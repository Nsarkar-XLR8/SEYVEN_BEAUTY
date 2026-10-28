import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { OrderStateMachine } from '../../orders/state-machine/order-state-machine';
import { PathaoApiClient } from './pathao-api.client';
import { PathaoBookingWorker } from '../workers/pathao-booking.worker';
import { BookPathaoConsignmentDto } from '../dto/book-pathao-consignment.dto';
import { PathaoWebhookDto } from '../dto/pathao-webhook.dto';
import {
  PathaoCreateOrderPayload,
  PathaoCreateOrderResponse,
  PathaoTrackingResponse,
} from '../interfaces/pathao.interface';
import { OrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PathaoService {
  private readonly logger = new Logger(PathaoService.name);
  private readonly defaultStoreId: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly pathaoApiClient: PathaoApiClient,
    private readonly pathaoBookingWorker: PathaoBookingWorker,
    private readonly outboxPublisher: OutboxPublisher,
  ) {
    this.defaultStoreId = Number(this.configService.get<number>('PATHAO_STORE_ID')) || 0;
  }

  /**
   * Book a confirmed order with Pathao Courier
   * Strictly enforces passing amount_to_collect = order.codDueBdt
   */
  async bookConsignment(
    dto: BookPathaoConsignmentDto,
    staffUserId?: string,
  ): Promise<PathaoCreateOrderResponse> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.orderId);
    const order = await this.prisma.order.findFirst({
      where: isUuid ? { id: dto.orderId } : { orderNumber: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID or Order Number '${dto.orderId}' not found`);
    }

    // 1. Guard against double-booking or terminal states
    if (order.status === OrderStatus.BOOKED && order.courierBookingId) {
      this.logger.warn(`Order ${order.orderNumber} is already booked (Consignment: ${order.courierBookingId})`);
      return {
        type: 'success',
        message: 'Order already booked with Pathao',
        data: {
          consignment_id: order.courierBookingId,
          merchant_order_id: order.orderNumber,
          order_status: 'Pending',
          delivery_fee: 60,
        },
      };
    }

    if (OrderStateMachine.isTerminal(order.status)) {
      throw new BadRequestException(
        `Cannot book consignment for order in terminal state '${order.status}'`,
      );
    }

    // 2. Prepare Pathao Consignment Payload
    const shippingAddress = (order.shippingAddress as Record<string, any>) || {};
    
    // Normalize phone number to strict 11-digit BD standard (01XXXXXXXXX)
    const rawPhone = order.guestPhone || shippingAddress.phoneNumber || shippingAddress.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length > 11) {
      cleanPhone = cleanPhone.slice(-11);
    }
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      this.logger.warn(`Order ${order.orderNumber} phone '${rawPhone}' normalized to '${cleanPhone}'`);
    }

    // Ensure address meets Pathao's 10-220 character constraint
    let recipientAddress = (
      shippingAddress.streetAddress ||
      `${shippingAddress.thanaArea || ''}, ${shippingAddress.district || ''}`
    ).trim();
    if (recipientAddress.length < 10) {
      recipientAddress = `${recipientAddress}, ${shippingAddress.district || 'Dhaka, Bangladesh'}`;
    }
    recipientAddress = recipientAddress.slice(0, 220);

    const recipientName = (
      order.guestName ||
      shippingAddress.recipientName ||
      shippingAddress.fullName ||
      'Valued Customer'
    ).trim().slice(0, 100);

    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0) || 1;
    const itemDescription =
      order.items.map((i) => `${i.title} (${i.sku}) x${i.quantity}`).join(', ') ||
      'SEYVEN Cosmetics Care Package';

    // Strictly pass cod_amount = order.codDueBdt (0 if prepaid)
    const amountToCollect = Math.max(0, Math.round(Number(order.codDueBdt || 0)));

    const payload: PathaoCreateOrderPayload = {
      store_id: dto.storeId || this.defaultStoreId,
      merchant_order_id: order.orderNumber,
      recipient_name: recipientName,
      recipient_phone: cleanPhone,
      recipient_address: recipientAddress,
      delivery_type: 48, // Standard 48 Hours
      item_type: 2, // Parcel
      special_instruction: (
        dto.specialInstruction || shippingAddress.notes || 'Fragile Cosmetic Packaging - Handle with Care'
      ).slice(0, 255),
      item_quantity: totalQuantity,
      item_weight: dto.itemWeightKg ? Math.max(0.5, Math.min(10, dto.itemWeightKg)) : 0.5,
      amount_to_collect: amountToCollect,
      item_description: itemDescription.slice(0, 255),
    };

    if (dto.recipientCityId) {
      payload.recipient_city = dto.recipientCityId;
    }
    if (dto.recipientZoneId || shippingAddress.courierZoneId) {
      payload.recipient_zone = dto.recipientZoneId || shippingAddress.courierZoneId;
    }
    if (dto.recipientAreaId) {
      payload.recipient_area = dto.recipientAreaId;
    }

    // 3. Dispatch through Retry Worker with DLQ protection
    const bookingResponse = await this.pathaoBookingWorker.dispatchWithRetry(
      order.id,
      order.orderNumber,
      payload,
    );

    const consignmentId = bookingResponse.data.consignment_id;

    // 4. Update Order status and record immutable audit trail
    await this.prisma.$transaction(async (tx) => {
      // Validate forward state transition to BOOKED
      if (OrderStateMachine.canTransition(order.status, OrderStatus.BOOKED)) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.BOOKED,
            courierBookingId: consignmentId,
            trackingCode: consignmentId,
          },
        });

        await tx.orderAuditLog.create({
          data: {
            id: uuidv4(),
            orderId: order.id,
            staffUserId: staffUserId || null,
            action: 'COURIER_BOOKED',
            previousStatus: order.status,
            newStatus: OrderStatus.BOOKED,
            reason: `Consignment created with Pathao Courier: #${consignmentId} (COD Collection: ৳${amountToCollect})`,
            metadata: {
              courier: 'PATHAO',
              consignmentId,
              amountToCollect,
              deliveryFee: bookingResponse.data.delivery_fee,
              storeId: payload.store_id,
            },
          },
        });
      } else {
        // Just update courier reference if status is already further
        await tx.order.update({
          where: { id: order.id },
          data: {
            courierBookingId: consignmentId,
            trackingCode: consignmentId,
          },
        });
      }

      // Outbox Domain Event
      await this.outboxPublisher.publish(
        {
          aggregateType: 'Order',
          aggregateId: order.id,
          eventType: 'CourierConsignmentBooked',
          payload: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            courier: 'PATHAO',
            consignmentId,
            amountToCollect,
          },
        },
        tx,
      );
    });

    return bookingResponse;
  }

  /**
   * Idempotent Inbound Webhook handler syncing Pathao delivery status to SEYVEN Order Lifecycle
   */
  async handleInboundWebhook(dto: PathaoWebhookDto) {
    const rawStatus = (dto.order_status_slug || dto.order_status || '').toLowerCase().trim();

    // 1. Sliding Window Redis Idempotency Guard (7 Days)
    const idempotencyKey = `idempotency:pathao:webhook:${dto.consignment_id}:${rawStatus}`;
    const alreadyProcessed = await this.redisService.get(idempotencyKey);
    if (alreadyProcessed) {
      this.logger.debug(
        `[Pathao Webhook] Idempotent skip: Consignment ${dto.consignment_id} status '${rawStatus}' already ingested.`,
      );
      return {
        acknowledged: true,
        idempotent: true,
        consignmentId: dto.consignment_id,
      };
    }

    // 2. Locate matching order by Order Number or Consignment Reference
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: dto.merchant_order_id },
          { courierBookingId: dto.consignment_id },
          { trackingCode: dto.consignment_id },
        ],
      },
    });

    if (!order) {
      this.logger.warn(
        `[Pathao Webhook] No matching order found for merchant_order_id: '${dto.merchant_order_id}' or CID: '${dto.consignment_id}'`,
      );
      return {
        acknowledged: true,
        orderFound: false,
        consignmentId: dto.consignment_id,
      };
    }

    // 3. Map Pathao Delivery Status to Domain OrderStatus
    const targetStatus = this.mapPathaoStatusToDomain(rawStatus);

    if (targetStatus && targetStatus !== order.status) {
      // Validate Monotonic Forward Transition Guard
      if (OrderStateMachine.canTransition(order.status, targetStatus)) {
        await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: targetStatus },
          });

          await tx.orderAuditLog.create({
            data: {
              id: uuidv4(),
              orderId: order.id,
              action: 'COURIER_WEBHOOK_STATUS_SYNC',
              previousStatus: order.status,
              newStatus: targetStatus,
              reason: `Pathao status synced: '${dto.order_status}'${dto.reason ? ` (${dto.reason})` : ''}`,
              metadata: {
                courier: 'PATHAO',
                consignmentId: dto.consignment_id,
                rawStatus: dto.order_status,
                collectedAmount: dto.collected_amount || null,
                reason: dto.reason || null,
              },
            },
          });

          await this.outboxPublisher.publish(
            {
              aggregateType: 'Order',
              aggregateId: order.id,
              eventType: 'OrderStatusUpdated',
              payload: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                previousStatus: order.status,
                newStatus: targetStatus,
                courier: 'PATHAO',
                consignmentId: dto.consignment_id,
              },
            },
            tx,
          );
        });

        this.logger.log(
          `[Pathao Webhook] Order ${order.orderNumber} transitioned from '${order.status}' to '${targetStatus}'`,
        );
      } else {
        this.logger.warn(
          `[Pathao Webhook] Monotonic guard prevented invalid status transition from '${order.status}' to '${targetStatus}' for order ${order.orderNumber}.`,
        );
      }
    }

    // 4. Mark processed in Redis with 7-day TTL
    await this.redisService.set(idempotencyKey, 'PROCESSED', 604800);

    return {
      acknowledged: true,
      consignmentId: dto.consignment_id,
      orderNumber: order.orderNumber,
      previousStatus: order.status,
      newStatus: targetStatus || order.status,
    };
  }

  /**
   * Real-time tracking query from Pathao API
   */
  async getTrackingStatus(consignmentId: string): Promise<PathaoTrackingResponse> {
    return this.pathaoApiClient.getTrackingStatus(consignmentId);
  }

  /**
   * Retrieve Dead-Letter Queue entries for administrative review
   */
  async getDlqEntries(limit: number = 50) {
    return this.pathaoBookingWorker.getDlqEntries(limit);
  }

  /**
   * Retrieve registered merchant stores from Pathao
   */
  async getMerchantStores() {
    return this.pathaoApiClient.getStores();
  }

  /**
   * Map Pathao raw statuses to SEYVEN strict OrderStatus enum
   */
  private mapPathaoStatusToDomain(rawStatus: string): OrderStatus | null {
    switch (rawStatus) {
      case 'delivered':
        return OrderStatus.DELIVERED;
      case 'partial_delivered':
      case 'partial-delivered':
        return OrderStatus.PARTIALLY_DELIVERED;
      case 'in_transit':
      case 'in-transit':
      case 'picked':
      case 'pickup_requested':
      case 'dispatched':
        return OrderStatus.SHIPPED;
      case 'returned':
      case 'return_received':
        return OrderStatus.RETURNED;
      case 'cancelled':
        return OrderStatus.CANCELLED;
      case 'pending':
      case 'accepted':
      case 'assigned':
        return OrderStatus.BOOKED;
      default:
        return null;
    }
  }
}

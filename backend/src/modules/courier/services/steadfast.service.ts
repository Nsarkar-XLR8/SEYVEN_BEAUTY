import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { OrderStateMachine } from '../../orders/state-machine/order-state-machine';
import { SteadfastApiClient } from './steadfast-api.client';
import { SteadfastBookingWorker } from '../workers/steadfast-booking.worker';
import { BookSteadfastConsignmentDto } from '../dto/book-steadfast-consignment.dto';
import { SteadfastWebhookDto } from '../dto/steadfast-webhook.dto';
import {
  SteadfastCreateOrderPayload,
  SteadfastCreateOrderResponse,
  SteadfastTrackingResponse,
} from '../interfaces/steadfast.interface';
import { OrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SteadfastService {
  private readonly logger = new Logger(SteadfastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly steadfastApiClient: SteadfastApiClient,
    private readonly steadfastBookingWorker: SteadfastBookingWorker,
    private readonly outboxPublisher: OutboxPublisher,
  ) {}

  /**
   * Book a confirmed order with Steadfast Courier
   * Strictly enforces passing cod_amount = order.codDueBdt (৳0 for prepaid orders)
   */
  async bookConsignment(
    dto: BookSteadfastConsignmentDto,
    staffUserId?: string,
  ): Promise<SteadfastCreateOrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${dto.orderId}' not found`);
    }

    // 1. Guard against double-booking or terminal states
    if (order.status === OrderStatus.BOOKED && order.courierBookingId) {
      this.logger.warn(
        `Order ${order.orderNumber} is already booked (Consignment: ${order.courierBookingId})`,
      );
      return {
        status: 200,
        message: 'Order already booked with Steadfast',
        consignment: {
          consignment_id: order.courierBookingId,
          invoice: order.orderNumber,
          tracking_code: order.trackingCode || `SF${order.courierBookingId}`,
          recipient_name: order.guestName,
          recipient_phone: order.guestPhone,
          recipient_address:
            (order.shippingAddress as Record<string, any>)?.streetAddress || '',
          cod_amount: Math.max(0, Math.round(Number(order.codDueBdt))),
          status: 'in_review',
        },
      };
    }

    if (OrderStateMachine.isTerminal(order.status)) {
      throw new BadRequestException(
        `Cannot book consignment for order in terminal state '${order.status}'`,
      );
    }

    // 2. Prepare Steadfast Consignment Payload
    const shippingAddress = order.shippingAddress as Record<string, any>;
    const recipientAddress =
      shippingAddress.streetAddress ||
      `${shippingAddress.thanaArea || ''}, ${shippingAddress.district || ''}`.trim() ||
      'Customer Address';

    const itemDescription =
      order.items.map((i) => `${i.title} (${i.sku}) x${i.quantity}`).join(', ') ||
      'SEYVEN Cosmetics Care Package';

    // Strictly pass cod_amount = order.codDueBdt (0 for prepaid)
    const amountToCollect = Math.max(0, Math.round(Number(order.codDueBdt)));

    const payload: SteadfastCreateOrderPayload = {
      invoice: order.orderNumber,
      recipient_name: order.guestName,
      recipient_phone: order.guestPhone,
      recipient_address: recipientAddress,
      cod_amount: amountToCollect,
      note:
        dto.specialInstruction ||
        shippingAddress.notes ||
        'Fragile Luxury Cosmetic Packaging',
      item_description: itemDescription.slice(0, 255),
    };

    // 3. Dispatch through Retry Worker with DLQ protection
    const bookingResponse = await this.steadfastBookingWorker.dispatchWithRetry(
      order.id,
      order.orderNumber,
      payload,
    );

    const consignment = bookingResponse.consignment;
    const consignmentId = String(consignment.consignment_id);
    const trackingCode = consignment.tracking_code || `SF${consignmentId}`;

    // 4. Update Order status and record immutable audit trail
    await this.prisma.$transaction(async (tx) => {
      // Validate forward state transition to BOOKED
      if (OrderStateMachine.canTransition(order.status, OrderStatus.BOOKED)) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.BOOKED,
            courierBookingId: consignmentId,
            trackingCode: trackingCode,
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
            reason: `Consignment created with Steadfast Courier: #${consignmentId} (COD Collection: ৳${amountToCollect})`,
            metadata: {
              courier: 'STEADFAST',
              consignmentId,
              trackingCode,
              amountToCollect,
            },
          },
        });
      } else {
        // Just update courier reference if status is already further along
        await tx.order.update({
          where: { id: order.id },
          data: {
            courierBookingId: consignmentId,
            trackingCode: trackingCode,
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
            courier: 'STEADFAST',
            consignmentId,
            trackingCode,
            amountToCollect,
          },
        },
        tx,
      );
    });

    return bookingResponse;
  }

  /**
   * Idempotent Inbound Webhook handler syncing Steadfast delivery status to SEYVEN Order Lifecycle
   */
  async handleInboundWebhook(dto: SteadfastWebhookDto) {
    const rawStatus = (dto.status || '').toLowerCase().trim();
    const consignmentId = String(dto.consignment_id);

    // 1. Sliding Window Redis Idempotency Guard (7 Days)
    const idempotencyKey = `idempotency:steadfast:webhook:${consignmentId}:${rawStatus}`;
    const alreadyProcessed = await this.redisService.get(idempotencyKey);
    if (alreadyProcessed) {
      this.logger.debug(
        `[Steadfast Webhook] Idempotent skip: Consignment ${consignmentId} status '${rawStatus}' already ingested.`,
      );
      return {
        acknowledged: true,
        idempotent: true,
        consignmentId,
      };
    }

    // 2. Locate matching order by Order Number or Consignment Reference
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          ...(dto.invoice ? [{ orderNumber: dto.invoice }] : []),
          { courierBookingId: consignmentId },
          ...(dto.tracking_code ? [{ trackingCode: dto.tracking_code }] : []),
          { trackingCode: consignmentId },
        ],
      },
    });

    if (!order) {
      this.logger.warn(
        `[Steadfast Webhook] No matching order found for invoice: '${dto.invoice}' or CID: '${consignmentId}'`,
      );
      return {
        acknowledged: true,
        orderFound: false,
        consignmentId,
      };
    }

    // 3. Map Steadfast Delivery Status to Domain OrderStatus
    const targetStatus = this.mapSteadfastStatusToDomain(rawStatus);

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
              reason: `Steadfast status synced: '${dto.status}'${dto.reason ? ` (${dto.reason})` : ''}`,
              metadata: {
                courier: 'STEADFAST',
                consignmentId,
                rawStatus: dto.status,
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
                courier: 'STEADFAST',
                consignmentId,
              },
            },
            tx,
          );
        });

        this.logger.log(
          `[Steadfast Webhook] Order ${order.orderNumber} transitioned from '${order.status}' to '${targetStatus}'`,
        );
      } else {
        this.logger.warn(
          `[Steadfast Webhook] Monotonic guard prevented invalid status transition from '${order.status}' to '${targetStatus}' for order ${order.orderNumber}.`,
        );
      }
    }

    // 4. Mark processed in Redis with 7-day TTL
    await this.redisService.set(idempotencyKey, 'PROCESSED', 604800);

    return {
      acknowledged: true,
      consignmentId,
      orderNumber: order.orderNumber,
      previousStatus: order.status,
      newStatus: targetStatus || order.status,
    };
  }

  /**
   * Real-time tracking query from Steadfast API
   */
  async getTrackingStatus(
    consignmentId: string | number,
  ): Promise<SteadfastTrackingResponse> {
    return this.steadfastApiClient.getTrackingStatus(consignmentId);
  }

  /**
   * Retrieve Dead-Letter Queue entries for administrative review
   */
  async getDlqEntries(limit: number = 50) {
    return this.steadfastBookingWorker.getDlqEntries(limit);
  }

  /**
   * Map Steadfast raw statuses to SEYVEN strict OrderStatus enum
   */
  private mapSteadfastStatusToDomain(rawStatus: string): OrderStatus | null {
    switch (rawStatus) {
      case 'delivered':
        return OrderStatus.DELIVERED;
      case 'partial_delivered':
      case 'partial-delivered':
        return OrderStatus.PARTIALLY_DELIVERED;
      case 'in_transit':
      case 'in-transit':
      case 'picked':
      case 'dispatched':
      case 'out_for_delivery':
        return OrderStatus.SHIPPED;
      case 'return':
      case 'returned':
      case 'cancelled_and_returned':
        return OrderStatus.RETURNED;
      case 'cancelled':
      case 'canceled':
        return OrderStatus.CANCELLED;
      case 'pending':
      case 'in_review':
      case 'accepted':
        return OrderStatus.BOOKED;
      default:
        return null;
    }
  }
}

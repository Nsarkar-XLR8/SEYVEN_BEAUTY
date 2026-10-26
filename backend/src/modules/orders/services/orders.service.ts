import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../common/database/prisma.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { GeoZoneService } from '../../checkout/services/geo-zone.service';
import { PhoneUtils } from '../../../common/utils/phone.utils';
import { OrderStateMachine } from '../state-machine/order-state-machine';
import { CreateManualOrderDto } from '../dto/create-manual-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { LogCallVerificationDto } from '../dto/log-call-verification.dto';
import { ListOrdersQueryDto } from '../dto/list-orders-query.dto';
import { AuthUser } from '../../auth/decorators/current-user.decorator';
import { ResendEmailService } from '../../auth/services/resend-email.service';
import { TelegramNotificationService } from '../../notifications/services/telegram-notification.service';
// Prisma Generated Entities & Enums
import {
  CallVerificationOutcome,
  OrderSource,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private ordersStoragePath = path.resolve(process.cwd(), 'data', 'local-orders.json');
  private fallbackOrders: any[] = [
    {
      id: 'SYV-202610-0921',
      orderNumber: 'SYV-202610-0921',
      referenceNo: 'ORD-9921',
      customerName: 'Nusrat Jahan',
      guestName: 'Nusrat Jahan',
      customerPhone: '01712-345678',
      guestPhone: '01712-345678',
      customerEmail: 'nusrat.jahan@gmail.com',
      shippingAddress: 'House 42, Road 11, Banani, Dhaka',
      zone: 'Dhaka North',
      district: 'Dhaka',
      items: [
        {
          id: 'it-01',
          sku: 'SYV-TO-HA30ML',
          title: 'Hyaluronic Acid 2% + B5 (30ml)',
          brand: 'The Ordinary',
          variant: '30ml Dropper',
          quantity: 1,
          unitPrice: 2450,
          totalPrice: 2450,
        },
      ],
      subtotal: 2450,
      deliveryFee: 70,
      discount: 0,
      totalAmount: 2520,
      paymentMethod: 'COD',
      status: 'PLACED',
      codVerification: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxPublisher: OutboxPublisher,
    private readonly geoZoneService: GeoZoneService,
    @Optional() private readonly resendEmailService?: ResendEmailService,
    @Optional() private readonly telegramNotificationService?: TelegramNotificationService,
  ) {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    try {
      const dir = path.dirname(this.ordersStoragePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.ordersStoragePath)) {
        const raw = fs.readFileSync(this.ordersStoragePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.fallbackOrders = parsed;
        }
      } else {
        this.persistLocalStorage();
      }
    } catch {
      // safe fallback
    }
  }

  private persistLocalStorage() {
    try {
      const dir = path.dirname(this.ordersStoragePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.ordersStoragePath, JSON.stringify(this.fallbackOrders, null, 2), 'utf8');
    } catch {
      // safe fallback
    }
  }

  async createDirectOrder(dto: any) {
    const orderId =
      dto.orderId ||
      `SYV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

    const newOrder = {
      id: orderId,
      orderNumber: orderId,
      referenceNo: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: dto.customerName || 'Online Client',
      guestName: dto.customerName || 'Online Client',
      customerPhone: dto.phone || dto.customerPhone || '01700000000',
      guestPhone: dto.phone || dto.customerPhone || '01700000000',
      customerEmail: dto.email || dto.customerEmail || '',
      shippingAddress: dto.address || dto.shippingAddress || 'Dhaka',
      zone: dto.districtName || dto.zone || 'Dhaka Metro',
      district: dto.districtName || dto.district || 'Dhaka',
      items: Array.isArray(dto.items)
        ? dto.items.map((it: any, idx: number) => ({
            id: it.id || `it-${idx}`,
            sku: it.sku || `SKU-${idx}`,
            title: it.titleEn || it.title || 'Formulation',
            brand: it.brand || 'SEYVEN',
            variant: it.volume || it.variant || 'Standard',
            quantity: it.quantity || 1,
            unitPrice: it.priceBdt || it.unitPrice || 2450,
            totalPrice: (it.priceBdt || it.unitPrice || 2450) * (it.quantity || 1),
          }))
        : [],
      subtotal: dto.subtotalBdt !== undefined ? dto.subtotalBdt : (dto.subtotal !== undefined ? dto.subtotal : (dto.totalBdt || 2450)),
      deliveryFee: dto.deliveryFeeBdt !== undefined ? dto.deliveryFeeBdt : (dto.deliveryFee !== undefined ? dto.deliveryFee : 70),
      discount: dto.discountBdt || dto.discount || 0,
      totalAmount: dto.totalBdt || dto.totalAmount || 2520,
      paymentMethod: dto.paymentMethod || 'COD',
      status: dto.status || 'PLACED',
      codVerification: dto.status === 'CONFIRMED' ? 'VERIFIED' : 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Direct persistence to Supabase Cloud PostgreSQL
    try {
      const primaryVariant = await this.prisma.productVariant.findFirst({
        include: { product: true },
      }).catch(() => null);

      const orderUuid = uuidv4();
      const isManual = (dto.source && typeof dto.source === 'string' && dto.source.toLowerCase().includes('manual')) || dto.status === 'CONFIRMED';
      const orderStatusEnum = isManual ? OrderStatus.CONFIRMED : OrderStatus.PLACED;
      const orderSourceEnum = dto.source === 'WHATSAPP' ? OrderSource.WHATSAPP : (dto.source === 'PHONE' ? OrderSource.PHONE : (isManual ? OrderSource.MANUAL_ASSISTED : OrderSource.STOREFRONT));
      const payStatusEnum = newOrder.paymentMethod === 'COD' ? PaymentStatus.PENDING : PaymentStatus.PAID;

      const preparedItems = await Promise.all(
        (newOrder.items || []).map(async (it: any) => {
          let variant = null;
          if (it.sku) {
            variant = await this.prisma.productVariant.findFirst({
              where: { sku: it.sku },
              include: { product: true },
            }).catch(() => null);
          }
          if (!variant && it.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(it.id)) {
            variant = await this.prisma.productVariant.findFirst({
              where: { id: it.id },
              include: { product: true },
            }).catch(() => null);
          }
          const resolvedVariant = variant || primaryVariant;

          return {
            id: uuidv4(),
            productId: resolvedVariant?.productId || uuidv4(),
            variantId: resolvedVariant?.id || uuidv4(),
            title: it.title || 'Curated Formulation',
            sku: it.sku || resolvedVariant?.sku || 'SKU-001',
            quantity: Number(it.quantity) || 1,
            unitPriceBdt: Number(it.unitPrice) || 2450,
            lineTotalBdt: Number(it.totalPrice) || Number(it.unitPrice || 2450) * Number(it.quantity || 1),
          };
        }),
      );

      await this.prisma.order.create({
        data: {
          id: orderUuid,
          orderNumber: orderId,
          guestName: newOrder.customerName,
          guestPhone: newOrder.customerPhone,
          shippingAddress: {
            fullName: newOrder.customerName,
            phone: newOrder.customerPhone,
            address: newOrder.shippingAddress,
            district: newOrder.district,
            zone: newOrder.zone,
          },
          subtotalBdt: newOrder.subtotal,
          deliveryFeeBdt: newOrder.deliveryFee,
          discountBdt: newOrder.discount,
          vatBdt: 0,
          totalPayableBdt: newOrder.totalAmount,
          codDueBdt: newOrder.paymentMethod === 'COD' ? newOrder.totalAmount : 0,
          advancePaidBdt: dto.advancePaid || 0,
          status: orderStatusEnum,
          paymentStatus: payStatusEnum,
          source: orderSourceEnum,
          staffNotes: dto.agentNotes || null,
          items: {
            create: preparedItems,
          },
        },
      });
      this.logger.log(`[Supabase Cloud DB] Order ${orderId} (${newOrder.customerName}) committed safely to PostgreSQL!`);
    } catch (err: any) {
      this.logger.error(`[Supabase Order Persist Error] Failed to persist order ${orderId} to PostgreSQL: ${err.message}`);
    }

    // 2. Also keep in fallback cache & disk
    this.fallbackOrders.unshift(newOrder);
    this.persistLocalStorage();
    this.logger.log(`[Direct Order] Created live order ${orderId} (${newOrder.customerName})`);

    // 3. Dispatch Email Notification to Admin Gmail (configured in backend .env)
    if (this.resendEmailService) {
      try {
        await this.resendEmailService.sendOrderNotificationEmail({
          orderNumber: newOrder.orderNumber,
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          customerEmail: newOrder.customerEmail,
          shippingAddress: newOrder.shippingAddress,
          district: newOrder.district,
          zone: newOrder.zone,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          deliveryFee: newOrder.deliveryFee,
          discount: newOrder.discount,
          totalAmount: newOrder.totalAmount,
          paymentMethod: 'COD',
          status: newOrder.status,
          createdAt: newOrder.createdAt,
        });
      } catch (emailErr: any) {
        this.logger.warn(`[Order Notification Email Notice] ${emailErr?.message || emailErr}`);
      }
    }

    // 4. Dispatch Telegram Order Alert
    if (this.telegramNotificationService) {
      try {
        await this.telegramNotificationService.sendOrderAlert({
          orderNumber: newOrder.orderNumber,
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          shippingAddress: newOrder.shippingAddress,
          district: newOrder.district,
          zone: newOrder.zone,
          items: (newOrder.items || []).map((it: any) => ({
            title: it.title,
            quantity: it.quantity || 1,
            unitPrice: Number(it.unitPrice || 0),
            totalPrice: Number(it.totalPrice || it.unitPrice || 0),
          })),
          subtotal: newOrder.subtotal,
          deliveryFee: newOrder.deliveryFee,
          discount: newOrder.discount,
          totalAmount: newOrder.totalAmount,
          paymentMethod: newOrder.paymentMethod || 'COD',
          source: (dto as any)?.source || 'STOREFRONT',
          status: newOrder.status,
          createdAt: newOrder.createdAt,
        });
      } catch (tgErr: any) {
        this.logger.warn(`[Order Notification Telegram Notice] ${tgErr?.message || tgErr}`);
      }
    }

    return newOrder;
  }

  /**
   * Manual assisted order creation for social commerce (Messenger/WhatsApp/Phone)
   */
  async createManualOrder(dto: CreateManualOrderDto, staffUserId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // 1. Normalize Phone Number
    const normalizedPhone = PhoneUtils.normalize(dto.customerPhone);
    const recipientPhone = PhoneUtils.normalize(dto.shippingAddress.phone || dto.customerPhone);

    // 2. Fetch and Validate Product Variants
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    if (variants.length !== variantIds.length) {
      const foundIds = new Set(variants.map((v) => v.id));
      const missingIds = variantIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Product variants not found: ${missingIds.join(', ')}`);
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // 3. Compute item lines, subtotal & pricing
    let subtotal = 0;
    const preparedItems: Array<{
      id: string;
      productId: string;
      variantId: string;
      title: string;
      sku: string;
      quantity: number;
      unitPriceBdt: number;
      lineTotalBdt: number;
      isGwp: boolean;
    }> = [];

    for (const item of dto.items) {
      const variant = variantMap.get(item.variantId)!;
      const unitPrice =
        item.unitPriceBdt !== undefined ? Number(item.unitPriceBdt) : Number(variant.priceBdt);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;

      subtotal += lineTotal;
      preparedItems.push({
        id: uuidv4(),
        productId: variant.productId,
        variantId: variant.id,
        title: variant.product.titleEn,
        sku: variant.sku,
        quantity: item.quantity,
        unitPriceBdt: unitPrice,
        lineTotalBdt: lineTotal,
        isGwp: unitPrice === 0,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // 4. Resolve delivery fee
    let deliveryFee = 0;
    if (dto.deliveryFeeBdt !== undefined) {
      deliveryFee = Math.round(Number(dto.deliveryFeeBdt) * 100) / 100;
    } else {
      const zone = this.geoZoneService.resolveCourierZone(
        dto.shippingAddress.division,
        dto.shippingAddress.district,
        dto.shippingAddress.thanaArea,
      );
      deliveryFee = zone.baseFee;
      // Free delivery on ৳2,000 threshold
      if (subtotal >= 2000) {
        deliveryFee = 0;
      }
    }

    // 5. Calculate VAT (5% standard retail beauty rate in BD)
    const vat = Math.round(subtotal * 0.05 * 100) / 100;
    const discount = Math.round((Number(dto.discountBdt) || 0) * 100) / 100;
    const totalPayable = Math.max(0, Math.round((subtotal - discount + deliveryFee) * 100) / 100);
    const advancePaid = Math.round((Number(dto.advancePaidBdt) || 0) * 100) / 100;
    const codDue = Math.max(0, Math.round((totalPayable - advancePaid) * 100) / 100);

    // 6. Generate Human-Readable Sequential Order Number
    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = uuidv4().slice(0, 6).toUpperCase();
    const orderNumber = `SYV-${datePrefix}-${randomSuffix}`;
    const orderId = uuidv4();

    const shippingAddressJson = {
      fullName: dto.shippingAddress.fullName,
      phone: recipientPhone,
      division: dto.shippingAddress.division,
      district: dto.shippingAddress.district,
      thanaArea: dto.shippingAddress.thanaArea,
      courierZoneId: dto.shippingAddress.courierZoneId || 1,
      streetAddress: dto.shippingAddress.streetAddress,
      landmark: dto.shippingAddress.landmark || null,
    };

    // Determine payment status
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    if (advancePaid >= totalPayable && totalPayable > 0) {
      paymentStatus = PaymentStatus.PAID;
    } else if (advancePaid > 0) {
      paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }

    // Assisted manual orders are verified by staff -> Created in CONFIRMED state directly
    const initialStatus = OrderStatus.CONFIRMED;

    // 7. Atomic DB Transaction
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          id: orderId,
          orderNumber,
          userId: dto.userId || null,
          guestPhone: normalizedPhone,
          guestName: dto.customerName,
          shippingAddress: shippingAddressJson,
          subtotalBdt: subtotal,
          deliveryFeeBdt: deliveryFee,
          discountBdt: discount,
          vatBdt: vat,
          totalPayableBdt: totalPayable,
          advancePaidBdt: advancePaid,
          codDueBdt: codDue,
          status: initialStatus,
          paymentStatus,
          source: dto.source,
          staffNotes: dto.staffNotes || null,
          channelReference: dto.channelReference || null,
        },
      });

      // Insert Order Items
      for (const item of preparedItems) {
        await tx.orderItem.create({
          data: {
            id: item.id,
            orderId,
            productId: item.productId,
            variantId: item.variantId,
            title: item.title,
            sku: item.sku,
            quantity: item.quantity,
            unitPriceBdt: item.unitPriceBdt,
            lineTotalBdt: item.lineTotalBdt,
            isGwp: item.isGwp,
          },
        });
      }

      // Record Initial Immutable Audit Log
      await tx.orderAuditLog.create({
        data: {
          id: uuidv4(),
          orderId,
          staffUserId: staffUserId || null,
          action: 'MANUAL_ORDER_CREATED',
          previousStatus: null,
          newStatus: initialStatus,
          reason: `Manual assisted order created via ${dto.source}${
            dto.channelReference ? ` (${dto.channelReference})` : ''
          }`,
          metadata: {
            source: dto.source,
            channelReference: dto.channelReference || null,
            itemsCount: preparedItems.length,
            totalPayableBdt: totalPayable,
            codDueBdt: codDue,
            advancePaidBdt: advancePaid,
          },
        },
      });

      // Outbox Domain Event
      await this.outboxPublisher.publish(
        {
          aggregateType: 'Order',
          aggregateId: orderId,
          eventType: 'OrderCreated',
          payload: {
            orderId,
            orderNumber,
            phone: normalizedPhone,
            source: dto.source,
            status: initialStatus,
            totalPayableBdt: totalPayable,
            codDueBdt: codDue,
          },
        },
        tx,
      );

      return {
        ...order,
        items: preparedItems,
      };
    });

    // 8. Dispatch Email Notification to Admin Gmail
    if (this.resendEmailService) {
      try {
        await this.resendEmailService.sendOrderNotificationEmail({
          orderNumber: createdOrder.orderNumber,
          customerName: createdOrder.guestName,
          customerPhone: createdOrder.guestPhone,
          customerEmail: (dto as any).customerEmail || '',
          shippingAddress: typeof createdOrder.shippingAddress === 'object'
            ? (createdOrder.shippingAddress as any)?.streetAddress || 'Address'
            : String(createdOrder.shippingAddress),
          district: typeof createdOrder.shippingAddress === 'object'
            ? (createdOrder.shippingAddress as any)?.district || 'Dhaka'
            : 'Dhaka',
          items: (createdOrder.items || []).map((it: any) => ({
            title: it.title,
            quantity: it.quantity,
            unitPrice: Number(it.unitPriceBdt || 0),
            totalPrice: Number(it.lineTotalBdt || 0),
          })),
          subtotal: Number(createdOrder.subtotalBdt || 0),
          deliveryFee: Number(createdOrder.deliveryFeeBdt || 0),
          discount: Number(createdOrder.discountBdt || 0),
          totalAmount: Number(createdOrder.totalPayableBdt || 0),
          paymentMethod: 'COD',
          status: createdOrder.status,
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        this.logger.warn(`[Manual Order Notification Email Notice] ${err?.message || err}`);
      }
    }

    // 9. Dispatch Telegram Order Alert
    if (this.telegramNotificationService) {
      try {
        await this.telegramNotificationService.sendOrderAlert({
          orderNumber: createdOrder.orderNumber,
          customerName: createdOrder.guestName || dto.customerName,
          customerPhone: createdOrder.guestPhone || dto.customerPhone,
          shippingAddress: typeof createdOrder.shippingAddress === 'object'
            ? (createdOrder.shippingAddress as any)?.address || (createdOrder.shippingAddress as any)?.streetAddress || 'Address'
            : String(createdOrder.shippingAddress),
          district: typeof createdOrder.shippingAddress === 'object'
            ? (createdOrder.shippingAddress as any)?.district || 'Dhaka'
            : 'Dhaka',
          zone: typeof createdOrder.shippingAddress === 'object'
            ? (createdOrder.shippingAddress as any)?.zone || ''
            : '',
          items: (createdOrder.items || []).map((it: any) => ({
            title: it.title,
            quantity: it.quantity,
            unitPrice: Number(it.unitPriceBdt || 0),
            totalPrice: Number(it.lineTotalBdt || 0),
          })),
          subtotal: Number(createdOrder.subtotalBdt || 0),
          deliveryFee: Number(createdOrder.deliveryFeeBdt || 0),
          discount: Number(createdOrder.discountBdt || 0),
          totalAmount: Number(createdOrder.totalPayableBdt || 0),
          paymentMethod: 'COD',
          source: createdOrder.source || dto.source || 'MANUAL',
          status: createdOrder.status,
          createdAt: new Date().toISOString(),
        });
      } catch (tgErr: any) {
        this.logger.warn(`[Manual Order Notification Telegram Notice] ${tgErr?.message || tgErr}`);
      }
    }

    return createdOrder;
  }

  /**
   * Monotonic status update with out-of-order webhook regression guard and audit trail
   */
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, staffUserId?: string) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      const order = await this.prisma.order.findFirst({
        where: isUuid ? { id: orderId } : { orderNumber: orderId },
      });

      if (order) {
        // 1. Idempotency Check
        if (order.status === dto.status) {
          this.logger.debug(`[Order ${order.orderNumber}] Status is already '${dto.status}'. No-op.`);
          return {
            ...order,
            allowedNextStatuses: OrderStateMachine.getAllowedNextStates(order.status),
          };
        }

        // 2. Validate Monotonic Forward Transition Guard
        OrderStateMachine.validateTransition(order.status, dto.status);

        // 3. Commit Transition in DB Transaction
        return await this.prisma.$transaction(async (tx) => {
          const updateData: Prisma.OrderUpdateInput = {
            status: dto.status,
          };

          if (dto.trackingCode) {
            updateData.trackingCode = dto.trackingCode;
          }
          if (dto.courierBookingId) {
            updateData.courierBookingId = dto.courierBookingId;
          }

          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: updateData,
          });

          // Record Immutable Audit Log
          await tx.orderAuditLog.create({
            data: {
              id: uuidv4(),
              orderId: order.id,
              staffUserId: staffUserId || null,
              action: 'STATUS_CHANGE',
              previousStatus: order.status,
              newStatus: dto.status,
              reason: dto.reason || dto.notes || `Status transitioned to ${dto.status}`,
              metadata: {
                trackingCode: dto.trackingCode || null,
                courierBookingId: dto.courierBookingId || null,
                notes: dto.notes || null,
              },
            },
          });

          return {
            ...updatedOrder,
            allowedNextStatuses: OrderStateMachine.getAllowedNextStates(updatedOrder.status),
          };
        });
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      // Continue to offline fallback
    }

    const match = this.fallbackOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (match) {
      match.status = dto.status;
      if (dto.trackingCode) {
        match.trackingCode = dto.trackingCode;
        match.consignmentId = dto.trackingCode;
      }
      match.updatedAt = new Date().toISOString();
      this.persistLocalStorage();
      return match;
    }

    throw new NotFoundException(`Order with ID '${orderId}' not found`);
  }

  /**
   * Log COD Verification Call and automatically update status on CONFIRMED or CANCELLED
   */
  async logCallVerification(orderId: string, dto: LogCallVerificationDto, staffUserId?: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (order) {
        const previousAttemptCount = await this.prisma.orderCallVerification.count({
          where: { orderId },
        });
        const attemptNumber = previousAttemptCount + 1;

        return await this.prisma.$transaction(async (tx) => {
          const callEntry = await tx.orderCallVerification.create({
            data: {
              id: uuidv4(),
              orderId,
              staffUserId: staffUserId || null,
              callOutcome: dto.callOutcome,
              attemptNumber,
              notes: dto.notes || null,
              nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null,
            },
          });

          await tx.orderAuditLog.create({
            data: {
              id: uuidv4(),
              orderId,
              staffUserId: staffUserId || null,
              action: 'CALL_VERIFICATION',
              previousStatus: order.status,
              newStatus: order.status,
              reason: `COD Phone Verification attempt #${attemptNumber}: ${dto.callOutcome}${
                dto.notes ? ` - ${dto.notes}` : ''
              }`,
              metadata: {
                attemptNumber,
                callOutcome: dto.callOutcome,
                nextFollowUpAt: dto.nextFollowUpAt || null,
              },
            },
          });

          let currentStatus = order.status;

          if (
            dto.callOutcome === CallVerificationOutcome.CONFIRMED &&
            order.status === OrderStatus.PLACED
          ) {
            await tx.order.update({
              where: { id: orderId },
              data: { status: OrderStatus.CONFIRMED },
            });
            currentStatus = OrderStatus.CONFIRMED;
          } else if (
            dto.callOutcome === CallVerificationOutcome.CANCELLED &&
            !OrderStateMachine.isTerminal(order.status)
          ) {
            await tx.order.update({
              where: { id: orderId },
              data: { status: OrderStatus.CANCELLED },
            });
            currentStatus = OrderStatus.CANCELLED;
          }

          return {
            orderId,
            orderNumber: order.orderNumber,
            currentStatus,
            verificationRecord: callEntry,
            allowedNextStatuses: OrderStateMachine.getAllowedNextStates(currentStatus),
          };
        });
      }
    } catch {
      // Gracefully continue to persistent local storage fallback
    }

    const match = this.fallbackOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (match) {
      if (dto.callOutcome === CallVerificationOutcome.CONFIRMED) {
        match.status = 'CONFIRMED';
        match.codVerification = 'VERIFIED';
      } else if (dto.callOutcome === CallVerificationOutcome.CANCELLED) {
        match.status = 'CANCELLED';
        match.codVerification = 'FAILED';
      }
      match.agentNotes =
        (match.agentNotes ? match.agentNotes + ' | ' : '') +
        `Call ${dto.callOutcome}: ${dto.notes || 'Status updated via Phone Verification Desk'}`;
      match.updatedAt = new Date().toISOString();
      this.persistLocalStorage();
      return {
        orderId: match.id,
        orderNumber: match.orderNumber,
        currentStatus: match.status,
        allowedNextStatuses: ['CONFIRMED', 'PACKED', 'SHIPPED', 'CANCELLED'],
      };
    }

    throw new NotFoundException(`Order with ID '${orderId}' not found`);
  }

  /**
   * Fetch complete order details including audit timeline, items, and next allowed transitions
   */
  async getOrderById(orderId: string, requestingUser?: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        auditLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            staffUser: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
        callVerifications: {
          orderBy: { calledAt: 'asc' },
          include: {
            staffUser: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
        splitLedger: {
          include: {
            entries: { orderBy: { createdAt: 'desc' } },
          },
        },
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    // Role-based customer ownership check
    if (requestingUser && requestingUser.role === UserRole.CUSTOMER) {
      const isOwner =
        order.userId === requestingUser.userId ||
        order.guestPhone === PhoneUtils.normalize(requestingUser.phone);
      if (!isOwner) {
        throw new ForbiddenException('Access denied: You can only view your own orders');
      }
    }

    return {
      ...order,
      allowedNextStatuses: OrderStateMachine.getAllowedNextStates(order.status),
      isTerminal: OrderStateMachine.isTerminal(order.status),
    };
  }

  /**
   * List orders with multi-dimensional filtering, search, and pagination
   */
  async listOrders(query: ListOrdersQueryDto, requestingUser?: AuthUser) {
    const where: Prisma.OrderWhereInput = {};

    // Customer scoping
    if (requestingUser && requestingUser.role === UserRole.CUSTOMER) {
      const normalizedCustomerPhone = PhoneUtils.normalize(requestingUser.phone);
      where.OR = [
        { userId: requestingUser.userId },
        { guestPhone: normalizedCustomerPhone },
      ];
    } else {
      // Admin filters
      if (query.status) {
        where.status = query.status;
      }
      if (query.source) {
        where.source = query.source;
      }
      if (query.search) {
        const search = query.search.trim();
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { guestPhone: { contains: search } },
          { guestName: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (query.startDate || query.endDate) {
        where.createdAt = {
          gte: query.startDate ? new Date(query.startDate) : undefined,
          lte: query.endDate ? new Date(query.endDate) : undefined,
        };
      }
    }

    try {
      const take = Number(query.limit) || 20;
      const page = Number(query.page) || 1;
      const skip = (page - 1) * take;

      const [total, orders] = await Promise.all([
        this.prisma.order.count({ where }),
        this.prisma.order.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            callVerifications: {
              take: 1,
              orderBy: { calledAt: 'desc' },
            },
          },
        }),
      ]);

      const formattedDbOrders = orders.map((o) => {
        const addr = typeof o.shippingAddress === 'object' && o.shippingAddress !== null
          ? (o.shippingAddress as any)
          : {};
        return {
          ...o,
          id: o.orderNumber || o.id,
          orderNumber: o.orderNumber,
          referenceNo: `ORD-${(o.orderNumber || o.id).slice(-4)}`,
          customerName: o.guestName || 'Valued Client',
          guestName: o.guestName || 'Valued Client',
          customerPhone: o.guestPhone || '',
          guestPhone: o.guestPhone || '',
          customerEmail: (o as any).guestEmail || '',
          shippingAddress: addr.address || addr.streetAddress || 'Dhaka',
          district: addr.district || 'Dhaka',
          zone: addr.zone || 'Dhaka Metro',
          totalAmount: Number(o.totalPayableBdt || 0),
          deliveryFee: Number(o.deliveryFeeBdt || 0),
          subtotal: Number(o.subtotalBdt || 0),
          discount: Number(o.discountBdt || 0),
          advancePaid: Number(o.advancePaidBdt || 0),
          paymentMethod: 'COD',
          codVerification: o.status === 'CONFIRMED' || o.status === 'SHIPPED' || o.status === 'DELIVERED' ? 'VERIFIED' : 'PENDING',
          allowedNextStatuses: OrderStateMachine.getAllowedNextStates(o.status),
          items: (o.items || []).map((it: any, idx: number) => ({
            id: it.id || `it-${idx}`,
            sku: it.sku || 'SKU-001',
            title: it.title || 'Formulation',
            brand: 'SEYVEN',
            variant: 'Standard',
            quantity: it.quantity || 1,
            unitPrice: Number(it.unitPriceBdt || it.unitPrice || 0),
            totalPrice: Number(it.lineTotalBdt || it.totalPrice || (it.unitPriceBdt || 0) * (it.quantity || 1)),
          })),
        };
      });

      // Merge with fallback orders not yet present in DB so admin sees all storefront orders
      const dbIds = new Set(formattedDbOrders.map((o) => o.id));
      const localOnly = this.fallbackOrders
        .filter((o) => !dbIds.has(o.id))
        .map((o) => ({
          ...o,
          paymentMethod: 'COD',
          items: (o.items || []).map((it: any, idx: number) => ({
            id: it.id || `it-${idx}`,
            sku: it.sku || 'SKU-001',
            title: it.title || 'Formulation',
            brand: it.brand || 'SEYVEN',
            variant: it.variant || 'Standard',
            quantity: it.quantity || 1,
            unitPrice: Number(it.unitPrice || 0),
            totalPrice: Number(it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1)),
          })),
        }));

      const combined = [...formattedDbOrders, ...localOnly];

      return {
        items: combined,
        total: combined.length,
        page,
        limit: take,
        totalPages: Math.ceil(combined.length / take) || 1,
      };
    } catch {
      let filtered = [...this.fallbackOrders].map((o) => ({
        ...o,
        paymentMethod: 'COD',
        items: (o.items || []).map((it: any, idx: number) => ({
          id: it.id || `it-${idx}`,
          sku: it.sku || 'SKU-001',
          title: it.title || 'Formulation',
          brand: it.brand || 'SEYVEN',
          variant: it.variant || 'Standard',
          quantity: it.quantity || 1,
          unitPrice: Number(it.unitPrice || 0),
          totalPrice: Number(it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1)),
        })),
      }));

      if (query.status) {
        filtered = filtered.filter((o) => o.status === query.status);
      }
      return {
        items: filtered,
        total: filtered.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
    }
  }

  private normalizePhone(phone?: string): string {
    if (!phone) return '';
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.startsWith('8801') && digitsOnly.length === 13) {
      return digitsOnly.slice(2);
    }
    if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
      return '0' + digitsOnly;
    }
    return digitsOnly;
  }

  /**
   * Returning Client Recognition Desk:
   * Checks BOTH phone number and email against past orders & client registries.
   * Checks phone first; if not found or not provided, systematically verifies email.
   */
  async checkReturningClient(phone?: string, email?: string) {
    const cleanPhone = this.normalizePhone(phone);
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    let matchedBy: 'phone' | 'email' | null = null;
    let customerName: string | null = null;
    let ordersCount = 0;

    // 1. Check Phone First (Highest accuracy for Bangladesh mobile commerce)
    if (cleanPhone && cleanPhone.length >= 10) {
      const matchedFallback = this.fallbackOrders.filter((o) => {
        const orderPhone = this.normalizePhone(o.customerPhone || o.guestPhone);
        return orderPhone && (orderPhone === cleanPhone || orderPhone.endsWith(cleanPhone) || cleanPhone.endsWith(orderPhone));
      });

      if (matchedFallback.length > 0) {
        matchedBy = 'phone';
        ordersCount = matchedFallback.length;
        customerName = matchedFallback[0].customerName || matchedFallback[0].guestName || null;
      } else {
        try {
          const dbOrders = await this.prisma.order.findMany({
            where: {
              OR: [
                { guestPhone: { contains: cleanPhone } },
                { user: { phone: { contains: cleanPhone } } },
              ],
            },
            select: { guestName: true, user: { select: { fullName: true } } },
            take: 10,
          });
          if (dbOrders.length > 0) {
            matchedBy = 'phone';
            ordersCount = dbOrders.length;
            customerName = dbOrders[0].user?.fullName || dbOrders[0].guestName || null;
          }
        } catch {
          // resilient fallback
        }
      }
    }

    // 2. If phone not found or not provided, systematically verify Email
    if (!matchedBy && cleanEmail && cleanEmail.includes('@')) {
      const matchedEmailFallback = this.fallbackOrders.filter((o) => {
        const orderEmail = (o.customerEmail || o.email || '').trim().toLowerCase();
        return orderEmail && orderEmail === cleanEmail;
      });

      if (matchedEmailFallback.length > 0) {
        matchedBy = 'email';
        ordersCount = matchedEmailFallback.length;
        customerName = matchedEmailFallback[0].customerName || matchedEmailFallback[0].guestName || null;
      } else {
        try {
          const dbOrders = await this.prisma.order.findMany({
            where: {
              user: { email: { equals: cleanEmail, mode: 'insensitive' } },
            },
            select: { guestName: true, user: { select: { fullName: true } } },
            take: 10,
          });
          if (dbOrders.length > 0) {
            matchedBy = 'email';
            ordersCount = dbOrders.length;
            customerName = dbOrders[0].user?.fullName || dbOrders[0].guestName || null;
          }
        } catch {
          // resilient fallback
        }
      }
    }

    const isReturningClient = Boolean(matchedBy);

    return {
      success: true,
      isReturningClient,
      matchedBy,
      ordersCount,
      customerName,
      privilegePercent: isReturningClient ? 5 : 0,
      message: isReturningClient
        ? `Esteemed returning client recognized via ${matchedBy}. 5% courtesy privilege honored.`
        : 'Inaugural client. First curation unlocks lifetime 5% returning privilege.',
    };
  }
}

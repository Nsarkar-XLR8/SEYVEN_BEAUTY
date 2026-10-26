import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { GeoZoneService } from '../../checkout/services/geo-zone.service';
import {
  CallVerificationOutcome,
  OrderSource,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  UserRole,
} from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let outboxPublisher: any;
  let geoZoneService: any;

  const mockVariant = {
    id: 'var-101',
    productId: 'prod-101',
    sku: 'SYV-SRM-001',
    priceBdt: 1250,
    product: {
      id: 'prod-101',
      titleEn: 'SEYVEN Advanced Niacinamide Serum',
    },
  };

  const mockOrder = {
    id: 'ord-uuid-1',
    orderNumber: 'SYV-202610-A9F1B2',
    userId: 'cust-uuid-1',
    guestPhone: '+8801712345678',
    guestName: 'Farhana Ahmed',
    status: OrderStatus.PLACED,
    paymentStatus: PaymentStatus.PENDING,
    subtotalBdt: 1250,
    deliveryFeeBdt: 70,
    vatBdt: 62.5,
    totalPayableBdt: 1320,
    advancePaidBdt: 0,
    codDueBdt: 1320,
    source: OrderSource.STOREFRONT,
    trackingCode: null,
    courierBookingId: null,
    shippingAddress: {
      fullName: 'Farhana Ahmed',
      phone: '+8801712345678',
      division: 'Dhaka',
      district: 'Dhaka',
      thanaArea: 'Dhanmondi',
    },
    items: [],
    auditLogs: [],
    callVerifications: [],
  };

  beforeEach(async () => {
    prisma = {
      productVariant: {
        findMany: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      orderItem: {
        create: jest.fn(),
      },
      orderAuditLog: {
        create: jest.fn(),
      },
      orderCallVerification: {
        create: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };
    prisma.order.findFirst.mockImplementation((args: any) => prisma.order.findUnique(args));

    outboxPublisher = {
      publish: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };

    geoZoneService = {
      resolveCourierZone: jest.fn().mockReturnValue({
        courierZoneId: 1,
        zoneName: 'Dhaka Metro',
        baseFee: 70,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxPublisher, useValue: outboxPublisher },
        { provide: GeoZoneService, useValue: geoZoneService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createManualOrder', () => {
    const validDto = {
      customerPhone: '01712345678',
      customerName: 'Ayesha Rahman',
      source: OrderSource.MESSENGER,
      channelReference: 'fb_thread_123',
      shippingAddress: {
        fullName: 'Ayesha Rahman',
        phone: '01712345678',
        division: 'Dhaka',
        district: 'Dhaka',
        thanaArea: 'Gulshan',
        streetAddress: 'House 12, Road 5',
      },
      items: [
        {
          variantId: 'var-101',
          quantity: 2,
        },
      ],
      discountBdt: 100,
      staffNotes: 'Customer prefers evening delivery',
    };

    it('should throw BadRequestException if items array is empty', async () => {
      await expect(
        service.createManualOrder({ ...validDto, items: [] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if any variant is not found in database', async () => {
      prisma.productVariant.findMany.mockResolvedValue([]);

      await expect(service.createManualOrder(validDto as any)).rejects.toThrow(
        /Product variants not found/,
      );
    });

    it('should calculate totals, create order in CONFIRMED state, append audit log, and emit event', async () => {
      prisma.productVariant.findMany.mockResolvedValue([mockVariant]);
      prisma.order.create.mockImplementation(({ data }: any) => Promise.resolve(data));

      const result = await service.createManualOrder(validDto as any, 'staff-agent-1');

      expect(result.guestPhone).toBe('+8801712345678');
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(result.source).toBe(OrderSource.MESSENGER);
      expect(result.subtotalBdt).toBe(2500); // 1250 * 2
      // subtotal 2500 >= 2000 -> free delivery fee
      expect(result.deliveryFeeBdt).toBe(0);
      expect(result.discountBdt).toBe(100);
      expect(result.vatBdt).toBe(125); // 5% of 2500
      expect(result.totalPayableBdt).toBe(2400); // 2500 - 100 + 0

      // Verify audit log creation
      expect(prisma.orderAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'MANUAL_ORDER_CREATED',
            newStatus: OrderStatus.CONFIRMED,
            staffUserId: 'staff-agent-1',
          }),
        }),
      );

      // Verify outbox event dispatch
      expect(outboxPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateType: 'Order',
          eventType: 'OrderCreated',
        }),
        prisma,
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus('non-existent', { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle idempotent status update without mutating database', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      const res = await service.updateOrderStatus('ord-uuid-1', {
        status: OrderStatus.CONFIRMED,
      });

      expect(res.status).toBe(OrderStatus.CONFIRMED);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should succeed on valid monotonic transition (PLACED -> CONFIRMED) and record audit log', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.PLACED });
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.CONFIRMED });

      const res = await service.updateOrderStatus(
        'ord-uuid-1',
        { status: OrderStatus.CONFIRMED, reason: 'Payment verified' },
        'staff-1',
      );

      expect(res.status).toBe(OrderStatus.CONFIRMED);
      expect(prisma.orderAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'STATUS_CHANGE',
            previousStatus: OrderStatus.PLACED,
            newStatus: OrderStatus.CONFIRMED,
            staffUserId: 'staff-1',
          }),
        }),
      );
    });

    it('should throw BadRequestException on monotonic backward regression (SHIPPED -> BOOKED)', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.SHIPPED });

      await expect(
        service.updateOrderStatus('ord-uuid-1', { status: OrderStatus.BOOKED }),
      ).rejects.toThrow(/Monotonic transition violation/);
    });

    it('should throw BadRequestException on transition out of terminal state (CANCELLED -> CONFIRMED)', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

      await expect(
        service.updateOrderStatus('ord-uuid-1', { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(/terminal state/);
    });

    it('should transition status to CANCELLED and update database', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.PLACED });
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

      const res = await service.updateOrderStatus('ord-uuid-1', {
        status: OrderStatus.CANCELLED,
        reason: 'Customer requested',
      });

      expect(res.status).toBe(OrderStatus.CANCELLED);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OrderStatus.CANCELLED }),
        }),
      );
    });
  });

  describe('logCallVerification', () => {
    it('should record call attempt and auto-transition PLACED order to CONFIRMED on CONFIRMED outcome', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.PLACED });
      prisma.orderCallVerification.count.mockResolvedValue(0);
      prisma.orderCallVerification.create.mockResolvedValue({
        id: 'call-1',
        attemptNumber: 1,
        callOutcome: CallVerificationOutcome.CONFIRMED,
      });
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.CONFIRMED });

      const result = await service.logCallVerification(
        'ord-uuid-1',
        {
          callOutcome: CallVerificationOutcome.CONFIRMED,
          notes: 'Customer answered and confirmed delivery address',
        },
        'agent-1',
      );

      expect(result.currentStatus).toBe(OrderStatus.CONFIRMED);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-uuid-1' },
        data: { status: OrderStatus.CONFIRMED },
      });
      expect(prisma.orderAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CALL_VERIFICATION',
            previousStatus: OrderStatus.PLACED,
            newStatus: OrderStatus.PLACED,
          }),
        }),
      );
    });

    it('should auto-transition order to CANCELLED when outcome is CANCELLED during verification call', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.PLACED });
      prisma.orderCallVerification.count.mockResolvedValue(1);
      prisma.orderCallVerification.create.mockResolvedValue({
        id: 'call-2',
        attemptNumber: 2,
        callOutcome: CallVerificationOutcome.CANCELLED,
      });

      const result = await service.logCallVerification(
        'ord-uuid-1',
        {
          callOutcome: CallVerificationOutcome.CANCELLED,
          notes: 'Customer changed mind and asked to cancel',
        },
        'agent-1',
      );

      expect(result.currentStatus).toBe(OrderStatus.CANCELLED);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-uuid-1' },
        data: { status: OrderStatus.CANCELLED },
      });
    });

    it('should record NO_ANSWER call without changing order status', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.PLACED });
      prisma.orderCallVerification.count.mockResolvedValue(0);
      prisma.orderCallVerification.create.mockResolvedValue({
        id: 'call-1',
        attemptNumber: 1,
        callOutcome: CallVerificationOutcome.NO_ANSWER,
      });

      const result = await service.logCallVerification(
        'ord-uuid-1',
        {
          callOutcome: CallVerificationOutcome.NO_ANSWER,
          notes: 'Phone rang with no answer, will retry later',
          nextFollowUpAt: '2026-10-09T10:00:00.000Z',
        },
        'agent-1',
      );

      expect(result.currentStatus).toBe(OrderStatus.PLACED);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('getOrderById', () => {
    it('should return full order and allowed next transitions', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      const result = await service.getOrderById('ord-uuid-1', {
        userId: 'staff-1',
        phone: '01712345678',
        role: UserRole.SUPPORT_AGENT,
      });

      expect(result.id).toBe('ord-uuid-1');
      expect(result.allowedNextStatuses).toEqual([
        OrderStatus.PACKED,
        OrderStatus.BOOKED,
        OrderStatus.CANCELLED,
      ]);
      expect(result.isTerminal).toBe(false);
    });

    it('should throw ForbiddenException if customer attempts to view another users order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        userId: 'other-cust-id',
        guestPhone: '+8801999999999',
      });

      await expect(
        service.getOrderById('ord-uuid-1', {
          userId: 'cust-uuid-1',
          phone: '+8801712345678',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listOrders', () => {
    it('should scope query to authenticated customer when role is CUSTOMER', async () => {
      prisma.order.count.mockResolvedValue(1);
      prisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.listOrders(
        { page: 1, limit: 10 },
        {
          userId: 'cust-uuid-1',
          phone: '01712345678',
          role: UserRole.CUSTOMER,
        },
      );

      expect(result.total).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { userId: 'cust-uuid-1' },
              { guestPhone: '+8801712345678' },
            ],
          },
        }),
      );
    });

    it('should apply search filters and pagination for operations staff', async () => {
      prisma.order.count.mockResolvedValue(5);
      prisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.listOrders(
        { page: 1, limit: 10, search: 'Farhana', status: OrderStatus.PLACED },
        {
          userId: 'staff-1',
          phone: '01888888888',
          role: UserRole.SUPPORT_AGENT,
        },
      );

      expect(result.total).toBe(5);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PLACED,
          }),
        }),
      );
    });
  });
});

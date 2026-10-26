import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PathaoService } from './pathao.service';
import { PathaoApiClient } from './pathao-api.client';
import { PathaoBookingWorker } from '../workers/pathao-booking.worker';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { OrderStatus } from '@prisma/client';

describe('PathaoService', () => {
  let service: PathaoService;
  let prisma: any;
  let redisService: any;
  let pathaoApiClient: any;
  let pathaoBookingWorker: any;
  let outboxPublisher: any;

  const mockOrder = {
    id: 'ord-123',
    orderNumber: 'SYV-202610-A9F1B2',
    guestName: 'Tasnim Hasan',
    guestPhone: '+8801712345678',
    codDueBdt: 1250,
    status: OrderStatus.CONFIRMED,
    courierBookingId: null,
    trackingCode: null,
    shippingAddress: {
      streetAddress: 'House 14, Road 5, Dhanmondi',
      district: 'Dhaka',
      thanaArea: 'Dhanmondi',
      courierZoneId: 1,
    },
    items: [
      {
        title: 'SEYVEN Niacinamide Serum',
        sku: 'SYV-SRM-001',
        quantity: 1,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      orderAuditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      lrange: jest.fn().mockResolvedValue([]),
    };

    pathaoApiClient = {
      createConsignment: jest.fn(),
      getTrackingStatus: jest.fn().mockResolvedValue({
        type: 'success',
        data: { consignment_id: 'DB1029384', order_status: 'In_Transit' },
      }),
    };

    pathaoBookingWorker = {
      dispatchWithRetry: jest.fn().mockResolvedValue({
        type: 'success',
        data: {
          consignment_id: 'DB1029384',
          merchant_order_id: 'SYV-202610-A9F1B2',
          order_status: 'Pending',
          delivery_fee: 60,
        },
      }),
      getDlqEntries: jest.fn().mockResolvedValue([]),
    };

    outboxPublisher = {
      publish: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathaoService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redisService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def: any) => {
              if (key === 'PATHAO_STORE_ID') return 9988;
              return def;
            }),
          },
        },
        { provide: PathaoApiClient, useValue: pathaoApiClient },
        { provide: PathaoBookingWorker, useValue: pathaoBookingWorker },
        { provide: OutboxPublisher, useValue: outboxPublisher },
      ],
    }).compile();

    service = module.get<PathaoService>(PathaoService);
  });

  describe('bookConsignment', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.bookConsignment({ orderId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order is in terminal state', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      await expect(
        service.bookConsignment({ orderId: 'ord-123' }),
      ).rejects.toThrow(/terminal state/);
    });

    it('should strictly pass order.codDueBdt to amount_to_collect and transition order to BOOKED', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.bookConsignment(
        { orderId: 'ord-123' },
        'staff-operator-1',
      );

      expect(result.data.consignment_id).toBe('DB1029384');

      // Verify strict cod_amount mapping
      expect(pathaoBookingWorker.dispatchWithRetry).toHaveBeenCalledWith(
        'ord-123',
        'SYV-202610-A9F1B2',
        expect.objectContaining({
          merchant_order_id: 'SYV-202610-A9F1B2',
          amount_to_collect: 1250, // Exactly order.codDueBdt
          recipient_name: 'Tasnim Hasan',
          recipient_phone: '+8801712345678',
        }),
      );

      // Verify database update to BOOKED
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-123' },
          data: expect.objectContaining({
            status: OrderStatus.BOOKED,
            courierBookingId: 'DB1029384',
            trackingCode: 'DB1029384',
          }),
        }),
      );

      // Verify audit log entry
      expect(prisma.orderAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'COURIER_BOOKED',
            newStatus: OrderStatus.BOOKED,
            staffUserId: 'staff-operator-1',
          }),
        }),
      );

      // Verify outbox event
      expect(outboxPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateType: 'Order',
          eventType: 'CourierConsignmentBooked',
        }),
        prisma,
      );
    });

    it('should pass amount_to_collect = 0 for fully prepaid orders', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        codDueBdt: 0,
      });

      await service.bookConsignment({ orderId: 'ord-123' });

      expect(pathaoBookingWorker.dispatchWithRetry).toHaveBeenCalledWith(
        'ord-123',
        'SYV-202610-A9F1B2',
        expect.objectContaining({
          amount_to_collect: 0,
        }),
      );
    });
  });

  describe('handleInboundWebhook', () => {
    it('should handle idempotent duplicate webhook call via Redis guard', async () => {
      redisService.get.mockResolvedValue('PROCESSED');

      const result = await service.handleInboundWebhook({
        consignment_id: 'DB1029384',
        merchant_order_id: 'SYV-202610-A9F1B2',
        order_status: 'Delivered',
      });

      expect(result.idempotent).toBe(true);
      expect(prisma.order.findFirst).not.toHaveBeenCalled();
    });

    it('should transition order to DELIVERED when Pathao status is Delivered', async () => {
      prisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });

      const result = await service.handleInboundWebhook({
        consignment_id: 'DB1029384',
        merchant_order_id: 'SYV-202610-A9F1B2',
        order_status: 'Delivered',
        collected_amount: 1250,
      });

      expect(result.newStatus).toBe(OrderStatus.DELIVERED);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-123' },
          data: { status: OrderStatus.DELIVERED },
        }),
      );

      expect(prisma.orderAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'COURIER_WEBHOOK_STATUS_SYNC',
            newStatus: OrderStatus.DELIVERED,
          }),
        }),
      );

      // Verify idempotency cache set
      expect(redisService.set).toHaveBeenCalledWith(
        'idempotency:pathao:webhook:DB1029384:delivered',
        'PROCESSED',
        604800,
      );
    });

    it('should transition order to SHIPPED when Pathao status is In_Transit or Picked', async () => {
      prisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.BOOKED,
      });

      const result = await service.handleInboundWebhook({
        consignment_id: 'DB1029384',
        merchant_order_id: 'SYV-202610-A9F1B2',
        order_status: 'In_Transit',
      });

      expect(result.newStatus).toBe(OrderStatus.SHIPPED);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.SHIPPED },
        }),
      );
    });

    it('should transition order to RETURNED when Pathao status is Returned', async () => {
      prisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });

      const result = await service.handleInboundWebhook({
        consignment_id: 'DB1029384',
        merchant_order_id: 'SYV-202610-A9F1B2',
        order_status: 'Returned',
        reason: 'Customer refused parcel',
      });

      expect(result.newStatus).toBe(OrderStatus.RETURNED);
    });

    it('should gracefully ignore backward status regression without crashing webhook', async () => {
      // Order is already DELIVERED
      prisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      // Webhook sends out-of-order 'In_Transit'
      const result = await service.handleInboundWebhook({
        consignment_id: 'DB1029384',
        merchant_order_id: 'SYV-202610-A9F1B2',
        order_status: 'In_Transit',
      });

      expect(result.acknowledged).toBe(true);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('getTrackingStatus and DLQ', () => {
    it('should query tracking from API client', async () => {
      const tracking = await service.getTrackingStatus('DB1029384');
      expect(tracking.data.consignment_id).toBe('DB1029384');
      expect(pathaoApiClient.getTrackingStatus).toHaveBeenCalledWith('DB1029384');
    });

    it('should retrieve DLQ entries from worker', async () => {
      pathaoBookingWorker.getDlqEntries.mockResolvedValue([
        { jobId: 'job-1', orderNumber: 'SYV-1' },
      ]);
      const dlq = await service.getDlqEntries();
      expect(dlq.length).toBe(1);
    });
  });
});

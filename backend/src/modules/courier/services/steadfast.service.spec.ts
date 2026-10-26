import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SteadfastService } from './steadfast.service';
import { SteadfastApiClient } from './steadfast-api.client';
import { SteadfastBookingWorker } from '../workers/steadfast-booking.worker';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { OrderStatus } from '@prisma/client';

describe('SteadfastService', () => {
  let service: SteadfastService;
  let prisma: any;
  let redisService: any;
  let steadfastApiClient: any;
  let steadfastBookingWorker: any;
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

    steadfastApiClient = {
      createConsignment: jest.fn(),
      getTrackingStatus: jest.fn().mockResolvedValue({
        status: 200,
        delivery_status: 'in_transit',
        consignment: { consignment_id: 9876543, delivery_status: 'in_transit' },
      }),
    };

    steadfastBookingWorker = {
      dispatchWithRetry: jest.fn().mockResolvedValue({
        status: 200,
        message: 'Consignment created successfully',
        consignment: {
          consignment_id: 9876543,
          invoice: 'SYV-202610-A9F1B2',
          tracking_code: 'SF9876543',
          cod_amount: 1250,
          status: 'in_review',
        },
      }),
      getDlqEntries: jest.fn().mockResolvedValue([]),
    };

    outboxPublisher = {
      publish: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SteadfastService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redisService },
        { provide: SteadfastApiClient, useValue: steadfastApiClient },
        { provide: SteadfastBookingWorker, useValue: steadfastBookingWorker },
        { provide: OutboxPublisher, useValue: outboxPublisher },
      ],
    }).compile();

    service = module.get<SteadfastService>(SteadfastService);
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

    it('should return existing consignment details if order is already booked', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.BOOKED,
        courierBookingId: '9876543',
        trackingCode: 'SF9876543',
      });

      const result = await service.bookConsignment({ orderId: 'ord-123' });

      expect(result.status).toBe(200);
      expect(result.message).toContain('already booked');
      expect(result.consignment.consignment_id).toBe('9876543');
      expect(steadfastBookingWorker.dispatchWithRetry).not.toHaveBeenCalled();
    });

    it('should strictly pass order.codDueBdt to cod_amount and transition order to BOOKED', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.bookConsignment(
        { orderId: 'ord-123' },
        'staff-operator-1',
      );

      expect(result.consignment.consignment_id).toBe(9876543);

      // Verify strict cod_amount mapping
      expect(steadfastBookingWorker.dispatchWithRetry).toHaveBeenCalledWith(
        'ord-123',
        'SYV-202610-A9F1B2',
        expect.objectContaining({
          invoice: 'SYV-202610-A9F1B2',
          cod_amount: 1250, // Exactly order.codDueBdt
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
            courierBookingId: '9876543',
            trackingCode: 'SF9876543',
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

    it('should pass cod_amount = 0 for fully prepaid orders', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        codDueBdt: 0,
      });

      await service.bookConsignment({ orderId: 'ord-123' });

      expect(steadfastBookingWorker.dispatchWithRetry).toHaveBeenCalledWith(
        'ord-123',
        'SYV-202610-A9F1B2',
        expect.objectContaining({
          cod_amount: 0,
        }),
      );
    });
  });

  describe('handleInboundWebhook', () => {
    it('should handle idempotent duplicate webhook call via Redis guard', async () => {
      redisService.get.mockResolvedValue('PROCESSED');

      const result = await service.handleInboundWebhook({
        consignment_id: 9876543,
        invoice: 'SYV-202610-A9F1B2',
        status: 'delivered',
      });

      expect(result.idempotent).toBe(true);
      expect(prisma.order.findFirst).not.toHaveBeenCalled();
    });

    it('should return acknowledged with orderFound false if no order matches', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await service.handleInboundWebhook({
        consignment_id: 9876543,
        invoice: 'UNKNOWN-INV',
        status: 'delivered',
      });

      expect(result.acknowledged).toBe(true);
      expect(result.orderFound).toBe(false);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should transition order to DELIVERED when Steadfast status is delivered', async () => {
      prisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });

      const result = await service.handleInboundWebhook({
        consignment_id: 9876543,
        invoice: 'SYV-202610-A9F1B2',
        status: 'delivered',
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

      // Verify idempotency cache set with 7-day TTL (604800s)
      expect(redisService.set).toHaveBeenCalledWith(
        'idempotency:steadfast:webhook:9876543:delivered',
        'PROCESSED',
        604800,
      );
    });

    it('should transition order to SHIPPED when Steadfast status is in_transit or picked', async () => {
      prisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.BOOKED,
      });

      const result = await service.handleInboundWebhook({
        consignment_id: 9876543,
        invoice: 'SYV-202610-A9F1B2',
        status: 'in_transit',
      });

      expect(result.newStatus).toBe(OrderStatus.SHIPPED);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.SHIPPED },
        }),
      );
    });

    it('should transition order to RETURNED when Steadfast status is returned', async () => {
      prisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });

      const result = await service.handleInboundWebhook({
        consignment_id: 9876543,
        invoice: 'SYV-202610-A9F1B2',
        status: 'returned',
        reason: 'Customer cancelled at doorstep',
      });

      expect(result.newStatus).toBe(OrderStatus.RETURNED);
    });

    it('should gracefully ignore backward status regression without crashing webhook', async () => {
      // Order is already DELIVERED
      prisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      // Webhook sends out-of-order 'in_transit'
      const result = await service.handleInboundWebhook({
        consignment_id: 9876543,
        invoice: 'SYV-202610-A9F1B2',
        status: 'in_transit',
      });

      expect(result.acknowledged).toBe(true);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('getTrackingStatus and DLQ', () => {
    it('should query tracking from API client', async () => {
      const tracking = await service.getTrackingStatus(9876543);
      expect(tracking.delivery_status).toBe('in_transit');
      expect(steadfastApiClient.getTrackingStatus).toHaveBeenCalledWith(9876543);
    });

    it('should retrieve DLQ entries from worker', async () => {
      steadfastBookingWorker.getDlqEntries.mockResolvedValue([
        { jobId: 'job-1', orderNumber: 'SYV-1' },
      ]);
      const dlq = await service.getDlqEntries();
      expect(dlq.length).toBe(1);
    });
  });
});

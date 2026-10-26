import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRecoveryService } from './payment-recovery.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { OrderStatus } from '@prisma/client';

describe('PaymentRecoveryService', () => {
  let service: PaymentRecoveryService;
  let prisma: any;
  let outboxPublisher: any;

  beforeEach(async () => {
    prisma = {
      order: {
        update: jest.fn(),
      },
      orderItem: {
        findMany: jest.fn(),
      },
      inventoryLot: {
        findMany: jest.fn(),
      },
    };

    outboxPublisher = {
      publish: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRecoveryService,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxPublisher, useValue: outboxPublisher },
      ],
    }).compile();

    service = module.get<PaymentRecoveryService>(PaymentRecoveryService);
  });

  describe('handleUnfulfillablePayment', () => {
    it('should transition order to UNFULFILLABLE_PAYMENT_CAPTURED and publish outbox event', async () => {
      prisma.order.update.mockResolvedValue({
        id: 'order-123',
        orderNumber: 'SYV-202610-0001',
        guestPhone: '01711111111',
        status: OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED,
      });

      const result = await service.handleUnfulfillablePayment(
        'order-123',
        'TRX_BKASH_123',
        1500,
        ['SKU-SERUM-01'],
      );

      expect(result.status).toBe(OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: {
          status: OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED,
        },
      });
      expect(outboxPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateType: 'Order',
          aggregateId: 'order-123',
          eventType: 'UnfulfillablePaymentCaptured',
          payload: expect.objectContaining({
            orderId: 'order-123',
            transactionId: 'TRX_BKASH_123',
            amountBdt: 1500,
            exhaustedSkus: ['SKU-SERUM-01'],
          }),
        }),
      );
    });
  });

  describe('verifyStockAvailability', () => {
    it('should report stock available when active lots have sufficient inventory', async () => {
      prisma.orderItem.findMany.mockResolvedValue([
        { variantId: 'var-1', sku: 'SKU-01', quantity: 2 },
      ]);
      prisma.inventoryLot.findMany.mockResolvedValue([
        { id: 'lot-1', availableQuantity: 5 },
      ]);

      const result = await service.verifyStockAvailability('order-123');

      expect(result.isStockAvailable).toBe(true);
      expect(result.exhaustedSkus).toEqual([]);
    });

    it('should report exhausted SKUs when active lots have insufficient inventory', async () => {
      prisma.orderItem.findMany.mockResolvedValue([
        { variantId: 'var-1', sku: 'SKU-01', quantity: 5 },
      ]);
      prisma.inventoryLot.findMany.mockResolvedValue([
        { id: 'lot-1', availableQuantity: 2 },
      ]);

      const result = await service.verifyStockAvailability('order-123');

      expect(result.isStockAvailable).toBe(false);
      expect(result.exhaustedSkus).toContain('SKU-01');
    });
  });
});

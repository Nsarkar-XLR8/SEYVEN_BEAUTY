import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RtoReturnsService } from './rto-returns.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { LotStatus, OrderStatus, PaymentStatus } from '@prisma/client';

describe('RtoReturnsService', () => {
  let service: RtoReturnsService;
  let prisma: any;
  let outboxPublisher: any;

  const mockOrder = {
    id: 'ord-12345',
    orderNumber: 'SYV-202610-A9F1B2',
    guestName: 'Tasnim Hasan',
    guestPhone: '+8801712345678',
    shippingAddress: {
      fullName: 'Tasnim Hasan',
      phone: '+8801712345678',
      district: 'Dhaka',
      thanaArea: 'Dhanmondi',
      streetAddress: 'House 14, Road 5',
    },
    subtotalBdt: 2000,
    deliveryFeeBdt: 60,
    discountBdt: 0,
    vatBdt: 100,
    totalPayableBdt: 2160,
    advancePaidBdt: 60,
    codDueBdt: 2100,
    status: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.PARTIALLY_PAID,
    courierBookingId: 'SF9876543',
    trackingCode: 'SF9876543',
    items: [
      {
        id: 'item-1',
        variantId: 'var-1',
        title: 'SEYVEN Niacinamide Dermal Serum 30ml',
        sku: 'SYV-SRM-001',
        quantity: 2,
        unitPriceBdt: 1000,
        lineTotalBdt: 2000,
      },
    ],
    mushakInvoice: null,
    mushakCreditNotes: [],
    rtoExpenses: [],
  };

  const mockLot = {
    id: 'lot-1',
    variantId: 'var-1',
    availableQuantity: 10,
    status: LotStatus.ACTIVE,
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(mockOrder),
        update: jest.fn().mockImplementation(({ data }) => ({
          ...mockOrder,
          ...data,
        })),
      },
      orderItem: {
        update: jest.fn().mockResolvedValue({}),
      },
      inventoryLot: {
        findFirst: jest.fn().mockResolvedValue(mockLot),
        update: jest.fn().mockResolvedValue({}),
      },
      inventoryAuditLog: {
        create: jest.fn().mockResolvedValue({ id: 'inv-audit-1' }),
      },
      mushakInvoice: {
        create: jest.fn().mockResolvedValue({ id: 'inv-1', mushakSerialNo: 'M63-202610-A9F1B2' }),
      },
      mushakCreditNote: {
        create: jest.fn().mockResolvedValue({
          id: 'cn-1',
          creditNoteSerialNo: 'CN-M67-A1B2C3D4',
          refundedTaxableAmount: 1000,
          refundedVatAmount: 50,
        }),
      },
      rtoExpense: {
        create: jest.fn().mockResolvedValue({
          id: 'rto-1',
          courier: 'STEADFAST',
          forwardShippingFeeBdt: 60,
          returnShippingFeeBdt: 60,
          totalLossBdt: 120,
          rtoReason: 'CUSTOMER_REJECTED',
        }),
      },
      orderAuditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    outboxPublisher = {
      publish: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RtoReturnsService,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxPublisher, useValue: outboxPublisher },
      ],
    }).compile();

    service = module.get<RtoReturnsService>(RtoReturnsService);
  });

  describe('processPartialDelivery', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.processPartialDelivery('non-existent', { acceptedItems: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order is in terminal state', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      await expect(
        service.processPartialDelivery('ord-12345', {
          acceptedItems: [{ orderItemId: 'item-1', acceptedQuantity: 1 }],
        }),
      ).rejects.toThrow(/Cannot process partial delivery/);
    });

    it('should throw BadRequestException if accepted quantity exceeds original', async () => {
      await expect(
        service.processPartialDelivery('ord-12345', {
          acceptedItems: [{ orderItemId: 'item-1', acceptedQuantity: 5 }],
        }),
      ).rejects.toThrow(/Invalid accepted quantity/);
    });

    it('should recalculate price, release rejected stock to inventory lot, and issue credit note', async () => {
      const result = await service.processPartialDelivery(
        'ord-12345',
        {
          acceptedItems: [{ orderItemId: 'item-1', acceptedQuantity: 1 }],
          collectedAmountBdt: 1050,
          reason: 'Customer accepted 1 serum bottle at doorstep',
        },
        'staff-user-1',
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(OrderStatus.PARTIALLY_DELIVERED);

      // Subtotal reduced from 2000 to 1000
      expect(result.adjustedTotals.subtotalBdt).toBe(1000);
      // VAT reduced to 5% of 1000 = 50
      expect(result.adjustedTotals.vatBdt).toBe(50);
      // Total payable = 1000 + 60 (delivery) = 1060
      expect(result.adjustedTotals.totalPayableBdt).toBe(1060);

      // Stock restocked: 1 unit returned to lot-1
      expect(prisma.inventoryLot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lot-1' },
          data: { availableQuantity: 11 }, // 10 + 1
        }),
      );

      // Audit log created for inventory restocking
      expect(prisma.inventoryAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reasonCode: 'DOORSTEP_PARTIAL_RETURN',
            adjustmentDelta: 1,
          }),
        }),
      );

      // Credit Note created in DB
      expect(prisma.mushakCreditNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reason: 'Customer accepted 1 serum bottle at doorstep',
            refundedTaxableAmount: 1000,
            refundedVatAmount: 50,
          }),
        }),
      );

      // Outbox domain event published
      expect(outboxPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateType: 'Order',
          eventType: 'OrderPartiallyDelivered',
        }),
        prisma,
      );
    });
  });

  describe('processRto', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.processRto('non-existent', {
          courier: 'STEADFAST',
          forwardShippingFeeBdt: 60,
          returnShippingFeeBdt: 60,
          rtoReason: 'CUSTOMER_REJECTED',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should record RTO expenses in ledger, restock all items, and issue credit note', async () => {
      const result = await service.processRto(
        'ord-12345',
        {
          courier: 'STEADFAST',
          consignmentId: 'SF9876543',
          forwardShippingFeeBdt: 60,
          returnShippingFeeBdt: 60,
          rtoReason: 'CUSTOMER_REJECTED_AT_DOORSTEP',
          notes: 'Customer refused parcel',
          releaseStock: true,
        },
        'staff-user-1',
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(OrderStatus.RETURNED);
      expect(result.rtoExpense.totalLossBdt).toBe(120);

      // Verify RTO expense persisted
      expect(prisma.rtoExpense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            courier: 'STEADFAST',
            forwardShippingFeeBdt: 60,
            returnShippingFeeBdt: 60,
            totalLossBdt: 120,
            rtoReason: 'CUSTOMER_REJECTED_AT_DOORSTEP',
          }),
        }),
      );

      // Verify all 2 units of item-1 restocked to lot
      expect(prisma.inventoryLot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lot-1' },
          data: { availableQuantity: 12 }, // 10 + 2
        }),
      );

      // Verify order shifted to RETURNED
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.RETURNED,
            codDueBdt: 0,
          }),
        }),
      );

      // Verify Mushak-6.7 Credit Note issued
      expect(prisma.mushakCreditNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reason: 'CUSTOMER_REJECTED_AT_DOORSTEP',
            refundedTaxableAmount: 2000,
            refundedVatAmount: 100,
          }),
        }),
      );

      // Verify Outbox domain event published
      expect(outboxPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateType: 'Order',
          eventType: 'OrderReturnedToOrigin',
        }),
        prisma,
      );
    });
  });

  describe('generateMushak67Pdf', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.generateMushak67Pdf('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should generate valid NBR Form Mushak-6.7 Credit Note Vector PDF', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        mushakCreditNotes: [
          {
            id: 'cn-1',
            creditNoteSerialNo: 'CN-M67-A1B2C3D4',
            reason: 'Customer Refused at Doorstep',
            refundedTaxableAmount: 1000,
            refundedVatAmount: 50,
            issuedAt: new Date(),
          },
        ],
      });

      const buffer = await service.generateMushak67Pdf('ord-12345');

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });
  });
});

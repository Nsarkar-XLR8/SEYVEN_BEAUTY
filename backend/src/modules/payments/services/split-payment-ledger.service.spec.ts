import { Test, TestingModule } from '@nestjs/testing';
import { SplitPaymentLedgerService } from './split-payment-ledger.service';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  PaymentStatus,
  PaymentType,
  LedgerEntryType,
  LedgerEntryDirection,
} from '../interfaces/payment.interface';

describe('SplitPaymentLedgerService', () => {
  let service: SplitPaymentLedgerService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      splitPaymentLedger: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      paymentLedgerEntry: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SplitPaymentLedgerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SplitPaymentLedgerService>(SplitPaymentLedgerService);
  });

  describe('getOrCreateLedger', () => {
    it('should create a new split ledger with correct COD due when not existing', async () => {
      prisma.splitPaymentLedger.findUnique.mockResolvedValue(null);
      prisma.splitPaymentLedger.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );

      const result = await service.getOrCreateLedger('order-uuid-1', 1500, 150);

      expect(prisma.splitPaymentLedger.findUnique).toHaveBeenCalledWith({
        where: { orderId: 'order-uuid-1' },
        include: { entries: true },
      });
      expect(prisma.splitPaymentLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'order-uuid-1',
            totalPayableBdt: 1500,
            advanceRequiredBdt: 150,
            codDueBdt: 1350,
            isFullySettled: false,
          }),
        }),
      );
      expect(result.codDueBdt).toBe(1350);
    });

    it('should return existing split ledger if found', async () => {
      const existingLedger = {
        id: 'ledger-uuid-1',
        orderId: 'order-uuid-1',
        totalPayableBdt: 1500,
        advancePaidBdt: 150,
        codDueBdt: 1350,
        isFullySettled: false,
      };
      prisma.splitPaymentLedger.findUnique.mockResolvedValue(existingLedger);

      const result = await service.getOrCreateLedger('order-uuid-1', 1500, 150);
      expect(result).toEqual(existingLedger);
      expect(prisma.splitPaymentLedger.create).not.toHaveBeenCalled();
    });
  });

  describe('recordCreditPayment', () => {
    it('should record ADVANCE_DELIVERY_FEE and update status to PARTIALLY_PAID', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-uuid-1',
        totalPayableBdt: 1500,
        advancePaidBdt: 0,
        codDueBdt: 1500,
        paymentStatus: PaymentStatus.PENDING,
      });

      prisma.splitPaymentLedger.findUnique.mockResolvedValue({
        id: 'ledger-uuid-1',
        orderId: 'order-uuid-1',
        totalPayableBdt: 1500,
        advanceRequiredBdt: 150,
        advancePaidBdt: 0,
        codDueBdt: 1500,
        isFullySettled: false,
      });

      prisma.paymentLedgerEntry.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );
      prisma.splitPaymentLedger.update.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({});

      const result = await service.recordCreditPayment('order-uuid-1', {
        paymentType: PaymentType.ADVANCE_DELIVERY_FEE,
        amount: 150,
        referenceNote: 'bKash TrxID: TX12345',
      });

      expect(result.newPaymentStatus).toBe(PaymentStatus.PARTIALLY_PAID);
      expect(result.advancePaidBdt).toBe(150);
      expect(result.codDueBdt).toBe(1350);
      expect(result.isFullySettled).toBe(false);

      expect(prisma.paymentLedgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entryType: LedgerEntryType.ADVANCE_FEE_COLLECTED,
            direction: LedgerEntryDirection.CREDIT,
            amountBdt: 150,
            runningBalanceBdt: 150,
          }),
        }),
      );

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-uuid-1' },
        data: {
          advancePaidBdt: 150,
          codDueBdt: 1350,
          paymentStatus: PaymentStatus.PARTIALLY_PAID,
        },
      });
    });

    it('should record DOORSTEP_COD and mark order fully PAID and settled', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-uuid-1',
        totalPayableBdt: 1500,
        advancePaidBdt: 150,
        codDueBdt: 1350,
        paymentStatus: PaymentStatus.PARTIALLY_PAID,
      });

      prisma.splitPaymentLedger.findUnique.mockResolvedValue({
        id: 'ledger-uuid-1',
        orderId: 'order-uuid-1',
        totalPayableBdt: 1500,
        advanceRequiredBdt: 150,
        advancePaidBdt: 150,
        codDueBdt: 1350,
        isFullySettled: false,
      });

      prisma.paymentLedgerEntry.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );
      prisma.splitPaymentLedger.update.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({});

      const result = await service.recordCreditPayment('order-uuid-1', {
        paymentType: PaymentType.DOORSTEP_COD,
        amount: 1350,
        referenceNote: 'Steadfast Cash collected at doorstep',
      });

      expect(result.newPaymentStatus).toBe(PaymentStatus.PAID);
      expect(result.codDueBdt).toBe(0);
      expect(result.isFullySettled).toBe(true);
    });
  });

  describe('recordRefundDebit', () => {
    it('should record debit and set status to REFUNDED on full refund', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-uuid-1',
        totalPayableBdt: 1500,
        advancePaidBdt: 150,
        paymentStatus: PaymentStatus.PARTIALLY_PAID,
        splitLedger: {
          id: 'ledger-uuid-1',
          advancePaidBdt: 150,
          isFullySettled: false,
        },
      });

      prisma.paymentLedgerEntry.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );
      prisma.splitPaymentLedger.update.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({});

      const result = await service.recordRefundDebit('order-uuid-1', {
        amount: 150,
        referenceNote: 'Cancellation refund',
      });

      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(result.remainingAdvancePaidBdt).toBe(0);
      expect(prisma.paymentLedgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entryType: LedgerEntryType.REFUND_DISBURSED,
            direction: LedgerEntryDirection.DEBIT,
            amountBdt: 150,
          }),
        }),
      );
    });
  });
});

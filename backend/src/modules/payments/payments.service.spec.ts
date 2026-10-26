import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../common/database/prisma.service';
import { OutboxPublisher } from '../../common/database/outbox/outbox.service';
import { BkashService } from './gateways/bkash/bkash.service';
import { SSLCommerzService } from './gateways/sslcommerz/sslcommerz.service';
import { SplitPaymentLedgerService } from './services/split-payment-ledger.service';
import { PaymentRecoveryService } from './services/payment-recovery.service';
import {
  PaymentGateway,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentType,
} from './interfaces/payment.interface';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let outboxPublisher: any;
  let bkashService: any;
  let sslcommerzService: any;
  let ledgerService: any;
  let recoveryService: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      paymentTransaction: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    outboxPublisher = {
      publish: jest.fn().mockResolvedValue({}),
    };

    bkashService = {
      createPayment: jest.fn(),
      executePayment: jest.fn(),
      queryPayment: jest.fn(),
      refundPayment: jest.fn(),
    };

    sslcommerzService = {
      initiateSession: jest.fn(),
      validateIpn: jest.fn(),
    };

    ledgerService = {
      getOrCreateLedger: jest.fn(),
      recordCreditPayment: jest.fn(),
      recordRefundDebit: jest.fn(),
      getLedgerByOrderId: jest.fn(),
    };

    recoveryService = {
      verifyStockAvailability: jest.fn(),
      handleUnfulfillablePayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxPublisher, useValue: outboxPublisher },
        { provide: BkashService, useValue: bkashService },
        { provide: SSLCommerzService, useValue: sslcommerzService },
        { provide: SplitPaymentLedgerService, useValue: ledgerService },
        { provide: PaymentRecoveryService, useValue: recoveryService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('initiatePayment', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.initiatePayment({
          orderId: 'non-existent',
          gateway: PaymentGateway.BKASH,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if order is already PAID', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-123',
        orderNumber: 'SYV-001',
        paymentStatus: PaymentStatus.PAID,
      });

      await expect(
        service.initiatePayment({
          orderId: 'order-123',
          gateway: PaymentGateway.BKASH,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should initiate bKash payment for advance delivery fee', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-123',
        orderNumber: 'SYV-001',
        paymentStatus: PaymentStatus.PENDING,
        totalPayableBdt: 1500,
        deliveryFeeBdt: 120,
        advancePaidBdt: 0,
        codDueBdt: 1500,
        guestName: 'Rahim Khan',
        guestPhone: '01711111111',
      });

      ledgerService.getOrCreateLedger.mockResolvedValue({});
      bkashService.createPayment.mockResolvedValue({
        paymentID: 'BKASH_PAY_123',
        bkashURL: 'https://sandbox.bka.sh/checkout?id=123',
      });

      prisma.paymentTransaction.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );

      const result = await service.initiatePayment({
        orderId: 'order-123',
        gateway: PaymentGateway.BKASH,
        paymentType: PaymentType.ADVANCE_DELIVERY_FEE,
        amountBdt: 120,
      });

      expect(result.orderId).toBe('order-123');
      expect(result.amountBdt).toBe(120);
      expect(result.gateway).toBe(PaymentGateway.BKASH);
      expect(result.paymentUrl).toBe('https://sandbox.bka.sh/checkout?id=123');
      expect(result.gatewayPaymentId).toBe('BKASH_PAY_123');
      expect(prisma.paymentTransaction.create).toHaveBeenCalled();
    });

    it('should initiate SSLCommerz payment for full total', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-123',
        orderNumber: 'SYV-001',
        paymentStatus: PaymentStatus.PENDING,
        totalPayableBdt: 2500,
        advancePaidBdt: 0,
        codDueBdt: 2500,
        guestName: 'Fatima',
        guestPhone: '01811111111',
        shippingAddress: { streetAddress: 'Banani, Dhaka' },
      });

      ledgerService.getOrCreateLedger.mockResolvedValue({});
      sslcommerzService.initiateSession.mockResolvedValue({
        status: 'SUCCESS',
        sessionkey: 'SSLC_SESSION_123',
        GatewayPageURL: 'https://sandbox.sslcommerz.com/gw?session=123',
      });

      prisma.paymentTransaction.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );

      const result = await service.initiatePayment({
        orderId: 'order-123',
        gateway: PaymentGateway.SSLCOMMERZ,
        paymentType: PaymentType.FULL_PREPAYMENT,
      });

      expect(result.amountBdt).toBe(2500);
      expect(result.gateway).toBe(PaymentGateway.SSLCOMMERZ);
      expect(result.paymentUrl).toBe('https://sandbox.sslcommerz.com/gw?session=123');
    });
  });

  describe('handleBkashCallback', () => {
    it('should execute bKash payment, update ledger and mark transaction SUCCESS', async () => {
      const mockTrx = {
        id: 'trx-uuid-1',
        orderId: 'order-123',
        gatewayPaymentId: 'BKASH_PAY_123',
        paymentType: PaymentType.ADVANCE_DELIVERY_FEE,
        amountBdt: 120,
        order: {
          id: 'order-123',
          orderNumber: 'SYV-001',
          paymentStatus: PaymentStatus.PENDING,
        },
      };

      prisma.paymentTransaction.findFirst.mockResolvedValue(mockTrx);
      bkashService.executePayment.mockResolvedValue({
        trxID: 'TRX_BKASH_999',
        amount: '120.00',
        transactionStatus: 'Completed',
      });
      recoveryService.verifyStockAvailability.mockResolvedValue({
        isStockAvailable: true,
        exhaustedSkus: [],
      });
      ledgerService.recordCreditPayment.mockResolvedValue({
        newPaymentStatus: PaymentStatus.PARTIALLY_PAID,
      });
      prisma.paymentTransaction.update.mockResolvedValue({});

      const result = await service.handleBkashCallback({
        paymentID: 'BKASH_PAY_123',
        status: 'success',
      });

      expect(result.success).toBe(true);
      expect(result.trxId).toBe('TRX_BKASH_999');
      expect(result.paymentStatus).toBe(PaymentStatus.PARTIALLY_PAID);
      expect(ledgerService.recordCreditPayment).toHaveBeenCalled();
      expect(outboxPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateType: 'Payment',
          eventType: 'PaymentSuccess',
        }),
      );
    });

    it('should trigger stock recovery handler if inventory depleted before callback', async () => {
      const mockTrx = {
        id: 'trx-uuid-1',
        orderId: 'order-123',
        gatewayPaymentId: 'BKASH_PAY_123',
        paymentType: PaymentType.ADVANCE_DELIVERY_FEE,
        amountBdt: 120,
        order: {
          id: 'order-123',
          orderNumber: 'SYV-001',
          paymentStatus: PaymentStatus.PENDING,
        },
      };

      prisma.paymentTransaction.findFirst.mockResolvedValue(mockTrx);
      bkashService.executePayment.mockResolvedValue({
        trxID: 'TRX_BKASH_999',
        amount: '120.00',
      });
      recoveryService.verifyStockAvailability.mockResolvedValue({
        isStockAvailable: false,
        exhaustedSkus: ['SKU-OUT-OF-STOCK'],
      });
      recoveryService.handleUnfulfillablePayment.mockResolvedValue({});
      prisma.paymentTransaction.update.mockResolvedValue({});

      const result = await service.handleBkashCallback({
        paymentID: 'BKASH_PAY_123',
        status: 'success',
      });

      expect(result.success).toBe(true);
      expect(recoveryService.handleUnfulfillablePayment).toHaveBeenCalledWith(
        'order-123',
        'TRX_BKASH_999',
        120,
        ['SKU-OUT-OF-STOCK'],
      );
    });
  });

  describe('handleSSLCommerzIpn', () => {
    it('should validate IPN, settle ledger, and mark transaction SUCCESS', async () => {
      sslcommerzService.validateIpn.mockResolvedValue({
        isValid: true,
        tranId: 'SSLC_SYV-001_123',
        valId: 'VAL_SSLC_999',
        amount: 2500,
        orderId: 'order-123',
        paymentType: 'FULL_PREPAYMENT',
      });

      const mockTrx = {
        id: 'trx-123',
        orderId: 'order-123',
        paymentType: PaymentType.FULL_PREPAYMENT,
        order: {
          id: 'order-123',
          orderNumber: 'SYV-001',
          totalPayableBdt: 2500,
          paymentStatus: PaymentStatus.PENDING,
        },
      };

      prisma.paymentTransaction.findFirst.mockResolvedValue(mockTrx);
      recoveryService.verifyStockAvailability.mockResolvedValue({
        isStockAvailable: true,
        exhaustedSkus: [],
      });
      ledgerService.recordCreditPayment.mockResolvedValue({
        newPaymentStatus: PaymentStatus.PAID,
      });
      prisma.paymentTransaction.update.mockResolvedValue({});

      const result = await service.handleSSLCommerzIpn({
        tran_id: 'SSLC_SYV-001_123',
        val_id: 'VAL_SSLC_999',
        amount: '2500.00',
        status: 'VALID',
      });

      expect(result.status).toBe('IPN_SUCCESS');
      expect(result.orderId).toBe('order-123');
      expect(ledgerService.recordCreditPayment).toHaveBeenCalled();
      expect(outboxPublisher.publish).toHaveBeenCalled();
    });
  });

  describe('processRefund', () => {
    it('should process refund, record debit entry, and return refund result', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-123',
        orderNumber: 'SYV-001',
        paymentTransactions: [
          {
            id: 'trx-123',
            gateway: PaymentGateway.BKASH,
            gatewayPaymentId: 'BKASH_PAY_123',
            transactionId: 'TRX_ORIGINAL_123',
            status: PaymentTransactionStatus.SUCCESS,
          },
        ],
      });

      bkashService.refundPayment.mockResolvedValue({
        refundTrxID: 'REF_BKASH_999',
      });

      ledgerService.recordRefundDebit.mockResolvedValue({
        paymentStatus: PaymentStatus.REFUNDED,
      });

      prisma.paymentTransaction.create.mockResolvedValue({});

      const result = await service.processRefund({
        orderId: 'order-123',
        amountBdt: 120,
        reason: 'Customer cancelled prior to dispatch',
      });

      expect(result.success).toBe(true);
      expect(result.refundTrxId).toBe('REF_BKASH_999');
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(ledgerService.recordRefundDebit).toHaveBeenCalledWith('order-123', {
        transactionId: 'trx-123',
        amount: 120,
        referenceNote: 'Refund Reason: Customer cancelled prior to dispatch | RefTrx: REF_BKASH_999',
      });
    });
  });
});

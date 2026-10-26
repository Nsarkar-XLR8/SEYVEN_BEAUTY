import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import {
  PaymentGateway,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentType,
} from './interfaces/payment.interface';

import { TokenService } from '../auth/services/token.service';
import { Reflector } from '@nestjs/core';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: any;

  beforeEach(async () => {
    service = {
      initiatePayment: jest.fn(),
      createBkashPayment: jest.fn(),
      handleBkashCallback: jest.fn(),
      initSSLCommerzPayment: jest.fn(),
      handleSSLCommerzIpn: jest.fn(),
      verifyTransaction: jest.fn(),
      processRefund: jest.fn(),
      getLedger: jest.fn(),
    };

    const mockTokenService = {
      verifyAccessToken: jest.fn().mockResolvedValue({
        sub: 'user-1',
        phone: '01711111111',
        role: 'CUSTOMER',
        jti: 'jti-1',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: service },
        { provide: TokenService, useValue: mockTokenService },
        Reflector,
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('POST /payments/initiate should call service.initiatePayment', async () => {
    const dto = {
      orderId: 'order-123',
      gateway: PaymentGateway.BKASH,
      paymentType: PaymentType.ADVANCE_DELIVERY_FEE,
      amountBdt: 120,
    };
    service.initiatePayment.mockResolvedValue({
      orderId: 'order-123',
      status: PaymentTransactionStatus.PENDING,
    });

    const req = { user: { userId: 'user-1' } };
    const res = await controller.initiatePayment(dto as any, req);

    expect(service.initiatePayment).toHaveBeenCalledWith(dto, 'user-1');
    expect(res.orderId).toBe('order-123');
  });

  it('POST /payments/bkash/create should call service.createBkashPayment', async () => {
    const dto = {
      orderId: 'order-123',
      paymentType: PaymentType.ADVANCE_DELIVERY_FEE,
      amountBdt: 120,
    };
    service.createBkashPayment.mockResolvedValue({
      orderId: 'order-123',
      gatewayPaymentId: 'BKASH_PAY_123',
    });

    const res = await controller.createBkashPayment(dto as any);
    expect(service.createBkashPayment).toHaveBeenCalledWith(dto);
    expect(res.gatewayPaymentId).toBe('BKASH_PAY_123');
  });

  it('POST /payments/bkash/callback should call service.handleBkashCallback', async () => {
    const dto = { paymentID: 'BKASH_PAY_123', status: 'success' };
    service.handleBkashCallback.mockResolvedValue({
      success: true,
      orderId: 'order-123',
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
    });

    const res = await controller.handleBkashCallback(dto);
    expect(service.handleBkashCallback).toHaveBeenCalledWith(dto);
    expect(res.success).toBe(true);
  });

  it('POST /payments/sslcommerz/init should call service.initSSLCommerzPayment', async () => {
    const dto = {
      orderId: 'order-123',
      paymentType: PaymentType.FULL_PREPAYMENT,
    };
    service.initSSLCommerzPayment.mockResolvedValue({
      orderId: 'order-123',
      paymentUrl: 'https://sandbox.sslcommerz.com/gw',
    });

    const res = await controller.initSSLCommerzPayment(dto as any);
    expect(service.initSSLCommerzPayment).toHaveBeenCalledWith(dto);
    expect(res.paymentUrl).toBeDefined();
  });

  it('POST /payments/sslcommerz/ipn should call service.handleSSLCommerzIpn', async () => {
    const dto = {
      tran_id: 'SSLC_001',
      val_id: 'VAL_001',
      amount: '1500',
      status: 'VALID',
    };
    service.handleSSLCommerzIpn.mockResolvedValue({
      status: 'IPN_SUCCESS',
      orderId: 'order-123',
    });

    const res = await controller.handleSSLCommerzIpn(dto);
    expect(service.handleSSLCommerzIpn).toHaveBeenCalledWith(dto);
    expect(res.status).toBe('IPN_SUCCESS');
  });

  it('POST /payments/verify/:trxId should call service.verifyTransaction', async () => {
    service.verifyTransaction.mockResolvedValue({
      transactionId: 'TRX_123',
      status: PaymentTransactionStatus.SUCCESS,
    });

    const res = await controller.verifyTransaction('TRX_123');
    expect(service.verifyTransaction).toHaveBeenCalledWith('TRX_123');
    expect(res.transactionId).toBe('TRX_123');
  });

  it('POST /payments/refund should call service.processRefund', async () => {
    const dto = {
      orderId: 'order-123',
      amountBdt: 120,
      reason: 'Cancelled',
    };
    service.processRefund.mockResolvedValue({
      success: true,
      refundTrxId: 'REF_123',
    });

    const res = await controller.processRefund(dto);
    expect(service.processRefund).toHaveBeenCalledWith(dto);
    expect(res.success).toBe(true);
  });

  it('GET /payments/:id/ledger should call service.getLedger', async () => {
    service.getLedger.mockResolvedValue({
      ledgerId: 'ledger-1',
      orderId: 'order-123',
      totalPayableBdt: 1500,
      advancePaidBdt: 120,
      codDueBdt: 1380,
    });

    const res = await controller.getLedger('order-123');
    expect(service.getLedger).toHaveBeenCalledWith('order-123');
    expect(res.orderId).toBe('order-123');
  });
});

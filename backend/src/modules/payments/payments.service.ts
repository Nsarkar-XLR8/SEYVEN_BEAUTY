import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { OutboxPublisher } from '../../common/database/outbox/outbox.service';
import { BkashService } from './gateways/bkash/bkash.service';
import { SSLCommerzService } from './gateways/sslcommerz/sslcommerz.service';
import { SplitPaymentLedgerService } from './services/split-payment-ledger.service';
import { PaymentRecoveryService } from './services/payment-recovery.service';
import {
  InitiatePaymentDto,
} from './dto/initiate-payment.dto';
import {
  CreateBkashPaymentDto,
  BkashCallbackDto,
} from './dto/bkash.dto';
import {
  InitSSLCommerzPaymentDto,
  SSLCommerzIpnDto,
} from './dto/sslcommerz.dto';
import { ProcessRefundDto } from './dto/refund.dto';
import {
  InitiatePaymentResult,
  PaymentGateway,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentType,
  RefundResult,
  SplitLedgerSummary,
} from './interfaces/payment.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxPublisher: OutboxPublisher,
    private readonly bkashService: BkashService,
    private readonly sslcommerzService: SSLCommerzService,
    private readonly ledgerService: SplitPaymentLedgerService,
    private readonly recoveryService: PaymentRecoveryService,
  ) {}

  /**
   * Unified payment initiation supporting bKash, SSLCommerz, and split deposits.
   */
  async initiatePayment(
    dto: InitiatePaymentDto,
    userId?: string,
  ): Promise<InitiatePaymentResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    if (
      order.paymentStatus === PaymentStatus.PAID ||
      order.paymentStatus === PaymentStatus.REFUNDED
    ) {
      throw new ConflictException(`Order ${order.orderNumber} is already ${order.paymentStatus}`);
    }

    const totalPayable = Number(order.totalPayableBdt);
    const advancePaid = Number(order.advancePaidBdt) || 0;
    const codDue = Number(order.codDueBdt);

    let amountToPay: number;
    const paymentType = dto.paymentType || PaymentType.FULL_PREPAYMENT;

    if (paymentType === PaymentType.ADVANCE_DELIVERY_FEE) {
      amountToPay = dto.amountBdt || Number(order.deliveryFeeBdt) || 120;
    } else if (paymentType === PaymentType.PARTIAL_PAYMENT) {
      amountToPay = dto.amountBdt || codDue;
    } else {
      // FULL_PREPAYMENT
      amountToPay = dto.amountBdt || (codDue > 0 ? codDue : totalPayable);
    }

    if (amountToPay <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const transactionId = `TXN_${uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

    // Initialize Split Ledger record if not already present
    await this.ledgerService.getOrCreateLedger(
      order.id,
      totalPayable,
      paymentType === PaymentType.ADVANCE_DELIVERY_FEE ? amountToPay : 0,
    );

    let paymentUrl: string | undefined;
    let gatewayPaymentId: string | undefined;

    if (dto.gateway === PaymentGateway.BKASH) {
      const bkashRes = await this.bkashService.createPayment({
        amount: amountToPay,
        orderNumber: order.orderNumber,
        callbackUrl: dto.redirectSuccessUrl,
      });
      paymentUrl = bkashRes.bkashURL;
      gatewayPaymentId = bkashRes.paymentID;
    } else if (dto.gateway === PaymentGateway.SSLCOMMERZ) {
      const addressJson = (order.shippingAddress as any) || {};
      const sslRes = await this.sslcommerzService.initiateSession({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: amountToPay,
        paymentType,
        customerName: order.guestName,
        customerPhone: order.guestPhone,
        shippingAddress: addressJson.streetAddress || 'Dhaka, Bangladesh',
        successUrl: dto.redirectSuccessUrl,
        failUrl: dto.redirectFailUrl,
        cancelUrl: dto.redirectFailUrl,
      });
      paymentUrl = sslRes.GatewayPageURL || sslRes.redirectGatewayURL;
      gatewayPaymentId = sslRes.sessionkey;
    } else {
      paymentUrl = `https://mockgateway.seyven.com/checkout?order=${order.id}&amount=${amountToPay}`;
      gatewayPaymentId = `MOCK_GW_${uuidv4().slice(0, 8)}`;
    }

    // Record Payment Transaction
    const transaction = await (this.prisma as any).paymentTransaction.create({
      data: {
        id: uuidv4(),
        orderId: order.id,
        transactionId,
        gatewayPaymentId,
        gateway: dto.gateway,
        paymentType,
        amountBdt: amountToPay,
        status: PaymentTransactionStatus.PENDING,
        metadata: {
          userId,
          initiatedAt: new Date().toISOString(),
          paymentUrl,
        },
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentType,
      gateway: dto.gateway,
      amountBdt: amountToPay,
      paymentUrl,
      gatewayPaymentId,
      transactionId: transaction.transactionId || transactionId,
      status: PaymentTransactionStatus.PENDING,
      metadata: {
        totalPayableBdt: totalPayable,
        advancePaidBdt: advancePaid,
        codDueBdt: codDue,
      },
    };
  }

  /**
   * Direct bKash Tokenized payment creation endpoint.
   */
  async createBkashPayment(dto: CreateBkashPaymentDto): Promise<InitiatePaymentResult> {
    return this.initiatePayment({
      orderId: dto.orderId,
      gateway: PaymentGateway.BKASH,
      paymentType: dto.paymentType,
      amountBdt: dto.amountBdt,
      redirectSuccessUrl: dto.callbackUrl,
    });
  }

  /**
   * bKash execution callback handler.
   */
  async handleBkashCallback(dto: BkashCallbackDto): Promise<{
    success: boolean;
    orderId: string;
    trxId?: string;
    paymentStatus: PaymentStatus;
    message: string;
  }> {
    const transaction = await (this.prisma as any).paymentTransaction.findFirst({
      where: { gatewayPaymentId: dto.paymentID },
      include: { order: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Payment transaction with paymentID ${dto.paymentID} not found`);
    }

    const order = transaction.order;

    if (dto.status !== 'success') {
      await (this.prisma as any).paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.FAILED,
          gatewayResponse: { callbackStatus: dto.status },
        },
      });
      return {
        success: false,
        orderId: order.id,
        paymentStatus: order.paymentStatus as PaymentStatus,
        message: `bKash payment was ${dto.status}`,
      };
    }

    // 1. Execute bKash Tokenized transaction
    const executeRes = await this.bkashService.executePayment(dto.paymentID);
    const amountPaid = Number(executeRes.amount) || Number(transaction.amountBdt);
    const trxId = executeRes.trxID || `TRX_${dto.paymentID}`;

    // 2. Check stock availability for unfulfillable payment scenario
    const stockCheck = await this.recoveryService.verifyStockAvailability(order.id);
    if (!stockCheck.isStockAvailable) {
      await this.recoveryService.handleUnfulfillablePayment(
        order.id,
        trxId,
        amountPaid,
        stockCheck.exhaustedSkus,
      );

      await (this.prisma as any).paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          transactionId: trxId,
          status: PaymentTransactionStatus.SUCCESS,
          gatewayResponse: executeRes as any,
        },
      });

      return {
        success: true,
        orderId: order.id,
        trxId,
        paymentStatus: PaymentStatus.PARTIALLY_PAID,
        message: 'Payment captured but inventory exhausted; marked as UNFULFILLABLE_PAYMENT_CAPTURED',
      };
    }

    // 3. Record credit payment into Split-Payment Ledger
    const ledgerResult = await this.ledgerService.recordCreditPayment(order.id, {
      transactionId: transaction.id,
      paymentType: transaction.paymentType,
      amount: amountPaid,
      referenceNote: `bKash TrxID: ${trxId}`,
    });

    // 4. Update transaction status
    await (this.prisma as any).paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        transactionId: trxId,
        status: PaymentTransactionStatus.SUCCESS,
        gatewayResponse: executeRes as any,
      },
    });

    // 5. Emit Outbox Event for order notification
    await this.outboxPublisher.publish({
      aggregateType: 'Payment',
      aggregateId: transaction.id,
      eventType: 'PaymentSuccess',
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        trxId,
        amount: amountPaid,
        gateway: PaymentGateway.BKASH,
        paymentType: transaction.paymentType,
        paymentStatus: ledgerResult.newPaymentStatus,
      },
    });

    return {
      success: true,
      orderId: order.id,
      trxId,
      paymentStatus: ledgerResult.newPaymentStatus,
      message: 'bKash payment successfully executed and ledger updated',
    };
  }

  /**
   * SSLCommerz session initialization endpoint.
   */
  async initSSLCommerzPayment(dto: InitSSLCommerzPaymentDto): Promise<InitiatePaymentResult> {
    return this.initiatePayment({
      orderId: dto.orderId,
      gateway: PaymentGateway.SSLCOMMERZ,
      paymentType: dto.paymentType,
      amountBdt: dto.amountBdt,
      redirectSuccessUrl: dto.successUrl,
      redirectFailUrl: dto.failUrl,
    });
  }

  /**
   * SSLCommerz Server-to-Server IPN Handler with replay protection and stock validation.
   */
  async handleSSLCommerzIpn(ipnDto: SSLCommerzIpnDto): Promise<{
    status: string;
    orderId?: string;
    tranId: string;
    message: string;
  }> {
    const validation = await this.sslcommerzService.validateIpn(ipnDto as any);

    if (!validation.isValid) {
      throw new BadRequestException(`SSLCommerz IPN validation failed for tran_id: ${ipnDto.tran_id}`);
    }

    let transaction = await (this.prisma as any).paymentTransaction.findFirst({
      where: {
        OR: [
          { transactionId: ipnDto.tran_id },
          { gatewayPaymentId: ipnDto.val_id },
        ],
      },
      include: { order: true },
    });

    const orderId = transaction?.orderId || validation.orderId;
    if (!orderId) {
      throw new NotFoundException(`Order reference not found in IPN payload for tran_id: ${ipnDto.tran_id}`);
    }

    const order = transaction?.order || (await (this.prisma as any).order.findUnique({ where: { id: orderId } }));
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const amountPaid = validation.amount || Number(order.totalPayableBdt);

    // Stock verification
    const stockCheck = await this.recoveryService.verifyStockAvailability(order.id);
    if (!stockCheck.isStockAvailable) {
      await this.recoveryService.handleUnfulfillablePayment(
        order.id,
        validation.tranId,
        amountPaid,
        stockCheck.exhaustedSkus,
      );

      return {
        status: 'UNFULFILLABLE_PAYMENT_CAPTURED',
        orderId: order.id,
        tranId: validation.tranId,
        message: 'IPN validated but inventory was exhausted; marked UNFULFILLABLE_PAYMENT_CAPTURED',
      };
    }

    // Record credit payment
    const paymentType = (transaction?.paymentType || validation.paymentType || PaymentType.FULL_PREPAYMENT) as PaymentType;
    const ledgerResult = await this.ledgerService.recordCreditPayment(order.id, {
      transactionId: transaction?.id,
      paymentType,
      amount: amountPaid,
      referenceNote: `SSLCommerz val_id: ${validation.valId}, card: ${validation.cardType || 'ONLINE'}`,
    });

    if (transaction) {
      await (this.prisma as any).paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.SUCCESS,
          gatewayResponse: ipnDto as any,
        },
      });
    }

    await this.outboxPublisher.publish({
      aggregateType: 'Payment',
      aggregateId: transaction?.id || order.id,
      eventType: 'PaymentSuccess',
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tranId: validation.tranId,
        valId: validation.valId,
        amount: amountPaid,
        gateway: PaymentGateway.SSLCOMMERZ,
        paymentStatus: ledgerResult.newPaymentStatus,
      },
    });

    return {
      status: 'IPN_SUCCESS',
      orderId: order.id,
      tranId: validation.tranId,
      message: 'SSLCommerz IPN processed and ledger settled',
    };
  }

  /**
   * Query transaction verification by TrxID / Transaction UUID.
   */
  async verifyTransaction(trxId: string): Promise<any> {
    const transaction = await (this.prisma as any).paymentTransaction.findFirst({
      where: {
        OR: [
          { transactionId: trxId },
          { gatewayPaymentId: trxId },
          { id: trxId },
        ],
      },
      include: {
        order: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${trxId} not found`);
    }

    let gatewayLiveStatus: any = null;
    if (transaction.gateway === PaymentGateway.BKASH && transaction.gatewayPaymentId) {
      gatewayLiveStatus = await this.bkashService.queryPayment(transaction.gatewayPaymentId);
    }

    return {
      transactionId: transaction.transactionId,
      gatewayPaymentId: transaction.gatewayPaymentId,
      orderId: transaction.orderId,
      orderNumber: transaction.order?.orderNumber,
      gateway: transaction.gateway,
      paymentType: transaction.paymentType,
      amountBdt: Number(transaction.amountBdt),
      status: transaction.status,
      createdAt: transaction.createdAt,
      gatewayLiveStatus,
    };
  }

  /**
   * Process full or partial refund.
   */
  async processRefund(dto: ProcessRefundDto): Promise<RefundResult> {
    const order: any = await (this.prisma as any).order.findUnique({
      where: { id: dto.orderId },
      include: {
        paymentTransactions: {
          where: { status: PaymentTransactionStatus.SUCCESS },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    const successTrx = dto.paymentTransactionId
      ? order.paymentTransactions?.find((t: any) => t.id === dto.paymentTransactionId)
      : order.paymentTransactions?.[0];

    let refundTrxId = `REF_${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

    // If bKash gateway, disburse via bKash API
    if (successTrx && successTrx.gateway === PaymentGateway.BKASH && successTrx.gatewayPaymentId) {
      const bkashRefundRes = await this.bkashService.refundPayment({
        paymentId: successTrx.gatewayPaymentId,
        trxId: successTrx.transactionId || '',
        amount: dto.amountBdt,
        reason: dto.reason,
      });
      refundTrxId = bkashRefundRes.refundTrxID || refundTrxId;
    }

    // Record Debit in Split Payment Ledger
    const debitResult = await this.ledgerService.recordRefundDebit(order.id, {
      transactionId: successTrx?.id,
      amount: dto.amountBdt,
      referenceNote: `Refund Reason: ${dto.reason} | RefTrx: ${refundTrxId}`,
    });

    // Create Refund Transaction Record
    await (this.prisma as any).paymentTransaction.create({
      data: {
        id: uuidv4(),
        orderId: order.id,
        transactionId: refundTrxId,
        gateway: successTrx?.gateway || PaymentGateway.BKASH,
        paymentType: PaymentType.REFUND,
        amountBdt: dto.amountBdt,
        status: PaymentTransactionStatus.REFUNDED,
        refundReason: dto.reason,
        refundTrxId,
        metadata: {
          originalTransactionId: successTrx?.transactionId,
        },
      },
    });

    // Publish Outbox Event
    await this.outboxPublisher.publish({
      aggregateType: 'Payment',
      aggregateId: order.id,
      eventType: 'PaymentRefunded',
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        refundTrxId,
        amountBdt: dto.amountBdt,
        reason: dto.reason,
        newPaymentStatus: debitResult.paymentStatus,
      },
    });

    return {
      success: true,
      refundTrxId,
      orderId: order.id,
      amountBdt: dto.amountBdt,
      gateway: successTrx?.gateway || PaymentGateway.BKASH,
      message: `Refund of ৳${dto.amountBdt} processed successfully`,
      paymentStatus: debitResult.paymentStatus,
    };
  }

  /**
   * Get ledger breakdown for an order.
   */
  async getLedger(orderId: string): Promise<SplitLedgerSummary> {
    return this.ledgerService.getLedgerByOrderId(orderId);
  }
}

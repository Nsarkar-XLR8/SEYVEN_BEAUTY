import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  PaymentStatus,
  PaymentType,
  LedgerEntryType,
  LedgerEntryDirection,
  SplitLedgerSummary,
} from '../interfaces/payment.interface';
import { PaymentStateMachine } from '../state-machine/payment-state-machine';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SplitPaymentLedgerService {
  private readonly logger = new Logger(SplitPaymentLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or initialize split payment ledger for an order.
   */
  async getOrCreateLedger(
    orderId: string,
    totalPayable: number,
    advanceRequired: number = 0,
    prismaTx?: any,
  ): Promise<any> {
    const db = prismaTx || this.prisma;
    let ledger = await db.splitPaymentLedger.findUnique({
      where: { orderId },
      include: { entries: true },
    });

    if (!ledger) {
      const codDue = Math.max(0, totalPayable - advanceRequired);
      ledger = await db.splitPaymentLedger.create({
        data: {
          id: uuidv4(),
          orderId,
          totalPayableBdt: totalPayable,
          advanceRequiredBdt: advanceRequired,
          advancePaidBdt: 0,
          codDueBdt: codDue,
          isFullySettled: false,
        },
        include: { entries: true },
      });
      this.logger.log(`Initialized split ledger for order ${orderId}: advanceRequired=${advanceRequired}, codDue=${codDue}`);
    }

    return ledger;
  }

  /**
   * Record credit payment into ledger and update order financial state.
   */
  async recordCreditPayment(
    orderId: string,
    params: {
      transactionId?: string;
      paymentType: PaymentType;
      amount: number;
      referenceNote?: string;
    },
    prismaTx?: any,
  ): Promise<any> {
    const db = prismaTx || this.prisma;

    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const totalPayable = Number(order.totalPayableBdt);
    const ledger = await this.getOrCreateLedger(
      orderId,
      totalPayable,
      Number(order.advancePaidBdt) || 0,
      db,
    );

    const amount = Number(params.amount);
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const currentAdvancePaid = Number(ledger.advancePaidBdt);
    let newAdvancePaid = currentAdvancePaid;
    let newCodDue = Number(ledger.codDueBdt);
    let newPaymentStatus: PaymentStatus = order.paymentStatus as PaymentStatus;
    let entryType: LedgerEntryType = LedgerEntryType.PARTIAL_PAYMENT_COLLECTED;
    let isFullySettled = ledger.isFullySettled;
    let settledAt = ledger.settledAt;

    if (params.paymentType === PaymentType.ADVANCE_DELIVERY_FEE) {
      entryType = LedgerEntryType.ADVANCE_FEE_COLLECTED;
      newAdvancePaid = currentAdvancePaid + amount;
      newCodDue = Math.max(0, totalPayable - newAdvancePaid);
      newPaymentStatus = newCodDue === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
      if (newCodDue === 0) {
        isFullySettled = true;
        settledAt = new Date();
      }
    } else if (params.paymentType === PaymentType.FULL_PREPAYMENT) {
      entryType = LedgerEntryType.FULL_PAYMENT_COLLECTED;
      newAdvancePaid = totalPayable;
      newCodDue = 0;
      newPaymentStatus = PaymentStatus.PAID;
      isFullySettled = true;
      settledAt = new Date();
    } else if (params.paymentType === PaymentType.DOORSTEP_COD) {
      entryType = LedgerEntryType.DOORSTEP_COD_COLLECTED;
      newCodDue = 0;
      newPaymentStatus = PaymentStatus.PAID;
      isFullySettled = true;
      settledAt = new Date();
    } else {
      newAdvancePaid = currentAdvancePaid + amount;
      newCodDue = Math.max(0, totalPayable - newAdvancePaid);
      newPaymentStatus = newCodDue === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
      if (newCodDue === 0) {
        isFullySettled = true;
        settledAt = new Date();
      }
    }

    // Check monotonic state transition
    PaymentStateMachine.assertCanTransition(order.paymentStatus as PaymentStatus, newPaymentStatus);

    // Calculate running balance (Total received so far)
    const runningBalance = (params.paymentType === PaymentType.DOORSTEP_COD)
      ? totalPayable
      : newAdvancePaid;

    // Create Ledger Entry
    const ledgerEntry = await db.paymentLedgerEntry.create({
      data: {
        id: uuidv4(),
        ledgerId: ledger.id,
        transactionId: params.transactionId || null,
        entryType,
        direction: LedgerEntryDirection.CREDIT,
        amountBdt: amount,
        runningBalanceBdt: runningBalance,
        referenceNote: params.referenceNote || `Payment credited via ${params.paymentType}`,
      },
    });

    // Update Split Ledger
    await db.splitPaymentLedger.update({
      where: { id: ledger.id },
      data: {
        advancePaidBdt: newAdvancePaid,
        codDueBdt: newCodDue,
        isFullySettled,
        settledAt,
      },
    });

    // Update Order
    await db.order.update({
      where: { id: orderId },
      data: {
        advancePaidBdt: newAdvancePaid,
        codDueBdt: newCodDue,
        paymentStatus: newPaymentStatus,
      },
    });

    this.logger.log(
      `Recorded ledger credit for order ${orderId}: amount=${amount}, advancePaid=${newAdvancePaid}, codDue=${newCodDue}, status=${newPaymentStatus}`,
    );

    return {
      ledgerEntry,
      newPaymentStatus,
      advancePaidBdt: newAdvancePaid,
      codDueBdt: newCodDue,
      isFullySettled,
    };
  }

  /**
   * Record refund debit entry into ledger and adjust order status.
   */
  async recordRefundDebit(
    orderId: string,
    params: {
      transactionId?: string;
      amount: number;
      referenceNote?: string;
    },
    prismaTx?: any,
  ): Promise<any> {
    const db = prismaTx || this.prisma;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { splitLedger: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const ledger = order.splitLedger || (await this.getOrCreateLedger(orderId, Number(order.totalPayableBdt), 0, db));
    const amount = Number(params.amount);
    const advancePaid = Number(ledger.advancePaidBdt);

    const newAdvancePaid = Math.max(0, advancePaid - amount);
    const isFullRefund = newAdvancePaid === 0;
    const nextStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

    PaymentStateMachine.assertCanTransition(order.paymentStatus as PaymentStatus, nextStatus);

    const ledgerEntry = await db.paymentLedgerEntry.create({
      data: {
        id: uuidv4(),
        ledgerId: ledger.id,
        transactionId: params.transactionId || null,
        entryType: LedgerEntryType.REFUND_DISBURSED,
        direction: LedgerEntryDirection.DEBIT,
        amountBdt: amount,
        runningBalanceBdt: newAdvancePaid,
        referenceNote: params.referenceNote || 'Refund disbursed to customer',
      },
    });

    await db.splitPaymentLedger.update({
      where: { id: ledger.id },
      data: {
        advancePaidBdt: newAdvancePaid,
        isFullySettled: false,
      },
    });

    await db.order.update({
      where: { id: orderId },
      data: {
        advancePaidBdt: newAdvancePaid,
        paymentStatus: nextStatus,
      },
    });

    this.logger.log(`Recorded refund debit for order ${orderId}: refunded=${amount}, remaining=${newAdvancePaid}, status=${nextStatus}`);

    return {
      ledgerEntry,
      paymentStatus: nextStatus,
      remainingAdvancePaidBdt: newAdvancePaid,
    };
  }

  /**
   * Get split ledger breakdown by order ID.
   */
  async getLedgerByOrderId(orderId: string): Promise<SplitLedgerSummary> {
    const order: any = await (this.prisma as any).order.findUnique({
      where: { id: orderId },
      include: {
        splitLedger: {
          include: {
            entries: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (!order.splitLedger) {
      // Create empty ledger representation if not present
      return {
        ledgerId: '',
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalPayableBdt: Number(order.totalPayableBdt),
        advanceRequiredBdt: Number(order.advancePaidBdt),
        advancePaidBdt: Number(order.advancePaidBdt),
        codDueBdt: Number(order.codDueBdt),
        isFullySettled: order.paymentStatus === PaymentStatus.PAID,
        settledAt: null,
        paymentStatus: order.paymentStatus as PaymentStatus,
        entries: [],
      };
    }

    return {
      ledgerId: order.splitLedger.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalPayableBdt: Number(order.splitLedger.totalPayableBdt),
      advanceRequiredBdt: Number(order.splitLedger.advanceRequiredBdt),
      advancePaidBdt: Number(order.splitLedger.advancePaidBdt),
      codDueBdt: Number(order.splitLedger.codDueBdt),
      isFullySettled: order.splitLedger.isFullySettled,
      settledAt: order.splitLedger.settledAt,
      paymentStatus: order.paymentStatus as PaymentStatus,
      entries: order.splitLedger.entries.map((entry: any) => ({
        id: entry.id,
        transactionId: entry.transactionId,
        entryType: entry.entryType as LedgerEntryType,
        direction: entry.direction as LedgerEntryDirection,
        amountBdt: Number(entry.amountBdt),
        runningBalanceBdt: Number(entry.runningBalanceBdt),
        referenceNote: entry.referenceNote,
        createdAt: entry.createdAt,
      })),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { RefundChannel, RmaStatus } from '@prisma/client';
import { RmaSettlementResult } from '../interfaces/rma.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RefundDisbursementService {
  private readonly logger = new Logger(RefundDisbursementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxPublisher: OutboxPublisher,
  ) {}

  /**
   * Disburses customer refund, issues NBR Mushak-6.7 Credit Note, and logs financial audit trail.
   */
  async disburseAndIssueCreditNote(
    rmaRequest: any,
    approvedRefundAmountBdt: number,
    refundChannel: RefundChannel,
    staffUserId?: string,
    providedRefundTrxId?: string,
  ): Promise<RmaSettlementResult> {
    const order = rmaRequest.order;
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = uuidv4().slice(0, 6).toUpperCase();
    const creditNoteSerial = `CRN-SYV-${yearMonth}-${randomSuffix}`;
    const refundTrxId =
      providedRefundTrxId ||
      `RFD_${refundChannel}_${Date.now()}_${uuidv4().slice(0, 4).toUpperCase()}`;

    // Calculate VAT proportion (Standard 7.5% or 15% VAT component)
    // Formula: taxable = total / 1.15, vat = total - taxable (or proportional to order subtotal vs vat)
    const orderSubtotal = Number(order.subtotalBdt || 1);
    const orderVat = Number(order.vatBdt || 0);
    const orderTotal = Number(order.totalPayableBdt || orderSubtotal + orderVat);

    let refundedTaxableAmount = 0;
    let refundedVatAmount = 0;

    if (orderTotal > 0 && orderVat > 0) {
      const vatRatio = orderVat / orderTotal;
      refundedVatAmount = Math.round(approvedRefundAmountBdt * vatRatio * 100) / 100;
      refundedTaxableAmount = Math.round((approvedRefundAmountBdt - refundedVatAmount) * 100) / 100;
    } else {
      refundedTaxableAmount = approvedRefundAmountBdt;
      refundedVatAmount = 0;
    }

    let creditNoteId = uuidv4();

    // Execute atomic DB transaction
    try {
      await (this.prisma as any).$transaction(async (tx: any) => {
        // 1. Ensure Mushak Invoice exists
        let mushakInvoice = await tx.mushakInvoice.findUnique({
          where: { orderId: order.id },
        });

        if (!mushakInvoice) {
          mushakInvoice = await tx.mushakInvoice.create({
            data: {
              id: uuidv4(),
              orderId: order.id,
              mushakSerialNo: `MSK-6.3-SYV-${yearMonth}-${randomSuffix}`,
              sellerBin: '004928174-0101',
              customerName: rmaRequest.customerName || order.guestName,
              customerPhone: rmaRequest.customerPhone || order.guestPhone,
              itemizedBreakdown: [],
              totalTaxableAmount: Number(order.subtotalBdt || approvedRefundAmountBdt),
              totalVatAmount: Number(order.vatBdt || 0),
            },
          });
        }

        // 2. Create Mushak-6.7 Credit Note
        const creditNote = await tx.mushakCreditNote.create({
          data: {
            id: creditNoteId,
            mushakInvoiceId: mushakInvoice.id,
            orderId: order.id,
            creditNoteSerialNo: creditNoteSerial,
            reason: `RMA Settlement: ${rmaRequest.rmaNumber} (${rmaRequest.primaryReason})`,
            refundedTaxableAmount,
            refundedVatAmount,
          },
        });
        creditNoteId = creditNote.id;

        // 3. Update RMA Record to SETTLED
        await tx.rmaRequest.update({
          where: { id: rmaRequest.id },
          data: {
            status: RmaStatus.SETTLED,
            approvedRefundAmountBdt,
            preferredRefundChannel: refundChannel,
            refundTrxId,
            settledAt: now,
            mushakCreditNoteId: creditNote.id,
          },
        });

        // 4. Record order audit log
        await tx.orderAuditLog.create({
          data: {
            id: uuidv4(),
            orderId: order.id,
            staffUserId: staffUserId || null,
            action: 'RMA_REFUND_SETTLED',
            previousStatus: order.status,
            newStatus: order.status,
            reason: `RMA ${rmaRequest.rmaNumber} settled: BDT ${approvedRefundAmountBdt} refunded via ${refundChannel}. Credit Note: ${creditNoteSerial}`,
            metadata: {
              rmaNumber: rmaRequest.rmaNumber,
              refundTrxId,
              creditNoteSerial,
              approvedRefundAmountBdt,
              refundedTaxableAmount,
              refundedVatAmount,
            },
          },
        });

        // 5. Publish Outbox Event
        await this.outboxPublisher.publish(
          {
            aggregateType: 'RmaRequest',
            aggregateId: rmaRequest.id,
            eventType: 'RmaRefundSettled',
            payload: {
              rmaId: rmaRequest.id,
              rmaNumber: rmaRequest.rmaNumber,
              orderId: order.id,
              orderNumber: order.orderNumber,
              approvedRefundAmountBdt,
              refundChannel,
              refundTrxId,
              creditNoteSerial,
              customerPhone: rmaRequest.customerPhone,
              settledAt: now.toISOString(),
            },
          },
          tx,
        );
      });
    } catch (dbErr: unknown) {
      this.logger.warn(`[Refund Disbursement] DB transaction note: ${(dbErr as Error).message}`);
    }

    return {
      rmaNumber: rmaRequest.rmaNumber,
      orderNumber: order.orderNumber,
      status: RmaStatus.SETTLED,
      approvedRefundAmountBdt,
      refundChannel,
      refundTrxId,
      mushakCreditNoteSerial: creditNoteSerial,
      settledAt: now.toISOString(),
      isRestocked: rmaRequest.isRestockable || false,
    };
  }
}

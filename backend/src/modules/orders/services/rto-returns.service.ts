import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { OrderStateMachine } from '../state-machine/order-state-machine';
import { PartialDeliveryDto } from '../dto/partial-delivery.dto';
import { RecordRtoExpenseDto } from '../dto/record-rto-expense.dto';
import { LotStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFKitLib = require('pdfkit');
const PDFDocument = PDFKitLib.default || PDFKitLib;

@Injectable()
export class RtoReturnsService {
  private readonly logger = new Logger(RtoReturnsService.name);

  // Corporate details for NBR Mushak-6.7 Credit Notes
  public static readonly COMPANY_NAME = 'SEYVEN Dermal Care Ltd.';
  public static readonly COMPANY_BIN = '004918273-0101';
  public static readonly COMPANY_ADDRESS =
    'House 42, Road 11, Block D, Banani Commercial Area, Dhaka-1213';
  public static readonly COMPANY_HOTLINE = '+880 9612-739836 (SEYVEN)';

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxPublisher: OutboxPublisher,
  ) {}

  /**
   * Process doorstep partial item acceptance:
   * 1. Re-calculates accepted order subtotal, 5% VAT, and remaining COD payable
   * 2. Automatically releases rejected units back to active inventory lots
   * 3. Issues statutory NBR Mushak-6.7 Credit Note for rejected items
   * 4. Transitions order to PARTIALLY_DELIVERED with immutable audit log
   */
  async processPartialDelivery(
    orderId: string,
    dto: PartialDeliveryDto,
    staffUserId?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        mushakInvoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    if (
      order.status !== OrderStatus.SHIPPED &&
      order.status !== OrderStatus.BOOKED &&
      order.status !== OrderStatus.PARTIALLY_DELIVERED
    ) {
      throw new BadRequestException(
        `Cannot process partial delivery for order in '${order.status}' status. Order must be SHIPPED or BOOKED.`,
      );
    }

    if (!dto.acceptedItems || dto.acceptedItems.length === 0) {
      throw new BadRequestException('At least one accepted item must be specified');
    }

    const acceptedMap = new Map<string, number>();
    for (const acc of dto.acceptedItems) {
      acceptedMap.set(acc.orderItemId, acc.acceptedQuantity);
    }

    // 1. Validate items and compute financial adjustment
    let newSubtotal = 0;
    let rejectedTaxableAmount = 0;
    const restockedItemsSummary: Array<{
      orderItemId: string;
      sku: string;
      title: string;
      rejectedQty: number;
      variantId: string;
    }> = [];

    for (const item of order.items) {
      const acceptedQty = acceptedMap.get(item.id);
      if (acceptedQty === undefined) {
        // If not listed in acceptedItems, assume full original quantity accepted
        newSubtotal += Number(item.lineTotalBdt);
        continue;
      }

      if (acceptedQty < 0 || acceptedQty > item.quantity) {
        throw new BadRequestException(
          `Invalid accepted quantity ${acceptedQty} for item '${item.title}' (Original: ${item.quantity})`,
        );
      }

      const unitPrice = Number(item.unitPriceBdt);
      const acceptedLineTotal = Math.round(acceptedQty * unitPrice * 100) / 100;
      newSubtotal += acceptedLineTotal;

      const rejectedQty = item.quantity - acceptedQty;
      if (rejectedQty > 0) {
        const rejectedLineTotal = Math.round(rejectedQty * unitPrice * 100) / 100;
        rejectedTaxableAmount += rejectedLineTotal;

        restockedItemsSummary.push({
          orderItemId: item.id,
          sku: item.sku,
          title: item.title,
          rejectedQty,
          variantId: item.variantId,
        });
      }
    }

    // 2. Compute adjusted financial metrics
    newSubtotal = Math.round(newSubtotal * 100) / 100;
    const deliveryFee = Number(order.deliveryFeeBdt) || 0;
    const discount = Number(order.discountBdt) || 0;
    const newVat = Math.round(newSubtotal * 0.05 * 100) / 100;
    const newTotalPayable = Math.max(
      0,
      Math.round((newSubtotal - discount + deliveryFee) * 100) / 100,
    );
    const advancePaid = Number(order.advancePaidBdt) || 0;

    let codDue = Math.max(0, Math.round((newTotalPayable - advancePaid) * 100) / 100);
    if (dto.collectedAmountBdt !== undefined) {
      codDue = Math.max(0, Math.round((codDue - dto.collectedAmountBdt) * 100) / 100);
    }

    const refundedVat = Math.round(rejectedTaxableAmount * 0.05 * 100) / 100;
    const creditNoteSerial = `CN-M67-${uuidv4().slice(0, 8).toUpperCase()}`;

    // 3. Execute Atomic Database Transaction
    return this.prisma.$transaction(async (tx) => {
      // 3.1. Restock rejected items to active inventory lots
      for (const restock of restockedItemsSummary) {
        const activeLot = await tx.inventoryLot.findFirst({
          where: {
            variantId: restock.variantId,
            status: LotStatus.ACTIVE,
          },
          orderBy: { expiryDate: 'asc' }, // FEFO preference
        });

        if (activeLot) {
          const newQty = activeLot.availableQuantity + restock.rejectedQty;
          await tx.inventoryLot.update({
            where: { id: activeLot.id },
            data: { availableQuantity: newQty },
          });

          await tx.inventoryAuditLog.create({
            data: {
              id: uuidv4(),
              lotId: activeLot.id,
              staffUserId: staffUserId || null,
              previousQuantity: activeLot.availableQuantity,
              newQuantity: newQty,
              adjustmentDelta: restock.rejectedQty,
              reasonCode: 'DOORSTEP_PARTIAL_RETURN',
              notes: `Order ${order.orderNumber} partial doorstep return of ${restock.rejectedQty} units (${restock.sku})`,
            },
          });
        }

        // Adjust line item accepted quantity in DB
        const acceptedQty = acceptedMap.get(restock.orderItemId) || 0;
        const acceptedLineTotal = Math.round(acceptedQty * Number(order.items.find(i => i.id === restock.orderItemId)?.unitPriceBdt || 0) * 100) / 100;
        await tx.orderItem.update({
          where: { id: restock.orderItemId },
          data: {
            quantity: acceptedQty,
            lineTotalBdt: acceptedLineTotal,
          },
        });
      }

      // 3.2. Ensure Mushak Invoice exists
      let mushakInvoice = order.mushakInvoice;
      if (!mushakInvoice) {
        mushakInvoice = await tx.mushakInvoice.create({
          data: {
            id: uuidv4(),
            orderId: order.id,
            mushakSerialNo: `M63-${order.orderNumber.replace('SYV-', '')}`,
            sellerBin: RtoReturnsService.COMPANY_BIN,
            customerName: order.guestName,
            customerPhone: order.guestPhone,
            itemizedBreakdown: order.items.map((i) => ({
              sku: i.sku,
              title: i.title,
              quantity: i.quantity,
              unitPrice: Number(i.unitPriceBdt),
              lineTotal: Number(i.lineTotalBdt),
            })),
            totalTaxableAmount: Number(order.subtotalBdt),
            totalVatAmount: Number(order.vatBdt),
          },
        });
      }

      // 3.3. Create NBR Mushak-6.7 Credit Note
      const creditNote = await tx.mushakCreditNote.create({
        data: {
          id: uuidv4(),
          mushakInvoiceId: mushakInvoice.id,
          orderId: order.id,
          creditNoteSerialNo: creditNoteSerial,
          reason: dto.reason || 'DOORSTEP_PARTIAL_REJECTION',
          refundedTaxableAmount: rejectedTaxableAmount,
          refundedVatAmount: refundedVat,
        },
      });

      // 3.4. Update Order financial totals and status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PARTIALLY_DELIVERED,
          subtotalBdt: newSubtotal,
          vatBdt: newVat,
          totalPayableBdt: newTotalPayable,
          codDueBdt: codDue,
          paymentStatus:
            codDue === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID,
        },
        include: { items: true },
      });

      // 3.5. Record immutable audit trail
      await tx.orderAuditLog.create({
        data: {
          id: uuidv4(),
          orderId: order.id,
          staffUserId: staffUserId || null,
          action: 'PARTIAL_DELIVERY_PROCESSED',
          previousStatus: order.status,
          newStatus: OrderStatus.PARTIALLY_DELIVERED,
          reason: `Doorstep partial acceptance: ${restockedItemsSummary.length} item(s) adjusted. Credit note: ${creditNoteSerial}`,
          metadata: {
            adjustedSubtotal: newSubtotal,
            adjustedTotalPayable: newTotalPayable,
            refundedTaxableAmount: rejectedTaxableAmount,
            refundedVatAmount: refundedVat,
            creditNoteSerial,
            restockedItems: restockedItemsSummary,
          },
        },
      });

      // 3.6. Publish Domain Event
      await this.outboxPublisher.publish(
        {
          aggregateType: 'Order',
          aggregateId: order.id,
          eventType: 'OrderPartiallyDelivered',
          payload: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            newSubtotal,
            newTotalPayable,
            creditNoteSerial,
            restockedItems: restockedItemsSummary,
          },
        },
        tx,
      );

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: OrderStatus.PARTIALLY_DELIVERED,
        adjustedTotals: {
          subtotalBdt: newSubtotal,
          vatBdt: newVat,
          totalPayableBdt: newTotalPayable,
          codDueBdt: codDue,
        },
        creditNote: {
          serialNo: creditNote.creditNoteSerialNo,
          refundedTaxableAmount: Number(creditNote.refundedTaxableAmount),
          refundedVatAmount: Number(creditNote.refundedVatAmount),
          totalCreditAmount:
            Number(creditNote.refundedTaxableAmount) +
            Number(creditNote.refundedVatAmount),
        },
        restockedItems: restockedItemsSummary,
      };
    });
  }

  /**
   * Record Courier Return-to-Origin (RTO) Expense and Restock:
   * 1. Records non-refundable forward and return courier shipping fees in rto_expenses table
   * 2. Automatically releases all reserved/shipped items back to inventory lots
   * 3. Transitions order status to RETURNED with immutable staff audit trail
   * 4. Issues full NBR Mushak-6.7 Credit Note for VAT reconciliation
   */
  async processRto(
    orderId: string,
    dto: RecordRtoExpenseDto,
    staffUserId?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        mushakInvoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    const totalLossBdt =
      Math.round((dto.forwardShippingFeeBdt + dto.returnShippingFeeBdt) * 100) / 100;
    const creditNoteSerial = `CN-M67-${uuidv4().slice(0, 8).toUpperCase()}`;
    const taxableAmount = Number(order.subtotalBdt);
    const vatAmount = Number(order.vatBdt);

    return this.prisma.$transaction(async (tx) => {
      // 1. Record RTO non-refundable courier expense
      const rtoExpense = await (tx as any).rtoExpense.create({
        data: {
          id: uuidv4(),
          orderId: order.id,
          courier: dto.courier.toUpperCase(),
          consignmentId:
            dto.consignmentId ||
            order.courierBookingId ||
            order.trackingCode ||
            null,
          forwardShippingFeeBdt: dto.forwardShippingFeeBdt,
          returnShippingFeeBdt: dto.returnShippingFeeBdt,
          totalLossBdt,
          rtoReason: dto.rtoReason,
          notes: dto.notes || null,
          staffUserId: staffUserId || null,
        },
      });

      // 2. Restock all items to active inventory lots
      const restockedSummary: Array<{
        sku: string;
        title: string;
        quantity: number;
        lotId?: string;
      }> = [];

      if (dto.releaseStock !== false) {
        for (const item of order.items) {
          const activeLot = await tx.inventoryLot.findFirst({
            where: {
              variantId: item.variantId,
              status: LotStatus.ACTIVE,
            },
            orderBy: { expiryDate: 'asc' },
          });

          if (activeLot) {
            const newQty = activeLot.availableQuantity + item.quantity;
            await tx.inventoryLot.update({
              where: { id: activeLot.id },
              data: { availableQuantity: newQty },
            });

            await tx.inventoryAuditLog.create({
              data: {
                id: uuidv4(),
                lotId: activeLot.id,
                staffUserId: staffUserId || null,
                previousQuantity: activeLot.availableQuantity,
                newQuantity: newQty,
                adjustmentDelta: item.quantity,
                reasonCode: 'RTO_FULL_RESTOCK',
                notes: `Order ${order.orderNumber} full RTO restock of ${item.quantity} units (${item.sku})`,
              },
            });

            restockedSummary.push({
              sku: item.sku,
              title: item.title,
              quantity: item.quantity,
              lotId: activeLot.id,
            });
          }
        }
      }

      // 3. Ensure Mushak Invoice exists & issue Mushak-6.7 Credit Note
      let mushakInvoice = order.mushakInvoice;
      if (!mushakInvoice) {
        mushakInvoice = await tx.mushakInvoice.create({
          data: {
            id: uuidv4(),
            orderId: order.id,
            mushakSerialNo: `M63-${order.orderNumber.replace('SYV-', '')}`,
            sellerBin: RtoReturnsService.COMPANY_BIN,
            customerName: order.guestName,
            customerPhone: order.guestPhone,
            itemizedBreakdown: order.items.map((i) => ({
              sku: i.sku,
              title: i.title,
              quantity: i.quantity,
              unitPrice: Number(i.unitPriceBdt),
              lineTotal: Number(i.lineTotalBdt),
            })),
            totalTaxableAmount: taxableAmount,
            totalVatAmount: vatAmount,
          },
        });
      }

      const creditNote = await tx.mushakCreditNote.create({
        data: {
          id: uuidv4(),
          mushakInvoiceId: mushakInvoice.id,
          orderId: order.id,
          creditNoteSerialNo: creditNoteSerial,
          reason: dto.rtoReason,
          refundedTaxableAmount: taxableAmount,
          refundedVatAmount: vatAmount,
        },
      });

      // 4. Transition order status to RETURNED
      if (OrderStateMachine.canTransition(order.status, OrderStatus.RETURNED)) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.RETURNED,
            codDueBdt: 0,
          },
        });
      }

      // 5. Record immutable staff audit log
      await tx.orderAuditLog.create({
        data: {
          id: uuidv4(),
          orderId: order.id,
          staffUserId: staffUserId || null,
          action: 'RTO_EXPENSE_RECORDED',
          previousStatus: order.status,
          newStatus: OrderStatus.RETURNED,
          reason: `RTO recorded via ${dto.courier} (${dto.rtoReason}). Unrecoverable courier loss: ৳${totalLossBdt}. Credit Note: ${creditNoteSerial}`,
          metadata: {
            courier: dto.courier,
            forwardShippingFee: dto.forwardShippingFeeBdt,
            returnShippingFee: dto.returnShippingFeeBdt,
            totalLossBdt,
            rtoReason: dto.rtoReason,
            creditNoteSerial,
            restockedItems: restockedSummary,
          },
        },
      });

      // 6. Outbox domain event
      await this.outboxPublisher.publish(
        {
          aggregateType: 'Order',
          aggregateId: order.id,
          eventType: 'OrderReturnedToOrigin',
          payload: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            courier: dto.courier,
            totalLossBdt,
            creditNoteSerial,
          },
        },
        tx,
      );

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: OrderStatus.RETURNED,
        rtoExpense: {
          id: rtoExpense.id,
          courier: rtoExpense.courier,
          forwardShippingFeeBdt: Number(rtoExpense.forwardShippingFeeBdt),
          returnShippingFeeBdt: Number(rtoExpense.returnShippingFeeBdt),
          totalLossBdt: Number(rtoExpense.totalLossBdt),
          reason: rtoExpense.rtoReason,
        },
        creditNote: {
          serialNo: creditNote.creditNoteSerialNo,
          refundedTaxableAmount: Number(creditNote.refundedTaxableAmount),
          refundedVatAmount: Number(creditNote.refundedVatAmount),
          totalCreditAmount:
            Number(creditNote.refundedTaxableAmount) +
            Number(creditNote.refundedVatAmount),
        },
        restockedItems: restockedSummary,
      };
    });
  }

  /**
   * Generate Statutory NBR Mushak-6.7 Credit Note (কর ক্রেডিট নোট) Vector PDF (A4 Format)
   * Pursuant to Rule 40(1)(g) of Bangladesh VAT & SD Rules, 2016
   */
  async generateMushak67Pdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        mushakInvoice: true,
        mushakCreditNotes: {
          orderBy: { issuedAt: 'desc' },
        },
        rtoExpenses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    const orderData = order as any;
    const latestCreditNote = orderData?.mushakCreditNotes?.[0];
    const creditNoteSerial =
      latestCreditNote?.creditNoteSerialNo ||
      `CN-M67-${order.orderNumber.replace('SYV-', '')}`;
    const invoiceSerial =
      orderData?.mushakInvoice?.mushakSerialNo ||
      `M63-${order.orderNumber.replace('SYV-', '')}`;
    const shippingAddress = (order.shippingAddress || {}) as Record<string, any>;
    const reason =
      latestCreditNote?.reason ||
      orderData?.rtoExpenses?.[0]?.rtoReason ||
      (order.status === OrderStatus.PARTIALLY_DELIVERED
        ? 'Doorstep Partial Rejection'
        : 'Return to Origin (RTO)');

    const taxableDeducted = latestCreditNote
      ? Number(latestCreditNote.refundedTaxableAmount)
      : Number(order.subtotalBdt);
    const vatDeducted = latestCreditNote
      ? Number(latestCreditNote.refundedVatAmount)
      : Number(order.vatBdt);
    const totalCreditAmount = taxableDeducted + vatDeducted;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 32,
        info: {
          Title: `Mushak-6.7 Credit Note - ${creditNoteSerial}`,
          Author: RtoReturnsService.COMPANY_NAME,
          Subject: 'NBR Form Mushak-6.7 VAT Credit Note',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Outer Decorative Border
      doc.rect(24, 24, 547, 794).lineWidth(0.8).stroke('#374151');

      // Top NBR Statutory Header
      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text("GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH", 32, 34, {
          align: 'center',
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('NATIONAL BOARD OF REVENUE', 32, 47, { align: 'center' });
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('CREDIT NOTE / কর ক্রেডিট নোট [FORM MUSHAK-6.7]', 32, 60, {
          align: 'center',
        });
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .text(
          '[See Clause (g) of Sub-rule (1) of Rule 40 of Value Added Tax and Supplementary Duty Rules, 2016]',
          32,
          74,
          { align: 'center' },
        );

      doc.moveTo(32, 88).lineTo(563, 88).lineWidth(1).stroke('#111827');

      // 2-Column Metadata Grid
      // Left: Supplier Details
      doc.font('Helvetica-Bold').fontSize(8).text('REGISTERED SUPPLIER DETAILS:', 32, 94);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(RtoReturnsService.COMPANY_NAME, 32, 105);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`BIN / VAT Reg No: ${RtoReturnsService.COMPANY_BIN}`, 32, 116);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Address: ${RtoReturnsService.COMPANY_ADDRESS}`, 32, 127, {
          width: 250,
        });

      // Right: Credit Note & Challan Reference
      doc.font('Helvetica-Bold').fontSize(8).text('CREDIT NOTE & CHALLAN REFERENCE:', 330, 94);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#B91C1C')
        .text(`Credit Note No: ${creditNoteSerial}`, 330, 105);
      doc
        .fillColor('#111827')
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Original Tax Invoice No: ${invoiceSerial}`, 330, 116);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Original Order No: ${order.orderNumber}`, 330, 127);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Issue Date: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-US')}`,
          330,
          138,
        );

      // Divider Line
      doc.moveTo(32, 154).lineTo(563, 154).lineWidth(0.5).stroke('#D1D5DB');

      // Buyer Details
      doc.font('Helvetica-Bold').fontSize(8).text('BUYER / RECIPIENT DETAILS:', 32, 160);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Name: ${shippingAddress.fullName || order.guestName || 'Valued Client'}`,
          32,
          171,
        );
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Phone: ${shippingAddress.phone || order.guestPhone || 'N/A'}`,
          32,
          182,
        );
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Destination: ${shippingAddress.thanaArea || ''}, ${shippingAddress.district || ''}`,
          32,
          193,
        );
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(`Reason for Credit Note: ${reason}`, 330, 171);

      // Schedule Table Header
      const tableY = 212;
      doc.rect(32, tableY, 531, 20).fill('#1E293B');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(6.5);
      doc.text('SL', 36, tableY + 6);
      doc.text('ORIGINAL CHALLAN', 58, tableY + 6);
      doc.text('DESCRIPTION OF RETURNED GOODS', 160, tableY + 6);
      doc.text('RET. QTY', 320, tableY + 6);
      doc.text('TAXABLE VAL (BDT)', 375, tableY + 6);
      doc.text('VAT RATE', 460, tableY + 6);
      doc.text('VAT DEDUCTED', 505, tableY + 6);

      // Table Rows
      let currentY = tableY + 22;
      doc.font('Helvetica').fontSize(6.5).fillColor('#111827');

      const itemsList: any[] = orderData?.items || [];
      itemsList.forEach((item: any, index: number) => {
        const itemLineTotal = Number(item.lineTotalBdt);
        const itemVat = Math.round(itemLineTotal * 0.05 * 100) / 100;

        if (index % 2 === 1) {
          doc.rect(32, currentY - 2, 531, 14).fill('#F8FAFC');
          doc.fillColor('#111827');
        }

        doc.text(String(index + 1), 38, currentY);
        doc.text(invoiceSerial, 58, currentY);
        doc.text(`${item.title} (${item.sku})`, 160, currentY, { width: 155 });
        doc.text(String(item.quantity), 330, currentY);
        doc.text(`৳ ${itemLineTotal.toFixed(2)}`, 375, currentY);
        doc.text('5%', 465, currentY);
        doc.text(`৳ ${itemVat.toFixed(2)}`, 505, currentY);

        currentY += 15;
      });

      currentY += 10;
      doc.moveTo(32, currentY).lineTo(563, currentY).lineWidth(0.8).stroke('#374151');
      currentY += 6;

      // Summary Box
      const summaryX = 330;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1F2937');
      doc.text('Total Deducted Taxable Value:', summaryX, currentY);
      doc.text(`৳ ${taxableDeducted.toFixed(2)}`, 480, currentY, { align: 'right' });

      currentY += 12;
      doc.text('Total Deducted Value Added Tax (VAT 5%):', summaryX, currentY);
      doc.text(`৳ ${vatDeducted.toFixed(2)}`, 480, currentY, { align: 'right' });

      currentY += 14;
      doc.rect(summaryX - 4, currentY - 2, 237, 16).fill('#1E293B');
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('TOTAL CREDIT NOTE VALUE (BDT):', summaryX, currentY + 2);
      doc.text(`৳ ${totalCreditAmount.toFixed(2)}`, 480, currentY + 2, {
        align: 'right',
      });

      // Statutory Declaration & Sign-off
      const footerY = 700;
      doc.fillColor('#111827');
      doc
        .font('Helvetica-Oblique')
        .fontSize(6.5)
        .text(
          'Statutory Declaration: Issued pursuant to Section 51(3) of the Value Added Tax and Supplementary Duty Act, 2012. Value Added Tax indicated in this credit note has been adjusted in the supplier monthly VAT Return (Form Mushak-9.1). Returned items have been accounted for in the raw material/finished goods inventory ledger.',
          32,
          footerY,
          { width: 520, align: 'center' },
        );

      doc.moveTo(40, footerY + 60).lineTo(180, footerY + 60).lineWidth(0.5).stroke('#6B7280');
      doc
        .font('Helvetica')
        .fontSize(7)
        .text('Customer Acknowledgment / Signature', 40, footerY + 65, {
          width: 140,
          align: 'center',
        });

      doc.moveTo(400, footerY + 60).lineTo(540, footerY + 60).lineWidth(0.5).stroke('#6B7280');
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .text('Authorized Signatory & Seal', 400, footerY + 65, {
          width: 140,
          align: 'center',
        });
      doc
        .font('Helvetica')
        .fontSize(6)
        .text('SEYVEN Dermal Care Ltd.', 400, footerY + 75, {
          width: 140,
          align: 'center',
        });

      doc.end();
    });
  }
}

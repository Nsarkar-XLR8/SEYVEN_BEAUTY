import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  ExportManifestDto,
  ManifestCourierFilter,
} from '../dto/export-manifest.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFKitLib = require('pdfkit');
const PDFDocument = (PDFKitLib.default || PDFKitLib);

@Injectable()
export class DispatchDocsService {
  private readonly logger = new Logger(DispatchDocsService.name);

  // Corporate details for NBR Mushak-6.3 and Dispatch Labels
  public static readonly COMPANY_NAME = 'SEYVEN Dermal Care Ltd.';
  public static readonly COMPANY_TAGLINE = 'The Sanctuary of Beauty';
  public static readonly COMPANY_BIN = '004918273-0101';
  public static readonly COMPANY_ADDRESS =
    'House 42, Road 11, Block D, Banani Commercial Area, Dhaka-1213';
  public static readonly COMPANY_HOTLINE = '+880 9612-739836 (SEYVEN)';
  public static readonly COMPANY_EMAIL = 'concierge@seyven.com';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate 4x6 inch (288x432 pt) Vector PDF Thermal Shipping Label
   */
  async generateShippingLabelPdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    const shippingAddress = (order.shippingAddress || {}) as Record<string, any>;
    const codDue = Math.max(0, Math.round(Number(order.codDueBdt)));
    const isCod = codDue > 0;
    const carrier = order.trackingCode?.startsWith('DB')
      ? 'PATHAO COURIER'
      : order.trackingCode?.startsWith('SF')
        ? 'STEADFAST COURIER'
        : order.courierBookingId
          ? 'COURIER DISPATCH'
          : 'STANDARD LOGISTICS';

    const consignmentCode =
      order.courierBookingId || order.trackingCode || `SF${order.orderNumber}`;

    return new Promise((resolve, reject) => {
      // 4x6 inches in PostScript points: 4 * 72 = 288 pt wide, 6 * 72 = 432 pt high
      const doc = new PDFDocument({
        size: [288, 432],
        margin: 14,
        info: {
          Title: `Shipping Label - ${order.orderNumber}`,
          Author: 'SEYVEN Logistics',
          Subject: 'Thermal 4x6 Shipping Label',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Outer Border
      doc.rect(10, 10, 268, 412).lineWidth(1.2).stroke('#111827');

      // Top Header: Merchant Brand
      doc.rect(10, 10, 268, 36).fill('#111827');
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('S E Y V E N', 14, 16, { align: 'center', characterSpacing: 4 });
      doc
        .font('Helvetica')
        .fontSize(7)
        .text('THE SANCTUARY OF BEAUTY  •  DHAKA, BANGLADESH', 14, 33, {
          align: 'center',
          characterSpacing: 1,
        });

      // Carrier & Tracking Code Bar
      doc.fillColor('#111827');
      doc.rect(14, 52, 260, 28).fill('#F3F4F6');
      doc
        .fillColor('#1F2937')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`CARRIER: ${carrier}`, 20, 58);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`CID / TRK: ${consignmentCode}`, 20, 68);

      // Simulated Vector Barcode
      this.drawVectorBarcode(doc, consignmentCode, 20, 86, 248, 28);

      // Prominent COD vs Prepaid Badge
      if (isCod) {
        doc.rect(14, 122, 260, 42).fill('#B91C1C'); // Red banner
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('CASH ON DELIVERY (COD)', 14, 127, { align: 'center' });
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .text(`COLLECT FROM CUSTOMER: ৳ ${codDue.toLocaleString('en-US')}`, 14, 142, {
            align: 'center',
          });
      } else {
        doc.rect(14, 122, 260, 36).fill('#047857'); // Green banner
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('PREPAID SHIPMENT', 14, 127, { align: 'center' });
        doc
          .font('Helvetica')
          .fontSize(9)
          .text('DO NOT COLLECT CASH AT DOORSTEP', 14, 142, { align: 'center' });
      }

      // Divider Line
      doc.moveTo(14, 172).lineTo(274, 172).lineWidth(0.8).stroke('#D1D5DB');

      // Recipient Delivery Address
      doc.fillColor('#111827');
      doc.font('Helvetica-Bold').fontSize(8).text('DELIVER TO (RECIPIENT):', 16, 178);
      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .text(
          `${shippingAddress.fullName || order.guestName || 'Customer'}`,
          16,
          189,
        );
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
          `PHONE: ${shippingAddress.phone || order.guestPhone || 'N/A'}`,
          16,
          202,
        );

      const addressStr = `${shippingAddress.streetAddress || ''}, ${shippingAddress.thanaArea || ''}, ${shippingAddress.district || ''}`.trim();
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(addressStr || 'Home / Office Address', 16, 214, {
          width: 256,
          lineGap: 1.5,
        });

      // Divider Line
      doc.moveTo(14, 252).lineTo(274, 252).lineWidth(0.8).stroke('#D1D5DB');

      // Order Reference & Item Summary
      doc.font('Helvetica-Bold').fontSize(7.5).text('ORDER DETAILS:', 16, 258);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Order No: ${order.orderNumber}`, 16, 268);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`,
          160,
          268,
        );

      // Itemised Package Manifest (max 4 rows on 4x6 label)
      let itemY = 282;
      doc.rect(14, itemY, 260, 14).fill('#E5E7EB');
      doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(6.5);
      doc.text('SKU', 18, itemY + 3.5);
      doc.text('ITEM DESCRIPTION', 75, itemY + 3.5);
      doc.text('QTY', 248, itemY + 3.5);

      itemY += 16;
      doc.font('Helvetica').fontSize(6.5).fillColor('#111827');
      const displayedItems = order.items.slice(0, 4);
      for (const item of displayedItems) {
        doc.text(item.sku.slice(0, 12), 18, itemY);
        doc.text(item.title.slice(0, 36), 75, itemY, { width: 165 });
        doc.text(`x${item.quantity}`, 250, itemY);
        itemY += 11;
      }

      if (order.items.length > 4) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(6)
          .text(`+ ${order.items.length - 4} additional items enclosed`, 75, itemY);
      }

      // Fragile & Cosmetics Storage Advisory
      doc.rect(14, 350, 260, 32).fill('#FEF3C7'); // Light yellow
      doc.rect(14, 350, 260, 32).lineWidth(0.5).stroke('#F59E0B');
      doc
        .fillColor('#92400E')
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .text('⚠️  FRAGILE DERMAL COSMETICS  •  HANDLE WITH CARE', 18, 354);
      doc
        .font('Helvetica')
        .fontSize(6)
        .text(
          'Keep upright. Temperature sensitive active skincare. Store below 25°C. Tamper-evident seal must remain intact upon delivery.',
          18,
          364,
          { width: 252 },
        );

      // Return Hub Footer
      doc
        .fillColor('#6B7280')
        .font('Helvetica')
        .fontSize(5.5)
        .text(
          `Return Address: ${DispatchDocsService.COMPANY_NAME}, ${DispatchDocsService.COMPANY_ADDRESS} • Hotline: ${DispatchDocsService.COMPANY_HOTLINE}`,
          14,
          396,
          { align: 'center', width: 260 },
        );

      doc.end();
    });
  }

  /**
   * Generate NBR Mushak-6.3 VAT Tax Invoice Vector PDF (A4 Format)
   * National Board of Revenue, Bangladesh — Value Added Tax and Supplementary Duty Act, 2012
   */
  async generateMushak63Pdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    const shippingAddress = (order.shippingAddress || {}) as Record<string, any>;
    const challanNo = `M63-${order.orderNumber.replace('SYV-', '')}`;
    const invoiceDate = new Date(order.createdAt);
    const dateFormatted = invoiceDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = invoiceDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 32,
        info: {
          Title: `Mushak-6.3 Tax Invoice - ${order.orderNumber}`,
          Author: DispatchDocsService.COMPANY_NAME,
          Subject: 'NBR Mushak-6.3 Value Added Tax Invoice',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Outer Decorative Border
      doc.rect(24, 24, 547, 794).lineWidth(0.8).stroke('#374151');

      // Top Header: NBR Seal & Form Header
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
        .text('TAX INVOICE [FORM MUSHAK-6.3]', 32, 60, {
          align: 'center',
        });
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .text(
          '[See Clause (c) and Clause (f) of Sub-rule (1) of Rule 40 of Value Added Tax and Supplementary Duty Rules, 2016]',
          32,
          74,
          { align: 'center' },
        );

      doc.moveTo(32, 88).lineTo(563, 88).lineWidth(1).stroke('#111827');

      // Seller and Invoice Details (2-Column Grid)
      // Left: Seller Info
      doc.font('Helvetica-Bold').fontSize(8).text('REGISTERED SUPPLIER DETAILS:', 32, 94);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(DispatchDocsService.COMPANY_NAME, 32, 105);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`BIN / VAT Reg No: ${DispatchDocsService.COMPANY_BIN}`, 32, 116);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Address: ${DispatchDocsService.COMPANY_ADDRESS}`, 32, 127, {
          width: 250,
        });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Hotline: ${DispatchDocsService.COMPANY_HOTLINE}`, 32, 145);

      // Right: Challan & Order Info
      doc.font('Helvetica-Bold').fontSize(8).text('INVOICE & CHALLAN DATA:', 330, 94);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`Challan No: ${challanNo}`, 330, 105);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Order Reference: ${order.orderNumber}`, 330, 116);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Issue Date: ${dateFormatted} at ${timeFormatted} BST`, 330, 127);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Payment Mode: ${Number(order.advancePaidBdt) > 0 ? 'MFS Advance' : 'Doorstep COD'}`,
          330,
          138,
        );

      // Divider Line
      doc.moveTo(32, 158).lineTo(563, 158).lineWidth(0.5).stroke('#D1D5DB');

      // Buyer Info Block
      doc.font('Helvetica-Bold').fontSize(8).text('BUYER / RECIPIENT DETAILS:', 32, 164);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Name: ${shippingAddress.fullName || order.guestName || 'Valued Client'}`,
          32,
          175,
        );
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Phone: ${shippingAddress.phone || order.guestPhone || 'N/A'}`,
          32,
          186,
        );
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Delivery Address: ${shippingAddress.streetAddress || ''}, ${shippingAddress.thanaArea || ''}, ${shippingAddress.district || ''}`,
          32,
          197,
          { width: 520 },
        );

      // Table Header: Mushak 6.3 Standard Schedule Columns
      const tableY = 216;
      doc.rect(32, tableY, 531, 20).fill('#1E293B');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(6.5);
      doc.text('SL', 36, tableY + 6);
      doc.text('GOODS DESCRIPTION & SKU', 58, tableY + 6);
      doc.text('QTY', 230, tableY + 6);
      doc.text('UNIT PRICE', 260, tableY + 6);
      doc.text('TOTAL VALUE', 320, tableY + 6);
      doc.text('SD (0%)', 380, tableY + 6);
      doc.text('VAT RATE', 424, tableY + 6);
      doc.text('VAT (BDT)', 470, tableY + 6);
      doc.text('NET TOTAL', 515, tableY + 6);

      // Table Rows
      let currentY = tableY + 22;
      doc.font('Helvetica').fontSize(6.5).fillColor('#111827');

      let calculatedSubtotal = 0;
      let calculatedTotalVat = 0;

      order.items.forEach((item, index) => {
        const itemLineTotal = Number(item.lineTotalBdt);
        const itemUnitPrice = Number(item.unitPriceBdt);
        // Retail beauty standard VAT rate: 5%
        const itemVat = Math.round(itemLineTotal * 0.05 * 100) / 100;
        const itemNet = Math.round((itemLineTotal + itemVat) * 100) / 100;

        calculatedSubtotal += itemLineTotal;
        calculatedTotalVat += itemVat;

        // Alternating row background
        if (index % 2 === 1) {
          doc.rect(32, currentY - 2, 531, 14).fill('#F8FAFC');
          doc.fillColor('#111827');
        }

        doc.text(String(index + 1), 38, currentY);
        doc.text(`${item.title} (${item.sku})`, 58, currentY, { width: 165 });
        doc.text(String(item.quantity), 235, currentY);
        doc.text(`৳${itemUnitPrice.toFixed(2)}`, 260, currentY);
        doc.text(`৳${itemLineTotal.toFixed(2)}`, 320, currentY);
        doc.text('৳0.00', 382, currentY);
        doc.text('5%', 430, currentY);
        doc.text(`৳${itemVat.toFixed(2)}`, 470, currentY);
        doc.text(`৳${itemNet.toFixed(2)}`, 515, currentY);

        currentY += 15;
      });

      // Delivery Fee Row
      const deliveryFee = Number(order.deliveryFeeBdt) || 0;
      doc.text(String(order.items.length + 1), 38, currentY);
      doc.text('Fulfillment & Doorstep Express Delivery', 58, currentY);
      doc.text('1', 235, currentY);
      doc.text(`৳${deliveryFee.toFixed(2)}`, 260, currentY);
      doc.text(`৳${deliveryFee.toFixed(2)}`, 320, currentY);
      doc.text('৳0.00', 382, currentY);
      doc.text('0%', 430, currentY);
      doc.text('৳0.00', 470, currentY);
      doc.text(`৳${deliveryFee.toFixed(2)}`, 515, currentY);

      currentY += 18;
      doc.moveTo(32, currentY).lineTo(563, currentY).lineWidth(0.8).stroke('#374151');
      currentY += 6;

      // Calculation Summary Box (Right Aligned)
      const subtotalBdt = Number(order.subtotalBdt) || calculatedSubtotal;
      const discountBdt = Number(order.discountBdt) || 0;
      const vatBdt = Number(order.vatBdt) || calculatedTotalVat;
      const totalPayableBdt = Number(order.totalPayableBdt);

      const summaryX = 330;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1F2937');
      doc.text('Gross Subtotal (Excl. VAT):', summaryX, currentY);
      doc.text(`৳ ${subtotalBdt.toFixed(2)}`, 480, currentY, { align: 'right' });

      currentY += 12;
      doc.text('Promotional Voucher / Savings:', summaryX, currentY);
      doc.text(`- ৳ ${discountBdt.toFixed(2)}`, 480, currentY, { align: 'right' });

      currentY += 12;
      doc.text('Delivery Fee:', summaryX, currentY);
      doc.text(`৳ ${deliveryFee.toFixed(2)}`, 480, currentY, { align: 'right' });

      currentY += 12;
      doc.text('Total Applicable Value Added Tax (VAT 5%):', summaryX, currentY);
      doc.text(`৳ ${vatBdt.toFixed(2)}`, 480, currentY, { align: 'right' });

      currentY += 14;
      doc.rect(summaryX - 4, currentY - 2, 237, 16).fill('#1E293B');
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('NET INVOICE PAYABLE (BDT):', summaryX, currentY + 2);
      doc.text(`৳ ${totalPayableBdt.toFixed(2)}`, 480, currentY + 2, {
        align: 'right',
      });

      // Statutory Declaration & Signature
      const footerY = 700;
      doc.fillColor('#111827');
      doc
        .font('Helvetica-Oblique')
        .fontSize(6.5)
        .text(
          'Statutory Declaration: This is an electronic tax invoice generated pursuant to Section 51 of the Value Added Tax and Supplementary Duty Act, 2012. Goods sold under this tax invoice comply with all Bangladesh Standards and Testing Institution (BSTI) cosmetic standards.',
          32,
          footerY,
          { width: 520, align: 'center' },
        );

      doc.moveTo(40, footerY + 60).lineTo(180, footerY + 60).lineWidth(0.5).stroke('#6B7280');
      doc
        .font('Helvetica')
        .fontSize(7)
        .text('Received in Good Condition (Client)', 40, footerY + 65, {
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

  /**
   * Generate 1-Click Bulk Courier Dispatch Manifest Vector PDF (A4 Format)
   */
  async generateManifestPdf(dto: ExportManifestDto): Promise<Buffer> {
    const orders = await this.fetchManifestOrders(dto);
    const manifestId = `MNF-${Date.now().toString().slice(-8)}`;
    const courierPartner = dto.courier || ManifestCourierFilter.ALL;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 32,
        info: {
          Title: `Courier Dispatch Manifest - ${manifestId}`,
          Author: DispatchDocsService.COMPANY_NAME,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Header Banner
      doc.rect(24, 24, 547, 44).fill('#111827');
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('SEYVEN — COURIER DISPATCH & HANDOVER MANIFEST', 32, 32);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Manifest ID: ${manifestId}  •  Courier Partner: ${courierPartner}  •  Date: ${new Date().toLocaleDateString('en-GB')}`,
          32,
          50,
        );

      // KPI Metric Cards
      const totalOrders = orders.length;
      const totalCodBdt = orders.reduce(
        (sum, o) => sum + Math.max(0, Math.round(Number(o.codDueBdt))),
        0,
      );
      const totalPrepaid = orders.filter((o) => Number(o.codDueBdt) <= 0).length;

      const cardY = 78;
      // Card 1
      doc.rect(32, cardY, 160, 36).fill('#F3F4F6');
      doc.fillColor('#4B5563').font('Helvetica-Bold').fontSize(7).text('TOTAL PARCELS', 40, cardY + 7);
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(14).text(String(totalOrders), 40, cardY + 18);

      // Card 2
      doc.rect(202, cardY, 185, 36).fill('#F3F4F6');
      doc.fillColor('#4B5563').font('Helvetica-Bold').fontSize(7).text('TOTAL COD COLLECTION (BDT)', 210, cardY + 7);
      doc.fillColor('#B91C1C').font('Helvetica-Bold').fontSize(14).text(`৳ ${totalCodBdt.toLocaleString('en-US')}`, 210, cardY + 18);

      // Card 3
      doc.rect(397, cardY, 166, 36).fill('#F3F4F6');
      doc.fillColor('#4B5563').font('Helvetica-Bold').fontSize(7).text('PREPAID PARCELS', 405, cardY + 7);
      doc.fillColor('#047857').font('Helvetica-Bold').fontSize(14).text(String(totalPrepaid), 405, cardY + 18);

      // Table Header
      const tableY = 126;
      doc.rect(32, tableY, 531, 18).fill('#1E293B');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
      doc.text('SL', 36, tableY + 5);
      doc.text('ORDER NO', 56, tableY + 5);
      doc.text('CONSIGNMENT / TRK ID', 150, tableY + 5);
      doc.text('RECIPIENT & PHONE', 270, tableY + 5);
      doc.text('DESTINATION', 400, tableY + 5);
      doc.text('COD DUE', 495, tableY + 5);

      // Table Rows
      let currentY = tableY + 20;
      doc.font('Helvetica').fontSize(6.5).fillColor('#111827');

      orders.forEach((order, index) => {
        // Page break safety
        if (currentY > 740) {
          doc.addPage();
          currentY = 40;
        }

        const shippingAddress = (order.shippingAddress || {}) as Record<string, any>;
        const cod = Math.max(0, Math.round(Number(order.codDueBdt)));
        const trk = order.courierBookingId || order.trackingCode || 'SF-PENDING';

        if (index % 2 === 1) {
          doc.rect(32, currentY - 2, 531, 14).fill('#F8FAFC');
          doc.fillColor('#111827');
        }

        doc.text(String(index + 1), 36, currentY);
        doc.text(order.orderNumber, 56, currentY);
        doc.text(trk, 150, currentY);
        doc.text(
          `${shippingAddress.fullName || order.guestName || 'Customer'} (${shippingAddress.phone || order.guestPhone || ''})`.slice(0, 30),
          270,
          currentY,
        );
        doc.text(
          `${shippingAddress.thanaArea || ''}, ${shippingAddress.district || ''}`.slice(0, 24),
          400,
          currentY,
        );
        doc.text(
          cod > 0 ? `৳${cod.toLocaleString('en-US')}` : 'PREPAID',
          495,
          currentY,
        );

        currentY += 15;
      });

      // Handover Signatures
      const sigY = 730;
      doc.moveTo(40, sigY).lineTo(220, sigY).lineWidth(0.8).stroke('#6B7280');
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#111827')
        .text('Dispatch Officer (SEYVEN)', 40, sigY + 6);
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .text('Signature & Date of Handover', 40, sigY + 16);

      doc.moveTo(350, sigY).lineTo(530, sigY).lineWidth(0.8).stroke('#6B7280');
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .text('Courier Representative / Rider', 350, sigY + 6);
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .text('Name, Phone, Signature & Date', 350, sigY + 16);

      doc.end();
    });
  }

  /**
   * Export Courier Dispatch Manifest in RFC-4180 compliant CSV format
   */
  async generateManifestCsv(dto: ExportManifestDto): Promise<string> {
    const orders = await this.fetchManifestOrders(dto);

    const headers = [
      'SL',
      'Order Number',
      'Consignment ID',
      'Tracking Code',
      'Recipient Name',
      'Recipient Phone',
      'District',
      'Thana Area',
      'Street Address',
      'COD Due (BDT)',
      'Order Status',
      'Created Date',
    ];

    const escapeCsv = (str: string | number | null | undefined) => {
      const val = str === null || str === undefined ? '' : String(str);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = orders.map((order, idx) => {
      const addr = (order.shippingAddress || {}) as Record<string, any>;
      return [
        idx + 1,
        order.orderNumber,
        order.courierBookingId || '',
        order.trackingCode || '',
        addr.fullName || order.guestName || '',
        addr.phone || order.guestPhone || '',
        addr.district || '',
        addr.thanaArea || '',
        addr.streetAddress || '',
        Math.max(0, Math.round(Number(order.codDueBdt))),
        order.status,
        new Date(order.createdAt).toISOString(),
      ]
        .map(escapeCsv)
        .join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Generate Warehouse Itemized Picking & Packing Slip Vector PDF (A4 Format)
   */
  async generatePackingSlipPdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    const shippingAddress = (order.shippingAddress || {}) as Record<string, any>;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 32,
        info: {
          Title: `Packing Slip - ${order.orderNumber}`,
          Author: DispatchDocsService.COMPANY_NAME,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Header Banner
      doc.rect(24, 24, 547, 44).fill('#0F172A');
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('SEYVEN — WAREHOUSE PICKING & PACKING SLIP', 32, 32);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Order Reference: ${order.orderNumber}  •  Status: ${order.status}  •  Fulfillment Hub: Central BANANI-01`,
          32,
          50,
        );

      // Customer & Shipping Info
      doc.fillColor('#111827');
      doc.font('Helvetica-Bold').fontSize(8.5).text('DESTINATION DETAILS:', 32, 82);
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(
          `Customer: ${shippingAddress.fullName || order.guestName} (${shippingAddress.phone || order.guestPhone})`,
          32,
          94,
        );
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(
          `Address: ${shippingAddress.streetAddress || ''}, ${shippingAddress.thanaArea || ''}, ${shippingAddress.district || ''}`,
          32,
          106,
          { width: 500 },
        );

      // Table Header: Items to Pick
      const tableY = 132;
      doc.rect(32, tableY, 531, 18).fill('#1E293B');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
      doc.text('CHECK', 36, tableY + 5);
      doc.text('SKU CODE', 75, tableY + 5);
      doc.text('PRODUCT DESCRIPTION', 160, tableY + 5);
      doc.text('LOCATION / BIN', 360, tableY + 5);
      doc.text('PICK QTY', 460, tableY + 5);
      doc.text('FEFO CHECK', 510, tableY + 5);

      // Table Rows
      let currentY = tableY + 20;
      doc.font('Helvetica').fontSize(7.5).fillColor('#111827');

      order.items.forEach((item, index) => {
        if (index % 2 === 1) {
          doc.rect(32, currentY - 2, 531, 18).fill('#F8FAFC');
          doc.fillColor('#111827');
        }

        // Draw checkbox square
        doc.rect(40, currentY + 1, 8, 8).lineWidth(0.8).stroke('#4B5563');
        doc.text(item.sku, 75, currentY + 2);
        doc.text(item.title, 160, currentY + 2, { width: 190 });
        doc.text(`RACK-${item.sku.slice(0, 3)}-01`, 360, currentY + 2);
        doc.font('Helvetica-Bold').text(`${item.quantity} units`, 460, currentY + 2);
        doc.font('Helvetica').text('≥90d OK', 512, currentY + 2);

        currentY += 20;
      });

      // Quality Inspection Checklist
      const qaY = Math.max(currentY + 20, 360);
      doc.rect(32, qaY, 531, 95).fill('#F1F5F9');
      doc.rect(32, qaY, 531, 95).lineWidth(0.5).stroke('#CBD5E1');

      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('WAREHOUSE QA & PACKAGING MANDATORY CHECKLIST:', 40, qaY + 8);

      const checks = [
        '[  ] Batch lot expiry dates verified (First-Expiry-First-Out with minimum 90-day threshold)',
        '[  ] Luxury cosmetic tamper-evident seal is intact and undamaged',
        '[  ] Thermal insulation and bubble padding applied against courier transit shock',
        '[  ] NBR Mushak-6.3 VAT Tax Invoice enclosed in transparent exterior document pouch',
        '[  ] Complimentary gift samples (GWP) packed if indicated on invoice',
      ];

      let checkY = qaY + 24;
      doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
      for (const chk of checks) {
        doc.text(chk, 44, checkY);
        checkY += 13;
      }

      // Warehouse Operator Sign-off
      const sigY = 730;
      doc.moveTo(40, sigY).lineTo(200, sigY).lineWidth(0.8).stroke('#6B7280');
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#111827')
        .text('Warehouse Picker Signature', 40, sigY + 6);
      doc.font('Helvetica').fontSize(7).text('Staff ID / Date / Shift', 40, sigY + 16);

      doc.moveTo(350, sigY).lineTo(510, sigY).lineWidth(0.8).stroke('#6B7280');
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text('QA Inspector & Packer Signature', 350, sigY + 6);
      doc.font('Helvetica').fontSize(7).text('Staff ID / Date / Station', 350, sigY + 16);

      doc.end();
    });
  }

  /**
   * Helper: Draw simulated Code128 barcode vector lines in PDFKit
   */
  private drawVectorBarcode(
    doc: any,
    code: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    doc.save();
    doc.rect(x, y, width, height).fill('#FFFFFF');
    doc.fillColor('#000000');

    // Generate deterministic bar widths based on code characters
    let currentX = x + 10;
    const endX = x + width - 10;
    const barWidths = [1, 2, 1.5, 3, 1, 2.5, 1];

    for (let i = 0; i < code.length && currentX < endX; i++) {
      const charCode = code.charCodeAt(i);
      const w = barWidths[charCode % barWidths.length];
      const gap = (charCode % 3) + 1;

      doc.rect(currentX, y, w, height - 8).fill('#000000');
      currentX += w + gap;
    }

    // Centered human readable text below barcode
    doc
      .font('Courier-Bold')
      .fontSize(6.5)
      .fillColor('#111827')
      .text(`* ${code} *`, x, y + height - 6, {
        width,
        align: 'center',
      });

    doc.restore();
  }

  /**
   * Helper: Query orders eligible for courier dispatch manifest
   */
  private async fetchManifestOrders(dto: ExportManifestDto) {
    const where: any = {};

    if (dto.courier === ManifestCourierFilter.PATHAO) {
      where.trackingCode = { startsWith: 'DB' };
    } else if (dto.courier === ManifestCourierFilter.STEADFAST) {
      where.OR = [
        { trackingCode: { startsWith: 'SF' } },
        { courierBookingId: { not: null } },
      ];
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: dto.limit || 100,
      include: { items: true },
    });
  }
}

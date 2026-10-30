import { jsPDF } from 'jspdf';
import { OrderReceiptData } from '@/components/checkout/order-receipt-document';
import { BRAND } from '@/lib/constants';

/**
 * SEYVEN Atelier — Luxury Minimalist Client Invoice Generator
 * Simple, elegant, haute-couture aesthetic for 100% authentic curated international skincare.
 */
export function generateAndDownloadSeyvenReceipt(orderData: OrderReceiptData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const rightX = pageWidth - margin;

  // Curated Luxury Palette
  const noir = { r: 28, g: 25, b: 23 };        // #1C1917 Noir Espresso
  const gold = { r: 199, g: 169, b: 123 };     // #C7A97B Champagne Gold
  const border = { r: 230, g: 223, b: 213 };   // #E6DFD5 Cashmere Stone
  const muted = { r: 120, g: 115, b: 110 };    // #78716C Warm Slate

  // 1. Subtle Luxury Outer Border (Framing the page to eliminate empty void)
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.25);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // 2. SEYVEN Luxury Masthead
  let y = 26;

  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(noir.r, noir.g, noir.b);
  doc.text('S E Y V E N', pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text('THE SANCTUARY OF BEAUTY', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(muted.r, muted.g, muted.b);
  doc.text('100% Authentic Curated International Skincare', pageWidth / 2, y, { align: 'center' });

  y += 3.5;
  doc.setFontSize(6.5);
  doc.text('NARAYANGANJ · BANGLADESH', pageWidth / 2, y, { align: 'center' });

  // Minimal Gold Center Hairline
  y += 4.5;
  doc.setDrawColor(gold.r, gold.g, gold.b);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 18, y, pageWidth / 2 + 18, y);

  // 3. Balanced Order Information Ledger (2 Columns)
  y += 12;

  const formattedDate = orderData.createdAt
    ? new Date(orderData.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  // Left Column: Order Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text('ORDER REFERENCE', margin, y);

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(noir.r, noir.g, noir.b);
  doc.text(orderData.orderId, margin, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(muted.r, muted.g, muted.b);
  doc.text(`Date: ${formattedDate}`, margin, y);

  const paymentLabel =
    orderData.paymentMethod === 'COD'
      ? 'Payment: Cash on Delivery'
      : orderData.paymentMethod === 'BKASH'
      ? 'Payment: bKash Online'
      : 'Payment: Online Payment';
  doc.text(paymentLabel, margin, y + 4);

  // Right Column: Client Destination
  const customerY = y - 8.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text('DELIVER TO', rightX, customerY, { align: 'right' });

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(noir.r, noir.g, noir.b);
  doc.text(orderData.customerName || 'Valued Client', rightX, customerY + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(muted.r, muted.g, muted.b);
  if (orderData.address) {
    doc.text(orderData.address, rightX, customerY + 8.5, { align: 'right' });
  }
  doc.text(`${orderData.districtName || 'Bangladesh'}`, rightX, customerY + 12.5, { align: 'right' });
  if (orderData.phone) {
    doc.text(`Phone: ${orderData.phone}`, rightX, customerY + 16.5, { align: 'right' });
  }

  // Divider Line below ledger
  y += 18;
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.3);
  doc.line(margin, y, rightX, y);

  // 4. Products Table
  y += 8;

  // Table Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text('ITEM FORMULATION', margin, y);
  doc.text('SPECIFICATION', margin + 105, y, { align: 'center' });
  doc.text('QTY', margin + 130, y, { align: 'center' });
  doc.text('PRICE (BDT)', rightX, y, { align: 'right' });

  y += 3.5;
  doc.setDrawColor(noir.r, noir.g, noir.b);
  doc.setLineWidth(0.35);
  doc.line(margin, y, rightX, y);

  // Products List
  const items =
    orderData.items && orderData.items.length > 0
      ? orderData.items
      : [
          {
            id: 'item-1',
            titleEn: 'Curated International Skincare Formulation',
            volume: 'Standard',
            priceBdt: orderData.totalBdt,
            quantity: 1,
          },
        ];

  items.forEach((item) => {
    y += 6.5;

    // Title with text-wrapping to prevent overflow
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(noir.r, noir.g, noir.b);
    const splitTitle = doc.splitTextToSize(item.titleEn, 95);
    doc.text(splitTitle, margin, y);

    // Specification & Quantity
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(muted.r, muted.g, muted.b);
    doc.text(item.volume || 'Standard', margin + 105, y, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(noir.r, noir.g, noir.b);
    doc.text(String(item.quantity), margin + 130, y, { align: 'center' });

    // Line Total in BDT
    const lineTotal = Math.round(item.priceBdt * item.quantity).toLocaleString('en-IN');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(noir.r, noir.g, noir.b);
    doc.text(`BDT ${lineTotal}`, rightX, y, { align: 'right' });

    // Adjust Y if product title wrapped
    const titleHeight = (splitTitle.length - 1) * 3.5;
    y += titleHeight + 3.5;

    doc.setDrawColor(border.r, border.g, border.b);
    doc.setLineWidth(0.2);
    doc.line(margin, y, rightX, y);
  });

  // 5. Clean Minimal Financial Settlement
  y += 8;
  const subtotal = orderData.subtotalBdt || orderData.totalBdt;
  const delivery = orderData.deliveryFeeBdt ?? 0;
  const discount = orderData.discountBdt ?? 0;

  const totalLabelX = rightX - 60;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(muted.r, muted.g, muted.b);

  doc.text('Subtotal', totalLabelX, y);
  doc.text(`BDT ${Math.round(subtotal).toLocaleString('en-IN')}`, rightX, y, { align: 'right' });

  y += 5;
  doc.text('Delivery Fee', totalLabelX, y);
  if (delivery === 0) {
    doc.setTextColor(gold.r, gold.g, gold.b);
    doc.text('Complimentary', rightX, y, { align: 'right' });
  } else {
    doc.text(`BDT ${delivery}`, rightX, y, { align: 'right' });
  }

  if (discount > 0) {
    y += 5;
    doc.setTextColor(gold.r, gold.g, gold.b);
    doc.text('Privilege Savings', totalLabelX, y);
    doc.text(`-BDT ${Math.round(discount).toLocaleString('en-IN')}`, rightX, y, { align: 'right' });
  }

  // Divider above Total
  y += 4;
  doc.setDrawColor(noir.r, noir.g, noir.b);
  doc.setLineWidth(0.35);
  doc.line(totalLabelX, y, rightX, y);

  y += 6.5;
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(noir.r, noir.g, noir.b);
  doc.text('TOTAL AMOUNT', totalLabelX, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`BDT ${Math.round(orderData.totalBdt).toLocaleString('en-IN')}`, rightX, y, { align: 'right' });

  // 6. Luxury Subtle Brand Commitment (Fulfilling "we re the interntionl 100% uthentic curtor")
  const commitmentY = pageHeight - 32;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(muted.r, muted.g, muted.b);
  doc.text(
    '100% Authentic Curated International Formulations • The Sanctuary of Beauty',
    pageWidth / 2,
    commitmentY,
    { align: 'center' }
  );

  // 7. Clean Minimalist Footer
  const footerY = pageHeight - 24;

  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.25);
  doc.line(margin, footerY, rightX, footerY);

  // Left Footer Info
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(noir.r, noir.g, noir.b);
  doc.text('SEYVEN', margin, footerY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(muted.r, muted.g, muted.b);
  doc.text('K.B. Saha Road, Amlapara, Chashara, Narayanganj - 1400', margin, footerY + 8.5);

  // Right Footer Info
  const customerCareContact =
    orderData.supportWhatsApp || orderData.supportPhone || BRAND.supportWhatsApp;
  const careText = customerCareContact
    ? `Customer Care: ${BRAND.supportEmail} • ${customerCareContact}`
    : `Customer Care: ${BRAND.supportEmail}`;
  doc.text(careText, rightX, footerY + 4.5, {
    align: 'right',
  });
  doc.text('www.theseyven.com', rightX, footerY + 8.5, { align: 'right' });

  // 8. Direct Download Trigger
  doc.save(`SEYVEN_Receipt_${orderData.orderId}.pdf`);
}

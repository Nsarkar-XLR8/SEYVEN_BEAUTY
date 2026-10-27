import { jsPDF } from 'jspdf';
import { OrderReceiptData } from '@/components/checkout/order-receipt-document';

/**
 * SEYVEN — Order Receipt PDF Generator
 * Simple, elegant, minimalist receipt for curated international skincare.
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

  // Colors
  const dark = { r: 28, g: 25, b: 23 };        // #1C1917
  const gold = { r: 199, g: 169, b: 123 };     // #C7A97B
  const border = { r: 230, g: 223, b: 213 };   // #E6DFD5
  const muted = { r: 120, g: 115, b: 110 };

  let y = 30;

  // 1. SEYVEN Header
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(dark.r, dark.g, dark.b);
  doc.text('S E Y V E N', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text('THE SANCTUARY OF BEAUTY', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFontSize(6.5);
  doc.setTextColor(muted.r, muted.g, muted.b);
  doc.text('DHAKA, BANGLADESH', pageWidth / 2, y, { align: 'center' });

  // Divider
  y += 6;
  doc.setDrawColor(gold.r, gold.g, gold.b);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 20, y, pageWidth / 2 + 20, y);

  // 2. Order Information Header
  y += 15;

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

  // Left: Order Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text('ORDER RECEIPT', margin, y);

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(dark.r, dark.g, dark.b);
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

  // Right: Customer Details
  const customerY = y - 8.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text('DELIVER TO', rightX, customerY, { align: 'right' });

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(dark.r, dark.g, dark.b);
  doc.text(orderData.customerName || 'Customer', rightX, customerY + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(muted.r, muted.g, muted.b);
  doc.text(`${orderData.address || ''}`, rightX, customerY + 9, { align: 'right' });
  doc.text(`${orderData.districtName || 'Dhaka'}, Bangladesh`, rightX, customerY + 13, { align: 'right' });
  doc.text(`Phone: ${orderData.phone || ''}`, rightX, customerY + 17, { align: 'right' });

  // Divider Line
  y += 18;
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.3);
  doc.line(margin, y, rightX, y);

  // 3. Products Table
  y += 8;

  // Column Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text('ITEM', margin, y);
  doc.text('SIZE', margin + 110, y, { align: 'center' });
  doc.text('QTY', margin + 135, y, { align: 'center' });
  doc.text('PRICE', rightX, y, { align: 'right' });

  y += 3.5;
  doc.setDrawColor(dark.r, dark.g, dark.b);
  doc.setLineWidth(0.4);
  doc.line(margin, y, rightX, y);

  // Products
  const items =
    orderData.items && orderData.items.length > 0
      ? orderData.items
      : [
          {
            id: 'item-1',
            titleEn: 'Skincare Item',
            volume: 'Standard',
            priceBdt: orderData.totalBdt,
            quantity: 1,
          },
        ];

  items.forEach((item) => {
    y += 7;
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(dark.r, dark.g, dark.b);
    doc.text(item.titleEn, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(muted.r, muted.g, muted.b);
    doc.text(item.volume || 'Standard', margin + 110, y, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(dark.r, dark.g, dark.b);
    doc.text(String(item.quantity), margin + 135, y, { align: 'center' });

    const lineTotal = Math.round(item.priceBdt * item.quantity).toLocaleString('en-IN');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Tk ${lineTotal}`, rightX, y, { align: 'right' });

    y += 4;
    doc.setDrawColor(border.r, border.g, border.b);
    doc.setLineWidth(0.2);
    doc.line(margin, y, rightX, y);
  });

  // 4. Financial Total
  y += 10;
  const subtotal = orderData.subtotalBdt || orderData.totalBdt;
  const delivery = orderData.deliveryFeeBdt ?? 0;
  const discount = orderData.discountBdt ?? 0;

  const totalLabelX = rightX - 55;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(muted.r, muted.g, muted.b);

  doc.text('Subtotal', totalLabelX, y);
  doc.text(`Tk ${Math.round(subtotal).toLocaleString('en-IN')}`, rightX, y, { align: 'right' });

  y += 5.5;
  doc.text('Delivery', totalLabelX, y);
  if (delivery === 0) {
    doc.setTextColor(gold.r, gold.g, gold.b);
    doc.text('Free Delivery', rightX, y, { align: 'right' });
  } else {
    doc.text(`Tk ${delivery}`, rightX, y, { align: 'right' });
  }

  if (discount > 0) {
    y += 5.5;
    doc.setTextColor(gold.r, gold.g, gold.b);
    doc.text('Discount', totalLabelX, y);
    doc.text(`-Tk ${Math.round(discount).toLocaleString('en-IN')}`, rightX, y, { align: 'right' });
  }

  // Total Line
  y += 4.5;
  doc.setDrawColor(dark.r, dark.g, dark.b);
  doc.setLineWidth(0.4);
  doc.line(totalLabelX, y, rightX, y);

  y += 7;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(dark.r, dark.g, dark.b);
  doc.text('TOTAL', totalLabelX, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(`Tk ${Math.round(orderData.totalBdt).toLocaleString('en-IN')}`, rightX, y, { align: 'right' });

  // 5. Clean Simple Footer
  const footerY = pageHeight - 25;

  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, rightX, footerY);

  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(dark.r, dark.g, dark.b);
  doc.text('SEYVEN', margin, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(muted.r, muted.g, muted.b);
  doc.text('The Sanctuary of Beauty', margin, footerY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(muted.r, muted.g, muted.b);
  doc.text('Customer Care: care@seyven.com.bd • +880 1700 000000', rightX, footerY + 5, { align: 'right' });
  doc.text('K.B. Saha Road, Amlapara, Chashara, Narayanganj - 1400 • www.theseyven.com', rightX, footerY + 9, { align: 'right' });

  // 6. Direct Instant Download
  doc.save(`SEYVEN_Receipt_${orderData.orderId}.pdf`);
}

/**
 * SEYVEN - The Sanctuary of Beauty
 * Customer Luxury Order Receipt Email Template
 * Completely customer-facing: Zero admin desk links or internal operational texts.
 */

export interface CustomerReceiptOrderData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  district?: string;
  zone?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
  items?: Array<{
    title: string;
    variant?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  totalAmount: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
}

export function generateCustomerOrderReceiptHtml(order: CustomerReceiptOrderData): string {
  const itemsRows = (order.items || [])
    .map(
      (it) => `
      <tr style="border-bottom: 1px solid #E6DFD5;">
        <td style="padding: 12px 8px; font-size: 13px; color: #1C1917;">
          <strong>${it.title || 'Curated Formulation'}</strong>
          ${it.variant ? `<br><span style="font-size: 11px; color: #78716C;">Edition: ${it.variant}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #1C1917; font-family: monospace;">
          ${it.quantity}
        </td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #1C1917; font-family: monospace;">
          ৳${Number(it.unitPrice || 0).toLocaleString()}
        </td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: right; font-weight: 600; color: #1C1917; font-family: monospace;">
          ৳${Number(it.totalPrice || it.unitPrice * it.quantity || 0).toLocaleString()}
        </td>
      </tr>
    `,
    )
    .join('');

  const isInsideDhaka =
    (order.district || order.zone || '').toLowerCase().includes('inside') ||
    (order.district || order.zone || '').toLowerCase().includes('metro');
  const estimatedArrival = isInsideDhaka ? '1–2 Business Days' : '2–3 Business Days';

  const rawSupportNum = (order.supportWhatsApp || order.supportPhone || '').trim();
  const cleanWhatsApp = rawSupportNum.replace(/[^0-9]/g, '');
  const whatsAppDigits = cleanWhatsApp
    ? (cleanWhatsApp.startsWith('88') ? cleanWhatsApp : `88${cleanWhatsApp.replace(/^0+/, '')}`)
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your SEYVEN Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F6F0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E6DFD5; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 20px rgba(28, 25, 23, 0.06);">
          <!-- Top Accent Gold Line -->
          <tr>
            <td style="height: 5px; background-color: #C7A97B;"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #E6DFD5; background-color: #FFFFFF;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; letter-spacing: 0.25em; color: #1C1917; font-weight: 500;">
                SEYVEN
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #C7A97B; font-weight: 600;">
                THE SANCTUARY OF BEAUTY
              </p>
            </td>
          </tr>

          <!-- Greeting & Order Status -->
          <tr>
            <td style="padding: 28px 32px; background-color: #F9F6F0; border-bottom: 1px solid #E6DFD5;">
              <span style="display: inline-block; padding: 4px 10px; background-color: #1C1917; color: #C7A97B; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 3px;">
                ✓ ORDER CONFIRMED
              </span>
              <h2 style="margin: 14px 0 6px 0; font-family: Georgia, serif; font-size: 22px; color: #1C1917; font-weight: 500;">
                Thank you for your order, ${order.customerName}.
              </h2>
              <p style="margin: 0; font-size: 13px; color: #78716C; line-height: 1.6;">
                We are carefully preparing your authentic skincare formulations in climate-protected packaging for prompt delivery.
              </p>
              <div style="margin-top: 14px; padding: 10px 14px; background-color: #FFFFFF; border: 1px solid #E6DFD5; display: inline-block;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #78716C;">Order Identifier:</span>
                <span style="font-size: 13px; font-weight: 700; font-family: monospace; color: #1C1917; margin-left: 6px;">#${order.orderNumber}</span>
              </div>
            </td>
          </tr>

          <!-- Delivery Details -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C7A97B; font-weight: 700;">
                Delivery Details
              </h3>
              <table role="presentation" width="100%" style="font-size: 13px; line-height: 1.6; color: #1C1917;">
                <tr>
                  <td style="width: 140px; color: #78716C; padding: 4px 0;">Recipient:</td>
                  <td style="font-weight: 600; padding: 4px 0;">${order.customerName} (${order.customerPhone})</td>
                </tr>
                <tr>
                  <td style="color: #78716C; padding: 4px 0;">Destination:</td>
                  <td style="padding: 4px 0; font-weight: 500;">${order.shippingAddress}, ${order.district || ''}</td>
                </tr>
                <tr>
                  <td style="color: #78716C; padding: 4px 0;">Estimated Arrival:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #1C1917;">${estimatedArrival} (Doorstep Delivery)</td>
                </tr>
                <tr>
                  <td style="color: #78716C; padding: 4px 0;">Payment Method:</td>
                  <td style="padding: 4px 0; font-weight: 600;">Cash on Delivery with open-box verification</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 16px 32px 24px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C7A97B; font-weight: 700;">
                Your Formulations
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #F9F6F0; border-top: 1px solid #E6DFD5; border-bottom: 1px solid #E6DFD5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #78716C;">
                    <th style="padding: 8px; text-align: left;">Item</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Unit</th>
                    <th style="padding: 8px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows || '<tr><td colspan="4" style="padding: 12px 8px; text-align: center; color: #78716C;">1 x Formulation</td></tr>'}
                </tbody>
              </table>

              <!-- Financial Breakdown -->
              <table role="presentation" width="100%" style="margin-top: 16px; font-size: 13px; color: #1C1917;">
                <tr>
                  <td style="text-align: right; padding: 4px 8px; color: #78716C;">Subtotal:</td>
                  <td style="text-align: right; width: 120px; padding: 4px 8px; font-family: monospace;">
                    ৳${Number(order.subtotal || 0).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style="text-align: right; padding: 4px 8px; color: #78716C;">Delivery Fee:</td>
                  <td style="text-align: right; padding: 4px 8px; font-family: monospace;">
                    ${order.deliveryFee === 0 ? 'FREE' : `৳${Number(order.deliveryFee).toLocaleString()}`}
                  </td>
                </tr>
                ${
                  order.discount && order.discount > 0
                    ? `<tr><td style="text-align: right; padding: 4px 8px; color: #166534;">Privilege Discount:</td><td style="text-align: right; padding: 4px 8px; font-family: monospace; color: #166534;">-৳${Number(order.discount).toLocaleString()}</td></tr>`
                    : ''
                }
                <tr style="border-top: 2px solid #1C1917;">
                  <td style="text-align: right; padding: 12px 8px; font-size: 15px; font-weight: 700;">Total Payable (COD):</td>
                  <td style="text-align: right; padding: 12px 8px; font-size: 18px; font-weight: 700; color: #1C1917; font-family: monospace;">
                    ৳${Number(order.totalAmount || 0).toLocaleString()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Concierge Support -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              ${
                whatsAppDigits
                  ? `<a href="https://wa.me/${whatsAppDigits}?text=Hi%20SEYVEN!%20I%20have%20an%20inquiry%20regarding%20Order%20%23${order.orderNumber}" style="display: inline-block; padding: 14px 28px; background-color: #1C1917; color: #F9F6F0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; text-decoration: none; border-radius: 4px;">
                      Chat with SEYVEN Concierge on WhatsApp (${rawSupportNum}) ↗
                    </a>`
                  : `<a href="mailto:officialseyven@gmail.com?subject=Inquiry%20regarding%20Order%20%23${order.orderNumber}" style="display: inline-block; padding: 14px 28px; background-color: #1C1917; color: #F9F6F0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; text-decoration: none; border-radius: 4px;">
                      Contact SEYVEN Concierge (officialseyven@gmail.com) ↗
                    </a>`
              }
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #78716C;">
                Our dermal specialists are available 7 days a week to assist with formulation advice and delivery updates.
              </p>
            </td>
          </tr>

          <!-- Luxury Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F9F6F0; border-top: 1px solid #E6DFD5; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 10px; letter-spacing: 0.18em; color: #78716C; text-transform: uppercase; font-weight: 600;">
                SEYVEN &bull; THE SANCTUARY OF BEAUTY
              </p>
              <p style="margin: 0; font-size: 10px; color: #A8A29E;">
                Authentic imported dermatological icons &bull; 100% genuine formulation guarantee
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


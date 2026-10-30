/**
 * SEYVEN - Admin Internal Order Notification Template
 * Targeted strictly for official staff email (officialseyven@gmail.com).
 * Includes quick links to Admin Desk and dispatch actions.
 */

export interface AdminOrderAlertData {
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

export function generateAdminOrderAlertHtml(order: AdminOrderAlertData): string {
  const itemsRows = (order.items || [])
    .map(
      (it) => `
      <tr style="border-bottom: 1px solid #E6DFD5;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1C1917;">
          <strong>${it.title || 'Formulation'}</strong>
          ${it.variant ? `<br><span style="font-size: 11px; color: #78716C;">Edition: ${it.variant}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: center; font-family: monospace;">
          ${it.quantity}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-family: monospace;">
          ৳${Number(it.unitPrice || 0).toLocaleString()}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-weight: 600; font-family: monospace;">
          ৳${Number(it.totalPrice || it.unitPrice * it.quantity || 0).toLocaleString()}
        </td>
      </tr>
    `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEYVEN - New Order Alert</title>
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

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px 16px 32px; text-align: center; border-bottom: 1px solid #E6DFD5; background-color: #FFFFFF;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; letter-spacing: 0.25em; color: #1C1917; font-weight: 500;">
                SEYVEN
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #C7A97B; font-weight: 700;">
                ADMIN DISPATCH & FULFILLMENT DESK
              </p>
            </td>
          </tr>

          <!-- Banner / Order Title -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F9F6F0; border-bottom: 1px solid #E6DFD5;">
              <span style="display: inline-block; padding: 4px 10px; background-color: #1C1917; color: #C7A97B; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 3px;">
                ✨ CASH ON DELIVERY (COD)
              </span>
              <h2 style="margin: 10px 0 4px 0; font-family: Georgia, serif; font-size: 20px; color: #1C1917; font-weight: 500;">
                New Order Received: #${order.orderNumber}
              </h2>
              <p style="margin: 0; font-size: 12px; color: #78716C;">
                Placed on ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} BST
              </p>
            </td>
          </tr>

          <!-- Customer & Destination Details -->
          <tr>
            <td style="padding: 20px 32px 16px 32px;">
              <h3 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C7A97B; font-weight: 700;">
                Customer & Destination Details
              </h3>
              <table role="presentation" width="100%" style="font-size: 13px; line-height: 1.6; color: #1C1917;">
                <tr>
                  <td style="width: 140px; color: #78716C; padding: 4px 0;">Customer Name:</td>
                  <td style="font-weight: 600; padding: 4px 0;">${order.customerName}</td>
                </tr>
                <tr>
                  <td style="color: #78716C; padding: 4px 0;">Phone Number:</td>
                  <td style="font-weight: 700; color: #1C1917; font-family: monospace; padding: 4px 0;">
                    <a href="tel:${order.customerPhone}" style="color: #1C1917; text-decoration: underline;">
                      ${order.customerPhone}
                    </a>
                  </td>
                </tr>
                ${order.customerEmail ? `<tr><td style="color: #78716C; padding: 4px 0;">Email Address:</td><td style="padding: 4px 0;">${order.customerEmail}</td></tr>` : ''}
                <tr>
                  <td style="color: #78716C; padding: 4px 0;">Destination:</td>
                  <td style="padding: 4px 0; font-weight: 600;">
                    ${order.district || 'Inside Dhaka'}
                  </td>
                </tr>
                <tr>
                  <td style="color: #78716C; padding: 4px 0;">Full Address:</td>
                  <td style="padding: 4px 0; font-weight: 500;">
                    ${order.shippingAddress}
                  </td>
                </tr>
                <tr>
                  <td style="color: #78716C; padding: 4px 0;">Payment Method:</td>
                  <td style="padding: 4px 0; font-weight: 700; color: #1C1917;">
                    Cash on Delivery (COD)
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Ordered Table -->
          <tr>
            <td style="padding: 12px 32px 20px 32px;">
              <h3 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C7A97B; font-weight: 700;">
                Curated Items Ordered
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
              <table role="presentation" width="100%" style="margin-top: 14px; font-size: 13px; color: #1C1917;">
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
                    ? `<tr><td style="text-align: right; padding: 4px 8px; color: #166534;">Courtesy Privilege / Campaign Discount:</td><td style="text-align: right; padding: 4px 8px; font-family: monospace; color: #166534;">-৳${Number(order.discount).toLocaleString()}</td></tr>`
                    : ''
                }
                <tr style="border-top: 2px solid #1C1917;">
                  <td style="text-align: right; padding: 10px 8px; font-size: 14px; font-weight: 700;">Total Collectible Due (COD):</td>
                  <td style="text-align: right; padding: 10px 8px; font-size: 16px; font-weight: 700; color: #1C1917; font-family: monospace;">
                    ৳${Number(order.totalAmount || 0).toLocaleString()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Admin Desk CTA Button -->
          <tr>
            <td style="padding: 0 32px 28px 32px; text-align: center;">
              <a href="https://admin.theseyven.com/orders" style="display: inline-block; padding: 14px 32px; background-color: #1C1917; color: #F9F6F0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; text-decoration: none; border-radius: 4px;">
                Open Admin Fulfillment Desk →
              </a>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #A8A29E;">
                Click to verify phone call, assign courier consignment, or print 4x6 label.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #F9F6F0; border-top: 1px solid #E6DFD5; text-align: center;">
              <p style="margin: 0; font-size: 9px; letter-spacing: 0.15em; color: #78716C; text-transform: uppercase;">
                SEYVEN &bull; AUTOMATED DISPATCH ENGINE
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


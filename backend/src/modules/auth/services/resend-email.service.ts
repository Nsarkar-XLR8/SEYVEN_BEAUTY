import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class ResendEmailService {
  private readonly logger = new Logger(ResendEmailService.name);
  private resend: Resend | null = null;
  private readonly senderEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      this.resend = new Resend(apiKey);
      this.logger.log('✨ Resend Email Client successfully initialized.');
    } else {
      this.logger.warn('⚠️ RESEND_API_KEY not found in environment. Emails will be logged to console in dev mode.');
    }

    // Default sender: either verified domain or Resend testing onboarding address
    this.senderEmail = process.env.RESEND_FROM_EMAIL || 'SEYVEN <onboarding@resend.dev>';
  }

  /**
   * Generates a luxury-styled HTML email matching SEYVEN's 4-color palette:
   * 60% Alabaster Silk (#F9F6F0), 30% Noir Espresso (#1C1917), 7% Brushed Champagne (#C7A97B), 3% Cashmere Stone (#E6DFD5).
   */
  private generatePasswordResetHtml(code: string, recipientName: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEYVEN Security Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F6F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E6DFD5; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(28, 25, 23, 0.04);">
          <!-- Top Accent Gold Line -->
          <tr>
            <td style="height: 4px; background-color: #C7A97B;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 36px 32px 20px 32px; text-align: center; border-bottom: 1px solid #E6DFD5;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; letter-spacing: 0.25em; color: #1C1917; font-weight: 500;">
                SEYVEN
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #C7A97B; font-weight: 600;">
                AUTHENTIC INTERNATIONAL CURATIONS
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 18px; font-weight: 500; color: #1C1917;">
                Password Reset Verification / সিকিউরিটি কোড
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #44403C;">
                Hello <strong>${recipientName || 'Valued Client'}</strong>,<br/>
                We received a request to reset your password for your SEYVEN sanctuary account. Please use the 6-digit verification code below to proceed:
              </p>

              <!-- 6-Digit Code Box -->
              <div style="background-color: #F9F6F0; border: 1px solid #C7A97B; border-radius: 4px; padding: 24px; text-align: center; margin: 28px 0;">
                <span style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1C1917; display: inline-block;">
                  ${code}
                </span>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #78716C; letter-spacing: 0.05em;">
                  Valid for 10 minutes &bull; একবারের জন্য প্রযোজ্য
                </p>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #78716C;">
                If you did not request this password reset, no action is needed. Your account remains completely secure.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #A8A29E; font-style: italic;">
                আপনি যদি এই অনুরোধটি না করে থাকেন, তবে নির্দ্বিধায় এই ইমেইলটি উপেক্ষা করুন। আপনার অ্যাকাউন্ট নিরাপদ রয়েছে।
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F9F6F0; border-top: 1px solid #E6DFD5; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 0.1em; color: #78716C; text-transform: uppercase;">
                SEYVEN &bull; BANGLADESH
              </p>
              <p style="margin: 0; font-size: 10px; color: #A8A29E;">
                Direct Curation &bull; Guaranteed Authenticity &bull; Skin Advisory
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

  /**
   * Dispatches the 6-digit password reset verification code via Resend.
   * Gracefully falls back to logging if RESEND_API_KEY is not set (e.g. local dev).
   */
  async sendPasswordResetEmail(toEmail: string, code: string, recipientName: string = 'Valued Client'): Promise<{ success: boolean; message: string }> {
    const subject = `Your SEYVEN Verification Code: ${code}`;
    const html = this.generatePasswordResetHtml(code, recipientName);

    if (this.resend) {
      try {
        const response = await this.resend.emails.send({
          from: this.senderEmail,
          to: toEmail,
          subject,
          html,
        });

        if (response.error) {
          this.logger.error(`❌ Resend API Error sending to ${toEmail}: ${response.error.message}`);
          // Log fallback code for local convenience
          this.logDevResetCode(toEmail, code);
          return { success: true, message: 'Reset code generated. Please check your email or console.' };
        }

        this.logger.log(`✉️ [Resend] Password reset email successfully dispatched to ${toEmail} (ID: ${response.data?.id})`);
        return { success: true, message: 'Password reset code sent to your email.' };
      } catch (err: any) {
        this.logger.error(`❌ Failed to send via Resend: ${err.message}`);
        this.logDevResetCode(toEmail, code);
        return { success: true, message: 'Reset code generated. (Dev Fallback Active)' };
      }
    } else {
      // In local dev without API key: log clearly to terminal
      this.logDevResetCode(toEmail, code);
      return { success: true, message: 'Verification code generated (Check server console in development mode).' };
    }
  }

  /**
   * Generates a luxury-styled HTML email matching SEYVEN's palette for Order Notifications:
   * Alabaster Silk (#F9F6F0), Noir Espresso (#1C1917), Brushed Champagne (#C7A97B), Cashmere Stone (#E6DFD5).
   */
  private generateOrderNotificationHtml(order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: string;
    district?: string;
    zone?: string;
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
  }): string {
    const itemsRows = (order.items || [])
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #E6DFD5;">
          <td style="padding: 12px 8px; font-size: 13px; color: #1C1917;">
            <strong>${it.title || 'Formulation'}</strong>
            ${it.variant ? `<br/><span style="font-size: 11px; color: #78716C;">Edition / Volume: ${it.variant}</span>` : ''}
          </td>
          <td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #1C1917; font-family: monospace;">
            x${it.quantity || 1}
          </td>
          <td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #1C1917; font-family: monospace;">
            ৳${Number(it.unitPrice || 0).toLocaleString()}
          </td>
          <td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #1C1917; font-weight: 600; font-family: monospace;">
            ৳${Number(it.totalPrice || it.unitPrice || 0).toLocaleString()}
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
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 5px; background-color: #C7A97B;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; text-align: center; border-bottom: 1px solid #E6DFD5; background-color: #FFFFFF;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; letter-spacing: 0.25em; color: #1C1917; font-weight: 500;">
                SEYVEN
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #C7A97B; font-weight: 700;">
                AUTHENTIC INTERNATIONAL DERMAL CURATIONS
              </p>
            </td>
          </tr>

          <!-- Banner / Order Title -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F9F6F0; border-bottom: 1px solid #E6DFD5;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="display: inline-block; padding: 4px 10px; background-color: #1C1917; color: #C7A97B; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 3px;">
                    ✨ CASH ON DELIVERY (COD)
                  </span>
                  <h2 style="margin: 12px 0 4px 0; font-family: Georgia, serif; font-size: 20px; color: #1C1917; font-weight: 500;">
                    New Order Received: ${order.orderNumber}
                  </h2>
                  <p style="margin: 0; font-size: 12px; color: #78716C;">
                    Placed on ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} BST
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Customer & Delivery Information -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C7A97B; font-weight: 700;">
                Customer & Destination Details
              </h3>
              <table role="presentation" width="100%" style="font-size: 13px; line-height: 1.6; color: #1C1917;">
                <tr>
                  <td style="width: 130px; color: #78716C; padding: 4px 0;">Customer Name:</td>
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
                  <td style="color: #78716C; padding: 4px 0;">Delivery Destination:</td>
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
                    Cash on Delivery (হাতে পেয়ে মূল্য পরিশোধ)
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Ordered Table -->
          <tr>
            <td style="padding: 16px 32px 24px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C7A97B; font-weight: 700;">
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
                    ? `<tr><td style="text-align: right; padding: 4px 8px; color: #166534;">Courtesy Privilege / Campaign Discount:</td><td style="text-align: right; padding: 4px 8px; font-family: monospace; color: #166534;">-৳${Number(order.discount).toLocaleString()}</td></tr>`
                    : ''
                }
                <tr style="border-top: 2px solid #1C1917;">
                  <td style="text-align: right; padding: 12px 8px; font-size: 15px; font-weight: 700;">Total Collectible Due (COD):</td>
                  <td style="text-align: right; padding: 12px 8px; font-size: 18px; font-weight: 700; color: #1C1917; font-family: monospace;">
                    ৳${Number(order.totalAmount || 0).toLocaleString()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="http://localhost:3001/orders" style="display: inline-block; padding: 14px 32px; background-color: #1C1917; color: #F9F6F0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 4px;">
                Open Admin Fulfillment Desk →
              </a>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #A8A29E;">
                Click to verify phone call, assign courier, or print 4x6 thermal dispatch label.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F9F6F0; border-top: 1px solid #E6DFD5; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 10px; letter-spacing: 0.15em; color: #78716C; text-transform: uppercase;">
                SEYVEN &bull; AUTOMATED DISPATCH ENGINE
              </p>
              <p style="margin: 0; font-size: 9px; color: #A8A29E;">
                This automated notification was generated for ${process.env.RESEND_EMAIL || 'officialseyven@gmail.com'}.
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

  /**
   * Dispatches luxury styled order confirmation notification email to the Gmail set in env (RESEND_EMAIL)
   * and optionally to customer email if provided.
   */
  async sendOrderNotificationEmail(order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: string;
    district?: string;
    zone?: string;
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
  }): Promise<{ success: boolean; message: string }> {
    const adminEmail = process.env.RESEND_EMAIL || 'officialseyven@gmail.com';
    const subject = `🔔 New Order Received: #${order.orderNumber} (৳${Number(order.totalAmount || 0).toLocaleString()} COD) - SEYVEN`;
    const html = this.generateOrderNotificationHtml(order);

    let sentToAdmin = false;

    if (this.resend) {
      try {
        const response = await this.resend.emails.send({
          from: this.senderEmail,
          to: adminEmail,
          subject,
          html,
        });

        if (response.error) {
          this.logger.error(`❌ Resend API Error sending order email to ${adminEmail}: ${response.error.message}`);
          this.logDevOrderNotification(adminEmail, order);
        } else {
          sentToAdmin = true;
          this.logger.log(`✉️ [Resend] Order notification successfully dispatched to admin Gmail: ${adminEmail} (ID: ${response.data?.id})`);
        }

        // If customer provided an email address, also dispatch order receipt
        if (order.customerEmail && order.customerEmail.includes('@') && order.customerEmail !== adminEmail) {
          try {
            const customerRes = await this.resend.emails.send({
              from: this.senderEmail,
              to: order.customerEmail,
              subject: `Your SEYVEN Order Confirmation: #${order.orderNumber}`,
              html,
            });
            if (customerRes.error) {
              this.logger.warn(`ℹ️ [Resend Info] Customer email copy skipped for ${order.customerEmail}: ${customerRes.error.message} (Requires verified domain at resend.com for external recipients)`);
            } else {
              this.logger.log(`✉️ [Resend] Customer order confirmation dispatched to ${order.customerEmail}`);
            }
          } catch (customerMailErr: any) {
            this.logger.warn(`Could not send customer copy: ${customerMailErr.message}`);
          }
        }
      } catch (err: any) {
        this.logger.error(`❌ Failed to send order email via Resend: ${err.message}`);
        this.logDevOrderNotification(adminEmail, order);
      }
    } else {
      this.logDevOrderNotification(adminEmail, order);
    }

    return {
      success: true,
      message: sentToAdmin
        ? `Notification email dispatched to ${adminEmail}`
        : `Order logged to server console (Dev Console Mode)`,
    };
  }

  private logDevOrderNotification(adminEmail: string, order: any) {
    this.logger.log(`
══════════════════════════════════════════════════════════════
  📧 [SEYVEN ORDER NOTIFICATION - EMAIL DISPATCH]
  Recipient Gmail : ${adminEmail}
  Order Number    : #${order.orderNumber}
  Customer Name   : ${order.customerName}
  Customer Phone  : ${order.customerPhone}
  Delivery Address: ${order.shippingAddress}, ${order.district || 'Dhaka'}
  Payment Method  : CASH ON DELIVERY (COD)
  Total Payable   : ৳${Number(order.totalAmount || 0).toLocaleString()} BDT
  Items Count     : ${(order.items || []).length} items
══════════════════════════════════════════════════════════════
    `);
  }

  private logDevResetCode(email: string, code: string) {
    this.logger.log(`
══════════════════════════════════════════════════════════════
  📧 [SEYVEN SECURITY - PASSWORD RESET CODE]
  Recipient : ${email}
  Code      : [ ${code} ] (Expires in 10 minutes)
══════════════════════════════════════════════════════════════
    `);
  }
}

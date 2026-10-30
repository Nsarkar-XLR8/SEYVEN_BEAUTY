import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { generatePasswordResetHtml } from '../../../common/templates/emails/password-reset.template';
import { generateCustomerOrderReceiptHtml } from '../../../common/templates/emails/customer-order-receipt.template';
import { generateAdminOrderAlertHtml, AdminOrderAlertData } from '../../../common/templates/emails/admin-order-alert.template';

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
  private readonly replyToEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      this.resend = new Resend(apiKey);
      this.logger.log('✨ Resend Email Client successfully initialized.');
    } else {
      this.logger.warn('⚠️ RESEND_API_KEY not found in environment. Emails will be logged to console in dev mode.');
    }

    // Default sender: verified domain or environment override
    this.senderEmail = process.env.RESEND_FROM_EMAIL || 'SEYVEN <info@theseyven.com>';
    this.replyToEmail = process.env.RESEND_REPLY_TO || process.env.RESEND_EMAIL || 'officialseyven@gmail.com';
  }

  /**
   * Dispatches the 6-digit password reset verification code via Resend.
   * Gracefully falls back to logging if RESEND_API_KEY is not set (e.g. local dev).
   */
  async sendPasswordResetEmail(
    toEmail: string,
    code: string,
    recipientName: string = 'Valued Client',
  ): Promise<{ success: boolean; message: string }> {
    const subject = `Your SEYVEN Verification Code: ${code}`;
    const html = generatePasswordResetHtml(code, recipientName);

    if (this.resend) {
      try {
        const response = await this.resend.emails.send({
          from: this.senderEmail,
          to: toEmail,
          replyTo: this.replyToEmail,
          subject,
          html,
        });

        if (response.error) {
          this.logger.error(`❌ Resend API Error for ${toEmail}: ${response.error.message}`);
          this.logDevResetCode(toEmail, code);
          return { success: false, message: response.error.message };
        }

        this.logger.log(`✉️ [Resend] Password reset code dispatched to ${toEmail} (ID: ${response.data?.id})`);
        return { success: true, message: `Verification code sent to ${toEmail}` };
      } catch (err: any) {
        this.logger.error(`❌ Failed to send password reset email via Resend: ${err.message}`);
        this.logDevResetCode(toEmail, code);
        return { success: false, message: 'Failed to send verification email' };
      }
    } else {
      this.logDevResetCode(toEmail, code);
      return { success: true, message: `(Dev Mode) Verification code generated: ${code}` };
    }
  }

  /**
   * Dispatches order notifications:
   * 1. Admin Alert -> official staff email (officialseyven@gmail.com) with Admin Desk links.
   * 2. Customer Receipt -> customer's email with luxury boutique receipt and zero admin links.
   */
  async sendOrderNotificationEmail(order: AdminOrderAlertData): Promise<{ success: boolean; message: string }> {
    const adminEmail = process.env.RESEND_EMAIL || 'officialseyven@gmail.com';
    const adminSubject = `🔔 New Order Received: #${order.orderNumber} (৳${Number(order.totalAmount || 0).toLocaleString()} COD) - SEYVEN`;
    const adminHtml = generateAdminOrderAlertHtml(order);

    let sentToAdmin = false;

    if (this.resend) {
      try {
        // 1. Dispatch Admin Notification
        const response = await this.resend.emails.send({
          from: this.senderEmail,
          to: adminEmail,
          replyTo: order.customerEmail || this.replyToEmail,
          subject: adminSubject,
          html: adminHtml,
        });

        if (response.error) {
          this.logger.error(`❌ Resend API Error sending order email to ${adminEmail}: ${response.error.message}`);
          this.logDevOrderNotification(adminEmail, order);
        } else {
          sentToAdmin = true;
          this.logger.log(`✉️ [Resend] Order notification successfully dispatched to admin Gmail: ${adminEmail} (ID: ${response.data?.id})`);
        }

        // 2. Dispatch Clean Customer Luxury Receipt (Only if valid customer email provided)
        if (order.customerEmail && order.customerEmail.includes('@') && order.customerEmail !== adminEmail) {
          try {
            const customerHtml = generateCustomerOrderReceiptHtml(order);
            const customerRes = await this.resend.emails.send({
              from: this.senderEmail,
              to: order.customerEmail,
              replyTo: this.replyToEmail,
              subject: `Your SEYVEN Order Confirmation: #${order.orderNumber}`,
              html: customerHtml,
            });
            if (customerRes.error) {
              this.logger.warn(`ℹ️ [Resend Info] Customer email copy skipped for ${order.customerEmail}: ${customerRes.error.message}`);
            } else {
              this.logger.log(`✉️ [Resend] Customer luxury order receipt dispatched to ${order.customerEmail}`);
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
      success: this.resend ? sentToAdmin : true,
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

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendNewsletterEmailOptions {
  toEmail: string;
  recipientName?: string;
  subject: string;
  previewText?: string;
  contentHtml: string;
  discountCode?: string;
  discountBanner?: string;
  unsubscribeToken: string;
}

@Injectable()
export class NewsletterEmailService {
  private readonly logger = new Logger(NewsletterEmailService.name);
  private resend: Resend | null = null;
  private readonly senderEmail: string;
  private readonly appUrl: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      this.resend = new Resend(apiKey);
      this.logger.log('✨ [NewsletterEmailService] Resend Email Client successfully initialized.');
    } else {
      this.logger.warn('⚠️ [NewsletterEmailService] RESEND_API_KEY not set. Operating in Development Console Mode.');
    }

    this.senderEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || process.env.RESEND_FROM_EMAIL || 'SEYVEN Sanctuary <onboarding@resend.dev>';
    this.appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.apiUrl = process.env.BACKEND_URL || 'http://localhost:5000/api/v1';
  }

  /**
   * Generates the signature SEYVEN Luxury Newsletter HTML template:
   * Alabaster Silk (#F9F6F0), Noir Espresso (#1C1917), Brushed Champagne Gold (#C7A97B), Cashmere Stone (#E6DFD5).
   */
  generateNewsletterHtml(options: SendNewsletterEmailOptions): string {
    const { recipientName, subject, previewText, contentHtml, discountCode, discountBanner, unsubscribeToken } = options;
    const unsubscribeUrl = `${this.apiUrl}/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
    const catalogUrl = `${this.appUrl}/catalog`;

    const discountBlock = discountBanner || discountCode ? `
      <!-- Luxury Promotional / Festive Banner -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background: linear-gradient(135deg, #1C1917 0%, #2A2421 100%); border: 1px solid #C7A97B; border-radius: 4px; overflow: hidden;">
        <tr>
          <td style="padding: 24px; text-align: center;">
            ${discountBanner ? `
              <p style="margin: 0 0 10px 0; font-family: Georgia, serif; font-size: 16px; letter-spacing: 0.15em; text-transform: uppercase; color: #C7A97B; font-weight: 500;">
                ${discountBanner}
              </p>
            ` : ''}
            ${discountCode ? `
              <div style="display: inline-block; padding: 8px 24px; background-color: #2A2421; border: 1px dashed #C7A97B; border-radius: 2px; margin-top: 8px;">
                <span style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #E6DFD5; display: block; margin-bottom: 4px;">USE PRIVILEGE CODE AT CHECKOUT</span>
                <span style="font-family: 'Courier New', monospace; font-size: 22px; font-weight: 700; letter-spacing: 4px; color: #FFFFFF;">${discountCode}</span>
              </div>
            ` : ''}
          </td>
        </tr>
      </table>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1C1917; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F6F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E6DFD5; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 24px rgba(28, 25, 23, 0.05);">
          <!-- Top Accent Gold Line -->
          <tr>
            <td style="height: 4px; background-color: #C7A97B;"></td>
          </tr>

          <!-- SEYVEN Header -->
          <tr>
            <td style="padding: 36px 32px 20px 32px; text-align: center; border-bottom: 1px solid #E6DFD5;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; letter-spacing: 0.25em; color: #1C1917; font-weight: 400;">
                SEYVEN
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #C7A97B; font-weight: 600;">
                THE SANCTUARY OF BEAUTY &bull; CURATED INTERNATIONAL FORMULATIONS
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              ${recipientName ? `
                <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 500; color: #1C1917;">
                  Dear ${recipientName},
                </p>
              ` : ''}

              ${discountBlock}

              <!-- Admin Rich Text Body Content -->
              <div style="font-size: 14px; line-height: 1.75; color: #374151;">
                ${contentHtml}
              </div>

              <!-- Call to Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 36px auto 16px auto;">
                <tr>
                  <td align="center" style="background-color: #1C1917; border-radius: 2px;">
                    <a href="${catalogUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #FFFFFF; text-decoration: none; font-weight: 500;">
                      Explore Sanctuary Curations &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="padding: 28px 32px; background-color: #F9F6F0; border-top: 1px solid #E6DFD5; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; letter-spacing: 0.12em; color: #6E6B65; text-transform: uppercase;">
                SEYVEN BEAUTY SANCTUARY &bull; BANGLADESH
              </p>
              <p style="margin: 0 0 12px 0; font-size: 10px; color: #8E8B85; line-height: 1.5;">
                Level 14, Lotus Kamal Tower, Gulshan-1, Dhaka-1212<br/>
                Concierge Hotline: +880 9612 000000 | WhatsApp: +880 1700 000000
              </p>

              <!-- Compliant Unsubscribe Link -->
              <div style="border-top: 1px solid #E6DFD5; padding-top: 14px; margin-top: 14px;">
                <p style="margin: 0; font-size: 10px; color: #A8A29E; line-height: 1.6;">
                  You received this dispatch because you are subscribed to SEYVEN Private Client Updates.<br/>
                  If you no longer wish to receive these privileged dispatches, you may 
                  <a href="${unsubscribeUrl}" target="_blank" style="color: #78716C; text-decoration: underline; font-weight: 500;">
                    unsubscribe instantly here
                  </a>.
                </p>
              </div>
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
   * Dispatches the newsletter email via Resend or logs in development console.
   */
  async sendEmail(options: SendNewsletterEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = this.generateNewsletterHtml(options);

    if (this.resend) {
      try {
        const response = await this.resend.emails.send({
          from: this.senderEmail,
          to: options.toEmail,
          subject: options.subject,
          html,
        });

        if (response.error) {
          this.logger.error(`❌ [Resend Error] Failed to send to ${options.toEmail}: ${response.error.message}`);
          return { success: false, error: response.error.message };
        }

        this.logger.log(`✉️ [Resend Dispatched] Newsletter sent to ${options.toEmail} (ID: ${response.data?.id})`);
        return { success: true, messageId: response.data?.id };
      } catch (err: any) {
        this.logger.error(`❌ [Resend Exception] Error sending to ${options.toEmail}: ${err.message}`);
        return { success: false, error: err.message };
      }
    } else {
      // Development console simulation
      this.logger.log(`
══════════════════════════════════════════════════════════════════════════
  📧 [SEYVEN NEWSLETTER DISPATCH - DEV SIMULATION]
  Recipient : ${options.toEmail} (${options.recipientName || 'Valued Client'})
  Subject   : ${options.subject}
  Promo     : ${options.discountCode || 'N/A'} (${options.discountBanner || 'No Banner'})
  Unsub Url : ${this.apiUrl}/newsletter/unsubscribe?token=${options.unsubscribeToken}
══════════════════════════════════════════════════════════════════════════
      `);
      return { success: true, messageId: `dev-sim-${Date.now()}` };
    }
  }
}

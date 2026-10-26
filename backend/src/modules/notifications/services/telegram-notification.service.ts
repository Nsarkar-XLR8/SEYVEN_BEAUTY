import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

export interface TelegramOrderPayload {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
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
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  totalAmount: number;
  paymentMethod?: string;
  source?: string;
  status?: string;
  createdAt?: string;
}

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  private get botToken(): string | undefined {
    return (
      this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
      process.env.TELEGRAM_BOT_TOKEN
    );
  }

  private get chatId(): string | undefined {
    return (
      this.configService.get<string>('TELEGRAM_CHAT_ID') ||
      process.env.TELEGRAM_CHAT_ID
    );
  }

  private escapeHtml(text?: string | null): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Dispatches instant order alert to Telegram bot with rich formatting and sound notification.
   * Completely non-blocking and safe: failures will be logged but never throw exceptions.
   */
  async sendOrderAlert(order: TelegramOrderPayload): Promise<boolean> {
    const token = this.botToken;
    const chat = this.chatId;

    if (!token || !chat) {
      this.logger.debug(
        '[TelegramNotificationService] Bot token or chat ID not configured. Skipping alert.',
      );
      return false;
    }

    try {
      const items = order.items || [];
      const itemsListHtml = items.length > 0
        ? items
            .map(
              (item, idx) =>
                `  ${idx + 1}. <b>${this.escapeHtml(item.title)}</b> × ${item.quantity} — ৳${Number(item.totalPrice || item.unitPrice * item.quantity || 0).toLocaleString()}`,
            )
            .join('\n')
        : '  <i>No item details available</i>';

      const now = order.createdAt ? new Date(order.createdAt) : new Date();
      const timeStr = now.toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const locationParts = Array.from(new Set([order.zone, order.district].filter(Boolean)));
      const locationStr = locationParts.length > 0 ? this.escapeHtml(locationParts.join(' — ')) : 'Dhaka';

      const message = [
        `🎉 <b>NEW ORDER RECEIVED!</b> 🛍️`,
        `━━━━━━━━━━━━━━━━━━━━━`,
        `🆔 <b>Order ID:</b> <code>#${this.escapeHtml(order.orderNumber)}</code>`,
        `👤 <b>Customer:</b> ${this.escapeHtml(order.customerName)}`,
        `📞 <b>Phone:</b> <code>${this.escapeHtml(order.customerPhone)}</code>`,
        `📍 <b>Location:</b> ${locationStr}`,
        `🏠 <b>Address:</b> ${this.escapeHtml(order.shippingAddress || 'Not provided')}`,
        `━━━━━━━━━━━━━━━━━━━━━`,
        `💰 <b>Total Payable:</b> <b>৳${Number(order.totalAmount || 0).toLocaleString()}</b> (${this.escapeHtml(order.paymentMethod || 'COD')})`,
        order.deliveryFee ? `🚚 <b>Delivery Fee:</b> ৳${Number(order.deliveryFee).toLocaleString()}` : null,
        order.discount ? `🏷️ <b>Discount:</b> -৳${Number(order.discount).toLocaleString()}` : null,
        order.source ? `🛒 <b>Source:</b> ${this.escapeHtml(order.source)}` : null,
        `━━━━━━━━━━━━━━━━━━━━━`,
        `📦 <b>Ordered Items (${items.length}):</b>`,
        itemsListHtml,
        `━━━━━━━━━━━━━━━━━━━━━`,
        `⏰ <b>Order Time:</b> ${timeStr} (BST)`,
      ]
        .filter(Boolean)
        .join('\n');

      return await this.dispatchTelegramMessage(token, chat, message);
    } catch (err: any) {
      this.logger.error(`[TelegramNotificationService] Failed to format or dispatch order alert: ${err?.message || err}`);
      return false;
    }
  }

  /**
   * Raw HTTP request to Telegram Bot API sendMessage endpoint.
   */
  private dispatchTelegramMessage(
    token: string,
    chatId: string,
    htmlText: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const payload = JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      const options: https.RequestOptions = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 8000,
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            this.logger.log(`[TelegramNotificationService] 🔔 Order alert successfully sent to Telegram chat ${chatId}`);
            resolve(true);
          } else {
            this.logger.warn(`[TelegramNotificationService] Telegram API error (${res.statusCode}): ${responseBody}`);
            resolve(false);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        this.logger.warn('[TelegramNotificationService] Telegram request timed out after 8s');
        resolve(false);
      });

      req.on('error', (err) => {
        this.logger.warn(`[TelegramNotificationService] Network error dispatching Telegram alert: ${err.message}`);
        resolve(false);
      });

      req.write(payload);
      req.end();
    });
  }
}

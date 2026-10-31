import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface MetaCapiPurchasePayload {
  eventId: string;
  orderNumber: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  district?: string;
  totalAmount: number;
  currency?: string;
  items?: Array<{
    id?: string;
    sku?: string;
    title?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
  clientIp?: string;
  clientUserAgent?: string;
}

@Injectable()
export class MetaCapiService {
  private readonly logger = new Logger(MetaCapiService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Hashes normalized string data with SHA-256 hex digest per Meta specifications.
   */
  private hashValue(value?: string): string | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Normalizes Bangladesh phone number to standard international format (8801XXXXXXXXX)
   * and produces SHA-256 hash.
   */
  private hashPhone(rawPhone?: string): string | null {
    if (!rawPhone) return null;
    let clean = rawPhone.replace(/\D/g, '');
    if (clean.startsWith('01') && clean.length === 11) {
      clean = `88${clean}`;
    } else if (clean.startsWith('8801') && clean.length === 13) {
      // already valid
    }
    return this.hashValue(clean);
  }

  /**
   * Dispatches server-side Purchase conversion event to Meta Graph API.
   * Runs asynchronously in background; never throws or blocks order placement.
   */
  async sendPurchaseEvent(payload: MetaCapiPurchasePayload): Promise<boolean> {
    const pixelId = this.configService.get<string>('META_PIXEL_ID');
    const accessToken = this.configService.get<string>('META_CAPI_ACCESS_TOKEN');
    const testEventCode = this.configService.get<string>('META_TEST_EVENT_CODE');

    // Strict zero-hardcoded policy: If credentials are not in environment, gracefully skip
    if (!pixelId || !accessToken) {
      this.logger.debug(
        '[Meta CAPI] Skipping server event dispatch: META_PIXEL_ID or META_CAPI_ACCESS_TOKEN is not configured.',
      );
      return false;
    }

    try {
      const hashedPhone = this.hashPhone(payload.customerPhone);
      const hashedEmail = this.hashValue(payload.customerEmail);

      // Name parsing
      let hashedFirstName: string | null = null;
      let hashedLastName: string | null = null;
      if (payload.customerName) {
        const parts = payload.customerName.trim().split(/\s+/);
        if (parts.length > 0) {
          hashedFirstName = this.hashValue(parts[0]);
          if (parts.length > 1) {
            hashedLastName = this.hashValue(parts.slice(1).join(' '));
          }
        }
      }

      const hashedCity = this.hashValue(payload.district || 'dhaka');
      const hashedCountry = this.hashValue('bd');

      const userData: Record<string, any> = {};
      if (hashedPhone) userData.ph = [hashedPhone];
      if (hashedEmail) userData.em = [hashedEmail];
      if (hashedFirstName) userData.fn = [hashedFirstName];
      if (hashedLastName) userData.ln = [hashedLastName];
      if (hashedCity) userData.ct = [hashedCity];
      if (hashedCountry) userData.country = [hashedCountry];
      if (payload.clientIp) userData.client_ip_address = payload.clientIp;
      if (payload.clientUserAgent) userData.client_user_agent = payload.clientUserAgent;

      const contents = (payload.items || []).map((it) => ({
        id: it.sku || it.id || 'ITEM',
        quantity: it.quantity || 1,
        item_price: it.unitPrice || 0,
      }));

      const eventData: Record<string, any> = {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId || payload.orderNumber,
        event_source_url: 'https://theseyven.com/checkout',
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: payload.currency || 'BDT',
          value: Number(payload.totalAmount) || 0,
          order_id: payload.orderNumber,
          num_items: contents.reduce((acc, curr) => acc + curr.quantity, 0),
          content_type: 'product',
          contents,
        },
      };

      const requestBody: Record<string, any> = {
        data: [eventData],
      };

      // Append Meta Test Event Code if provided in environment
      if (testEventCode && testEventCode.trim().length > 0) {
        requestBody.test_event_code = testEventCode.trim();
      }

      const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        this.logger.warn(
          `[Meta CAPI] Event dispatch warning for order ${payload.orderNumber}: ${JSON.stringify(
            responseData,
          )}`,
        );
        return false;
      }

      this.logger.log(
        `[Meta CAPI] Purchase event successfully sent for order ${payload.orderNumber} (events_received: ${responseData.events_received || 1}, event_id: ${payload.eventId || payload.orderNumber})`,
      );
      return true;
    } catch (err: any) {
      this.logger.warn(
        `[Meta CAPI] Failed to dispatch server event for order ${payload.orderNumber}: ${err.message}`,
      );
      return false;
    }
  }
}


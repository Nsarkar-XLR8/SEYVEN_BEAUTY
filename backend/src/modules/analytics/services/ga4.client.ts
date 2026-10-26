import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Ga4DispatchResponse,
  Ga4Event,
  Ga4Payload,
} from '../interfaces/ga4.interface';

@Injectable()
export class Ga4Client {
  private readonly logger = new Logger(Ga4Client.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dispatches events to Google Analytics 4 Measurement Protocol.
   */
  async dispatchEvent(
    clientId: string,
    event: Ga4Event,
    userId?: string,
  ): Promise<Ga4DispatchResponse> {
    const isTest = this.configService.get<string>('NODE_ENV') === 'test';
    const measurementId = this.configService.get<string>('GA4_MEASUREMENT_ID') || 'G-MOCK2026MEASURE';
    const apiSecret = this.configService.get<string>('GA4_API_SECRET') || 'mock_ga4_api_secret_2026';
    const endpoint = this.configService.get<string>('GA4_ENDPOINT') || 'https://www.google-analytics.com/mp/collect';

    const url = `${endpoint}?api_secret=${apiSecret}&measurement_id=${measurementId}`;

    const payload: Ga4Payload = {
      client_id: clientId || 'anonymous_client',
      ...(userId ? { user_id: userId } : {}),
      events: [event],
    };

    this.logger.debug(
      `[GA4 MP] Dispatching event '${event.name}' to ${measurementId} (Client: ${payload.client_id})`,
    );

    if (isTest || apiSecret.startsWith('mock_')) {
      this.logger.debug(
        `[GA4 MP Mock] Dispatched '${event.name}' successfully in sandbox/test mode`,
      );
      return {
        success: true,
        statusCode: 204,
        message: 'Dispatched in sandbox mode',
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // GA4 MP returns 204 No Content on successful reception
      if (response.status === 204 || response.ok) {
        return {
          success: true,
          statusCode: response.status,
        };
      }

      const text = await response.text();
      this.logger.warn(`⚠️ [GA4 MP] Non-204 response from GA4: HTTP ${response.status} - ${text}`);
      return {
        success: false,
        statusCode: response.status,
        message: text,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ [GA4 MP] Dispatch failure: ${msg}`);
      return {
        success: false,
        message: msg,
      };
    }
  }

  /**
   * Translates common e-commerce event names to GA4 standard event names.
   */
  mapToGa4EventName(standardName: string): string {
    switch (standardName.toLowerCase().replace(/[^a-z]/g, '')) {
      case 'purchase':
        return 'purchase';
      case 'addtocart':
        return 'add_to_cart';
      case 'initiatecheckout':
        return 'begin_checkout';
      case 'viewcontent':
        return 'view_item';
      case 'pageview':
        return 'page_view';
      default:
        return standardName.toLowerCase().replace(/\s+/g, '_');
    }
  }
}

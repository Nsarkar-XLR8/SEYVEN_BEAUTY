import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MetaCapiBatchRequest,
  MetaCapiEventPayload,
  MetaCapiResponse,
} from '../interfaces/meta-capi.interface';

@Injectable()
export class MetaCapiClient {
  private readonly logger = new Logger(MetaCapiClient.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dispatches a batch of normalized, SHA-256 hashed events to Meta Graph Conversions API.
   */
  async sendEvents(
    events: MetaCapiEventPayload[],
    customTestEventCode?: string,
  ): Promise<MetaCapiResponse> {
    const isTest = this.configService.get<string>('NODE_ENV') === 'test';
    const pixelId = this.configService.get<string>('META_PIXEL_ID') || 'mock_meta_pixel_id_2026';
    const accessToken = this.configService.get<string>('META_CAPI_ACCESS_TOKEN') || 'mock_meta_capi_access_token_2026';
    const apiVersion = this.configService.get<string>('META_CAPI_API_VERSION') || 'v20.0';
    const defaultTestCode = this.configService.get<string>('META_TEST_EVENT_CODE');
    const testEventCode = customTestEventCode || defaultTestCode;

    const endpoint = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${accessToken}`;

    const body: MetaCapiBatchRequest = {
      data: events,
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    this.logger.debug(
      `[Meta CAPI] Dispatching ${events.length} event(s) to Pixel ${pixelId} (Test Code: ${testEventCode || 'none'})`,
    );

    // In unit test or mock environment, return simulated Meta response
    if (isTest || accessToken.startsWith('mock_')) {
      this.logger.debug(
        `[Meta CAPI Mock] Successfully dispatched ${events.length} event(s) in sandbox/mock mode`,
      );
      return {
        events_received: events.length,
        messages: [],
        fbtrace_id: `mock_trace_${Date.now()}`,
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseData = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = responseData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        this.logger.error(`❌ [Meta CAPI Error] Failed to dispatch events: ${errorMsg}`);
        throw new Error(`Meta CAPI Dispatch Error: ${errorMsg}`);
      }

      return {
        events_received: responseData.events_received || events.length,
        messages: responseData.messages || [],
        fbtrace_id: responseData.fbtrace_id || `trace_${Date.now()}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ [Meta CAPI] Exception during event dispatch: ${msg}`);
      throw err;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SteadfastCreateOrderPayload,
  SteadfastCreateOrderResponse,
  SteadfastTrackingResponse,
} from '../interfaces/steadfast.interface';

@Injectable()
export class SteadfastApiClient {
  private readonly logger = new Logger(SteadfastApiClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'STEADFAST_BASE_URL',
      'https://portal.steadfast.com.bd/api/v1',
    );
    this.apiKey = this.configService.get<string>(
      'STEADFAST_API_KEY',
      'mock_steadfast_api_key_2026',
    );
    this.secretKey = this.configService.get<string>(
      'STEADFAST_SECRET_KEY',
      'mock_steadfast_secret_key_2026',
    );
  }

  /**
   * Create a delivery consignment order with Steadfast Courier
   */
  async createConsignment(
    payload: SteadfastCreateOrderPayload,
  ): Promise<SteadfastCreateOrderResponse> {
    const isMock =
      this.apiKey.startsWith('mock_') ||
      this.apiKey === 'test' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      const generatedCid = Math.floor(1000000 + Math.random() * 9000000);
      return {
        status: 200,
        message: 'Order created successfully',
        consignment: {
          consignment_id: generatedCid,
          invoice: payload.invoice,
          tracking_code: `SF${generatedCid}`,
          recipient_name: payload.recipient_name,
          recipient_phone: payload.recipient_phone,
          recipient_address: payload.recipient_address,
          cod_amount: payload.cod_amount,
          status: 'in_review',
          created_at: new Date().toISOString(),
        },
      };
    }

    const endpoint = `${this.baseUrl}/create_order`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
        },
        body: JSON.stringify({
          invoice: payload.invoice,
          recipient_name: payload.recipient_name,
          recipient_phone: payload.recipient_phone,
          recipient_address: payload.recipient_address,
          cod_amount: payload.cod_amount,
          note: payload.note,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Steadfast Consignment creation failed (HTTP ${response.status}): ${errorText}`,
        );
      }

      return (await response.json()) as SteadfastCreateOrderResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Query live delivery tracking status by Steadfast Consignment ID
   */
  async getTrackingStatus(
    consignmentId: string | number,
  ): Promise<SteadfastTrackingResponse> {
    const isMock =
      this.apiKey.startsWith('mock_') ||
      this.apiKey === 'test' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      return {
        status: 200,
        delivery_status: 'in_transit',
        consignment: {
          consignment_id: consignmentId,
          invoice: 'SYV-MOCK-INVOICE',
          tracking_code: `SF${consignmentId}`,
          status: 'in_transit',
          delivery_status: 'in_transit',
          updated_at: new Date().toISOString(),
        },
      };
    }

    const endpoint = `${this.baseUrl}/status_by_cid/${consignmentId}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Steadfast tracking query failed (HTTP ${response.status}): ${errorText}`,
        );
      }

      return (await response.json()) as SteadfastTrackingResponse;
    } finally {
      clearTimeout(timeout);
    }
  }
}

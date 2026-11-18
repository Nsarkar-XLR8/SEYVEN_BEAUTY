import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SteadfastBalanceResponse,
  SteadfastCreateOrderPayload,
  SteadfastCreateOrderResponse,
  SteadfastFraudScoreResponse,
  SteadfastPaymentsResponse,
  SteadfastPickupPayload,
  SteadfastPickupResponse,
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
      'https://portal.packzy.com/api/v1',
    );
    this.apiKey = this.configService.get<string>('STEADFAST_API_KEY') || '';
    this.secretKey = this.configService.get<string>('STEADFAST_SECRET_KEY') || '';
  }

  /**
   * Create a delivery consignment order with Steadfast Courier
   */
  async createConsignment(
    payload: SteadfastCreateOrderPayload,
  ): Promise<SteadfastCreateOrderResponse> {
    const isMock =
      !this.apiKey ||
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
      !this.apiKey ||
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

  /**
   * Health ping to Steadfast API (/ping requires no API key)
   */
  async ping(): Promise<{ status: number; message: string }> {
    const endpoint = `${this.baseUrl}/ping`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        return { status: response.status, message: 'Steadfast ping unreachable' };
      }

      const data = await response.json().catch(() => ({}));
      return { status: 200, message: data?.message || 'Steadfast service online' };
    } catch (err: any) {
      return { status: 503, message: err?.message || 'Steadfast ping failed' };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Query live withdrawable merchant COD balance (/get_balance)
   */
  async getBalance(): Promise<SteadfastBalanceResponse> {
    const isMock =
      !this.apiKey ||
      this.apiKey.startsWith('mock_') ||
      this.apiKey === 'test' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      return { status: 200, current_balance: 12450 };
    }

    const endpoint = `${this.baseUrl}/get_balance`;
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
          `Steadfast getBalance failed (HTTP ${response.status}): ${errorText}`,
        );
      }

      return (await response.json()) as SteadfastBalanceResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Screen customer delivery risk & fraud history (/fraud_check/score/{phone})
   */
  async getFraudScore(phone: string): Promise<SteadfastFraudScoreResponse> {
    const cleanedPhone = phone.replace(/[^\d]/g, '');

    const isMock =
      !this.apiKey ||
      this.apiKey.startsWith('mock_') ||
      this.apiKey === 'test' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      return {
        status: 200,
        phone: cleanedPhone,
        delivery_ratio: 92,
        cancellation_ratio: 7,
        volume_band: 'high',
        volume_range: '50+',
        delivered_count: 58,
        cancelled_count: 5,
        total_reports: 0,
        fraud_categories: [],
        scoring_disabled: true,
        doubtful_reports: false,
      };
    }

    const endpoint = `${this.baseUrl}/fraud_check/score/${cleanedPhone}`;
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
          `Steadfast fraud score failed (HTTP ${response.status}): ${errorText}`,
        );
      }

      return (await response.json()) as SteadfastFraudScoreResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Request a Steadfast rider to pick up packages from Narayanganj hub (/create_pickup_request)
   */
  async createPickupRequest(
    payload: SteadfastPickupPayload,
  ): Promise<SteadfastPickupResponse> {
    const isMock =
      !this.apiKey ||
      this.apiKey.startsWith('mock_') ||
      this.apiKey === 'test' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      return {
        message: 'Pickup request created successfully (Mock)',
        data: {
          id: Math.floor(1000 + Math.random() * 9000),
          pickup_location: payload.address,
          contact_number: payload.contact_number,
          estim_qty: payload.estim_qty || 1,
          req_status: 0,
          created_at: new Date().toISOString(),
        },
      };
    }

    const endpoint = `${this.baseUrl}/create_pickup_request`;
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
          address_id: payload.address_id || 42,
          police_station_id: payload.police_station_id || 17,
          address: payload.address,
          contact_number: payload.contact_number,
          note: payload.note,
          estim_qty: payload.estim_qty || 1,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Steadfast pickup request failed (HTTP ${response.status}): ${errorText}`,
        );
      }

      return (await response.json()) as SteadfastPickupResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Fetch merchant payout settlement history (/payments)
   */
  async getPayments(): Promise<SteadfastPaymentsResponse> {
    const isMock =
      !this.apiKey ||
      this.apiKey.startsWith('mock_') ||
      this.apiKey === 'test' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      return {
        status: 1,
        alertClass: 'success',
        message: 'Fetched successfully (Mock)',
        payments: [
          {
            payment_id: 'SFC-88213',
            amount: 12450,
            method: 'bKash',
            due_bills: 0,
            paid_bills: 3200,
            charges: 124,
            total: 12450,
            status_label: 'Paid',
            created_at: new Date().toISOString(),
          },
        ],
      };
    }

    const endpoint = `${this.baseUrl}/payments`;
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
          `Steadfast getPayments failed (HTTP ${response.status}): ${errorText}`,
        );
      }

      return (await response.json()) as SteadfastPaymentsResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../common/redis/redis.service';
import {
  PathaoCreateOrderPayload,
  PathaoCreateOrderResponse,
  PathaoTokenResponse,
  PathaoTrackingResponse,
} from '../interfaces/pathao.interface';

@Injectable()
export class PathaoApiClient {
  private readonly logger = new Logger(PathaoApiClient.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'PATHAO_BASE_URL',
      'https://courier-api-sandbox.pathao.com',
    );
    this.clientId = this.configService.get<string>('PATHAO_CLIENT_ID', 'mock_pathao_client_id_2026');
    this.clientSecret = this.configService.get<string>(
      'PATHAO_CLIENT_SECRET',
      'mock_pathao_client_secret_2026',
    );
    this.username = this.configService.get<string>(
      'PATHAO_USERNAME',
      'sandbox_merchant@seyven.com',
    );
    this.password = this.configService.get<string>('PATHAO_PASSWORD', 'mock_pathao_pass_2026');
  }

  /**
   * Obtain active OAuth2 Bearer Access Token for Pathao Aladdin API
   */
  async getAccessToken(): Promise<string> {
    const isMock =
      this.clientId.startsWith('mock_') ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      return 'mock_pathao_bearer_token_2026';
    }

    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 60000) {
      return this.cachedToken;
    }

    // Check Redis Token Cache
    const redisCacheKey = 'cache:pathao:access_token';
    const cachedRedis = await this.redisService.get(redisCacheKey);
    if (cachedRedis) {
      this.cachedToken = cachedRedis;
      this.tokenExpiresAt = now + 3600000;
      return cachedRedis;
    }

    // Request new token from Pathao OAuth endpoint
    const endpoint = `${this.baseUrl}/aladdin/api/v1/issue-token`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          username: this.username,
          password: this.password,
          grant_type: 'password',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pathao OAuth token issue failed (HTTP ${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as PathaoTokenResponse;
      this.cachedToken = data.access_token;
      this.tokenExpiresAt = now + (data.expires_in - 120) * 1000;

      await this.redisService.set(
        redisCacheKey,
        data.access_token,
        Math.max(60, data.expires_in - 120),
      );

      return data.access_token;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Book a physical shipment with Pathao Courier
   */
  async createConsignment(
    payload: PathaoCreateOrderPayload,
  ): Promise<PathaoCreateOrderResponse> {
    const isMock =
      this.clientId.startsWith('mock_') ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      const mockConsignmentId = `DB${Date.now().toString().slice(-8)}`;
      this.logger.debug(
        `[Mock Pathao API] Created consignment #${mockConsignmentId} for merchant order ${payload.merchant_order_id} (Collect: ৳${payload.amount_to_collect})`,
      );
      return {
        type: 'success',
        message: 'Order created successfully (Pathao Sandbox)',
        data: {
          consignment_id: mockConsignmentId,
          merchant_order_id: payload.merchant_order_id,
          order_status: 'Pending',
          delivery_fee: 60,
        },
      };
    }

    const token = await this.getAccessToken();
    const endpoint = `${this.baseUrl}/aladdin/api/v1/orders`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pathao order creation failed (HTTP ${response.status}): ${errorText}`);
      }

      return (await response.json()) as PathaoCreateOrderResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Track order delivery status by Pathao Consignment ID
   */
  async getTrackingStatus(consignmentId: string): Promise<PathaoTrackingResponse> {
    const isMock =
      this.clientId.startsWith('mock_') ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (isMock) {
      return {
        type: 'success',
        message: 'Order status fetched successfully',
        data: {
          consignment_id: consignmentId,
          merchant_order_id: 'SYV-MOCK-001',
          order_status: 'In_Transit',
          order_status_slug: 'in_transit',
          updated_at: new Date().toISOString(),
        },
      };
    }

    const token = await this.getAccessToken();
    const endpoint = `${this.baseUrl}/aladdin/api/v1/orders/${consignmentId}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Pathao tracking failed with status ${response.status}`);
      }

      return (await response.json()) as PathaoTrackingResponse;
    } finally {
      clearTimeout(timeout);
    }
  }
}

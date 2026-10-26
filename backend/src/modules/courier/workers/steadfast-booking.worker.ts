import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../common/redis/redis.service';
import { SteadfastApiClient } from '../services/steadfast-api.client';
import {
  SteadfastCreateOrderPayload,
  SteadfastCreateOrderResponse,
  SteadfastDlqEntry,
} from '../interfaces/steadfast.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SteadfastBookingWorker {
  private readonly logger = new Logger(SteadfastBookingWorker.name);
  public static readonly DLQ_REDIS_KEY = 'dlq:courier:steadfast';
  public static readonly MAX_RETRIES = 5;
  public static readonly RETRY_DELAYS_MS = [5000, 15000, 60000, 300000, 900000];

  constructor(
    private readonly steadfastApiClient: SteadfastApiClient,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Execute Steadfast consignment creation with exponential retry policy and Dead-Letter Queue fallback
   */
  async dispatchWithRetry(
    orderId: string,
    orderNumber: string,
    payload: SteadfastCreateOrderPayload,
  ): Promise<SteadfastCreateOrderResponse> {
    let lastError: Error | null = null;
    const isTest = this.configService.get<string>('NODE_ENV') === 'test';

    for (let attempt = 1; attempt <= SteadfastBookingWorker.MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(
          `[Steadfast Worker] Booking consignment for order ${orderNumber} (Attempt ${attempt}/${SteadfastBookingWorker.MAX_RETRIES})`,
        );

        const response = await this.steadfastApiClient.createConsignment(payload);
        return response;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(
          `⚠️ [Steadfast Worker] Consignment creation failed for order ${orderNumber} on attempt ${attempt}: ${lastError.message}`,
        );

        if (attempt < SteadfastBookingWorker.MAX_RETRIES) {
          const delayMs = isTest
            ? 10
            : SteadfastBookingWorker.RETRY_DELAYS_MS[attempt - 1] || 5000;
          await this.delay(delayMs);
        }
      }
    }

    // Retries exhausted — dispatch to Dead-Letter Queue (DLQ)
    const dlqEntry: SteadfastDlqEntry = {
      jobId: uuidv4(),
      orderId,
      orderNumber,
      error: lastError?.message || 'Exhausted all retry attempts',
      attemptCount: SteadfastBookingWorker.MAX_RETRIES,
      failedAt: new Date().toISOString(),
      payload,
    };

    await this.pushToDlq(dlqEntry);

    this.logger.error(
      `🚨 [Steadfast DLQ] Consignment booking for order ${orderNumber} pushed to Dead-Letter Queue after ${SteadfastBookingWorker.MAX_RETRIES} failures: ${dlqEntry.error}`,
    );

    throw new Error(
      `Steadfast booking failed after ${SteadfastBookingWorker.MAX_RETRIES} attempts. Moved to Dead-Letter Queue (DLQ: ${dlqEntry.jobId}): ${dlqEntry.error}`,
    );
  }

  /**
   * Push failed courier booking payload to Redis Dead-Letter Queue
   */
  async pushToDlq(entry: SteadfastDlqEntry): Promise<void> {
    await this.redisService.lpush(
      SteadfastBookingWorker.DLQ_REDIS_KEY,
      JSON.stringify(entry),
    );
  }

  /**
   * Retrieve Dead-Letter Queue items for administrator inspection
   */
  async getDlqEntries(limit: number = 50): Promise<SteadfastDlqEntry[]> {
    const rawItems = await this.redisService.lrange(
      SteadfastBookingWorker.DLQ_REDIS_KEY,
      0,
      limit - 1,
    );
    return rawItems.map((item: string) => JSON.parse(item) as SteadfastDlqEntry);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/redis/redis.service';
import { PathaoApiClient } from '../services/pathao-api.client';
import {
  PathaoCreateOrderPayload,
  PathaoCreateOrderResponse,
  PathaoDlqEntry,
} from '../interfaces/pathao.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PathaoBookingWorker {
  private readonly logger = new Logger(PathaoBookingWorker.name);
  private static readonly DLQ_REDIS_KEY = 'dlq:courier:pathao';
  private static readonly MAX_RETRIES = 5;
  private static readonly RETRY_DELAYS_MS = [5000, 15000, 60000, 300000, 900000];

  constructor(
    private readonly pathaoApiClient: PathaoApiClient,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Execute consignment creation with exponential retry policy and Dead-Letter Queue fallback
   */
  async dispatchWithRetry(
    orderId: string,
    orderNumber: string,
    payload: PathaoCreateOrderPayload,
  ): Promise<PathaoCreateOrderResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= PathaoBookingWorker.MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(
          `[Pathao Worker] Booking consignment for order ${orderNumber} (Attempt ${attempt}/${PathaoBookingWorker.MAX_RETRIES})`,
        );

        const response = await this.pathaoApiClient.createConsignment(payload);
        return response;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(
          `⚠️ [Pathao Worker] Consignment creation failed for order ${orderNumber} on attempt ${attempt}: ${lastError.message}`,
        );

        if (attempt < PathaoBookingWorker.MAX_RETRIES) {
          const delayMs = PathaoBookingWorker.RETRY_DELAYS_MS[attempt - 1] || 5000;
          await this.delay(delayMs);
        }
      }
    }

    // Retries exhausted — dispatch to Dead-Letter Queue (DLQ)
    const dlqEntry: PathaoDlqEntry = {
      jobId: uuidv4(),
      orderId,
      orderNumber,
      error: lastError?.message || 'Exhausted all retry attempts',
      attemptCount: PathaoBookingWorker.MAX_RETRIES,
      failedAt: new Date().toISOString(),
      payload,
    };

    await this.pushToDlq(dlqEntry);

    this.logger.error(
      `🚨 [Pathao DLQ] Consignment booking for order ${orderNumber} pushed to Dead-Letter Queue after ${PathaoBookingWorker.MAX_RETRIES} failures: ${dlqEntry.error}`,
    );

    throw new Error(
      `Pathao booking failed after ${PathaoBookingWorker.MAX_RETRIES} attempts. Moved to Dead-Letter Queue (DLQ: ${dlqEntry.jobId}): ${dlqEntry.error}`,
    );
  }

  /**
   * Push poisoned/failed courier booking payload to Redis Dead-Letter Queue
   */
  async pushToDlq(entry: PathaoDlqEntry): Promise<void> {
    await this.redisService.lpush(
      PathaoBookingWorker.DLQ_REDIS_KEY,
      JSON.stringify(entry),
    );
  }

  /**
   * Retrieve Dead-Letter Queue items for administrator inspection
   */
  async getDlqEntries(limit: number = 50): Promise<PathaoDlqEntry[]> {
    const rawItems = await this.redisService.lrange(
      PathaoBookingWorker.DLQ_REDIS_KEY,
      0,
      limit - 1,
    );
    return rawItems.map((item: string) => JSON.parse(item) as PathaoDlqEntry);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../common/redis/redis.service';
import { MetaCapiClient } from '../services/meta-capi.client';
import {
  MetaCapiDlqEntry,
  MetaCapiEventPayload,
  MetaCapiResponse,
} from '../interfaces/meta-capi.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MetaCapiWorker {
  private readonly logger = new Logger(MetaCapiWorker.name);
  public static readonly DLQ_REDIS_KEY = 'dlq:analytics:meta_capi';
  public static readonly MAX_RETRIES = 3;
  public static readonly RETRY_DELAYS_MS = [1000, 3000, 10000];

  constructor(
    private readonly metaCapiClient: MetaCapiClient,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Dispatches a Meta CAPI event with exponential backoff retries and DLQ fallback.
   */
  async dispatchWithRetry(
    event: MetaCapiEventPayload,
    testEventCode?: string,
  ): Promise<MetaCapiResponse> {
    let lastError: Error | null = null;
    const isTest = this.configService.get<string>('NODE_ENV') === 'test';

    for (let attempt = 1; attempt <= MetaCapiWorker.MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(
          `[Meta CAPI Worker] Dispatching event ${event.event_name} (${event.event_id}) (Attempt ${attempt}/${MetaCapiWorker.MAX_RETRIES})`,
        );

        const response = await this.metaCapiClient.sendEvents([event], testEventCode);
        return response;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(
          `⚠️ [Meta CAPI Worker] Dispatch failed for event ${event.event_name} (${event.event_id}) on attempt ${attempt}: ${lastError.message}`,
        );

        if (attempt < MetaCapiWorker.MAX_RETRIES) {
          const delayMs = isTest
            ? 5
            : MetaCapiWorker.RETRY_DELAYS_MS[attempt - 1] || 1000;
          await this.delay(delayMs);
        }
      }
    }

    // Retries exhausted — dispatch to Dead-Letter Queue (DLQ)
    const dlqEntry: MetaCapiDlqEntry = {
      jobId: uuidv4(),
      eventId: event.event_id,
      eventName: event.event_name,
      attemptCount: MetaCapiWorker.MAX_RETRIES,
      failedAt: new Date().toISOString(),
      error: lastError?.message || 'Meta CAPI retry limit reached',
      payload: event,
    };

    await this.pushToDlq(dlqEntry);

    this.logger.error(
      `🚨 [Meta CAPI DLQ] Event ${event.event_name} (${event.event_id}) moved to Dead-Letter Queue after ${MetaCapiWorker.MAX_RETRIES} failures: ${dlqEntry.error}`,
    );

    throw new Error(
      `Meta CAPI dispatch failed after ${MetaCapiWorker.MAX_RETRIES} attempts. Moved to DLQ (${dlqEntry.jobId}): ${dlqEntry.error}`,
    );
  }

  /**
   * Pushes failed CAPI payload to Redis Dead-Letter Queue.
   */
  async pushToDlq(entry: MetaCapiDlqEntry): Promise<void> {
    try {
      await this.redisService.lpush(
        MetaCapiWorker.DLQ_REDIS_KEY,
        JSON.stringify(entry),
      );
    } catch (err: unknown) {
      this.logger.error(
        `[Meta CAPI DLQ] Failed to push DLQ entry to Redis: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Retrieves items from the Meta CAPI Dead-Letter Queue.
   */
  async getDlqEntries(limit: number = 50): Promise<MetaCapiDlqEntry[]> {
    try {
      const rawItems = await this.redisService.lrange(
        MetaCapiWorker.DLQ_REDIS_KEY,
        0,
        limit - 1,
      );
      return rawItems.map((item: string) => JSON.parse(item) as MetaCapiDlqEntry);
    } catch {
      return [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

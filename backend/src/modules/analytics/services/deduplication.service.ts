import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

export interface DeduplicationRecord {
  isDuplicate: boolean;
  eventId: string;
  firstSeenAt?: string;
  source?: string;
}

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);
  public static readonly DEDUP_KEY_PREFIX = 'analytics:dedup:';
  public static readonly DEDUP_TTL_SECONDS = 48 * 60 * 60; // 48 hours (Meta CAPI recommended deduplication window)

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generates a unique or deterministic shared event_id for browser-server deduplication.
   */
  generateSharedEventId(eventName: string, uniqueSeed?: string): string {
    const cleanName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (uniqueSeed) {
      const cleanSeed = uniqueSeed.replace(/[^a-zA-Z0-9_-]/g, '');
      return `sey_${cleanName}_${cleanSeed}`;
    }
    return `sey_${cleanName}_${uuidv4()}`;
  }

  /**
   * Checks and registers an event_id in Redis.
   * If already registered, marks isDuplicate = true.
   * Otherwise registers it with a 48-hour TTL.
   */
  async registerAndCheck(
    eventId: string,
    eventName: string,
    source: string = 'server',
  ): Promise<DeduplicationRecord> {
    const key = `${DeduplicationService.DEDUP_KEY_PREFIX}${eventId}`;

    try {
      const existing = await this.redisService.get(key);
      if (existing) {
        let parsed: { firstSeenAt?: string; source?: string } = {};
        try {
          parsed = JSON.parse(existing);
        } catch {
          // ignore parsing error
        }

        this.logger.debug(
          `[Dedup Engine] Duplicate event detected for event_id: ${eventId} (name: ${eventName}, original source: ${parsed.source || 'unknown'})`,
        );

        return {
          isDuplicate: true,
          eventId,
          firstSeenAt: parsed.firstSeenAt,
          source: parsed.source,
        };
      }

      // First time seeing this eventId
      const record = {
        eventId,
        eventName,
        source,
        firstSeenAt: new Date().toISOString(),
      };

      await this.redisService.set(
        key,
        JSON.stringify(record),
        DeduplicationService.DEDUP_TTL_SECONDS,
      );

      return {
        isDuplicate: false,
        eventId,
        firstSeenAt: record.firstSeenAt,
        source,
      };
    } catch (err: unknown) {
      this.logger.warn(
        `[Dedup Engine] Redis check failed for event_id ${eventId}: ${(err as Error).message}`,
      );
      // Fail-open for analytics tracking: allow event processing
      return {
        isDuplicate: false,
        eventId,
      };
    }
  }
}

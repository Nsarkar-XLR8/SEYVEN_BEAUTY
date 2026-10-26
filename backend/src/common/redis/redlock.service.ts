import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { v4 as uuidv4 } from 'uuid';

export interface DistributedLock {
  resource: string;
  token: string;
  ttlMs: number;
  acquiredAt: number;
}

@Injectable()
export class RedlockService {
  private readonly logger = new Logger(RedlockService.name);

  // Lua script ensuring only the holder of the token can release the lock
  private readonly unlockScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  constructor(private readonly redis: RedisService) {}

  /**
   * Formats a resource key for Redis locking
   */
  private formatLockKey(resource: string): string {
    return `lock:${resource}`;
  }

  /**
   * Acquires a distributed lock on a single resource.
   */
  async acquireLock(
    resource: string,
    ttlMs: number = 5000,
    retryAttempts: number = 5,
    retryDelayMs: number = 100,
  ): Promise<DistributedLock | null> {
    const lockKey = this.formatLockKey(resource);
    const token = uuidv4();

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      const result = await this.redis.set(lockKey, token, 'PX', ttlMs, 'NX');
      if (result === 'OK') {
        return {
          resource,
          token,
          ttlMs,
          acquiredAt: Date.now(),
        };
      }

      if (attempt < retryAttempts - 1) {
        // Jittered backoff delay to prevent thundering herd
        const jitter = Math.floor(Math.random() * (retryDelayMs / 2));
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs + jitter));
      }
    }

    return null;
  }

  /**
   * Releases an acquired distributed lock.
   */
  async releaseLock(lock: DistributedLock): Promise<boolean> {
    const lockKey = this.formatLockKey(lock.resource);
    try {
      const result = await this.redis.eval(this.unlockScript, 1, lockKey, lock.token);
      return result === 1;
    } catch (err) {
      this.logger.error(`Error releasing distributed lock for "${lock.resource}": ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Acquires distributed locks across multiple resources atomically in sorted order
   * to eliminate circular wait deadlock conditions.
   */
  async acquireMultiLock(
    resources: string[],
    ttlMs: number = 5000,
    retryAttempts: number = 5,
    retryDelayMs: number = 100,
  ): Promise<DistributedLock[] | null> {
    // Deduplicate and sort resources deterministically
    const uniqueSortedResources = Array.from(new Set(resources)).sort();
    const acquiredLocks: DistributedLock[] = [];

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      let allAcquired = true;
      acquiredLocks.length = 0;

      for (const res of uniqueSortedResources) {
        // Attempt single lock acquisition for this resource
        const lockKey = this.formatLockKey(res);
        const token = uuidv4();
        const result = await this.redis.set(lockKey, token, 'PX', ttlMs, 'NX');

        if (result === 'OK') {
          acquiredLocks.push({
            resource: res,
            token,
            ttlMs,
            acquiredAt: Date.now(),
          });
        } else {
          allAcquired = false;
          break;
        }
      }

      if (allAcquired) {
        return acquiredLocks;
      }

      // Rollback any partially acquired locks before retrying
      await this.releaseMultiLock(acquiredLocks);

      if (attempt < retryAttempts - 1) {
        const jitter = Math.floor(Math.random() * (retryDelayMs / 2));
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs + jitter));
      }
    }

    return null;
  }

  /**
   * Releases multiple locks.
   */
  async releaseMultiLock(locks: DistributedLock[]): Promise<void> {
    await Promise.all(locks.map((lock) => this.releaseLock(lock)));
  }

  /**
   * Executes an operation inside a distributed lock block with automatic acquisition and release.
   */
  async withLock<T>(
    resources: string | string[],
    fn: () => Promise<T>,
    ttlMs: number = 5000,
  ): Promise<T> {
    const resourceList = Array.isArray(resources) ? resources : [resources];
    const locks = await this.acquireMultiLock(resourceList, ttlMs);

    if (!locks) {
      throw new ConflictException(
        `Unable to acquire concurrency lock for resources [${resourceList.join(', ')}]. Another transaction is in progress.`,
      );
    }

    try {
      return await fn();
    } finally {
      await this.releaseMultiLock(locks);
    }
  }
}

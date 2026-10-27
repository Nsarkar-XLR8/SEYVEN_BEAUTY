import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly isTest = process.env.NODE_ENV === 'test';

  // In-memory fallback map for test/mock environments or offline mode
  private readonly memoryStore = new Map<string, { value: string; expiresAt?: number }>();
  private readonly memorySets = new Map<string, Set<string>>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (this.isTest) {
      this.logger.log('Running in test environment: Using In-Memory Redis Mock provider');
      return;
    }

    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');

      if (redisUrl && redisUrl.trim().length > 0) {
        const isTls = redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.io');
        this.client = new Redis(redisUrl, {
          tls: isTls ? { rejectUnauthorized: false } : undefined,
          retryStrategy: (times) => {
            if (times > 3) {
              this.logger.warn(`Redis connection retry limit reached (${times}). Falling back.`);
              return null;
            }
            return Math.min(times * 100, 2000);
          },
          lazyConnect: true,
        });
      } else {
        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        const password = this.configService.get<string>('REDIS_PASSWORD', '');
        const isTls =
          this.configService.get<string>('REDIS_TLS') === 'true' ||
          host.includes('upstash.io');

        this.client = new Redis({
          host,
          port,
          password: password || undefined,
          tls: isTls ? { rejectUnauthorized: false } : undefined,
          retryStrategy: (times) => {
            if (times > 3) {
              this.logger.warn(`Redis connection retry limit reached (${times}). Falling back.`);
              return null;
            }
            return Math.min(times * 100, 2000);
          },
          lazyConnect: true,
        });
      }

      this.client.on('error', (err) => {
        this.logger.warn(`Redis client error: ${err.message}. Operating with fallback.`);
      });

      this.client
        .connect()
        .then(() => {
          this.logger.log(' Connected to Redis database successfully');
        })
        .catch((err) => {
          this.logger.warn(`Redis initial connect failed: ${err.message}. Will use in-memory store.`);
        });
    } catch (err) {
      this.logger.warn(`Failed to initialize Redis client: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        this.logger.error(`Error closing Redis client: ${(err as Error).message}`);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.client.status === 'ready') {
      return this.client.get(key);
    }
    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK' | null> {
    if (this.client && this.client.status === 'ready') {
      if (args.length === 1 && typeof args[0] === 'number') {
        return (this.client as any).set(key, value, 'EX', args[0]);
      }
      return (this.client as any).set(key, value, ...args);
    }

    let expiresAt: number | undefined;
    if (args && args.length === 1 && typeof args[0] === 'number') {
      expiresAt = Date.now() + args[0] * 1000;
    } else if (args && args.length >= 2) {
      const mode = String(args[0]).toUpperCase();
      const ttl = Number(args[1]);
      if (mode === 'EX' || mode === 'PX') {
        expiresAt = Date.now() + (mode === 'EX' ? ttl * 1000 : ttl);
      }
    }

    // Check NX / XX condition if provided
    if (args.includes('NX')) {
      const existing = await this.get(key);
      if (existing !== null) return null;
    }

    this.memoryStore.set(key, { value, expiresAt });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    if (this.client && this.client.status === 'ready') {
      return this.client.setex(key, seconds, value);
    }
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000,
    });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    if (this.client && this.client.status === 'ready') {
      return this.client.del(...keys);
    }
    let count = 0;
    for (const k of keys) {
      if (this.memoryStore.delete(k)) count++;
      if (this.memorySets.delete(k)) count++;
    }
    return count;
  }

  async exists(key: string): Promise<number> {
    const val = await this.get(key);
    return val !== null ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.client && this.client.status === 'ready') {
      return this.client.expire(key, seconds);
    }
    const item = this.memoryStore.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    if (this.client && this.client.status === 'ready') {
      return this.client.ttl(key);
    }
    const item = this.memoryStore.get(key);
    if (!item || !item.expiresAt) return -1;
    const remaining = Math.floor((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async eval(script: string, numkeys: number, ...args: any[]): Promise<any> {
    if (this.client && this.client.status === 'ready') {
      return (this.client as any).eval(script, numkeys, ...args);
    }
    // Emulate Redlock release lua script: if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end
    const keys = args.slice(0, numkeys);
    const argv = args.slice(numkeys);
    if (script.includes('redis.call("get", KEYS[1]) == ARGV[1]')) {
      const key = keys[0];
      const token = argv[0];
      const val = await this.get(key);
      if (val === token) {
        await this.del(key);
        return 1;
      }
      return 0;
    }
    return 1;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (this.client && this.client.status === 'ready') {
      return this.client.sadd(key, ...members);
    }
    let set = this.memorySets.get(key);
    if (!set) {
      set = new Set<string>();
      this.memorySets.set(key, set);
    }
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (this.client && this.client.status === 'ready') {
      return this.client.srem(key, ...members);
    }
    const set = this.memorySets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    if (this.client && this.client.status === 'ready') {
      return this.client.smembers(key);
    }
    const set = this.memorySets.get(key);
    return set ? Array.from(set) : [];
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.client && this.client.status === 'ready') {
      return this.client.keys(pattern);
    }
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    const result: string[] = [];
    for (const k of this.memoryStore.keys()) {
      if (regex.test(k)) {
        result.push(k);
      }
    }
    return result;
  }

  private readonly memoryLists = new Map<string, string[]>();

  async lpush(key: string, ...elements: string[]): Promise<number> {
    if (this.client && this.client.status === 'ready') {
      return this.client.lpush(key, ...elements);
    }
    let list = this.memoryLists.get(key);
    if (!list) {
      list = [];
      this.memoryLists.set(key, list);
    }
    list.unshift(...elements);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (this.client && this.client.status === 'ready') {
      return this.client.lrange(key, start, stop);
    }
    const list = this.memoryLists.get(key) || [];
    const end = stop < 0 ? list.length + stop + 1 : stop + 1;
    return list.slice(start, end);
  }
}

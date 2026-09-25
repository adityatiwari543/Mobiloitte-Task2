import { Redis } from 'ioredis';
import { env } from '../config/env.js';

interface InMemoryEntry {
  value: string;
  expiresAt: number | null; // epoch ms
}

class RedisService {
  private client: Redis | null = null;
  private subscriberClient: Redis | null = null;
  private isFallbackMode = false;
  private inMemoryStore = new Map<string, InMemoryEntry>();
  private localSubscribers = new Map<string, Set<(message: string) => void>>();

  constructor() {
    this.initClients();
  }

  private initClients() {
    try {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => null, // Don't spam retries when offline in local dev
        lazyConnect: true,
      });

      // Synchronously attach error handler to prevent Node.js Unhandled error event
      this.client.on('error', () => {
        if (!this.isFallbackMode) {
          console.warn('ℹ️ Redis offline. Resilient in-memory cache active for OTP & rate limiting.');
          this.isFallbackMode = true;
        }
      });

      this.client.on('connect', () => {
        this.isFallbackMode = false;
        console.log('✅ Connected to Redis cache successfully.');
      });

      this.client.connect().catch(() => {
        this.isFallbackMode = true;
      });
    } catch {
      this.isFallbackMode = true;
    }
  }

  // Clean expired in-memory items periodically
  private purgeExpiredInMemory() {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.inMemoryStore.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isFallbackMode && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        this.isFallbackMode = true;
      }
    }
    this.purgeExpiredInMemory();
    const entry = this.inMemoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.inMemoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (!this.isFallbackMode && this.client) {
      try {
        if (ttlSeconds) {
          return (await this.client.set(key, value, 'EX', ttlSeconds)) as 'OK';
        }
        return (await this.client.set(key, value)) as 'OK';
      } catch {
        this.isFallbackMode = true;
      }
    }
    this.inMemoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    if (!this.isFallbackMode && this.client) {
      try {
        return await this.client.del(key);
      } catch {
        this.isFallbackMode = true;
      }
    }
    const existed = this.inMemoryStore.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    if (!this.isFallbackMode && this.client) {
      try {
        return await this.client.exists(key);
      } catch {
        this.isFallbackMode = true;
      }
    }
    const val = await this.get(key);
    return val !== null ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.isFallbackMode && this.client) {
      try {
        return await this.client.expire(key, seconds);
      } catch {
        this.isFallbackMode = true;
      }
    }
    const entry = this.inMemoryStore.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.isFallbackMode && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          return await this.client.del(...keys);
        }
        return 0;
      } catch {
        this.isFallbackMode = true;
      }
    }
    let count = 0;
    // Simple glob regex converter: e.g. "jobs:list:*" -> "^jobs:list:.*$"
    const regexPattern = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.inMemoryStore.keys()) {
      if (regexPattern.test(key)) {
        this.inMemoryStore.delete(key);
        count++;
      }
    }
    return count;
  }

  async publish(channel: string, message: string): Promise<number> {
    if (!this.isFallbackMode && this.client) {
      try {
        return await this.client.publish(channel, message);
      } catch {
        this.isFallbackMode = true;
      }
    }
    const handlers = this.localSubscribers.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (err) {
          console.error('Error in local channel subscriber handler:', err);
        }
      }
      return handlers.size;
    }
    return 0;
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    if (!this.localSubscribers.has(channel)) {
      this.localSubscribers.set(channel, new Set());
    }
    this.localSubscribers.get(channel)!.add(handler);

    if (!this.isFallbackMode && !this.subscriberClient) {
      try {
        this.subscriberClient = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy: () => null,
          lazyConnect: true,
        });

        // Synchronously attach error handler
        this.subscriberClient.on('error', () => {
          this.subscriberClient = null;
        });

        await this.subscriberClient.connect();
        await this.subscriberClient.subscribe(channel);
        this.subscriberClient.on('message', (chan, msg) => {
          if (chan === channel) {
            handler(msg);
          }
        });
      } catch {
        this.subscriberClient = null;
      }
    }
  }

  getStatus(): { connected: boolean; fallbackMode: boolean; inMemoryKeyCount: number } {
    return {
      connected: !this.isFallbackMode,
      fallbackMode: this.isFallbackMode,
      inMemoryKeyCount: this.inMemoryStore.size,
    };
  }
}

export const redisService = new RedisService();

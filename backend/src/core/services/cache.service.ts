import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { CacheConfigHelper, DevLogger } from '../utils';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }
  private async initializeRedis() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 60000,
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        DevLogger.log('✅ Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        DevLogger.log('❌ Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  private generateKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || 'student_dashboard';
    return `${finalPrefix}:${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isConnected) {
      DevLogger.log('❌ Redis not connected, skipping cache get');
      return null;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const startTime = Date.now();

      const cached = await this.client.get(cacheKey);
      const duration = Date.now() - startTime;

      if (cached) {
        DevLogger.log(`🎯 Cache HIT for "${cacheKey}" (${duration}ms)`);
        return JSON.parse(cached);
      } else {
        DevLogger.log(`❌ Cache MISS for "${cacheKey}" (${duration}ms)`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key "${key}":`, error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    if (!this.isConnected) {
      DevLogger.log('❌ Redis not connected, skipping cache set');
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const ttl = options?.ttl || CacheConfigHelper.getDefaultTTL();
      const startTime = Date.now();

      await this.client.setEx(cacheKey, ttl, JSON.stringify(value));
      const duration = Date.now() - startTime;

      DevLogger.log(
        `💾 Cache SET for "${cacheKey}" with TTL ${ttl}s (${duration}ms)`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key "${key}":`, error);
      return false;
    }
  }

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected) {
      DevLogger.log('❌ Redis not connected, skipping cache delete');
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const startTime = Date.now();

      const result = await this.client.del(cacheKey);
      const duration = Date.now() - startTime;

      DevLogger.log(`🗑️ Cache DELETE for "${cacheKey}" (${duration}ms)`);
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key "${key}":`, error);
      return false;
    }
  }

  async clearPattern(pattern: string, options?: CacheOptions): Promise<number> {
    if (!this.isConnected) {
      DevLogger.log('❌ Redis not connected, skipping cache pattern clear');
      return 0;
    }

    try {
      const searchPattern = this.generateKey(pattern, options?.prefix);
      const startTime = Date.now();

      const keys = await this.client.keys(searchPattern);
      if (keys.length === 0) {
        DevLogger.log(`🔍 No keys found for pattern "${searchPattern}"`);
        return 0;
      }

      const result = await this.client.del(keys);
      const duration = Date.now() - startTime;

      DevLogger.log(
        `🧹 Cleared ${result} keys matching pattern "${searchPattern}" (${duration}ms)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Cache pattern clear error for pattern "${pattern}":`,
        error,
      );
      return 0;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists check error for key "${key}":`, error);
      return false;
    }
  }

  async getTTL(key: string, options?: CacheOptions): Promise<number> {
    if (!this.isConnected) {
      return -1;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      return await this.client.ttl(cacheKey);
    } catch (error) {
      this.logger.error(`Cache TTL check error for key "${key}":`, error);
      return -1;
    }
  }

  async invalidateNamespace(namespace: string): Promise<number> {
    return this.clearPattern(`${namespace}:*`);
  }

  async getStats(): Promise<any> {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
      };
    } catch (error) {
      this.logger.error('Cache stats error:', error);
      return { connected: false, error: error.message };
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      DevLogger.log('🔌 Redis connection closed');
    }
  }
}

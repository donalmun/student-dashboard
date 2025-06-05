import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CACHE_KEYS, CACHE_TTL } from '../config/redis.config';
import { DevLogger } from '../utils/logger.util';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    DevLogger.startup('CacheService constructor called!', 'CacheService');
    DevLogger.config(
      `Cache Manager injected: ${!!this.cacheManager}`,
      'CacheService',
    );

    this.logger.log('CacheService initialized');

    if (this.cacheManager) {
      DevLogger.success('Cache Manager is available', 'CacheService');
      this.testConnection();
    } else {
      DevLogger.error('Cache Manager is NOT available!', null, 'CacheService');
    }
  }

  /**
   * 🧪 Test cache connection on initialization
   */
  private async testConnection() {
    DevLogger.info('Testing cache connection...', 'CacheService');

    try {
      const testKey = 'cache:test:connection';
      const testValue = { test: true, timestamp: Date.now() };

      await this.cacheManager.set(testKey, testValue, 10);
      const retrieved = await this.cacheManager.get(testKey);

      if (retrieved) {
        DevLogger.success('Cache connection test PASSED', 'CacheService');
        this.logger.log('Cache connection test PASSED');
      } else {
        DevLogger.warn(
          'Cache connection test FAILED - could not retrieve test data',
          'CacheService',
        );
      }

      await this.cacheManager.del(testKey);
    } catch (error) {
      DevLogger.error('Cache connection test ERROR:', error, 'CacheService');
    }
  }

  /**
   * 🔍 Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.cacheManager.get<T>(key);
      if (data) {
        DevLogger.debug(`Cache HIT: ${key}`, 'CacheService');
        this.logger.debug(`Cache HIT: ${key}`);
        return data;
      } else {
        DevLogger.debug(`Cache MISS: ${key}`, 'CacheService');
        this.logger.debug(`Cache MISS: ${key}`);
        return null;
      }
    } catch (error) {
      DevLogger.error(`Cache GET error for key ${key}:`, error, 'CacheService');
      return null;
    }
  }

  /**
   * 💾 Set cached data
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const finalTtl = ttl || CACHE_TTL.MEDIUM;
      await this.cacheManager.set(key, value, finalTtl * 1000); // Convert to milliseconds
      DevLogger.debug(`Cache SET: ${key} (TTL: ${finalTtl}s)`, 'CacheService');
      this.logger.debug(`Cache SET: ${key} (TTL: ${finalTtl}s)`);
    } catch (error) {
      DevLogger.error(`Cache SET error for key ${key}:`, error, 'CacheService');
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * 🗑️ Delete cached data
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * 🧹 Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Manually delete known cache keys since reset() is not available
      await this.del(CACHE_KEYS.SUBJECT_STATISTICS);
      await this.del(CACHE_KEYS.DASHBOARD_OVERVIEW);
      await this.del(CACHE_KEYS.STUDENT_SEARCH);
      await this.del(CACHE_KEYS.KHOI_A_TOP10);
      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error('Cache CLEAR error:', error);
    }
  }

  /**
   * 🔑 Generate cache key for analytics
   */
  generateAnalyticsKey(baseKey: string, filters: any): string {
    const filterString = JSON.stringify(filters || {});
    const hash = this.simpleHash(filterString);
    return `${baseKey}:${hash}`;
  }

  /**
   * 🔑 Generate cache key for student search
   */
  generateSearchKey(query: any): string {
    const searchString = JSON.stringify(query);
    const hash = this.simpleHash(searchString);
    return `${CACHE_KEYS.STUDENT_SEARCH}:${hash}`;
  }

  /**
   * 🔑 Generate cache key with subject
   */
  generateSubjectKey(
    baseKey: string,
    subject: string,
    additionalParams?: any,
  ): string {
    const params = additionalParams
      ? `:${this.simpleHash(JSON.stringify(additionalParams))}`
      : '';
    return `${baseKey}:${subject}${params}`;
  }

  /**
   * ⏱️ Get or set pattern (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    DevLogger.debug(`Attempting cache lookup for key: ${key}`, 'CacheService');

    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      DevLogger.debug(`Returning cached data for key: ${key}`, 'CacheService');
      return cached;
    }

    // If not in cache, fetch data
    DevLogger.debug(
      `Cache miss - fetching fresh data for key: ${key}`,
      'CacheService',
    );
    this.logger.debug(`Fetching fresh data for key: ${key}`);

    const startTime = Date.now();
    const freshData = await fetchFunction();
    const fetchTime = Date.now() - startTime;

    DevLogger.debug(
      `Fresh data fetched in ${fetchTime}ms for key: ${key}`,
      'CacheService',
    );

    // Store in cache
    await this.set(key, freshData, ttl);

    return freshData;
  }

  /**
   * 🔄 Invalidate cache patterns
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Note: This is a simplified version. In production, you might want
      // to use Redis SCAN with pattern matching
      this.logger.log(`Invalidating cache pattern: ${pattern}`);

      // For now, we'll clear specific known keys
      if (pattern.includes('analytics')) {
        await this.del(CACHE_KEYS.SUBJECT_STATISTICS);
        await this.del(CACHE_KEYS.DASHBOARD_OVERVIEW);
      }

      if (pattern.includes('students')) {
        await this.del(CACHE_KEYS.STUDENT_SEARCH);
        await this.del(CACHE_KEYS.KHOI_A_TOP10);
      }
    } catch (error) {
      this.logger.error(
        `Cache invalidation error for pattern ${pattern}:`,
        error,
      );
    }
  }

  /**
   * 🧮 Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 📊 Get cache stats (for monitoring)
   */
  async getStats(): Promise<any> {
    try {
      // This would depend on your Redis setup
      // For now, return basic info
      return {
        status: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { status: 'error', error: error.message };
    }
  }
}

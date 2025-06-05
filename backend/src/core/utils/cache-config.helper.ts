import { ConfigService } from '@nestjs/config';

/**
 * 🔧 Cache Configuration Helper
 * Centralizes cache TTL calculations and configuration logic
 */
export class CacheConfigHelper {
  /**
   * 📊 Parse and validate TTL value
   */
  static parseTtl(value: string | number, defaultValue: number = 300): number {
    if (typeof value === 'number') return value;
    const parsed = parseInt(value || defaultValue.toString());
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * 🕐 Convert TTL to milliseconds for cache-manager
   */
  static toMilliseconds(ttlSeconds: number): number {
    return ttlSeconds * 1000;
  }
  /**
   * ⚙️ Get cache configuration from ConfigService
   */
  static getCacheConfig(configService: ConfigService) {
    const cacheEnabled = configService.get('CACHE_ENABLED');
    const redisTtl = this.parseTtl(
      configService.get('CACHE_DEFAULT_TTL') || '300',
      300,
    );
    const isEnabled = cacheEnabled === 'true';

    return {
      enabled: isEnabled,
      ttl: this.toMilliseconds(redisTtl),
      maxItems: isEnabled ? 1000 : 100, // More items when cache is enabled
    };
  }

  /**
   * 🕐 Get default TTL value
   */
  static getDefaultTTL(): number {
    return 300; // 5 minutes
  }

  /**
   * 🏷️ Generate consistent cache keys
   */
  static generateKey(prefix: string, ...params: (string | number)[]): string {
    return `${prefix}:${params.join(':')}`;
  }
}

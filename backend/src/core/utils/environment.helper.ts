import { ConfigService } from '@nestjs/config';

/**
 * 🔧 Environment Configuration Helper
 * Centralizes environment configuration logic and provides type-safe access
 */
export class EnvironmentHelper {
  /**
   * 🌍 Check if running in development mode
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * 🏭 Check if running in production mode
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * 🧪 Check if running in test mode
   */
  static isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  /**
   * 🔍 Get environment with fallback
   */
  static getNodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * 🔢 Get port with type safety
   */
  static getPort(configService: ConfigService): number {
    return configService.get<number>('PORT') || 3000;
  }

  /**
   * 🗄️ Get database configuration
   */
  static getDatabaseConfig(configService: ConfigService) {
    return {
      type: 'postgres' as const,
      host: configService.get('DB_HOST') || 'localhost',
      port: parseInt(configService.get('DB_PORT') || '5432'),
      username: configService.get('DB_USERNAME') || 'myuser',
      password: configService.get('DB_PASSWORD') || 'mypassword',
      database: configService.get('DB_NAME') || 'student_dashboard_db',
      synchronize: false,
      migrationsRun: this.isDevelopment(),
      logging: this.isDevelopment(),
    };
  }

  /**
   * 💾 Check if cache is enabled
   */
  static isCacheEnabled(configService: ConfigService): boolean {
    return configService.get('CACHE_ENABLED') === 'true';
  }

  /**
   * ⏱️ Get cache TTL with validation
   */
  static getCacheTtl(configService: ConfigService): number {
    const ttl = parseInt(configService.get('CACHE_DEFAULT_TTL') || '300');
    return isNaN(ttl) ? 300 : ttl;
  }

  /**
   * 📝 Get log level based on environment
   */
  static getLogLevel(): string {
    if (this.isProduction()) return 'warn';
    if (this.isTest()) return 'error';
    return 'debug';
  }

  /**
   * 🔐 Get required environment variable with validation
   */
  static getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * 🔧 Get optional environment variable with fallback
   */
  static getOptionalEnv(key: string, fallback: string): string {
    return process.env[key] || fallback;
  }
}

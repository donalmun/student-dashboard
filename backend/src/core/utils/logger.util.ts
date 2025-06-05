import { Logger } from '@nestjs/common';

/**
 * 🚀 Development Logger Utility
 * Only logs in development environment to avoid production noise
 */
export class DevLogger {
  private static readonly isDevelopment =
    process.env.NODE_ENV === 'development';
  private static readonly logger = new Logger('DevLogger');
  /**
   * 📝 General development-only log
   */
  static log(message: string, context?: string): void {
    if (this.isDevelopment) {
      console.log(`📝 ${context ? `[${context}] ` : ''}${message}`);
    }
  }

  /**
   * 🐛 Development-only console log
   */
  static debug(message: string, context?: string): void {
    if (this.isDevelopment) {
      console.log(`🐛 ${context ? `[${context}] ` : ''}${message}`);
    }
  }

  /**
   * ℹ️ Development-only info log
   */
  static info(message: string, context?: string): void {
    if (this.isDevelopment) {
      console.log(`ℹ️ ${context ? `[${context}] ` : ''}${message}`);
    }
  }

  /**
   * ⚠️ Development-only warning log
   */
  static warn(message: string, context?: string): void {
    if (this.isDevelopment) {
      console.warn(`⚠️ ${context ? `[${context}] ` : ''}${message}`);
    }
  }

  /**
   * 💥 Error log (always shown, regardless of environment)
   */
  static error(message: string, error?: any, context?: string): void {
    console.error(`💥 ${context ? `[${context}] ` : ''}${message}`, error);
    this.logger.error(message, error?.stack, context);
  }

  /**
   * ✅ Success log (development only)
   */
  static success(message: string, context?: string): void {
    if (this.isDevelopment) {
      console.log(`✅ ${context ? `[${context}] ` : ''}${message}`);
    }
  }

  /**
   * 🔧 Configuration log (development only)
   */
  static config(message: string, context?: string): void {
    if (this.isDevelopment) {
      console.log(`🔧 ${context ? `[${context}] ` : ''}${message}`);
    }
  }

  /**
   * 🚀 Startup log (development only)
   */
  static startup(message: string, context?: string): void {
    if (this.isDevelopment) {
      console.log(`🚀 ${context ? `[${context}] ` : ''}${message}`);
    }
  }
}

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 🚫 Business Logic Exception
 * For domain-specific business rule violations
 */
export class BusinessLogicException extends HttpException {
  constructor(
    message: string, 
    code?: string,
    details?: any
  ) {
    super({
      message,
      error: 'Business Logic Error',
      code,
      details,
    }, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 🔍 Resource Not Found Exception
 * For when requested resources don't exist
 */
export class ResourceNotFoundException extends HttpException {
  constructor(
    resource: string,
    identifier?: string | number,
    details?: any
  ) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super({
      message,
      error: 'Resource Not Found',
      resource,
      identifier,
      details,
    }, HttpStatus.NOT_FOUND);
  }
}

/**
 * ⚠️ Validation Exception
 * For custom validation errors beyond class-validator
 */
export class ValidationException extends HttpException {
  constructor(
    field: string,
    value: any,
    message: string,
    code?: string
  ) {
    super({
      message: `Validation failed for field '${field}': ${message}`,
      error: 'Validation Error',
      field,
      value,
      code,
    }, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 🔒 Permission Exception
 * For authorization and permission errors
 */
export class PermissionException extends HttpException {
  constructor(
    action: string,
    resource?: string,
    details?: any
  ) {
    const message = resource 
      ? `Permission denied for action '${action}' on resource '${resource}'`
      : `Permission denied for action '${action}'`;

    super({
      message,
      error: 'Permission Denied',
      action,
      resource,
      details,
    }, HttpStatus.FORBIDDEN);
  }
}

/**
 * ⏰ Rate Limit Exception
 * For rate limiting violations
 */
export class RateLimitException extends HttpException {
  constructor(
    limit: number,
    windowMs: number,
    retryAfter?: number
  ) {
    super({
      message: `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      error: 'Rate Limit Exceeded',
      limit,
      windowMs,
      retryAfter,
    }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/**
 * 🗄️ Database Exception
 * For database-specific errors
 */
export class DatabaseException extends HttpException {
  constructor(
    operation: string,
    details?: any,
    originalError?: Error
  ) {
    super({
      message: `Database operation failed: ${operation}`,
      error: 'Database Error',
      operation,
      details,
      originalError: originalError?.message,
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * 🔄 Cache Exception
 * For cache-related errors
 */
export class CacheException extends HttpException {
  constructor(
    operation: string,
    key?: string,
    details?: any
  ) {
    super({
      message: `Cache operation failed: ${operation}`,
      error: 'Cache Error',
      operation,
      key,
      details,
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * 🌐 External Service Exception
 * For external API or service failures
 */
export class ExternalServiceException extends HttpException {
  constructor(
    service: string,
    operation: string,
    statusCode?: number,
    details?: any
  ) {
    super({
      message: `External service error: ${service} - ${operation}`,
      error: 'External Service Error',
      service,
      operation,
      externalStatusCode: statusCode,
      details,
    }, HttpStatus.BAD_GATEWAY);
  }
}

/**
 * 📊 Configuration Exception
 * For configuration and environment errors
 */
export class ConfigurationException extends HttpException {
  constructor(
    setting: string,
    message?: string,
    details?: any
  ) {
    super({
      message: `Configuration error: ${setting} - ${message || 'Invalid or missing configuration'}`,
      error: 'Configuration Error',
      setting,
      details,
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

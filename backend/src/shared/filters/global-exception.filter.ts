import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { ValidationError } from 'class-validator';

/**
 * 🛡️ Global Exception Filter
 * Handles all exceptions across the application with consistent error responses
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error for monitoring
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * 🔧 Build structured error response
   */
  private buildErrorResponse(exception: unknown, request: Request) {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    // Base error response structure
    const baseResponse = {
      success: false,
      timestamp,
      path,
      method,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      details: null as any,
      requestId: this.generateRequestId(),
    };

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, baseResponse);
    }

    if (exception instanceof QueryFailedError) {
      return this.handleDatabaseError(exception, baseResponse);
    }

    if (exception instanceof EntityNotFoundError) {
      return this.handleEntityNotFoundError(exception, baseResponse);
    }

    if (this.isValidationError(exception)) {
      return this.handleValidationError(exception as any, baseResponse);
    }

    // Handle unexpected errors
    return this.handleUnexpectedError(exception, baseResponse);
  }

  /**
   * 🌐 Handle HTTP exceptions (NestJS built-in)
   */
  private handleHttpException(exception: HttpException, baseResponse: any) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message: string;
    let details: any = null;

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const responseObj = response as any;
      message = responseObj.message || responseObj.error || exception.message;
      
      // Handle validation errors from class-validator
      if (responseObj.message && Array.isArray(responseObj.message)) {
        details = {
          validationErrors: responseObj.message,
          errorCount: responseObj.message.length,
        };
        message = 'Validation failed';
      }
    } else {
      message = exception.message;
    }

    return {
      ...baseResponse,
      statusCode: status,
      error: this.getHttpErrorName(status),
      message,
      details,
    };
  }

  /**
   * 🗄️ Handle database errors
   */
  private handleDatabaseError(exception: QueryFailedError, baseResponse: any) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database operation failed';
    let details: any = null;

    // PostgreSQL error codes
    const pgErrorCode = (exception as any).code;
    
    switch (pgErrorCode) {
      case '23505': // Unique violation
        statusCode = HttpStatus.CONFLICT;
        message = 'Data already exists';
        details = {
          constraint: (exception as any).constraint,
          detail: (exception as any).detail,
        };
        break;
      
      case '23503': // Foreign key violation
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Referenced data not found';
        details = {
          constraint: (exception as any).constraint,
          detail: (exception as any).detail,
        };
        break;
      
      case '23502': // Not null violation
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Required field is missing';
        details = {
          column: (exception as any).column,
        };
        break;

      case '42P01': // Undefined table
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database schema error';
        break;

      default:
        // Don't expose internal database errors to users
        message = 'Database operation failed';
        details = {
          code: pgErrorCode,
          hint: 'Please check your request and try again',
        };
    }

    return {
      ...baseResponse,
      statusCode,
      error: this.getHttpErrorName(statusCode),
      message,
      details,
    };
  }

  /**
   * 🔍 Handle entity not found errors
   */
  private handleEntityNotFoundError(exception: EntityNotFoundError, baseResponse: any) {
    return {
      ...baseResponse,
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: 'The requested resource was not found',
      details: {
        entity: exception.message,
        suggestion: 'Please verify the ID or parameters',
      },
    };
  }

  /**
   * ✅ Handle validation errors from class-validator
   */
  private handleValidationError(exception: ValidationError[], baseResponse: any) {
    const validationErrors = this.extractValidationErrors(exception);

    return {
      ...baseResponse,
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Validation Error',
      message: 'Input validation failed',
      details: {
        validationErrors,
        errorCount: validationErrors.length,
        tip: 'Please check the request body and query parameters',
      },
    };
  }

  /**
   * ❌ Handle unexpected errors
   */
  private handleUnexpectedError(exception: unknown, baseResponse: any) {
    // In production, don't expose internal error details
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      ...baseResponse,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: isProduction 
        ? 'An unexpected error occurred. Please try again later.'
        : (exception as Error)?.message || 'Unknown error',
      details: isProduction ? null : {
        stack: (exception as Error)?.stack,
        name: (exception as Error)?.name,
      },
    };
  }

  /**
   * 📝 Extract validation errors from class-validator
   */
  private extractValidationErrors(validationErrors: ValidationError[]): any[] {
    const errors: any[] = [];

    validationErrors.forEach((error) => {
      if (error.constraints) {
        Object.values(error.constraints).forEach((constraint) => {
          errors.push({
            field: error.property,
            value: error.value,
            message: constraint,
            code: Object.keys(error.constraints!)[0],
          });
        });
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        errors.push(...this.extractValidationErrors(error.children));
      }
    });

    return errors;
  }

  /**
   * 🔍 Check if error is a validation error
   */
  private isValidationError(exception: unknown): boolean {
    return Array.isArray(exception) && 
           exception.length > 0 && 
           exception[0] instanceof ValidationError;
  }

  /**
   * 📛 Get HTTP error name by status code
   */
  private getHttpErrorName(statusCode: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return errorNames[statusCode] || 'Unknown Error';
  }

  /**
   * 📝 Log error for monitoring and debugging
   */
  private logError(exception: unknown, request: Request, errorResponse: any): void {
    const { statusCode, message, path, method } = errorResponse;
    
    // Create log context
    const logContext = {
      statusCode,
      method,
      path,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      requestId: errorResponse.requestId,
    };

    // Log based on severity
    if (statusCode >= 500) {
      this.logger.error(
        `💥 ${method} ${path} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
        JSON.stringify(logContext),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `⚠️ ${method} ${path} - ${message}`,
        JSON.stringify(logContext),
      );
    } else {
      this.logger.log(
        `ℹ️ ${method} ${path} - ${message}`,
        JSON.stringify(logContext),
      );
    }
  }

  /**
   * 🆔 Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

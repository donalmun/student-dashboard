import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationPipe as NestValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * 🔧 Enhanced Validation Pipe
 * Extends NestJS ValidationPipe with custom error formatting and additional features
 */
@Injectable()
export class EnhancedValidationPipe extends NestValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      // Default options for enhanced validation
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
          message: 'Validation failed',
          error: 'Bad Request',
          statusCode: 400,
          validationErrors: this.formatValidationErrors(errors),
          errorCount: this.countValidationErrors(errors),
          timestamp: new Date().toISOString(),
        });
      },
      ...options,
    });
  }

  /**
   * 📝 Format validation errors into a structured format
   */
  private formatValidationErrors(errors: ValidationError[]): any[] {
    const formattedErrors: any[] = [];

    errors.forEach((error) => {
      const fieldErrors = this.extractFieldErrors(error);
      formattedErrors.push(...fieldErrors);
    });

    return formattedErrors;
  }

  /**
   * 🔍 Extract errors from a single ValidationError
   */
  private extractFieldErrors(error: ValidationError, parentPath = ''): any[] {
    const errors: any[] = [];
    const currentPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    // Handle direct constraints
    if (error.constraints) {
      Object.entries(error.constraints).forEach(([type, message]) => {
        errors.push({
          field: currentPath,
          value: error.value,
          constraint: type,
          message,
          code: this.getValidationErrorCode(type),
          severity: this.getValidationErrorSeverity(type),
        });
      });
    }

    // Handle nested validation errors
    if (error.children && error.children.length > 0) {
      error.children.forEach((childError) => {
        errors.push(...this.extractFieldErrors(childError, currentPath));
      });
    }

    return errors;
  }

  /**
   * 🔢 Count total validation errors
   */
  private countValidationErrors(errors: ValidationError[]): number {
    let count = 0;

    errors.forEach((error) => {
      if (error.constraints) {
        count += Object.keys(error.constraints).length;
      }
      if (error.children) {
        count += this.countValidationErrors(error.children);
      }
    });

    return count;
  }

  /**
   * 🏷️ Get error code based on constraint type
   */
  private getValidationErrorCode(constraintType: string): string {
    const errorCodes: Record<string, string> = {
      isNotEmpty: 'REQUIRED_FIELD',
      isString: 'INVALID_STRING',
      isNumber: 'INVALID_NUMBER',
      isInt: 'INVALID_INTEGER',
      isEmail: 'INVALID_EMAIL',
      isUrl: 'INVALID_URL',
      isDate: 'INVALID_DATE',
      min: 'VALUE_TOO_SMALL',
      max: 'VALUE_TOO_LARGE',
      minLength: 'STRING_TOO_SHORT',
      maxLength: 'STRING_TOO_LONG',
      isEnum: 'INVALID_ENUM_VALUE',
      matches: 'PATTERN_MISMATCH',
      isOptional: 'OPTIONAL_FIELD',
      arrayMinSize: 'ARRAY_TOO_SMALL',
      arrayMaxSize: 'ARRAY_TOO_LARGE',
      isArray: 'INVALID_ARRAY',
      isBoolean: 'INVALID_BOOLEAN',
      isObject: 'INVALID_OBJECT',
    };

    return errorCodes[constraintType] || 'VALIDATION_ERROR';
  }

  /**
   * ⚠️ Get error severity based on constraint type
   */
  private getValidationErrorSeverity(constraintType: string): 'error' | 'warning' | 'info' {
    const criticalConstraints = [
      'isNotEmpty',
      'isString',
      'isNumber',
      'isEmail',
      'isRequired',
    ];

    const warningConstraints = [
      'min',
      'max',
      'minLength',
      'maxLength',
    ];

    if (criticalConstraints.includes(constraintType)) {
      return 'error';
    }

    if (warningConstraints.includes(constraintType)) {
      return 'warning';
    }

    return 'info';
  }
}

/**
 * 🎯 Custom validation pipe for specific use cases
 */
@Injectable()
export class StrictValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToClass(metadata.metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      skipMissingProperties: false,
      validationError: {
        target: false,
        value: false,
      },
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Strict validation failed',
        error: 'Validation Error',
        details: this.buildErrorDetails(errors),
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
  private buildErrorDetails(errors: ValidationError[]) {
    return errors.map((error) => ({
      property: error.property,
      value: error.value,
      constraints: error.constraints,
      children: error.children && error.children.length > 0 ? this.buildErrorDetails(error.children) : undefined,
    }));
  }
}

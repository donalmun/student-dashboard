import { 
  registerDecorator, 
  ValidationOptions, 
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface 
} from 'class-validator';

/**
 * 🔍 Custom validation decorators for specific business rules
 */

/**
 * ✅ Validates that SBD (Student Registration Number) follows correct format
 */
@ValidatorConstraint({ name: 'isValidSBD', async: false })
export class IsValidSBDConstraint implements ValidatorConstraintInterface {
  validate(sbd: string, args: ValidationArguments) {
    if (!sbd) return true; // Allow optional fields
    
    // SBD format: 8 digits, first 2 digits represent location code (01-64)
    const sbdRegex = /^[0-6][0-9][0-9]{6}$/;
    if (!sbdRegex.test(sbd)) return false;
    
    const locationCode = parseInt(sbd.substring(0, 2));
    return locationCode >= 1 && locationCode <= 64;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} phải là số báo danh hợp lệ (8 chữ số, mã tỉnh từ 01-64)`;
  }
}

export function IsValidSBD(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSBDConstraint,
    });
  };
}

/**
 * 📊 Validates score range (0-10 with 2 decimal places max)
 */
@ValidatorConstraint({ name: 'isValidScore', async: false })
export class IsValidScoreConstraint implements ValidatorConstraintInterface {
  validate(score: number, args: ValidationArguments) {
    if (score === null || score === undefined) return true; // Allow optional fields
    
    // Check if score is between 0 and 10
    if (score < 0 || score > 10) return false;
    
    // Check decimal places (max 2)
    const decimalPlaces = (score.toString().split('.')[1] || '').length;
    return decimalPlaces <= 2;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} phải là điểm số hợp lệ (0-10, tối đa 2 chữ số thập phân)`;
  }
}

export function IsValidScore(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidScoreConstraint,
    });
  };
}

/**
 * 📚 Validates subject names against allowed list
 */
@ValidatorConstraint({ name: 'isValidSubject', async: false })
export class IsValidSubjectConstraint implements ValidatorConstraintInterface {
  private readonly allowedSubjects = [
    'Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học',
    'Lịch sử', 'Địa lý', 'GDCD', 'Tiếng Pháp', 'Tiếng Đức', 'Tiếng Nhật',
    'Tiếng Nga', 'Tiếng Trung', 'Tiếng Hàn'
  ];

  validate(subject: string, args: ValidationArguments) {
    if (!subject) return true; // Allow optional fields
    return this.allowedSubjects.includes(subject);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} phải là tên môn học hợp lệ`;
  }
}

export function IsValidSubject(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSubjectConstraint,
    });
  };
}

/**
 * 🌐 Validates foreign language proficiency codes
 */
@ValidatorConstraint({ name: 'isValidForeignLanguageCode', async: false })
export class IsValidForeignLanguageCodeConstraint implements ValidatorConstraintInterface {
  validate(code: string, args: ValidationArguments) {
    if (!code) return true; // Allow optional fields
    
    // Pattern: Letter + Number (N1-N6, F1-F6, D1-D6, J1-J6, R1-R6, C1-C6, K1-K6)
    const pattern = /^[NFDJRCK][1-6]$/;
    return pattern.test(code);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} phải là mã trình độ ngoại ngữ hợp lệ (VD: N1, F2, D3, J4, R5, C6, K1)`;
  }
}

export function IsValidForeignLanguageCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidForeignLanguageCodeConstraint,
    });
  };
}

/**
 * 📅 Validates that date is not in the future
 */
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: Date, args: ValidationArguments) {
    if (!date) return true; // Allow optional fields
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return new Date(date) <= today;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} không được là ngày trong tương lai`;
  }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureDateConstraint,
    });
  };
}

/**
 * 📄 Validates pagination limit (1-100)
 */
@ValidatorConstraint({ name: 'isValidPaginationLimit', async: false })
export class IsValidPaginationLimitConstraint implements ValidatorConstraintInterface {
  validate(limit: number, args: ValidationArguments) {
    if (limit === null || limit === undefined) return true; // Allow optional fields
    
    return Number.isInteger(limit) && limit >= 1 && limit <= 100;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} phải là số nguyên từ 1 đến 100`;
  }
}

export function IsValidPaginationLimit(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPaginationLimitConstraint,
    });
  };
}

/**
 * 📊 Cross-field validation for score ranges (minScore <= maxScore)
 */
@ValidatorConstraint({ name: 'isValidScoreRange', async: false })
export class IsValidScoreRangeConstraint implements ValidatorConstraintInterface {
  validate(maxScore: number, args: ValidationArguments) {
    const minScore = (args.object as any).minScore;
    
    // Skip validation if either value is missing
    if (minScore === null || minScore === undefined || maxScore === null || maxScore === undefined) {
      return true;
    }
    
    return minScore <= maxScore;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Điểm tối đa phải lớn hơn hoặc bằng điểm tối thiểu';
  }
}

export function IsValidScoreRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidScoreRangeConstraint,
    });
  };
}
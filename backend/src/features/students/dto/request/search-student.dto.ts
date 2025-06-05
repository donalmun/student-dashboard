import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  Min, 
  Max, 
  Length,
  Matches,
  IsIn,
  ValidateIf,
  IsPositive,
  IsInt
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { 
  IsValidSBD, 
  IsValidForeignLanguageCode, 
  IsValidScore,
  IsValidScoreRange,
  IsValidPaginationLimit
} from '../../../../shared/decorators/validation.decorators';

export class SearchStudentDto {
  @ApiPropertyOptional({ 
    example: '01001001',
    description: 'Số báo danh (8 chữ số)',
    minLength: 8,
    maxLength: 8,
    pattern: '^[0-9]{8}$'
  })
  @IsString({ message: 'SBD phải là chuỗi ký tự' })
  @IsOptional()
  @Length(8, 8, { message: 'SBD phải có đúng 8 chữ số' })
  @Matches(/^[0-9]{8}$/, { message: 'SBD chỉ được chứa 8 chữ số' })
  @Transform(({ value }) => value?.toString().trim())
  sbd?: string;

  @ApiPropertyOptional({ 
    example: 'N1',
    description: 'Mã ngoại ngữ',
    enum: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6']
  })
  @IsString({ message: 'Mã ngoại ngữ phải là chuỗi ký tự' })
  @IsOptional()
  @IsIn(['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'], { 
    message: 'Mã ngoại ngữ không hợp lệ' 
  })
  @Transform(({ value }) => value?.toString().trim().toUpperCase())
  ma_ngoai_ngu?: string;

  @ApiPropertyOptional({ 
    example: 5.0,
    description: 'Điểm tối thiểu (0-10)',
    minimum: 0,
    maximum: 10
  })
  @IsNumber({}, { message: 'Điểm tối thiểu phải là số' })
  @IsOptional()
  @Min(0, { message: 'Điểm tối thiểu không được nhỏ hơn 0' })
  @Max(10, { message: 'Điểm tối thiểu không được lớn hơn 10' })
  @Type(() => Number)
  @ValidateIf((o) => o.maxScore === undefined || o.minScore <= o.maxScore, {
    message: 'Điểm tối thiểu không được lớn hơn điểm tối đa'
  })
  minScore?: number;

  @ApiPropertyOptional({ 
    example: 10.0,
    description: 'Điểm tối đa (0-10)',
    minimum: 0,
    maximum: 10
  })
  @IsNumber({}, { message: 'Điểm tối đa phải là số' })
  @IsOptional()
  @Min(0, { message: 'Điểm tối đa không được nhỏ hơn 0' })
  @Max(10, { message: 'Điểm tối đa không được lớn hơn 10' })
  @Type(() => Number)
  @ValidateIf((o) => o.minScore === undefined || o.maxScore >= o.minScore, {
    message: 'Điểm tối đa không được nhỏ hơn điểm tối thiểu'
  })
  maxScore?: number;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Số trang (từ 1)',
    minimum: 1,
    maximum: 1000
  })
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @IsOptional()
  @IsPositive({ message: 'Số trang phải là số dương' })
  @Min(1, { message: 'Số trang phải từ 1 trở lên' })
  @Max(1000, { message: 'Số trang không được vượt quá 1000' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ 
    example: 10,
    description: 'Số lượng kết quả mỗi trang (1-100)',
    minimum: 1,
    maximum: 100
  })
  @IsInt({ message: 'Số lượng kết quả phải là số nguyên' })
  @IsOptional()
  @IsPositive({ message: 'Số lượng kết quả phải là số dương' })
  @Min(1, { message: 'Số lượng kết quả phải ít nhất là 1' })
  @Max(100, { message: 'Số lượng kết quả không được vượt quá 100' })
  @Type(() => Number)
  limit?: number = 10;
}

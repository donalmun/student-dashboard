import {
  IsOptional,
  IsArray,
  IsString,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum ScoreLevelFilter {
  EXCELLENT = 'excellent', // >= 8
  GOOD = 'good', // 6-7.99
  AVERAGE = 'average', // 4-5.99
  POOR = 'poor', // < 4
}

export enum AggregationType {
  COUNT = 'count',
  PERCENTAGE = 'percentage',
  BOTH = 'both',
}

export enum SortBy {
  SUBJECT_NAME = 'subject_name',
  TOTAL_STUDENTS = 'total_students',
  EXCELLENT_COUNT = 'excellent_count',
  AVERAGE_SCORE = 'average_score',
}

export class AdvancedReportFilterDto {
  @ApiPropertyOptional({
    example: ['toan', 'ngu_van'],
    description: 'Danh sách môn học cần thống kê (để trống = tất cả môn)',
  })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined,
  )
  subjects?: string[];

  @ApiPropertyOptional({
    example: ['N1', 'N2'],
    description: 'Lọc theo mã ngoại ngữ',
  })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined,
  )
  foreignLanguageCodes?: string[];

  @ApiPropertyOptional({
    example: 5.0,
    description: 'Điểm tối thiểu để filter',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  minScore?: number;

  @ApiPropertyOptional({
    example: 10.0,
    description: 'Điểm tối đa để filter',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  maxScore?: number;

  @ApiPropertyOptional({
    enum: ScoreLevelFilter,
    isArray: true,
    example: ['excellent', 'good'],
    description: 'Lọc theo levels điểm cụ thể',
  })
  @IsArray()
  @IsOptional()
  @IsEnum(ScoreLevelFilter, { each: true })
  scoreLevels?: ScoreLevelFilter[];

  @ApiPropertyOptional({
    enum: AggregationType,
    example: 'both',
    description: 'Kiểu aggregation: count, percentage, hoặc both',
  })
  @IsEnum(AggregationType)
  @IsOptional()
  aggregationType?: AggregationType = AggregationType.BOTH;

  @ApiPropertyOptional({
    enum: SortBy,
    example: 'excellent_count',
    description: 'Sắp xếp theo field nào',
  })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy = SortBy.SUBJECT_NAME;

  @ApiPropertyOptional({
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    description: 'Thứ tự sắp xếp',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({
    example: 50,
    description: 'Chỉ lấy môn có ít nhất X học sinh',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  minStudentCount?: number;

  @ApiPropertyOptional({
    example: 'chart',
    enum: ['table', 'chart', 'export'],
    description: 'Format output',
  })
  @IsString()
  @IsOptional()
  format?: string = 'table';

  @ApiPropertyOptional({
    example: true,
    description: 'Bao gồm comparison với toàn bộ dữ liệu',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeComparison?: boolean = false;

  @ApiPropertyOptional({
    example: true,
    description: 'Bao gồm statistical analysis (median, mode, std dev)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeStatistics?: boolean = false;
}

// ✅ Keep old DTO for backward compatibility
export class ReportFilterDto {
  @ApiPropertyOptional({
    example: ['toan', 'ngu_van'],
    description: 'Danh sách môn học cần thống kê',
  })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  subjects?: string[];

  @ApiPropertyOptional({
    example: 'chart',
    description: 'Format output: table | chart',
    enum: ['table', 'chart'],
  })
  @IsString()
  @IsOptional()
  format?: string = 'table';
}

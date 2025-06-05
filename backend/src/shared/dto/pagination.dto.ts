// filepath: src/shared/dto/pagination.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 📄 Pagination Query DTO
 * For handling page-based pagination parameters
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    maximum: 1000,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
  // Computed properties for database queries
  get skip(): number {
    return ((this.page || 1) - 1) * (this.limit || 20);
  }

  get take(): number {
    return this.limit || 20;
  }
}

/**
 * 📄 Paginated Response DTO
 * Generic response wrapper for paginated data
 */
export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({
    description: 'Array of data items',
    isArray: true,
  })
  data: T[];

  @ApiPropertyOptional({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      currentPage: { type: 'number', example: 1 },
      itemsPerPage: { type: 'number', example: 20 },
      totalItems: { type: 'number', example: 150 },
      totalPages: { type: 'number', example: 8 },
      hasNextPage: { type: 'boolean', example: true },
      hasPreviousPage: { type: 'boolean', example: false },
    },
  })
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  constructor(data: T[], totalItems: number, page: number, limit: number) {
    this.data = data;

    const totalPages = Math.ceil(totalItems / limit);

    this.pagination = {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

/**
 * 🔧 Pagination Helper Utility
 */
export class PaginationHelper {
  /**
   * Create paginated response from data and count
   */
  static createResponse<T>(
    data: T[],
    totalItems: number,
    pagination: PaginationQueryDto,
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(
      data,
      totalItems,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  /**
   * Get TypeORM skip/take options from pagination DTO
   */
  static getTypeOrmOptions(pagination: PaginationQueryDto) {
    return {
      skip: pagination.skip,
      take: pagination.take,
    };
  }
}

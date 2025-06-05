/**
 * Interface chuẩn cho tất cả API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: ResponseMeta;
}

/**
 * Interface cho metadata trong response
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

/**
 * Interface cho pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Interface cho paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Interface cho search options của students
 */
export interface StudentSearchOptions extends PaginationOptions {
  sbd?: string;
  ma_ngoai_ngu?: string;
  minScore?: number;
  maxScore?: number;
  subjects?: string[];
}

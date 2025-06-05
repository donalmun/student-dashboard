/**
 * Base entity interface
 */
export interface BaseEntity {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Sort direction type
 */
export type SortDirection = 'ASC' | 'DESC';

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'test';

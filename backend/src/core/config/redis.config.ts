// Redis Cache Configuration
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
} as const;

export const CACHE_KEYS = {
  SUBJECT_STATISTICS: 'analytics:subjects',
  DASHBOARD_OVERVIEW: 'analytics:dashboard',
  STUDENT_SEARCH: 'students:search',
  KHOI_A_TOP10: 'analytics:khoiA:top10',
} as const;

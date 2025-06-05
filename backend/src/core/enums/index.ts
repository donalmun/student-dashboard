/**
 * HTTP Status Codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Cache Keys
 */
export enum CacheKey {
  STUDENTS_LIST = 'students:list',
  STUDENT_BY_SBD = 'student:sbd',
  TOP10_KHOI_A = 'top10:khoi-a',
  STATISTICS_OVERVIEW = 'statistics:overview',
}

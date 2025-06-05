/**
 * Danh sách tên các môn học trong hệ thống
 */
export const SUBJECT_NAMES = [
  'toan',
  'ngu_van',
  'ngoai_ngu',
  'vat_li',
  'hoa_hoc',
  'sinh_hoc',
  'lich_su',
  'dia_li',
  'gdcd',
] as const;

/**
 * Mapping từ tên môn học sang tên hiển thị
 */
export const SUBJECT_DISPLAY_NAMES = {
  toan: 'Toán',
  ngu_van: 'Ngữ văn',
  ngoai_ngu: 'Ngoại ngữ',
  vat_li: 'Vật lý',
  hoa_hoc: 'Hóa học',
  sinh_hoc: 'Sinh học',
  lich_su: 'Lịch sử',
  dia_li: 'Địa lý',
  gdcd: 'Giáo dục công dân',
} as const;

/**
 * ✅ Phân loại điểm số theo yêu cầu: 4 levels
 * Level 1: >= 8 điểm (Giỏi)
 * Level 2: >= 6 && < 8 điểm (Khá)
 * Level 3: >= 4 && < 6 điểm (Trung bình)
 * Level 4: < 4 điểm (Yếu)
 */
export const SCORE_RANGES = {
  EXCELLENT: {
    min: 8,
    max: 10,
    label: 'Giỏi (≥ 8 điểm)',
    shortLabel: 'Giỏi',
    color: '#52c41a',
    level: 1,
  },
  GOOD: {
    min: 6,
    max: 7.99,
    label: 'Khá (6 ≤ điểm < 8)',
    shortLabel: 'Khá',
    color: '#1890ff',
    level: 2,
  },
  AVERAGE: {
    min: 4,
    max: 5.99,
    label: 'Trung bình (4 ≤ điểm < 6)',
    shortLabel: 'Trung bình',
    color: '#faad14',
    level: 3,
  },
  POOR: {
    min: 0,
    max: 3.99,
    label: 'Yếu (< 4 điểm)',
    shortLabel: 'Yếu',
    color: '#f5222d',
    level: 4,
  },
} as const;

/**
 * ✅ Array để dễ dàng iterate qua các levels theo thứ tự
 */
export const SCORE_LEVELS_ORDER = [
  'EXCELLENT',
  'GOOD',
  'AVERAGE',
  'POOR',
] as const;

/**
 * ✅ Helper để get level name theo điểm số
 */
export const getScoreLevelByScore = (
  score: number,
): keyof typeof SCORE_RANGES => {
  if (score >= 8) return 'EXCELLENT';
  if (score >= 6) return 'GOOD';
  if (score >= 4) return 'AVERAGE';
  return 'POOR';
};

/**
 * Các tổ hợp khối thi THPT
 */
export const KHOI_COMBINATIONS = {
  A: ['toan', 'vat_li', 'hoa_hoc'],
  A1: ['toan', 'vat_li', 'ngoai_ngu'],
  B: ['toan', 'hoa_hoc', 'sinh_hoc'],
  C: ['ngu_van', 'lich_su', 'dia_li'],
  D: ['toan', 'ngu_van', 'ngoai_ngu'],
} as const;

/**
 * Các mã ngoại ngữ
 */
export const FOREIGN_LANGUAGE_CODES = {
  N1: 'Tiếng Anh',
  N2: 'Tiếng Nga',
  N3: 'Tiếng Pháp',
  N4: 'Tiếng Trung',
  N5: 'Tiếng Đức',
  N6: 'Tiếng Nhật',
} as const;

/**
 * Constants cho pagination
 */
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

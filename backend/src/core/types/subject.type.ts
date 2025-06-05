import {
  SUBJECT_NAMES,
  KHOI_COMBINATIONS,
  FOREIGN_LANGUAGE_CODES,
  SCORE_RANGES,
} from '../constants/subjects.constant';

/**
 * Type cho tên môn học
 */
export type SubjectName = (typeof SUBJECT_NAMES)[number];

/**
 * ✅ Type cho mức độ điểm số (4 levels)
 */
export type ScoreLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

/**
 * Type cho các khối thi
 */
export type KhoiCombination = keyof typeof KHOI_COMBINATIONS;

/**
 * Type cho mã ngoại ngữ
 */
export type ForeignLanguageCode = keyof typeof FOREIGN_LANGUAGE_CODES;

/**
 * ✅ Interface cho thống kê điểm theo level của từng môn
 */
export interface SubjectScoreStatistics {
  subject: SubjectName;
  subjectDisplayName: string;
  statistics: {
    excellent: number; // >= 8 điểm
    good: number; // 6 <= điểm < 8
    average: number; // 4 <= điểm < 6
    poor: number; // < 4 điểm
    total: number; // Tổng số học sinh có điểm môn này
  };
}

/**
 * ✅ Interface cho báo cáo tổng quan các môn
 */
export interface SubjectReportData {
  subjects: SubjectScoreStatistics[];
  summary: {
    totalStudents: number;
    totalScores: number;
    averageScore: number;
    reportGeneratedAt: string;
  };
}

/**
 * ✅ Interface cho chart data
 */
export interface ScoreChartData {
  subject: string;
  subjectDisplayName: string;
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

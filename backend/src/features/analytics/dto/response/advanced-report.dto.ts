import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StatisticalAnalysisDto {
  @ApiProperty({ example: 6.75, description: 'Điểm trung bình' })
  mean: number;

  @ApiProperty({ example: 7.0, description: 'Điểm trung vị' })
  median: number;

  @ApiProperty({ example: 8.0, description: 'Điểm phổ biến nhất' })
  mode: number;

  @ApiProperty({ example: 1.85, description: 'Độ lệch chuẩn' })
  standardDeviation: number;

  @ApiProperty({ example: 3.42, description: 'Phương sai' })
  variance: number;

  @ApiProperty({ example: 10.0, description: 'Điểm cao nhất' })
  max: number;

  @ApiProperty({ example: 0.5, description: 'Điểm thấp nhất' })
  min: number;
}

export class ComparisonDataDto {
  @ApiProperty({
    description: 'So sánh với dữ liệu tổng thể',
    example: {
      subjectAverage: 6.75,
      overallAverage: 6.5,
      difference: 0.25,
      percentageDifference: 3.85,
    },
  })
  overallComparison: {
    subjectAverage: number;
    overallAverage: number;
    difference: number;
    percentageDifference: number;
  };

  @ApiProperty({
    description: 'Xếp hạng so với các môn khác',
    example: { position: 3, totalSubjects: 11, percentile: 73 },
  })
  ranking: {
    position: number;
    totalSubjects: number;
    percentile: number;
  };
}

export class EnhancedSubjectLevelStatDto {
  @ApiProperty({ example: 150, description: 'Số học sinh giỏi (>= 8 điểm)' })
  excellent: number;

  @ApiProperty({ example: 200, description: 'Số học sinh khá (6-7.99 điểm)' })
  good: number;

  @ApiProperty({
    example: 100,
    description: 'Số học sinh trung bình (4-5.99 điểm)',
  })
  average: number;

  @ApiProperty({ example: 50, description: 'Số học sinh yếu (< 4 điểm)' })
  poor: number;

  @ApiProperty({ example: 500, description: 'Tổng số học sinh' })
  total: number;

  @ApiPropertyOptional({
    description: 'Phần trăm theo từng mức',
    example: { excellent: 30.0, good: 40.0, average: 20.0, poor: 10.0 },
  })
  percentages?: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

export class EnhancedSubjectReportDto {
  @ApiProperty({ example: 'toan', description: 'Mã môn học' })
  subject: string;

  @ApiProperty({ example: 'Toán', description: 'Tên hiển thị môn học' })
  subjectDisplayName: string;

  @ApiProperty({ description: 'Thống kê 4 mức điểm' })
  statistics: EnhancedSubjectLevelStatDto;

  @ApiProperty({ example: 6.75, description: 'Điểm trung bình môn học' })
  averageScore: number;

  @ApiPropertyOptional({ description: 'Phân tích thống kê nâng cao' })
  statisticalAnalysis?: StatisticalAnalysisDto;

  @ApiPropertyOptional({ description: 'So sánh với dữ liệu tổng thể' })
  comparison?: ComparisonDataDto;

  @ApiPropertyOptional({
    description: 'Top học sinh giỏi nhất',
    example: ['22001001', '22001002', '22001003'],
  })
  topPerformers?: string[];
}

export class AdvancedSummaryDto {
  @ApiProperty({
    example: 10000,
    description: 'Tổng số học sinh trong hệ thống',
  })
  totalStudents: number;

  @ApiProperty({ example: 110000, description: 'Tổng số bài thi' })
  totalScores: number;

  @ApiProperty({ example: 6.45, description: 'Điểm trung bình chung' })
  averageScore: number;

  @ApiProperty({ example: 8500, description: 'Số học sinh sau khi filter' })
  filteredStudents: number;

  @ApiProperty({
    description: 'Danh sách filters đã áp dụng',
    example: ['subjects: toan, vat_li', 'minScore: 5'],
  })
  appliedFilters: string[];

  @ApiProperty({
    example: '2024-12-03T14:30:00.000Z',
    description: 'Thời gian tạo báo cáo',
  })
  reportGeneratedAt: string;

  @ApiProperty({ example: 1245, description: 'Thời gian xử lý (milliseconds)' })
  processingTimeMs: number;
}

// ✅ FIXED: Enhanced Metadata with missing properties
export class AdvancedMetadataDto {
  @ApiProperty({
    example: false,
    description: 'Dữ liệu được lấy từ cache hay không',
  })
  cacheUsed: boolean;

  @ApiProperty({ example: true, description: 'Query đã được tối ưu hóa' })
  queryOptimized: boolean;

  @ApiProperty({ example: 'postgresql', description: 'Nguồn dữ liệu' })
  dataSource: string;

  @ApiPropertyOptional({
    example: 1245,
    description: 'Thời gian xử lý request (ms)',
  })
  processingTimeMs?: number; // ✅ Add this property

  @ApiPropertyOptional({ example: 'v2-advanced', description: 'Phiên bản API' })
  version?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Số lượng filters được áp dụng',
  })
  filtersApplied?: number;

  @ApiPropertyOptional({ example: true, description: 'Cache hit/miss status' })
  cacheHit?: boolean;

  @ApiPropertyOptional({ example: 'redis', description: 'Cache store type' })
  cacheStore?: string;

  @ApiPropertyOptional({ example: 300, description: 'Cache TTL (seconds)' })
  cacheTtl?: number;
}

export class AdvancedReportResponseDto {
  @ApiProperty({
    description: 'Danh sách thống kê các môn học',
    type: [EnhancedSubjectReportDto],
  })
  subjects: EnhancedSubjectReportDto[];

  @ApiProperty({ description: 'Tóm tắt báo cáo' })
  summary: AdvancedSummaryDto;

  @ApiProperty({ description: 'Dữ liệu cho biểu đồ' })
  chartData: any[];

  @ApiPropertyOptional({ description: 'Thống kê tổng thể nếu được yêu cầu' })
  overallStatistics?: StatisticalAnalysisDto;

  @ApiProperty({ description: 'Metadata về quá trình xử lý' })
  metadata: AdvancedMetadataDto; // ✅ Use enhanced metadata
}

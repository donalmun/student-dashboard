import {
  Controller,
  Get,
  Query,
  Param,
  ValidationPipe,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import {
  ReportFilterDto, // ✅ Old DTO for backward compatibility
  AdvancedReportFilterDto, // ✅ New advanced DTO
} from '../dto/request/report-filter.dto';
import {
  SubjectReportResponseDto, // ✅ Old response DTO
} from '../dto/response/subject-report.dto';
import {
  AdvancedReportResponseDto, // ✅ New response DTO
} from '../dto/response/advanced-report.dto';
import {
  QueryPerformanceService,
  OptimizationRecommendations,
} from '../../../core/services/query-performance.service';
import {
  PaginationQueryDto,
  PaginatedResponseDto,
} from '../../../shared/dto/pagination.dto';

@ApiTags('Analytics - Phân tích và báo cáo')
@Controller('api/analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly queryPerformanceService: QueryPerformanceService, // ✅ Add this
  ) {}

  /**
   * 🆕 NEW: Advanced Subject Statistics với Enhanced Filtering
   */
  @Get('reports/subjects/advanced')
  @ApiOperation({
    summary:
      '🚀 Advanced - Thống kê số học sinh theo 4 mức điểm với filters nâng cao',
    description: `
    **PHIÊN BẢN NÂNG CAO** của thống kê với nhiều tùy chọn filter:
    
    🎯 **4 Mức điểm:**
    - Level 1: >= 8 điểm (Giỏi)
    - Level 2: 6-7.99 điểm (Khá) 
    - Level 3: 4-5.99 điểm (Trung bình)
    - Level 4: < 4 điểm (Yếu)
    
    🔍 **Advanced Filters:**
    - Filter theo môn học cụ thể
    - Filter theo mã ngoại ngữ (N1, N2, etc.)
    - Filter theo khoảng điểm (minScore, maxScore)
    - Filter theo levels điểm cụ thể
    - Minimum số lượng học sinh
    
    📊 **Enhanced Analytics:**
    - Statistical analysis (mean, median, mode, std dev)
    - Comparison với overall data
    - Ranking giữa các môn
    - Top performers identification
    
    📈 **Sorting & Format:**
    - Sort theo subject name, student count, excellent count, average score
    - Output format: table, chart, export
    - Aggregation: count, percentage, both
    `,
  })
  @ApiQuery({
    name: 'subjects',
    required: false,
    description: 'Môn học (comma-separated)',
    example: 'toan,ngu_van',
  })
  @ApiQuery({
    name: 'foreignLanguageCodes',
    required: false,
    description: 'Mã ngoại ngữ (comma-separated)',
    example: 'N1,N2',
  })
  @ApiQuery({
    name: 'minScore',
    required: false,
    description: 'Điểm tối thiểu',
    example: 5.0,
  })
  @ApiQuery({
    name: 'maxScore',
    required: false,
    description: 'Điểm tối đa',
    example: 10.0,
  })
  @ApiQuery({
    name: 'scoreLevels',
    required: false,
    description: 'Score levels filter',
    example: 'excellent,good',
  })
  @ApiQuery({
    name: 'aggregationType',
    required: false,
    enum: ['count', 'percentage', 'both'],
    example: 'both',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'subject_name',
      'total_students',
      'excellent_count',
      'average_score',
    ],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiQuery({
    name: 'minStudentCount',
    required: false,
    description: 'Số học sinh tối thiểu',
    example: 50,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['table', 'chart', 'export'],
    example: 'chart',
  })
  @ApiQuery({
    name: 'includeComparison',
    required: false,
    description: 'Bao gồm so sánh',
    example: true,
  })
  @ApiQuery({
    name: 'includeStatistics',
    required: false,
    description: 'Bao gồm thống kê nâng cao',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê nâng cao thành công',
    type: AdvancedReportResponseDto,
  })
  async getAdvancedSubjectStatistics(
    @Query(ValidationPipe) filterDto: AdvancedReportFilterDto,
  ) {
    const data =
      await this.analyticsService.getAdvancedSubjectStatistics(filterDto);

    return {
      success: true,
      message: `Lấy thống kê nâng cao thành công - ${data.subjects.length} môn học, ${data.summary.filteredStudents} học sinh`,
      data,
      metadata: {
        version: 'v2-advanced',
        filters_applied: data.summary.appliedFilters.length,
        processing_time_ms: data.summary.processingTimeMs,
        cache_used: data.metadata?.cacheUsed || false,
      },
    };
  }

  /**
   * ✅ EXISTING: Basic Subject Statistics (Backward Compatibility)
   */
  @Get('reports/subjects')
  @ApiOperation({
    summary: '📊 Basic - Thống kê số học sinh theo 4 mức điểm của từng môn',
    description: `
    **PHIÊN BẢN CƠ BẢN** - Tương thích ngược với API cũ.
    
    Trả về thống kê chi tiết số lượng học sinh theo 4 mức điểm cho tất cả hoặc một số môn học.
    
    🔗 **Nâng cấp:** Sử dụng /reports/subjects/advanced để có thêm nhiều tùy chọn filter.
    `,
  })
  @ApiQuery({
    name: 'subjects',
    required: false,
    description: 'Danh sách môn học (để trống = tất cả môn)',
    example: 'toan,ngu_van',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Format output',
    enum: ['table', 'chart'],
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê cơ bản thành công',
    type: SubjectReportResponseDto,
  })
  async getSubjectStatistics(
    @Query(ValidationPipe) filterDto: ReportFilterDto,
  ) {
    const data = await this.analyticsService.getSubjectStatistics(filterDto);

    return {
      success: true,
      message: 'Lấy thống kê theo môn học thành công',
      data,
      metadata: {
        version: 'v1-basic',
        upgrade_available: '/api/analytics/reports/subjects/advanced',
        total_subjects: data.subjects.length,
      },
    };
  }

  /**
   * 🏆 Enhanced Top Performers by Subject
   */
  @Get('reports/subjects/:subject/top-performers')
  @ApiOperation({
    summary: '🏆 Top học sinh giỏi nhất theo môn',
    description:
      'Lấy danh sách học sinh có điểm cao nhất của một môn học cụ thể với thông tin chi tiết',
  })
  @ApiParam({
    name: 'subject',
    example: 'toan',
    description: 'Tên môn học (toan, ngu_van, anh_van, etc.)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Số lượng top học sinh (max: 100)',
  })
  async getTopPerformersBySubject(
    @Param('subject') subject: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    // Validate limit
    const validLimit = Math.min(Math.max(limit, 1), 100);

    const data = await this.analyticsService.getTopPerformersBySubject(
      subject,
      validLimit,
    );

    return {
      success: true,
      message: `Lấy top ${validLimit} học sinh giỏi môn ${subject} thành công`,
      data,
      metadata: {
        subject,
        requested_limit: limit,
        actual_limit: validLimit,
        result_count: data.length,
      },
    };
  }

  /**
   * 📊 Subject Comparison Analysis
   */
  @Get('reports/subjects/comparison')
  @ApiOperation({
    summary: '📊 So sánh hiệu suất giữa các môn học',
    description:
      'Phân tích và so sánh điểm trung bình, phân bố điểm giữa các môn học',
  })
  @ApiQuery({
    name: 'subjects',
    required: false,
    description: 'Môn học để so sánh (để trống = tất cả)',
    example: 'toan,vat_li,hoa_hoc',
  })
  @ApiQuery({
    name: 'includeStatistics',
    required: false,
    description: 'Bao gồm statistical analysis',
    example: true,
  })
  async getSubjectComparison(
    @Query('subjects') subjects?: string,
    @Query('includeStatistics') includeStatistics: boolean = true,
  ) {
    const subjectList = subjects ? subjects.split(',') : undefined;

    const filterDto: AdvancedReportFilterDto = {
      subjects: subjectList,
      includeStatistics,
      includeComparison: true,
      aggregationType: 'both' as any,
      sortBy: 'average_score' as any,
      sortOrder: 'DESC',
    };

    const data =
      await this.analyticsService.getAdvancedSubjectStatistics(filterDto);

    // Extract comparison data
    const comparisons = data.subjects.map((subject) => ({
      subject: subject.subject,
      subjectDisplayName: subject.subjectDisplayName,
      averageScore: subject.averageScore,
      statistics: subject.statistics,
      ranking: subject.comparison?.ranking,
      statisticalAnalysis: subject.statisticalAnalysis,
    }));

    return {
      success: true,
      message: `So sánh ${data.subjects.length} môn học thành công`,
      data: {
        comparisons,
        overallStatistics: data.overallStatistics,
        summary: data.summary,
      },
      metadata: {
        subjects_compared: data.subjects.length,
        with_statistics: includeStatistics,
        processing_time_ms: data.summary.processingTimeMs,
      },
    };
  }

  /**
   * 📈 Dashboard Overview với Performance Metrics
   */
  @Get('dashboard/overview')
  @ApiOperation({
    summary: '📈 Tổng quan dashboard với metrics chi tiết',
    description:
      'Dữ liệu tổng quan cho dashboard admin với performance insights',
  })
  @ApiQuery({
    name: 'includeDetails',
    required: false,
    description: 'Bao gồm chi tiết thống kê',
    example: true,
  })
  async getDashboardOverview(
    @Query('includeDetails') includeDetails: boolean = false,
  ) {
    const startTime = Date.now();
    const data = await this.analyticsService.getDashboardOverview();

    let additionalData = {};
    if (includeDetails) {
      // Get quick stats for top subjects
      const quickStats =
        await this.analyticsService.getAdvancedSubjectStatistics({
          aggregationType: 'both' as any,
          sortBy: 'average_score' as any,
          sortOrder: 'DESC',
          includeStatistics: false,
        });

      additionalData = {
        topSubjects: quickStats.subjects.slice(0, 5),
        performanceDistribution: quickStats.overallStatistics,
      };
    }

    return {
      success: true,
      message: 'Lấy dữ liệu dashboard thành công',
      data: {
        ...data,
        ...additionalData,
      },
      metadata: {
        with_details: includeDetails,
        processing_time_ms: Date.now() - startTime,
        data_freshness: 'real-time',
        cache_enabled: false, // Will be true after implementing caching
      },
    };
  }

  /**
   * 🔍 Quick Search & Filter Validation
   */
  @Get('reports/filters/validate')
  @ApiOperation({
    summary: '🔍 Validate filters và preview kết quả',
    description:
      'Kiểm tra tính hợp lệ của filters và xem preview số lượng kết quả',
  })
  async validateFilters(
    @Query(ValidationPipe) filterDto: AdvancedReportFilterDto,
  ) {
    const startTime = Date.now();

    // Get quick count without full processing
    const previewData =
      await this.analyticsService.getAdvancedSubjectStatistics({
        ...filterDto,
        includeStatistics: false,
        includeComparison: false,
      });

    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      estimatedResults: previewData.subjects.length,
      estimatedStudents: previewData.summary.filteredStudents,
      appliedFilters: previewData.summary.appliedFilters,
    };

    // Add warnings
    if (previewData.summary.filteredStudents === 0) {
      validation.warnings.push('Không có dữ liệu phù hợp với filters');
    }

    if (previewData.subjects.length === 0) {
      validation.warnings.push('Không có môn học nào phù hợp với filters');
    }

    return {
      success: true,
      message: 'Validation hoàn thành',
      data: validation,
      metadata: {
        processing_time_ms: Date.now() - startTime,
        quick_preview: true,
      },
    };
  }

  /**
   * 📊 Performance Monitoring & Database Stats
   */
  @Get('performance/benchmark')
  async getPerformanceBenchmark() {
    this.logger.log('🚀 Running performance benchmark...');
    const startTime = Date.now();

    try {
      const results =
        await this.queryPerformanceService.runPerformanceBenchmark();
      const totalTime = Date.now() - startTime;

      return {
        success: true,
        data: results,
        metadata: {
          benchmarkTime: totalTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('❌ Performance benchmark failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 🗄️ Database Statistics & Index Usage
   */
  @Get('performance/database-stats')
  async getDatabaseStats() {
    this.logger.log('📈 Collecting database statistics...');

    try {
      const stats = await this.queryPerformanceService.getDatabaseStatistics();

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Database stats collection failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 💡 Performance Optimization Recommendations
   */
  @Get('performance/recommendations')
  async getOptimizationRecommendations(): Promise<{
    success: boolean;
    data?: {
      recommendations: {
        recommendations: OptimizationRecommendations;
        priority: string;
        generatedAt: string;
        basedOnData: {
          queryCount: number;
          tableCount: number;
          indexCount: number;
        };
      };
      totalRecommendations: number;
    };
    error?: string;
    timestamp: string;
  }> {
    this.logger.log('💡 Generating optimization recommendations...');

    try {
      const recommendations =
        await this.queryPerformanceService.generateOptimizationRecommendations();

      return {
        success: true,
        data: {
          recommendations,
          totalRecommendations: Object.values(
            recommendations.recommendations,
          ).flat().length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Recommendations generation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  /**
   * 📄 NEW: Paginated Student List
   */
  @Get('students/paginated')
  @ApiOperation({
    summary: '📄 Paginated student list with filtering',
    description:
      'Get paginated list of students with optional filtering by subject, score range, or score level',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'subject', required: false, type: String, example: 'toan' })
  @ApiQuery({ name: 'minScore', required: false, type: Number, example: 8 })
  @ApiQuery({ name: 'maxScore', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'scoreLevel',
    required: false,
    enum: ['excellent', 'good', 'average', 'poor'],
  })
  async getPaginatedStudents(
    @Query(ValidationPipe) pagination: PaginationQueryDto,
    @Query('subject') subject?: string,
    @Query('minScore') minScore?: number,
    @Query('maxScore') maxScore?: number,
    @Query('scoreLevel') scoreLevel?: string,
  ): Promise<PaginatedResponseDto<any>> {
    const filters = {
      subject,
      minScore,
      maxScore,
      scoreLevel: scoreLevel as any,
    };

    const { data, total } = await this.analyticsService.getPaginatedStudentList(
      filters,
      pagination,
    );

    return new PaginatedResponseDto(
      data,
      total,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  /**
   * 📊 NEW: Student Performance Data (Paginated)
   */
  @Get('students/:studentId/performance')
  @ApiOperation({
    summary: '📊 Get student performance data with pagination',
    description:
      'Get detailed performance data for a specific student across all subjects',
  })
  @ApiParam({ name: 'studentId', type: Number, example: 1 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getStudentPerformance(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query(ValidationPipe) pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { data, total } =
      await this.analyticsService.getStudentPerformanceData(
        studentId,
        pagination,
      );

    return new PaginatedResponseDto(
      data,
      total,
      pagination.page || 1,
      pagination.limit || 10,
    );
  }
}

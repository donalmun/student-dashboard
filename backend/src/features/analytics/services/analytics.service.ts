import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SubjectScore } from '../../students/entities/subject-score.entity';
import { Student } from '../../students/entities/student.entity';
import {
  SUBJECT_NAMES,
  SUBJECT_DISPLAY_NAMES,
} from '../../../core/constants/subjects.constant';
import {
  AdvancedReportFilterDto,
  ScoreLevelFilter,
  AggregationType,
  ReportFilterDto,
} from '../dto/request/report-filter.dto';
import {
  AdvancedReportResponseDto,
  EnhancedSubjectReportDto,
  StatisticalAnalysisDto,
  ComparisonDataDto,
  EnhancedSubjectLevelStatDto,
} from '../dto/response/advanced-report.dto';
import { SubjectReportResponseDto } from '../dto/response/subject-report.dto';
import { CacheService } from '../../../core/services/cache.service'; // ✅ Add this import
import { CACHE_KEYS, CACHE_TTL } from '../../../core/config/redis.config'; // ✅ Add this import
import {
  PaginationQueryDto,
  PaginatedResponseDto,
  PaginationHelper,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(SubjectScore)
    private readonly scoreRepo: Repository<SubjectScore>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly cacheService: CacheService, // ✅ Inject CacheService
  ) {}
  /**
   * 🚀 ENHANCED: Main Method với Advanced Filtering + CACHING
   */
  async getAdvancedSubjectStatistics(
    filterDto: AdvancedReportFilterDto,
  ): Promise<AdvancedReportResponseDto> {
    const startTime = Date.now();

    // Generate cache key based on filters
    const cacheKey = `subject_statistics_${JSON.stringify(filterDto)}`;

    this.logger.log(`🔍 Checking cache for key: ${cacheKey}`);

    // Try to get from cache first
    const cached = await this.cacheService.get<AdvancedReportResponseDto>(
      cacheKey,
      { prefix: 'analytics' },
    );
    if (cached) {
      const cacheTime = Date.now() - startTime;
      this.logger.log(`✅ Cache HIT! Served from cache in ${cacheTime}ms`);

      // ✅ FIXED: Update metadata properly
      cached.metadata = {
        ...cached.metadata,
        cacheUsed: true,
        processingTimeMs: cacheTime,
        cacheHit: true,
        cacheStore: 'redis',
        version: 'v2-advanced',
      };

      return cached;
    }

    // Cache MISS - generate fresh data
    this.logger.log(`❌ Cache MISS! Generating fresh data...`);
    const result = await this.generateAdvancedStatisticsFromDatabase(filterDto);

    // Store in cache for next time
    await this.cacheService.set(cacheKey, result, {
      ttl: CACHE_TTL.MEDIUM,
      prefix: 'analytics',
    });
    this.logger.log(
      `💾 Data cached with key: ${cacheKey} (TTL: ${CACHE_TTL.MEDIUM}s)`,
    );

    const totalTime = Date.now() - startTime;

    // ✅ FIXED: Set metadata properly with all required fields
    result.metadata = {
      cacheUsed: false,
      queryOptimized: true,
      dataSource: 'postgresql',
      processingTimeMs: totalTime,
      cacheHit: false,
      cacheStore: 'redis',
      version: 'v2-advanced',
      filtersApplied: this.getAppliedFilters(filterDto).length,
      cacheTtl: CACHE_TTL.MEDIUM,
    };

    this.logger.log(`✅ Fresh data generated in ${totalTime}ms`);
    return result;
  }

  /**
   * 🏭 Generate fresh data from database (tách riêng để rõ ràng)
   */
  private async generateAdvancedStatisticsFromDatabase(
    filterDto: AdvancedReportFilterDto,
  ): Promise<AdvancedReportResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      '🔄 Starting fresh advanced subject statistics generation',
      { filters: filterDto },
    );

    try {
      // 1. Build optimized queries
      const subjectsToAnalyze = this.getSubjectsToAnalyze(filterDto.subjects);
      this.logger.debug(
        `📚 Analyzing ${subjectsToAnalyze.length} subjects:`,
        subjectsToAnalyze,
      );

      // 2. Get filtered data
      const subjectReports: EnhancedSubjectReportDto[] = [];
      const allFilteredScores: number[] = [];

      // Process each subject individually to avoid conflicts
      for (let i = 0; i < subjectsToAnalyze.length; i++) {
        const subject = subjectsToAnalyze[i];
        this.logger.debug(
          `📖 Processing subject ${i + 1}/${subjectsToAnalyze.length}: ${subject}`,
        );

        try {
          const subjectData = await this.analyzeSubjectSafe(subject, filterDto);

          // Filter by minStudentCount if specified
          if (
            !filterDto.minStudentCount ||
            subjectData.statistics.total >= filterDto.minStudentCount
          ) {
            subjectReports.push(subjectData);

            // Safely add scores for overall statistics
            if (
              (subjectData as any).scores &&
              Array.isArray((subjectData as any).scores)
            ) {
              allFilteredScores.push(...(subjectData as any).scores);
            }
          }
        } catch (subjectError) {
          this.logger.warn(
            `⚠️ Error processing subject ${subject}:`,
            subjectError.message,
          );
          // Continue với subject khác
        }
      }

      this.logger.debug(
        `✅ Processed ${subjectReports.length} subjects successfully`,
      );

      // 3. Sort results
      this.sortResults(subjectReports, filterDto);

      // 4. Calculate overall statistics if requested
      let overallStatistics: StatisticalAnalysisDto | undefined;
      if (filterDto.includeStatistics && allFilteredScores.length > 0) {
        try {
          overallStatistics =
            this.calculateStatisticalAnalysis(allFilteredScores);
        } catch (statsError) {
          this.logger.warn(
            '⚠️ Error calculating overall statistics:',
            statsError.message,
          );
          overallStatistics = undefined;
        }
      }

      // 5. Generate chart data
      const chartData = this.generateChartData(subjectReports, filterDto);

      // 6. Build summary
      const summary = await this.buildAdvancedSummary(
        filterDto,
        subjectReports,
        startTime,
      );

      const response: AdvancedReportResponseDto = {
        subjects: subjectReports,
        summary,
        chartData,
        overallStatistics,
        metadata: {
          cacheUsed: false,
          queryOptimized: true,
          dataSource: 'postgresql',
          processingTimeMs: 0, // Will be set by caller
          version: 'v2-advanced',
        },
      };

      this.logger.log(
        `🎉 Fresh statistics generated in ${Date.now() - startTime}ms`,
      );
      return response;
    } catch (error) {
      this.logger.error('💥 Error generating advanced statistics', error);
      throw new Error(`Analytics processing failed: ${error.message}`);
    }
  }

  /**
   * 🛡️ Safe version of analyzeSubject để tránh infinite recursion
   */
  private async analyzeSubjectSafe(
    subject: string,
    filterDto: AdvancedReportFilterDto,
  ): Promise<EnhancedSubjectReportDto> {
    this.logger.debug(`Analyzing subject: ${subject}`);

    try {
      // Build base query for this subject
      const baseQuery = this.buildBaseQuery(filterDto);
      const subjectQuery = baseQuery
        .clone()
        .andWhere('score.subject = :subject', { subject });

      // Get scores
      const scores = await subjectQuery.getMany();
      const scoreValues = scores.map((s) => s.score);

      this.logger.debug(
        `Found ${scoreValues.length} scores for subject ${subject}`,
      );

      // Basic statistics
      const basicStats = this.calculateLevelStatistics(
        scoreValues,
        filterDto.aggregationType,
      );

      // Enhanced statistics nếu được yêu cầu
      let statisticalAnalysis: StatisticalAnalysisDto | undefined;
      if (filterDto.includeStatistics && scoreValues.length > 0) {
        try {
          statisticalAnalysis = this.calculateStatisticalAnalysis(scoreValues);
        } catch (statsError) {
          this.logger.warn(
            `Error calculating statistics for ${subject}:`,
            statsError.message,
          );
          statisticalAnalysis = undefined;
        }
      }

      // Comparison nếu được yêu cầu
      let comparison: ComparisonDataDto | undefined;
      if (filterDto.includeComparison && scoreValues.length > 0) {
        try {
          comparison = await this.calculateComparison(subject, scoreValues);
        } catch (compError) {
          this.logger.warn(
            `Error calculating comparison for ${subject}:`,
            compError.message,
          );
          comparison = undefined;
        }
      }

      // Top performers
      let topPerformers: string[] | undefined;
      if (scoreValues.length > 0) {
        try {
          topPerformers = await this.getTopPerformersForSubject(subject, 3);
        } catch (topError) {
          this.logger.warn(
            `Error getting top performers for ${subject}:`,
            topError.message,
          );
          topPerformers = [];
        }
      }

      const averageScore =
        scoreValues.length > 0
          ? Math.round(
              (scoreValues.reduce((sum, score) => sum + score, 0) /
                scoreValues.length) *
                100,
            ) / 100
          : 0;

      return {
        subject,
        subjectDisplayName: SUBJECT_DISPLAY_NAMES[subject] || subject,
        statistics: basicStats,
        statisticalAnalysis,
        comparison,
        averageScore,
        topPerformers,
        // Internal property for calculations
        scores: scoreValues,
      } as any;
    } catch (error) {
      this.logger.error(`Error in analyzeSubjectSafe for ${subject}:`, error);
      throw error;
    }
  }

  /**
   * 🏗️ Build optimized base query với filters
   */
  private buildBaseQuery(
    filterDto: AdvancedReportFilterDto,
  ): SelectQueryBuilder<SubjectScore> {
    let query = this.scoreRepo
      .createQueryBuilder('score')
      .leftJoin('score.student', 'student');

    // Score range filters
    if (filterDto.minScore !== undefined) {
      query = query.andWhere('score.score >= :minScore', {
        minScore: filterDto.minScore,
      });
    }

    if (filterDto.maxScore !== undefined) {
      query = query.andWhere('score.score <= :maxScore', {
        maxScore: filterDto.maxScore,
      });
    }

    // Foreign language filter
    if (filterDto.foreignLanguageCodes?.length) {
      query = query.andWhere('student.ma_ngoai_ngu IN (:...codes)', {
        codes: filterDto.foreignLanguageCodes,
      });
    }

    // Score level filters
    if (filterDto.scoreLevels?.length) {
      const conditions = filterDto.scoreLevels
        .map((level) => {
          switch (level) {
            case ScoreLevelFilter.EXCELLENT:
              return 'score.score >= 8';
            case ScoreLevelFilter.GOOD:
              return 'score.score >= 6 AND score.score < 8';
            case ScoreLevelFilter.AVERAGE:
              return 'score.score >= 4 AND score.score < 6';
            case ScoreLevelFilter.POOR:
              return 'score.score < 4';
            default:
              return null;
          }
        })
        .filter(Boolean);

      if (conditions.length > 0) {
        query = query.andWhere(`(${conditions.join(' OR ')})`);
      }
    }

    return query;
  }

  /**
   * 📊 Enhanced level statistics calculation với error handling
   */
  private calculateLevelStatistics(
    scores: number[],
    aggregationType: AggregationType = AggregationType.BOTH,
  ): EnhancedSubjectLevelStatDto {
    if (!scores || scores.length === 0) {
      return {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0,
        total: 0,
        percentages: { excellent: 0, good: 0, average: 0, poor: 0 },
      };
    }

    let excellent = 0,
      good = 0,
      average = 0,
      poor = 0;

    scores.forEach((score) => {
      if (typeof score !== 'number' || isNaN(score)) {
        this.logger.warn(`Invalid score value: ${score}`);
        return;
      }

      if (score >= 8) excellent++;
      else if (score >= 6) good++;
      else if (score >= 4) average++;
      else poor++;
    });

    const total = scores.length;
    const result: EnhancedSubjectLevelStatDto = {
      excellent,
      good,
      average,
      poor,
      total,
    };

    // Add percentages if requested
    if (
      aggregationType === AggregationType.PERCENTAGE ||
      aggregationType === AggregationType.BOTH
    ) {
      if (total > 0) {
        result.percentages = {
          excellent: Math.round((excellent / total) * 100 * 100) / 100,
          good: Math.round((good / total) * 100 * 100) / 100,
          average: Math.round((average / total) * 100 * 100) / 100,
          poor: Math.round((poor / total) * 100 * 100) / 100,
        };
      } else {
        result.percentages = { excellent: 0, good: 0, average: 0, poor: 0 };
      }
    }

    return result;
  }

  /**
   * 📈 Fixed: Advanced statistical analysis - Remove recursion
   */
  private calculateStatisticalAnalysis(
    scores: number[],
  ): StatisticalAnalysisDto {
    if (!scores || scores.length === 0) {
      return {
        mean: 0,
        median: 0,
        mode: 0,
        standardDeviation: 0,
        variance: 0,
        max: 0,
        min: 0,
      };
    }

    // Create a copy to avoid mutation
    const sortedScores = [...scores].sort((a, b) => a - b);

    // Mean
    const sum = scores.reduce((total, score) => total + score, 0);
    const mean = sum / scores.length;

    // Median
    const middle = Math.floor(sortedScores.length / 2);
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[middle - 1] + sortedScores[middle]) / 2
        : sortedScores[middle];

    // Mode (most frequent score)
    const frequency = new Map<number, number>();
    scores.forEach((score) => {
      frequency.set(score, (frequency.get(score) || 0) + 1);
    });

    let mode = scores[0];
    let maxFreq = 0;
    frequency.forEach((freq, score) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = score;
      }
    });

    // Variance và Standard deviation
    const variance =
      scores.reduce((sum, score) => {
        return sum + Math.pow(score - mean, 2);
      }, 0) / scores.length;

    const standardDeviation = Math.sqrt(variance);

    // Min và Max
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    return {
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      mode: Math.round(mode * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      max,
      min,
    };
  }

  /**
   * 🔄 Calculate comparison với overall data
   */
  private async calculateComparison(
    subject: string,
    subjectScores: number[],
  ): Promise<ComparisonDataDto> {
    // Get overall average cho môn này
    const overallSubjectScores = await this.scoreRepo.find({
      where: { subject },
      select: ['score'],
    });

    const overallAverage =
      overallSubjectScores.length > 0
        ? overallSubjectScores.reduce((sum, s) => sum + s.score, 0) /
          overallSubjectScores.length
        : 0;

    const subjectAverage =
      subjectScores.length > 0
        ? subjectScores.reduce((sum, score) => sum + score, 0) /
          subjectScores.length
        : 0;

    const difference = subjectAverage - overallAverage;
    const percentageDifference =
      overallAverage > 0 ? (difference / overallAverage) * 100 : 0;

    // Calculate ranking
    const allSubjectsAverages = await Promise.all(
      SUBJECT_NAMES.map(async (subj) => {
        const scores = await this.scoreRepo.find({
          where: { subject: subj },
          select: ['score'],
        });
        const avg =
          scores.length > 0
            ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
            : 0;
        return { subject: subj, average: avg };
      }),
    );

    allSubjectsAverages.sort((a, b) => b.average - a.average);
    const position =
      allSubjectsAverages.findIndex((s) => s.subject === subject) + 1;
    const percentile = Math.round(
      ((allSubjectsAverages.length - position + 1) /
        allSubjectsAverages.length) *
        100,
    );

    return {
      overallComparison: {
        subjectAverage: Math.round(subjectAverage * 100) / 100,
        overallAverage: Math.round(overallAverage * 100) / 100,
        difference: Math.round(difference * 100) / 100,
        percentageDifference: Math.round(percentageDifference * 100) / 100,
      },
      ranking: {
        position,
        totalSubjects: allSubjectsAverages.length,
        percentile,
      },
    };
  }

  /**
   * 🔧 Helper methods với error handling
   */
  private getSubjectsToAnalyze(subjects?: string[]): string[] {
    const result = subjects?.length
      ? subjects.filter((s) => SUBJECT_NAMES.includes(s as any))
      : [...SUBJECT_NAMES];

    this.logger.debug(`Subjects to analyze: ${result.length}`, result);
    return result;
  }

  private sortResults(
    results: EnhancedSubjectReportDto[],
    filterDto: AdvancedReportFilterDto,
  ): void {
    const { sortBy, sortOrder } = filterDto;

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'subject_name':
          comparison = a.subjectDisplayName.localeCompare(b.subjectDisplayName);
          break;
        case 'total_students':
          comparison = a.statistics.total - b.statistics.total;
          break;
        case 'excellent_count':
          comparison = a.statistics.excellent - b.statistics.excellent;
          break;
        case 'average_score':
          comparison = a.averageScore - b.averageScore;
          break;
        default:
          comparison = a.subjectDisplayName.localeCompare(b.subjectDisplayName);
      }

      return sortOrder === 'DESC' ? -comparison : comparison;
    });
  }

  private generateChartData(
    results: EnhancedSubjectReportDto[],
    filterDto: AdvancedReportFilterDto,
  ): any[] {
    return results.map((result) => ({
      subject: result.subjectDisplayName,
      excellent: result.statistics.excellent,
      good: result.statistics.good,
      average: result.statistics.average,
      poor: result.statistics.poor,
      total: result.statistics.total,
      averageScore: result.averageScore,
      percentages: result.statistics.percentages,
    }));
  }

  private async buildAdvancedSummary(
    filterDto: AdvancedReportFilterDto,
    results: EnhancedSubjectReportDto[],
    startTime: number,
  ) {
    const totalStudents = await this.studentRepo.count();
    const totalScores = await this.scoreRepo.count();

    const filteredStudents = results.reduce(
      (sum, r) => sum + r.statistics.total,
      0,
    );
    const appliedFilters = this.getAppliedFilters(filterDto);

    const overallAverage =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.averageScore, 0) / results.length
        : 0;

    return {
      totalStudents,
      totalScores,
      averageScore: Math.round(overallAverage * 100) / 100,
      filteredStudents,
      appliedFilters,
      reportGeneratedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    };
  }

  private getAppliedFilters(filterDto: AdvancedReportFilterDto): string[] {
    const filters: string[] = [];

    if (filterDto.subjects?.length)
      filters.push(`subjects: ${filterDto.subjects.join(', ')}`);
    if (filterDto.foreignLanguageCodes?.length)
      filters.push(`languages: ${filterDto.foreignLanguageCodes.join(', ')}`);
    if (filterDto.minScore !== undefined)
      filters.push(`minScore: ${filterDto.minScore}`);
    if (filterDto.maxScore !== undefined)
      filters.push(`maxScore: ${filterDto.maxScore}`);
    if (filterDto.scoreLevels?.length)
      filters.push(`levels: ${filterDto.scoreLevels.join(', ')}`);
    if (filterDto.minStudentCount)
      filters.push(`minStudents: ${filterDto.minStudentCount}`);

    return filters;
  }

  private async getTopPerformersForSubject(
    subject: string,
    limit: number,
  ): Promise<string[]> {
    const topScores = await this.scoreRepo
      .createQueryBuilder('score')
      .leftJoin('score.student', 'student')
      .select(['student.sbd'])
      .where('score.subject = :subject', { subject })
      .orderBy('score.score', 'DESC')
      .limit(limit)
      .getRawMany();

    return topScores.map((result) => result.student_sbd);
  }
  /**
   * ✅ CACHED: Basic Subject Statistics (backward compatibility)
   */
  async getSubjectStatistics(
    filterDto: ReportFilterDto,
  ): Promise<SubjectReportResponseDto> {
    const cacheKey = `subject_statistics_basic_${JSON.stringify(filterDto)}`;

    this.logger.log(`🔍 Checking cache for basic stats: ${cacheKey}`);

    // Try to get from cache first
    const cached = await this.cacheService.get<SubjectReportResponseDto>(
      cacheKey,
      { prefix: 'analytics' },
    );
    if (cached) {
      this.logger.log(`✅ Cache HIT for basic stats: ${cacheKey}`);
      return cached;
    }

    // Cache MISS - generate fresh data
    this.logger.log('🔄 Generating fresh basic statistics...');

    // Convert old DTO to new DTO
    const advancedFilter: AdvancedReportFilterDto = {
      subjects: filterDto.subjects,
      format: filterDto.format || 'table',
      aggregationType: AggregationType.BOTH,
      includeComparison: false,
      includeStatistics: false,
    };

    const advancedResult =
      await this.generateAdvancedStatisticsFromDatabase(advancedFilter);

    // Convert back to old format
    const result: SubjectReportResponseDto = {
      subjects: advancedResult.subjects.map((subject) => ({
        subject: subject.subject,
        subjectDisplayName: subject.subjectDisplayName,
        statistics: {
          excellent: subject.statistics.excellent,
          good: subject.statistics.good,
          average: subject.statistics.average,
          poor: subject.statistics.poor,
          total: subject.statistics.total,
        },
        percentages: subject.statistics.percentages || {
          excellent: 0,
          good: 0,
          average: 0,
          poor: 0,
        },
      })),
      summary: {
        totalStudents: advancedResult.summary.totalStudents,
        totalScores: advancedResult.summary.totalScores,
        averageScore: advancedResult.summary.averageScore,
        reportGeneratedAt: advancedResult.summary.reportGeneratedAt,
      },
      chartData: advancedResult.chartData,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, {
      ttl: CACHE_TTL.MEDIUM,
      prefix: 'analytics',
    });

    return result;
  }
  /**
   * ✅ CACHED: Top Performers by Subject
   */
  async getTopPerformersBySubject(subject: string, limit: number = 10) {
    const cacheKey = `top_performers_${subject}_${limit}`;

    this.logger.log(`🔍 Checking cache for top performers: ${cacheKey}`);

    // Try to get from cache first
    const cached = await this.cacheService.get<any[]>(cacheKey, {
      prefix: 'analytics',
    });
    if (cached) {
      this.logger.log(`✅ Cache HIT for top performers: ${cacheKey}`);
      return cached;
    }

    // Cache MISS - generate fresh data
    this.logger.log(`🔄 Generating fresh top performers for ${subject}...`);

    const validLimit = Math.min(Math.max(limit, 1), 100);

    const topScores = await this.scoreRepo
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.student', 'student')
      .where('score.subject = :subject', { subject })
      .orderBy('score.score', 'DESC')
      .limit(validLimit)
      .getMany();

    const result = topScores.map((score) => ({
      sbd: score.student.sbd,
      score: score.score,
      subject,
      subjectDisplayName: SUBJECT_DISPLAY_NAMES[subject] || subject,
    }));

    // Cache the result
    await this.cacheService.set(cacheKey, result, {
      ttl: CACHE_TTL.LONG,
      prefix: 'analytics',
    });

    return result;
  }
  /**
   * ✅ CACHED: Dashboard Overview
   */
  async getDashboardOverview() {
    const cacheKey = 'dashboard_overview';
    this.logger.log(`🔍 Checking cache for dashboard: ${cacheKey}`);

    // Try to get from cache first
    const cached = await this.cacheService.get<any>(cacheKey, {
      prefix: 'analytics',
    });
    if (cached) {
      this.logger.log(`✅ Cache HIT for dashboard: ${cacheKey}`);
      return cached;
    }

    // Cache MISS - generate fresh data
    this.logger.log('🔄 Generating fresh dashboard data...');

    const summary = await this.buildBasicSummary();

    // Thống kê nhanh các levels tổng quát
    const allScores = await this.scoreRepo.find({ select: ['score'] });
    const overallStats = this.calculateLevelStatistics(
      allScores.map((s) => s.score),
    );
    const overallPercentages = overallStats.percentages;

    const result = {
      summary,
      overallStatistics: {
        statistics: overallStats,
        percentages: overallPercentages,
      },
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, {
      ttl: CACHE_TTL.LONG,
      prefix: 'analytics',
    });

    return result;
  }

  private async buildBasicSummary() {
    const totalStudents = await this.studentRepo.count();
    const totalScores = await this.scoreRepo.count();

    const averageScoreResult = await this.scoreRepo
      .createQueryBuilder('score')
      .select('AVG(score.score)', 'average')
      .getRawOne();

    const averageScore = averageScoreResult?.average
      ? Math.round(parseFloat(averageScoreResult.average) * 100) / 100
      : 0;

    return {
      totalStudents,
      totalScores,
      averageScore,
      reportGeneratedAt: new Date().toISOString(),
    };
  } /**
   * 🗑️ Cache invalidation method
   */
  async invalidateAnalyticsCache(): Promise<void> {
    await this.cacheService.clearPattern('analytics:*');
    this.logger.log('Analytics cache invalidated');
  }
  /**
   * 📄 NEW: Paginated Student List with Filters
   */
  async getPaginatedStudentList(
    filters: {
      subject?: string;
      minScore?: number;
      maxScore?: number;
      scoreLevel?: ScoreLevelFilter;
    } = {},
    pagination: PaginationQueryDto,
  ): Promise<{ data: any[]; total: number }> {
    const cacheKey = `paginated_students_${JSON.stringify({ ...filters, ...pagination })}`;

    // Try cache first
    const cached = await this.cacheService.get<{ data: any[]; total: number }>(
      cacheKey,
      { prefix: 'analytics' },
    );
    if (cached) {
      this.logger.log(`📄 Cache HIT: ${cacheKey}`);
      return cached;
    }

    // Build query
    let query = this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.scores', 'scores');

    // Apply filters
    if (filters.subject) {
      query = query.andWhere('scores.subject = :subject', {
        subject: filters.subject,
      });
    }

    if (filters.minScore !== undefined) {
      query = query.andWhere('scores.score >= :minScore', {
        minScore: filters.minScore,
      });
    }

    if (filters.maxScore !== undefined) {
      query = query.andWhere('scores.score <= :maxScore', {
        maxScore: filters.maxScore,
      });
    }

    if (filters.scoreLevel) {
      const scoreRanges = this.getScoreRangeForLevel(filters.scoreLevel);
      query = query.andWhere('scores.score BETWEEN :min AND :max', {
        min: scoreRanges.min,
        max: scoreRanges.max,
      });
    }

    // Get total count for pagination
    const total = await query.getCount();

    // Apply pagination
    const data = await query
      .skip(pagination.skip)
      .take(pagination.take)
      .orderBy('student.sbd', 'ASC')
      .getMany();

    const result = { data, total };

    // Cache the result
    await this.cacheService.set(cacheKey, result, {
      ttl: CACHE_TTL.MEDIUM,
      prefix: 'analytics',
    });
    this.logger.log(
      `📄 Cache MISS: ${cacheKey} - Data cached for ${CACHE_TTL.MEDIUM}s`,
    );

    return result;
  }
  /**
   * 📊 NEW: Student Performance Data with Pagination
   */
  async getStudentPerformanceData(
    studentId: number,
    pagination: PaginationQueryDto,
  ): Promise<{ data: any[]; total: number }> {
    const cacheKey = `student_performance_${studentId}_${JSON.stringify(pagination)}`;

    // Try cache first
    const cached = await this.cacheService.get<{ data: any[]; total: number }>(
      cacheKey,
      { prefix: 'analytics' },
    );
    if (cached) {
      this.logger.log(`📊 Cache HIT: ${cacheKey}`);
      return cached;
    }

    // Build query for student's scores
    const query = this.scoreRepo
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.student', 'student')
      .where('student.id = :studentId', { studentId });

    // Get total count
    const total = await query.getCount();

    // Get paginated data
    const scores = await query
      .skip(pagination.skip)
      .take(pagination.take)
      .orderBy('score.score', 'DESC')
      .getMany();

    // Transform data for response
    const data = scores.map((score) => ({
      subject: score.subject,
      subjectDisplayName: SUBJECT_DISPLAY_NAMES[score.subject] || score.subject,
      score: score.score,
      level: this.determineScoreLevel(score.score),
      ranking: null, // Could be calculated separately if needed
    }));

    const result = { data, total };

    // Cache the result
    await this.cacheService.set(cacheKey, result, {
      ttl: CACHE_TTL.SHORT,
      prefix: 'analytics',
    });
    this.logger.log(
      `📊 Cache MISS: ${cacheKey} - Data cached for ${CACHE_TTL.SHORT}s`,
    );

    return result;
  }

  /**
   * 🔧 Helper: Get score range for level filter
   */
  private getScoreRangeForLevel(level: ScoreLevelFilter): {
    min: number;
    max: number;
  } {
    switch (level) {
      case ScoreLevelFilter.EXCELLENT:
        return { min: 8, max: 10 };
      case ScoreLevelFilter.GOOD:
        return { min: 6.5, max: 7.9 };
      case ScoreLevelFilter.AVERAGE:
        return { min: 5, max: 6.4 };
      case ScoreLevelFilter.POOR:
        return { min: 0, max: 4.9 };
      default:
        return { min: 0, max: 10 };
    }
  }

  /**
   * 🎯 Helper: Determine score level from numeric score
   */
  private determineScoreLevel(score: number): string {
    if (score >= 8) return 'Excellent';
    if (score >= 6.5) return 'Good';
    if (score >= 5) return 'Average';
    return 'Below Average';
  }
}

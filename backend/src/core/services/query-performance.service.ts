import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SubjectScore } from '../../features/students/entities/subject-score.entity';
import { Student } from '../../features/students/entities/student.entity';

export interface QueryBenchmarkResult {
  description: string;
  query: string;
  executionTime: number;
  resultCount: number;
  usesIndex: boolean;
  planningTime: number;
  actualTime: number;
  error?: string;
}

export interface BenchmarkSummary {
  totalBenchmarkTime: number;
  averageQueryTime: number;
  queryCount: number;
  fastestQuery: number;
  slowestQuery: number;
  indexEfficiency: number;
}

export interface PaginationResult {
  pageSize: number;
  offset: number;
  executionTime: number;
}

export interface OptimizationRecommendations {
  database: string[];
  queries: string[];
  indexing: string[];
  caching: string[];
  priority: string;
}

@Injectable()
export class QueryPerformanceService {
  private readonly logger = new Logger(QueryPerformanceService.name);

  constructor(
    @InjectRepository(SubjectScore)
    private readonly scoreRepo: Repository<SubjectScore>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 📊 Analyze query performance with EXPLAIN ANALYZE
   */
  async analyzeQueryPerformance(
    query: string,
    parameters: any[] = [],
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Run EXPLAIN ANALYZE
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await queryRunner.query(explainQuery, parameters);

      const analysis = result[0]['QUERY PLAN'][0];

      this.logger.log('🔍 Query Performance Analysis:', {
        executionTime: analysis['Execution Time'],
        planningTime: analysis['Planning Time'],
        totalCost: analysis.Plan['Total Cost'],
        actualTime: analysis.Plan['Actual Total Time'],
      });

      return analysis;
    } catch (error) {
      this.logger.error('❌ Query performance analysis failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 🚀 Comprehensive performance benchmark
   */
  async runPerformanceBenchmark(): Promise<{
    queries: QueryBenchmarkResult[];
    summary: BenchmarkSummary;
    timestamp: string;
  }> {
    this.logger.log('🏁 Starting comprehensive performance benchmark...');

    const startTime = Date.now();
    const queries: QueryBenchmarkResult[] = [];

    try {
      // Test 1: Basic student count
      const countQuery = 'SELECT COUNT(*) as total FROM student';
      const countResult = await this.benchmarkQuery(
        countQuery,
        [],
        'Student Count',
      );
      queries.push(countResult);

      // Test 2: Subject score aggregation
      const scoreQuery =
        'SELECT subject, AVG(score) as avg_score FROM subject_score GROUP BY subject';
      const scoreResult = await this.benchmarkQuery(
        scoreQuery,
        [],
        'Subject Averages',
      );
      queries.push(scoreResult);

      // Test 3: Complex join query
      const joinQuery = `
        SELECT s.sbd, ss.subject, ss.score
        FROM student s
        JOIN subject_score ss ON s.id = ss."studentId"
        LIMIT 1000
      `;
      const joinResult = await this.benchmarkQuery(
        joinQuery,
        [],
        'Complex Join',
      );
      queries.push(joinResult);

      // Calculate summary
      const totalTime = Date.now() - startTime;
      const validQueries = queries.filter((q) => q.executionTime > 0);
      const avgTime =
        validQueries.length > 0
          ? validQueries.reduce((sum, q) => sum + q.executionTime, 0) /
            validQueries.length
          : 0;

      const summary: BenchmarkSummary = {
        totalBenchmarkTime: totalTime,
        averageQueryTime: Math.round(avgTime * 100) / 100,
        queryCount: queries.length,
        fastestQuery:
          validQueries.length > 0
            ? Math.min(...validQueries.map((q) => q.executionTime))
            : 0,
        slowestQuery:
          validQueries.length > 0
            ? Math.max(...validQueries.map((q) => q.executionTime))
            : 0,
        indexEfficiency: this.calculateIndexEfficiency(queries),
      };

      this.logger.log(`✅ Benchmark completed in ${totalTime}ms`);

      return {
        queries,
        summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Performance benchmark failed:', error);
      throw error;
    }
  }

  /**
   * 🧪 Individual query benchmark
   */
  private async benchmarkQuery(
    query: string,
    parameters: any[] = [],
    description: string,
  ): Promise<QueryBenchmarkResult> {
    const startTime = Date.now();

    try {
      const result = await this.dataSource.query(query, parameters);
      const executionTime = Date.now() - startTime;

      // Get query plan for analysis
      const explainResult = await this.analyzeQueryPerformance(
        query,
        parameters,
      );

      this.logger.log(`⚡ ${description}: ${executionTime}ms`);

      return {
        description,
        query: query.replace(/\s+/g, ' ').trim(),
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 1,
        usesIndex: this.detectIndexUsage(explainResult),
        planningTime: explainResult['Planning Time'] || 0,
        actualTime: explainResult.Plan['Actual Total Time'] || 0,
      };
    } catch (error) {
      this.logger.error(
        `❌ Query benchmark failed (${description}):`,
        error.message,
      );
      return {
        description,
        query: query.replace(/\s+/g, ' ').trim(),
        executionTime: -1,
        resultCount: 0,
        error: error.message,
        usesIndex: false,
        planningTime: 0,
        actualTime: 0,
      };
    }
  }

  /**
   * 🗜️ Test compression effectiveness
   */
  async testCompressionEffectiveness(): Promise<any> {
    this.logger.log('🗜️ Testing compression effectiveness...');

    try {
      // Get sample data
      const sampleData = await this.dataSource.query(`
        SELECT s.*, ss.subject, ss.score
        FROM student s
        JOIN subject_score ss ON s.id = ss."studentId"
        LIMIT 1000
      `);

      const dataString = JSON.stringify(sampleData);
      const uncompressedSize = Buffer.byteLength(dataString, 'utf8');

      // Estimate compressed size (simplified)
      const estimatedCompressionRatio = 0.3; // Typical JSON compression ratio
      const estimatedCompressedSize = Math.round(
        uncompressedSize * estimatedCompressionRatio,
      );

      const result = {
        sampleSize: sampleData.length,
        uncompressedBytes: uncompressedSize,
        estimatedCompressedBytes: estimatedCompressedSize,
        compressionRatio: `${Math.round((1 - estimatedCompressionRatio) * 100)}%`,
        recommendCompression: uncompressedSize > 1024, // Recommend for >1KB
      };

      this.logger.log(
        `🗜️ Compression test: ${uncompressedSize} → ~${estimatedCompressedSize} bytes`,
      );

      return result;
    } catch (error) {
      this.logger.error('❌ Compression test failed:', error);
      throw error;
    }
  }

  /**
   * 📄 Test pagination performance
   */
  async testPaginationPerformance(): Promise<{
    results: PaginationResult[];
    summary: {
      averageTime: number;
      slowestQuery: number;
      fastestQuery: number;
    };
  }> {
    this.logger.log('📄 Testing pagination performance...');

    const results: PaginationResult[] = [];
    const pageSizes = [10, 50, 100, 500];
    const offsets = [0, 1000, 5000, 10000];

    for (const pageSize of pageSizes) {
      for (const offset of offsets) {
        try {
          const startTime = Date.now();

          await this.dataSource.query(
            `
            SELECT s.id, s.sbd, AVG(ss.score) as avg_score
            FROM student s
            LEFT JOIN subject_score ss ON s.id = ss."studentId"
            GROUP BY s.id, s.sbd
            ORDER BY avg_score DESC NULLS LAST
            LIMIT $1 OFFSET $2
          `,
            [pageSize, offset],
          );

          const executionTime = Date.now() - startTime;

          results.push({
            pageSize,
            offset,
            executionTime,
          });

          if (executionTime < 1000) {
            // Only log if under 1 second
            this.logger.log(
              `📄 Pagination: LIMIT ${pageSize} OFFSET ${offset} = ${executionTime}ms`,
            );
          }
        } catch (error) {
          this.logger.error(
            `❌ Pagination test failed (${pageSize}/${offset}):`,
            error.message,
          );
        }
      }
    }

    const summary = {
      averageTime:
        results.length > 0
          ? results.reduce((sum, r) => sum + r.executionTime, 0) /
            results.length
          : 0,
      slowestQuery:
        results.length > 0
          ? Math.max(...results.map((r) => r.executionTime))
          : 0,
      fastestQuery:
        results.length > 0
          ? Math.min(...results.map((r) => r.executionTime))
          : 0,
    };

    return { results, summary };
  }

  /**
   * 📊 Get database statistics
   */
  async getDatabaseStatistics(): Promise<any> {
    this.logger.log('📊 Collecting database statistics...');

    try {
      // Database size
      const sizeResult = await this.dataSource.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      // Active connections
      const connectionsResult = await this.dataSource.query(`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE state = 'active'
      `);

      // Table statistics
      const tableStatsResult = await this.dataSource.query(`
        SELECT 
          schemaname,
          relname as tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        WHERE relname IN ('student', 'subject_score')
      `);

      // Index usage
      const indexStatsResult = await this.dataSource.query(`
        SELECT 
          schemaname,
          relname as tablename,
          indexrelname as indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE relname IN ('student', 'subject_score')
        ORDER BY idx_scan DESC
      `);

      // Cache hit ratio
      const cacheStats = await this.dataSource.query(`
        SELECT 
          schemaname,
          relname as tablename,
          heap_blks_read + heap_blks_hit as total_reads,
          heap_blks_hit::float / (heap_blks_read + heap_blks_hit) as hit_ratio
        FROM pg_statio_user_tables
      `);

      const stats = {
        database: {
          size: sizeResult[0]?.size || 'Unknown',
          activeConnections:
            parseInt(connectionsResult[0]?.active_connections) || 0,
        },
        tables: tableStatsResult,
        indexes: indexStatsResult,
        performance: {
          cacheHitRatio: 'N/A',
        },
      };

      stats.performance.cacheHitRatio = cacheStats[0]?.hit_ratio
        ? `${Math.round(cacheStats[0].hit_ratio * 100 * 100) / 100}%`
        : 'N/A';

      this.logger.log('📊 Database statistics collected successfully');
      return stats;
    } catch (error) {
      this.logger.error('❌ Failed to collect database statistics:', error);
      throw error;
    }
  }

  /**
   * 🎯 Generate optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<{
    recommendations: OptimizationRecommendations;
    priority: string;
    generatedAt: string;
    basedOnData: {
      queryCount: number;
      tableCount: number;
      indexCount: number;
    };
  }> {
    this.logger.log('🎯 Generating optimization recommendations...');

    try {
      // Run benchmark to get performance data
      const benchmark = await this.runPerformanceBenchmark();
      const dbStats = await this.getDatabaseStatistics();

      const recommendations: OptimizationRecommendations = {
        database: [],
        queries: [],
        indexing: [],
        caching: [],
        priority: 'medium',
      };

      // Analyze slow queries
      const slowQueries = benchmark.queries.filter(
        (q) => q.executionTime > 1000,
      );
      const averageTime = benchmark.summary.averageQueryTime;

      // Database recommendations
      const tableStats = dbStats.tables || [];
      const unusedIndexes = (dbStats.indexes || []).filter(
        (idx) => idx.scans === 0,
      );
      const lowUsageIndexes = (dbStats.indexes || []).filter(
        (idx) => idx.scans > 0 && idx.scans < 100,
      );

      if (unusedIndexes.length > 0) {
        recommendations.indexing.push(
          `Consider dropping ${unusedIndexes.length} unused indexes`,
        );
      }

      if (lowUsageIndexes.length > 0) {
        recommendations.indexing.push(
          `Review ${lowUsageIndexes.length} low-usage indexes`,
        );
      }

      // Table maintenance
      const deadTuples = tableStats.reduce(
        (sum, table) => sum + (table.dead_tuples || 0),
        0,
      );
      if (deadTuples > 10000) {
        recommendations.database.push(
          `Consider running VACUUM ANALYZE - ${deadTuples} dead tuples found`,
        );
        recommendations.priority = 'high';
      }

      // Performance recommendations
      if (dbStats.performance.cacheHitRatio !== 'N/A') {
        const hitRatio = parseFloat(dbStats.performance.cacheHitRatio);
        if (hitRatio < 95) {
          recommendations.database.push(
            `Database cache hit ratio is ${hitRatio}% - consider increasing shared_buffers`,
          );
          recommendations.priority = 'high';
        }
      }

      // Query performance
      if (slowQueries.length > 0) {
        recommendations.queries.push(
          `${slowQueries.length} queries are taking >1000ms - review and optimize`,
        );
        recommendations.priority = 'high';
      }

      if (averageTime > 500) {
        recommendations.queries.push(
          `Average query time is ${averageTime}ms - consider query optimization`,
        );
      }

      // Index efficiency
      if (benchmark.summary.indexEfficiency < 80) {
        recommendations.indexing.push(
          `Only ${benchmark.summary.indexEfficiency}% of queries use indexes efficiently`,
        );
        recommendations.priority = 'high';
      }

      // Caching recommendations
      if (averageTime > 100) {
        recommendations.caching.push(
          'Consider implementing query result caching for frequently accessed data',
        );
      }

      if (slowQueries.length > 2) {
        recommendations.caching.push(
          'Enable Redis caching for dashboard and analytics queries',
        );
      }

      // Add compression recommendation
      const compressionTest = await this.testCompressionEffectiveness();
      if (compressionTest.recommendCompression) {
        recommendations.caching.push(
          'Enable response compression for API endpoints',
        );
      }

      this.logger.log(
        `🎯 Generated ${Object.values(recommendations).flat().length} recommendations`,
      );

      return {
        recommendations,
        priority: recommendations.priority,
        generatedAt: new Date().toISOString(),
        basedOnData: {
          queryCount: benchmark.queries.length,
          tableCount: tableStats.length,
          indexCount: (dbStats.indexes || []).length,
        },
      };
    } catch (error) {
      this.logger.error('❌ Failed to generate recommendations:', error);
      throw error;
    }
  }

  /**
   * 🔧 Helper methods
   */
  private detectIndexUsage(explainResult: any): boolean {
    if (!explainResult?.Plan) return false;

    const plan = JSON.stringify(explainResult.Plan);
    return plan.includes('Index Scan') || plan.includes('Index Only Scan');
  }

  private calculateIndexEfficiency(queries: QueryBenchmarkResult[]): number {
    const validQueries = queries.filter((q) => q.executionTime > 0);
    if (validQueries.length === 0) return 0;

    const indexedQueries = validQueries.filter((q) => q.usesIndex);
    return Math.round((indexedQueries.length / validQueries.length) * 100);
  }
}

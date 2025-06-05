import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { SubjectScore } from '../students/entities/subject-score.entity';
import { Student } from '../students/entities/student.entity';
import { CacheService } from '../../core/services/cache.service';
import { QueryPerformanceService } from '../../core/services/query-performance.service';

@Module({
  imports: [TypeOrmModule.forFeature([SubjectScore, Student])],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    CacheService,
    QueryPerformanceService, // ✅ Add performance monitoring
  ],
  exports: [AnalyticsService, CacheService, QueryPerformanceService],
})
export class AnalyticsModule {}

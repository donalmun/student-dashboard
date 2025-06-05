import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Student } from './features/students/entities/student.entity';
import { SubjectScore } from './features/students/entities/subject-score.entity';
import { CsvSeederService } from './features/data-management/services/csv-seeder.service';
import { StudentModule } from './features/students/student.module';
import { AnalyticsModule } from './features/analytics/analytics.module';
import { DevLogger, CacheConfigHelper, EnvironmentHelper } from './core/utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        DevLogger.config('CacheModule factory called', 'AppModule');

        const cacheConfig = CacheConfigHelper.getCacheConfig(configService);

        DevLogger.config(`Cache enabled: ${cacheConfig.enabled}`, 'AppModule');

        if (!cacheConfig.enabled) {
          DevLogger.warn('Cache is DISABLED - using memory store', 'AppModule');
        } else {
          DevLogger.success(
            'Using in-memory cache store for development',
            'AppModule',
          );
        }

        return {
          ttl: cacheConfig.ttl,
          max: cacheConfig.maxItems,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...EnvironmentHelper.getDatabaseConfig(configService),
        entities: [Student, SubjectScore],
        migrations: ['dist/shared/database/migrations/*{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([Student, SubjectScore]),
    StudentModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CsvSeederService],
})
export class AppModule {
  constructor() {
    DevLogger.startup('AppModule constructor called', 'AppModule');
  }
}

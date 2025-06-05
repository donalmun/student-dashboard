import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { EnhancedValidationPipe } from './shared/pipes/enhanced-validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 🗜️ Enable response compression
  app.use(
    compression({
      level: 6, // Compression level (1-9, higher = more compression)
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req, res) => {
        // Don't compress responses if the request includes 'x-no-compression' header
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use compression filter function
        return compression.filter(req, res);
      },
    }),
  );

  // 🔧 Global validation pipe with enhanced features
  app.useGlobalPipes(
    new EnhancedValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: false,
      stopAtFirstError: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // 🛡️ Global exception filter for consistent error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 📚 Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Student Dashboard API')
    .setDescription('Performance-optimized API for student analytics')
    .setVersion('2.0')
    .addTag('Analytics', 'Performance analytics endpoints')
    .addTag('Students', 'Student management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();

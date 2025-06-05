import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Student } from '../../features/students/entities/student.entity';
import { SubjectScore } from '../../features/students/entities/subject-score.entity';
// Load environment variables từ file .env
config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST') || 'localhost',
  port: configService.get('DB_PORT') || 5432,
  username: configService.get('DB_USERNAME') || 'myuser',
  password: configService.get('DB_PASSWORD') || 'mypassword',
  database: configService.get('DB_NAME') || 'student_dashboard_db',

  // Entities: Import từ thư mục entities
  entities: [Student, SubjectScore],

  // Migrations: Path tương đối từ file config này
  migrations: ['src/shared/database/migrations/*{.ts,.js}'],

  // Tên bảng lưu trữ migration history
  migrationsTableName: 'migrations',

  // Tắt synchronize để dùng migration
  synchronize: false,

  // Logging để debug
  logging: ['query', 'error'],
});

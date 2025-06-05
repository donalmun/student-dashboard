import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { CsvSeederService } from '../services/csv-seeder.service';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(CsvSeederService);

  // Dùng đường dẫn tuyệt đối từ project root
  // process.cwd() = backend/ folder
  // Dataset ở ../dataset/ (lên 1 cấp rồi vào dataset)
  const csvPath = path.join(
    process.cwd(),
    '..',
    'dataset',
    'diem_thi_thpt_2024.csv',
  );
  console.log(`📁 CSV path: ${csvPath}`);

  await seeder.importFromCsv(csvPath);
  await app.close();
  console.log('✅ Import CSV thành công!');
}

bootstrap();

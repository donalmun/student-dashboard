import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Student } from '../../students/entities/student.entity'; // ✅ Đường dẫn mới
import { SubjectScore } from '../../students/entities/subject-score.entity'; // ✅ Đường dẫn mới
import * as fs from 'fs';
import * as csv from 'csv-parser';

@Injectable()
export class CsvSeederService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(SubjectScore)
    private scoreRepo: Repository<SubjectScore>,
    private dataSource: DataSource,
  ) {}

  async importFromCsv(filePath: string) {
    const BATCH_SIZE = 1000; // Xử lý 1000 dòng mỗi lần
    const studentRows: any[] = [];

    // Đọc CSV
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => studentRows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Đọc được ${studentRows.length} dòng từ CSV`);

    // Chia thành batches và xử lý
    const totalBatches = Math.ceil(studentRows.length / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, studentRows.length);
      const batch = studentRows.slice(startIndex, endIndex);

      console.log(
        `Đang xử lý batch ${batchIndex + 1}/${totalBatches} (${batch.length} dòng)`,
      );

      await this.processBatch(batch);

      // Tạm dừng giữa các batch để tránh quá tải
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('✅ Import CSV thành công!');
  }

  private async processBatch(batch: any[]) {
    await this.dataSource.transaction(async (manager) => {
      // 1. Lưu students cho batch này
      const studentsToSave = batch.map((row) => ({
        sbd: row.sbd,
        ma_ngoai_ngu: row.ma_ngoai_ngu || '',
      }));

      const savedStudents = await manager.save(Student, studentsToSave);

      // 2. Lưu scores cho batch này
      const subjectNames = [
        'toan',
        'ngu_van',
        'ngoai_ngu',
        'vat_li',
        'hoa_hoc',
        'sinh_hoc',
        'lich_su',
        'dia_li',
        'gdcd',
      ];

      const scoresToSave: Partial<SubjectScore>[] = [];
      for (let i = 0; i < batch.length; i++) {
        const row = batch[i];
        const student = savedStudents[i];

        for (const subject of subjectNames) {
          if (
            row[subject] &&
            row[subject] !== '' &&
            !isNaN(parseFloat(row[subject]))
          ) {
            scoresToSave.push({
              subject,
              score: parseFloat(row[subject]),
              studentId: student.id,
            });
          }
        }
      }

      if (scoresToSave.length > 0) {
        await manager.save(SubjectScore, scoresToSave);
      }
    });
  }
}

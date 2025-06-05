import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, SubjectScore } from '../entities';
import { SearchStudentDto } from '../dto/request';
import { StudentDto } from '../dto/response';
import { KHOI_COMBINATIONS } from '../../../core/constants/subjects.constant';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SubjectScore)
    private readonly scoreRepo: Repository<SubjectScore>,
  ) {}

  async findByRegistrationNumber(sbd: string): Promise<StudentDto> {
    const student = await this.studentRepo.findOne({
      where: { sbd },
      relations: ['scores'],
    });

    if (!student) {
      throw new NotFoundException(`Không tìm thấy học sinh với SBD: ${sbd}`);
    }

    return this.mapToDto(student);
  }

  async search(searchDto: SearchStudentDto) {
    const {
      page = 1,
      limit = 10,
      sbd,
      ma_ngoai_ngu,
      minScore,
      maxScore,
    } = searchDto;

    const queryBuilder = this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.scores', 'score');

    if (sbd) {
      queryBuilder.andWhere('student.sbd LIKE :sbd', { sbd: `%${sbd}%` });
    }

    if (ma_ngoai_ngu) {
      queryBuilder.andWhere('student.ma_ngoai_ngu = :ma_ngoai_ngu', {
        ma_ngoai_ngu,
      });
    }

    if (minScore !== undefined) {
      queryBuilder.andWhere('score.score >= :minScore', { minScore });
    }

    if (maxScore !== undefined) {
      queryBuilder.andWhere('score.score <= :maxScore', { maxScore });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('student.id', 'ASC');

    const [students, total] = await queryBuilder.getManyAndCount();

    return {
      data: students.map((student) => this.mapToDto(student)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTop10KhoiA(): Promise<StudentDto[]> {
    const khoiASubjects = KHOI_COMBINATIONS.A;

    // ✅ Sửa query - không dùng leftJoinAndSelect với GROUP BY
    const queryBuilder = this.studentRepo
      .createQueryBuilder('student')
      .innerJoin('student.scores', 'score') // ✅ Đổi từ leftJoinAndSelect thành innerJoin
      .select(['student.id', 'student.sbd', 'student.ma_ngoai_ngu'])
      .addSelect('SUM(score.score)', 'totalScore') // ✅ Add aggregate select
      .where('score.subject IN (:...subjects)', { subjects: khoiASubjects })
      .groupBy('student.id, student.sbd, student.ma_ngoai_ngu') // ✅ Add all selected columns
      .having('COUNT(DISTINCT score.subject) = :subjectCount', {
        subjectCount: khoiASubjects.length,
      })
      .orderBy('SUM(score.score)', 'DESC')
      .limit(10);

    const rawResults = await queryBuilder.getRawMany();

    // ✅ Manually load scores for each student
    const studentIds = rawResults.map((r) => r.student_id);
    const studentsWithScores = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.scores', 'score')
      .where('student.id IN (:...ids)', { ids: studentIds })
      .andWhere('score.subject IN (:...subjects)', { subjects: khoiASubjects })
      .getMany();

    // ✅ Sort theo totalScore từ raw results
    const sortedStudents = rawResults
      .map((rawResult) => {
        const student = studentsWithScores.find(
          (s) => s.id === rawResult.student_id,
        );
        return student;
      })
      .filter(Boolean);

    return sortedStudents
      .filter((student): student is Student => student !== undefined)
      .map((student) => this.mapToDto(student));
  }

  async getOverviewStatistics() {
    const totalStudents = await this.studentRepo.count();
    const totalScores = await this.scoreRepo.count();

    const averageScoreResult = await this.scoreRepo
      .createQueryBuilder('score')
      .select('AVG(score.score)', 'average')
      .getRawOne();

    return {
      total_students: totalStudents,
      total_scores: totalScores,
      average_score: averageScoreResult?.average
        ? Math.round(parseFloat(averageScoreResult.average) * 100) / 100
        : 0,
      last_updated: new Date().toISOString(),
    };
  }

  private mapToDto(student: Student): StudentDto {
    const dto = new StudentDto();
    dto.id = student.id;
    dto.sbd = student.sbd;
    dto.ma_ngoai_ngu = student.ma_ngoai_ngu;

    if (student.scores) {
      dto.scores = student.scores.map((score) => ({
        id: score.id,
        subject: score.subject,
        score: score.score,
      }));
    }

    return dto;
  }
}

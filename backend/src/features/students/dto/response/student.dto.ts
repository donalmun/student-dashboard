import { ApiProperty } from '@nestjs/swagger';

export class SubjectScoreDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  score: number;
}

export class StudentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sbd: string;

  @ApiProperty()
  ma_ngoai_ngu: string;

  @ApiProperty({ type: [SubjectScoreDto] })
  scores?: SubjectScoreDto[];

  get averageScore(): number | null {
    if (!this.scores || this.scores.length === 0) return null;
    const total = this.scores.reduce((sum, score) => sum + score.score, 0);
    return Math.round((total / this.scores.length) * 100) / 100;
  }

  get khoiAScore(): number | null {
    if (!this.scores) return null;
    const khoiASubjects = ['toan', 'vat_li', 'hoa_hoc'];
    const khoiAScores = this.scores.filter((score) =>
      khoiASubjects.includes(score.subject),
    );
    if (khoiAScores.length !== 3) return null;
    const total = khoiAScores.reduce((sum, score) => sum + score.score, 0);
    return Math.round(total * 100) / 100;
  }
}

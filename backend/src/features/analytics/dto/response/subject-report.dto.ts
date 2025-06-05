import { ApiProperty } from '@nestjs/swagger';

export class SubjectLevelStatDto {
  @ApiProperty({ example: 150, description: 'Số học sinh >= 8 điểm' })
  excellent: number;

  @ApiProperty({ example: 200, description: 'Số học sinh 6-7.99 điểm' })
  good: number;

  @ApiProperty({ example: 100, description: 'Số học sinh 4-5.99 điểm' })
  average: number;

  @ApiProperty({ example: 50, description: 'Số học sinh < 4 điểm' })
  poor: number;

  @ApiProperty({ example: 500, description: 'Tổng số học sinh' })
  total: number;
}

export class SubjectReportDto {
  @ApiProperty({ example: 'toan' })
  subject: string;

  @ApiProperty({ example: 'Toán' })
  subjectDisplayName: string;

  @ApiProperty({ type: SubjectLevelStatDto })
  statistics: SubjectLevelStatDto;

  @ApiProperty({
    example: { excellent: 30, good: 40, average: 20, poor: 10 },
    description: 'Phần trăm theo từng level',
  })
  percentages: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

export class SubjectReportResponseDto {
  @ApiProperty({ type: [SubjectReportDto] })
  subjects: SubjectReportDto[];

  @ApiProperty()
  summary: {
    totalStudents: number;
    totalScores: number;
    averageScore: number;
    reportGeneratedAt: string;
  };

  @ApiProperty()
  chartData: ChartDataDto[];
}

export class ChartDataDto {
  @ApiProperty({ example: 'Toán' })
  subject: string;

  @ApiProperty({ example: 150 })
  excellent: number;

  @ApiProperty({ example: 200 })
  good: number;

  @ApiProperty({ example: 100 })
  average: number;

  @ApiProperty({ example: 50 })
  poor: number;
}

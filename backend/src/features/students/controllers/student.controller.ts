import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StudentService } from '../services/student.service';
import { SearchStudentDto } from '../dto/request';
import { StudentDto } from '../dto/response';

@ApiTags('Students')
@Controller('api/students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('sbd/:sbd')
  @ApiOperation({ summary: 'Tra cứu điểm theo SBD' })
  @ApiResponse({ status: 200, type: StudentDto })
  async findByRegistrationNumber(@Param('sbd') sbd: string) {
    const student = await this.studentService.findByRegistrationNumber(sbd);
    return {
      success: true,
      message: 'Tìm thấy thông tin học sinh',
      data: student,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm học sinh' })
  async search(@Query(ValidationPipe) searchDto: SearchStudentDto) {
    const result = await this.studentService.search(searchDto);
    return {
      success: true,
      message: 'Tìm kiếm thành công',
      data: result.data,
      meta: {
        page: result.page,
        limit: searchDto.limit || 10,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('top10/khoi-a')
  @ApiOperation({ summary: 'Top 10 học sinh khối A' })
  async getTop10KhoiA() {
    const students = await this.studentService.getTop10KhoiA();
    return {
      success: true,
      message: 'Lấy top 10 khối A thành công',
      data: students,
    };
  }

  @Get('statistics/overview')
  @ApiOperation({ summary: 'Thống kê tổng quan' })
  async getOverviewStatistics() {
    const statistics = await this.studentService.getOverviewStatistics();
    return {
      success: true,
      message: 'Lấy thống kê thành công',
      data: statistics,
    };
  }
}

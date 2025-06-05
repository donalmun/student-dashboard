import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './controllers/student.controller';
import { StudentService } from './services/student.service';
import { Student, SubjectScore } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Student, SubjectScore])],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}

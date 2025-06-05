import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';

@Entity()
export class SubjectScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string; // toan, ngu_van,...

  @Column('float')
  score: number;

  @ManyToOne(() => Student, (student) => student.scores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' }) // Đặt tên cột FK rõ ràng
  student: Student;

  @Column()
  studentId: number; // Thêm cột FK rõ ràng
}

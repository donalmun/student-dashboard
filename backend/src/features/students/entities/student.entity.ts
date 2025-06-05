import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SubjectScore } from './subject-score.entity';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sbd: string;

  @Column()
  ma_ngoai_ngu: string;

  @OneToMany(() => SubjectScore, (score) => score.student, {
    cascade: false, // TẮT cascade để tránh vòng lặp
  })
  scores: SubjectScore[];
}

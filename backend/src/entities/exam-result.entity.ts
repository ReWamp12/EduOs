import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'exam_results' })
export class ExamResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'exam_id' })
  examId: string;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @Column({ type: 'numeric', name: 'marks_obtained', precision: 5, scale: 2 })
  marksObtained: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  percentile: number;

  @Column({ type: 'integer', name: 'rank_in_batch', nullable: true })
  rankInBatch: number;

  @Column({ type: 'text', array: true, name: 'weak_topics', nullable: true })
  weakTopics: string[];

  @Column({ type: 'text', name: 'mistake_summary', nullable: true })
  mistakeSummary: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

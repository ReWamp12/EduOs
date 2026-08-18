import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'exams' })
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'batch_id', nullable: true })
  batchId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', name: 'exam_type', default: 'mock_test' })
  examType: string;

  @Column({ type: 'integer', name: 'total_marks', default: 100 })
  totalMarks: number;

  @Column({ type: 'integer', name: 'duration_minutes', default: 180 })
  durationMinutes: number;

  @Column({ type: 'date', name: 'exam_date' })
  examDate: string;

  @Column({ type: 'boolean', name: 'is_published', default: false })
  isPublished: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'assignment_submissions' })
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assignment_id' })
  assignmentId: string;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @Column({ type: 'text', name: 'submission_url', nullable: true })
  submissionUrl: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'submitted_at', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @Column({ type: 'integer', name: 'marks_obtained', nullable: true })
  marksObtained: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'text', default: 'submitted' })
  status: string; // submitted, graded, late
}

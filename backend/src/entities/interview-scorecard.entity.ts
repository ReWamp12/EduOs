import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('interview_scorecards')
export class InterviewScorecard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'applicant_id', type: 'uuid' })
  applicantId: string;

  @Column({ name: 'interviewer_id', nullable: true })
  interviewerId: string;

  @Column({ name: 'interviewer_name' })
  interviewerName: string;

  @Column({ name: 'round_name', default: 'Pedagogy & Technical Round' })
  roundName: string;

  @Column({ name: 'pedagogy_score', type: 'int', default: 0 })
  pedagogyScore: number; // 1-5

  @Column({ name: 'subject_knowledge_score', type: 'int', default: 0 })
  subjectKnowledgeScore: number; // 1-5

  @Column({ name: 'classroom_management_score', type: 'int', default: 0 })
  classroomManagementScore: number; // 1-5

  @Column({ name: 'communication_score', type: 'int', default: 0 })
  communicationScore: number; // 1-5

  @Column({ name: 'overall_rating', type: 'float', default: 0 })
  overallRating: number;

  @Column({ type: 'text', nullable: true })
  strengths: string;

  @Column({ type: 'text', nullable: true })
  areasOfImprovement: string;

  @Column({ default: 'hire' })
  recommendation: 'strong_hire' | 'hire' | 'hold' | 'reject';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

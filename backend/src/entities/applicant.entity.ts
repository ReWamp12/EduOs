import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('applicants')
export class Applicant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ name: 'experience_years', type: 'float', default: 0 })
  experienceYears: number;

  @Column({ name: 'highest_qualification' })
  highestQualification: string;

  @Column({ name: 'current_organization', nullable: true })
  currentOrganization: string;

  @Column({ name: 'resume_url', nullable: true })
  resumeUrl: string;

  @Column({ name: 'portfolio_url', nullable: true })
  portfolioUrl: string;

  @Column({ type: 'text', nullable: true })
  coverLetter: string;

  @Column({
    default: 'applied',
  })
  stage: 'applied' | 'shortlisted' | 'interview_scheduled' | 'interviewed' | 'offer_extended' | 'e_signed' | 'hired' | 'rejected';

  @Column({ name: 'offered_salary', nullable: true })
  offeredSalary: string;

  @Column({ name: 'proposed_joining_date', nullable: true })
  proposedJoiningDate: string;

  @Column({ name: 'e_sign_timestamp', nullable: true })
  eSignTimestamp: Date;

  @Column({ name: 'source', default: 'Career Portal' })
  source: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

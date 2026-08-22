import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('job_openings')
export class JobOpening {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column()
  title: string;

  @Column()
  department: string;

  @Column({ name: 'job_type', default: 'Full-time' })
  jobType: string;

  @Column({ name: 'designation_category', default: 'Teaching' })
  designationCategory: 'Teaching' | 'Non-Teaching' | 'Administrative' | 'Leadership';

  @Column({ name: 'experience_required', default: '2-5 years' })
  experienceRequired: string;

  @Column({ name: 'salary_range', nullable: true })
  salaryRange: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ default: 'published' })
  status: 'draft' | 'published' | 'closed' | 'filled';

  @Column({ name: 'location', default: 'Main Campus' })
  location: string;

  @Column({ name: 'positions_count', default: 1 })
  positionsCount: number;

  @Column({ name: 'deadline', nullable: true })
  deadline: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('training_records')
export class TrainingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ name: 'training_title' })
  trainingTitle: string;

  @Column({ name: 'provider_agency' })
  providerAgency: string; // 'CBSE Sahodaya' | 'NCERT NISHTHA' | 'In-House Pedagogy' | 'State DIET' | 'External'

  @Column({
    name: 'category',
    default: 'pedagogy',
  })
  category: 'pedagogy' | 'nep2020' | 'subject_enrichment' | 'child_safety_pocso' | 'ict_digital' | 'inclusive_education';

  @Column({ name: 'duration_hours', type: 'float', default: 0 })
  durationHours: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'academic_year', default: '2026-2027' })
  academicYear: string;

  @Column({ name: 'mode', default: 'online' })
  mode: 'online' | 'offline_workshop' | 'hybrid';

  @Column({ name: 'certificate_url', nullable: true })
  certificateUrl: string;

  @Column({ name: 'is_verified_by_principal', default: true })
  isVerifiedByPrincipal: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

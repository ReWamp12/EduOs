import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('employee_records')
export class EmployeeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'employee_code', unique: true })
  employeeCode: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  designation: string;

  @Column()
  department: string;

  @Column({ name: 'employee_type', default: 'teaching' })
  employeeType: 'teaching' | 'non_teaching' | 'administrative' | 'support';

  @Column({ name: 'date_of_joining', type: 'date' })
  dateOfJoining: string;

  @Column({ name: 'employment_status', default: 'active' })
  employmentStatus: 'probationary' | 'confirmed' | 'notice_period' | 'resigned' | 'retired';

  @Column({
    name: 'police_verification_status',
    default: 'submitted_pending',
  })
  policeVerificationStatus: 'verified' | 'submitted_pending' | 'missing';

  @Column({ name: 'police_doc_url', nullable: true })
  policeDocUrl: string;

  @Column({ name: 'police_verification_date', nullable: true })
  policeVerificationDate: string;

  @Column({ name: 'police_acknowledgment_number', nullable: true })
  policeAcknowledgmentNumber: string;

  @Column({ name: 'grace_period_expiry_date', type: 'date', nullable: true })
  gracePeriodExpiryDate: string;

  @Column({ name: 'is_access_restricted', default: false })
  isAccessRestricted: boolean;

  @Column({ name: 'emergency_contact_name', nullable: true })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', nullable: true })
  emergencyContactPhone: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface QualificationEntry {
  degree: string;
  institution: string;
  yearOfPassing: number;
  percentageOrGrade: string;
  isVerified: boolean;
  docUrl?: string;
}

export interface ScaleIncrementEntry {
  id: string;
  effectiveDate: string;
  basicPay: number;
  gradePay?: number;
  daHraAllowances: number;
  grossPay: number;
  orderNumber: string;
  remarks: string;
}

export interface PromotionEntry {
  id: string;
  effectiveDate: string;
  fromDesignation: string;
  toDesignation: string;
  orderNumber: string;
  remarks: string;
}

@Entity('employee_service_records')
export class EmployeeServiceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ name: 'appointment_order_number' })
  appointmentOrderNumber: string;

  @Column({ name: 'appointment_date', type: 'date' })
  appointmentDate: string;

  @Column({ name: 'confirmation_order_number', nullable: true })
  confirmationOrderNumber: string;

  @Column({ name: 'confirmation_date', type: 'date', nullable: true })
  confirmationDate: string;

  @Column({ name: 'provident_fund_uan', nullable: true })
  providentFundUan: string;

  @Column({ name: 'esi_insurance_number', nullable: true })
  esiInsuranceNumber: string;

  @Column({ name: 'pan_number', nullable: true })
  panNumber: string;

  @Column({ name: 'qualifications_json', type: 'jsonb', default: [] })
  qualificationsJson: QualificationEntry[];

  @Column({ name: 'scale_history_json', type: 'jsonb', default: [] })
  scaleHistoryJson: ScaleIncrementEntry[];

  @Column({ name: 'promotion_history_json', type: 'jsonb', default: [] })
  promotionHistoryJson: PromotionEntry[];

  @Column({ name: 'casual_leave_balance', default: 12 })
  casualLeaveBalance: number;

  @Column({ name: 'earned_leave_balance', default: 30 })
  earnedLeaveBalance: number;

  @Column({ name: 'medical_leave_balance', default: 10 })
  medicalLeaveBalance: number;

  @Column({ name: 'disciplinary_entries', type: 'text', nullable: true })
  disciplinaryEntries: string;

  @Column({ name: 'service_book_locked', default: false })
  serviceBookLocked: boolean;

  @Column({ name: 'last_verified_by_name', nullable: true })
  lastVerifiedByName: string;

  @Column({ name: 'last_verified_at', nullable: true })
  lastVerifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

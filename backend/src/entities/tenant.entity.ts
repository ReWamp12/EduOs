import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  subdomain: string;

  @Column({ type: 'text', name: 'custom_domain', nullable: true })
  customDomain: string;

  @Column({ type: 'text', name: 'institution_type', default: 'coaching' })
  institutionType: string;

  @Column({ type: 'text', name: 'primary_color', default: '#4F46E5' })
  primaryColor: string;

  @Column({ type: 'text', name: 'secondary_color', default: '#06B6D4' })
  secondaryColor: string;

  @Column({ type: 'text', name: 'accent_color', default: '#F59E0B' })
  accentColor: string;

  @Column({ type: 'text', name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  tagline: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

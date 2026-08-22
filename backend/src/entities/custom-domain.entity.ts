import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DnsStatus = 'pending_dns' | 'dns_verified' | 'dns_misconfigured';
export type SslStatus = 'pending_ssl' | 'issuing' | 'active_secured' | 'expiring_soon' | 'expired' | 'failed';

@Entity('custom_domains')
export class CustomDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: true })
  domain: string; // e.g. "portal.modernpublicschool.com"

  @Column({ name: 'expected_cname', default: 'ingress.eduos.app' })
  expectedCname: string;

  @Column({ name: 'cname_verified', default: false })
  cnameVerified: boolean;

  @Column({
    name: 'dns_status',
    type: 'varchar',
    default: 'pending_dns',
  })
  dnsStatus: DnsStatus;

  @Column({
    name: 'ssl_status',
    type: 'varchar',
    default: 'pending_ssl',
  })
  sslStatus: SslStatus;

  @Column({ name: 'ssl_issuer', nullable: true })
  sslIssuer?: string; // "Let's Encrypt Authority X3" / "AWS ACM"

  @Column({ name: 'ssl_fingerprint', nullable: true })
  sslFingerprint?: string; // SHA-256

  @Column({ name: 'ssl_valid_from', nullable: true })
  sslValidFrom?: Date;

  @Column({ name: 'ssl_expires_at', nullable: true })
  sslExpiresAt?: Date;

  @Column({ name: 'acme_challenge_token', nullable: true })
  acmeChallengeToken?: string;

  @Column({ name: 'acme_challenge_value', nullable: true })
  acmeChallengeValue?: string;

  @Column({ name: 'resolved_ip', nullable: true })
  resolvedIp?: string;

  @Column({ name: 'last_checked_at', nullable: true })
  lastCheckedAt?: Date;

  @Column({ name: 'auto_renew', default: true })
  autoRenew: boolean;

  @Column({ name: 'nginx_vhost_configured', default: false })
  nginxVhostConfigured: boolean;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DnsService, DnsCheckResult } from './dns.service';
import { SslProvisionerService, SslProvisionResult } from './ssl-provisioner.service';
import { CustomDomain } from '../entities/custom-domain.entity';

export interface DomainStatusSummary {
  domain: string;
  tenantId: string;
  expectedCname: string;
  dnsStatus: 'pending_dns' | 'dns_verified' | 'dns_misconfigured';
  sslStatus: 'pending_ssl' | 'issuing' | 'active_secured' | 'expiring_soon' | 'expired' | 'failed';
  sslIssuer?: string;
  sslFingerprint?: string;
  sslExpiresAt?: Date;
  lastCheckedAt?: Date;
  diagnostics?: string;
  nginxConfigReady: boolean;
}

@Injectable()
export class DomainWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DomainWorkerService.name);
  private pollingTimer: NodeJS.Timeout | null = null;

  // In-memory persistent registry of custom domains
  private domainsMap = new Map<string, CustomDomain>();

  constructor(
    private readonly dnsService: DnsService,
    private readonly sslProvisioner: SslProvisionerService,
  ) {
    // Seed initial demo institution custom domain
    const seedDomain: CustomDomain = {
      id: 'cd-mps-01',
      tenantId: 'tenant-mps-01',
      domain: 'portal.modernpublicschool.com',
      expectedCname: 'ingress.eduos.app',
      cnameVerified: true,
      dnsStatus: 'dns_verified',
      sslStatus: 'active_secured',
      sslIssuer: "Let's Encrypt Authority X3",
      sslFingerprint: 'A4:2B:99:81:7C:E3:44:91:00:2A:FF:D3:84:61:90:EE',
      sslValidFrom: new Date(Date.now() - 15 * 86_400_000),
      sslExpiresAt: new Date(Date.now() + 75 * 86_400_000),
      resolvedIp: '76.76.21.21',
      lastCheckedAt: new Date(),
      autoRenew: true,
      nginxVhostConfigured: true,
      createdAt: new Date(Date.now() - 30 * 86_400_000),
      updatedAt: new Date(),
    };
    this.domainsMap.set(seedDomain.domain, seedDomain);
  }

  onModuleInit() {
    this.logger.log('[Worker] Starting background DNS CNAME polling & SSL automation worker (Interval: 30s)');
    // Run initial sweep
    this.runAutomationSweep();
    // Schedule background sweep every 30 seconds
    this.pollingTimer = setInterval(() => {
      this.runAutomationSweep();
    }, 30000);
  }

  onModuleDestroy() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Main background automation cycle:
   * 1. Polls pending DNS domains
   * 2. Auto-provisions SSL for verified domains
   * 3. Checks certificate expiration & auto-renews
   */
  async runAutomationSweep(): Promise<void> {
    const allDomains = Array.from(this.domainsMap.values());

    for (const record of allDomains) {
      try {
        // Step 1: Check DNS if not yet verified or periodic health check
        if (record.dnsStatus !== 'dns_verified' || !record.cnameVerified) {
          const dnsResult = await this.dnsService.verifyDomainDns(record.domain, record.expectedCname);
          record.lastCheckedAt = new Date();

          if (dnsResult.isVerified) {
            record.dnsStatus = 'dns_verified';
            record.cnameVerified = true;
            record.resolvedIp = dnsResult.resolvedValues.join(', ');
            this.logger.log(`[Worker] DNS confirmed for ${record.domain}. Transitioning to SSL provisioning.`);
          } else {
            record.dnsStatus = 'pending_dns';
            record.errorMessage = dnsResult.diagnostics;
          }
        }

        // Step 2: Auto-provision SSL if DNS is verified but SSL is pending
        if (record.dnsStatus === 'dns_verified' && (record.sslStatus === 'pending_ssl' || record.sslStatus === 'issuing')) {
          record.sslStatus = 'issuing';
          const sslResult = await this.sslProvisioner.provisionSslCertificate(record.domain, record.tenantId);

          if (sslResult.success) {
            record.sslStatus = 'active_secured';
            record.sslIssuer = sslResult.sslIssuer;
            record.sslFingerprint = sslResult.sslFingerprint;
            record.sslValidFrom = sslResult.validFrom;
            record.sslExpiresAt = sslResult.expiresAt;
            record.nginxVhostConfigured = true;
            record.errorMessage = undefined;
            this.logger.log(`[Worker] SSL successfully activated for ${record.domain}`);
          } else {
            record.sslStatus = 'failed';
            record.errorMessage = sslResult.errorMessage;
          }
        }

        // Step 3: Check certificate renewal for active secured domains (< 30 days remaining)
        if (record.sslStatus === 'active_secured' && record.sslExpiresAt && record.autoRenew) {
          if (this.sslProvisioner.isExpiringSoon(record.sslExpiresAt)) {
            this.logger.warn(`[Worker] Domain ${record.domain} certificate expiring soon (<30 days). Triggering auto-renewal.`);
            record.sslStatus = 'expiring_soon';
            const renewResult = await this.sslProvisioner.provisionSslCertificate(record.domain, record.tenantId);
            if (renewResult.success) {
              record.sslStatus = 'active_secured';
              record.sslExpiresAt = renewResult.expiresAt;
              record.sslFingerprint = renewResult.sslFingerprint;
              this.logger.log(`[Worker] Auto-renewal successful for ${record.domain}. New expiry: ${record.sslExpiresAt.toISOString()}`);
            }
          }
        }

        record.updatedAt = new Date();
        this.domainsMap.set(record.domain, record);
      } catch (err: any) {
        this.logger.error(`[Worker] Error processing domain ${record.domain}: ${err.message}`);
      }
    }
  }

  /**
   * Register a new custom domain request
   */
  async registerCustomDomain(domain: string, tenantId: string): Promise<CustomDomain> {
    const cleanDomain = domain.toLowerCase().trim();
    if (this.domainsMap.has(cleanDomain)) {
      return this.domainsMap.get(cleanDomain)!;
    }

    const newRecord: CustomDomain = {
      id: `cd-${Date.now()}`,
      tenantId,
      domain: cleanDomain,
      expectedCname: 'ingress.eduos.app',
      cnameVerified: false,
      dnsStatus: 'pending_dns',
      sslStatus: 'pending_ssl',
      autoRenew: true,
      nginxVhostConfigured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.domainsMap.set(cleanDomain, newRecord);

    // Immediately trigger on-demand verification
    this.runAutomationSweep();
    return newRecord;
  }

  /**
   * Trigger immediate manual re-check
   */
  async verifyDomainImmediate(domain: string): Promise<CustomDomain | null> {
    const cleanDomain = domain.toLowerCase().trim();
    let record = this.domainsMap.get(cleanDomain);

    if (!record) {
      return null;
    }

    // Force DNS check
    const dnsResult = await this.dnsService.verifyDomainDns(record.domain, record.expectedCname);
    record.lastCheckedAt = new Date();

    if (dnsResult.isVerified) {
      record.dnsStatus = 'dns_verified';
      record.cnameVerified = true;
      record.resolvedIp = dnsResult.resolvedValues.join(', ');

      // Trigger instant SSL
      const sslResult = await this.sslProvisioner.provisionSslCertificate(record.domain, record.tenantId);
      if (sslResult.success) {
        record.sslStatus = 'active_secured';
        record.sslIssuer = sslResult.sslIssuer;
        record.sslFingerprint = sslResult.sslFingerprint;
        record.sslValidFrom = sslResult.validFrom;
        record.sslExpiresAt = sslResult.expiresAt;
        record.nginxVhostConfigured = true;
        record.errorMessage = undefined;
      }
    } else {
      record.dnsStatus = 'pending_dns';
      record.errorMessage = dnsResult.diagnostics;
    }

    record.updatedAt = new Date();
    this.domainsMap.set(cleanDomain, record);
    return record;
  }

  /**
   * Get all registered custom domains
   */
  getAllDomains(): CustomDomain[] {
    return Array.from(this.domainsMap.values());
  }

  /**
   * Get custom domain by domain name
   */
  getDomain(domain: string): CustomDomain | null {
    return this.domainsMap.get(domain.toLowerCase().trim()) || null;
  }
}

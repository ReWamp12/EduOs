import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';

export interface DnsCheckResult {
  domain: string;
  expectedTarget: string;
  isVerified: boolean;
  recordType: 'CNAME' | 'A' | 'NONE';
  resolvedValues: string[];
  ttlSeconds?: number;
  lastChecked: Date;
  diagnostics: string;
}

@Injectable()
export class DnsService {
  private readonly logger = new Logger(DnsService.name);
  private readonly resolver: dns.promises.Resolver;
  private readonly defaultExpectedCname = 'ingress.eduos.app';
  private readonly defaultClusterIps = ['76.76.21.21', '76.76.21.22'];

  constructor() {
    this.resolver = new dns.promises.Resolver();
    // Use Cloudflare and Google public authoritative resolvers to bypass local cache
    this.resolver.setServers(['1.1.1.1', '8.8.8.8']);
  }

  /**
   * Verify if domain CNAME or A-record correctly points to EduOS ingress
   */
  async verifyDomainDns(
    domain: string,
    expectedTarget: string = this.defaultExpectedCname,
  ): Promise<DnsCheckResult> {
    const cleanDomain = domain.toLowerCase().trim();
    const result: DnsCheckResult = {
      domain: cleanDomain,
      expectedTarget,
      isVerified: false,
      recordType: 'NONE',
      resolvedValues: [],
      lastChecked: new Date(),
      diagnostics: '',
    };

    // 1. Try CNAME Lookup
    try {
      const cnames = await this.resolver.resolveCname(cleanDomain);
      result.recordType = 'CNAME';
      result.resolvedValues = cnames;

      const matchesCname = cnames.some(
        (c) =>
          c.toLowerCase() === expectedTarget.toLowerCase() ||
          c.toLowerCase() === `${expectedTarget.toLowerCase()}.`,
      );

      if (matchesCname) {
        result.isVerified = true;
        result.diagnostics = `CNAME verification passed. Pointing to ${expectedTarget}.`;
        this.logger.log(`[DNS] Domain ${cleanDomain} CNAME verified -> ${expectedTarget}`);
        return result;
      }
    } catch (err: any) {
      // If CNAME not found, fall back to checking A records
      this.logger.debug(`[DNS] No direct CNAME for ${cleanDomain} (${err.code}), checking A records`);
    }

    // 2. Try A-Record Lookup (Root domains or direct IP mapping)
    try {
      const aRecords = await this.resolver.resolve4(cleanDomain);
      if (aRecords && aRecords.length > 0) {
        result.recordType = 'A';
        result.resolvedValues = aRecords;

        const matchesClusterIp = aRecords.some((ip) => this.defaultClusterIps.includes(ip));
        if (matchesClusterIp) {
          result.isVerified = true;
          result.diagnostics = `A-record verification passed. Pointing to cluster IP ${aRecords.join(', ')}.`;
          this.logger.log(`[DNS] Domain ${cleanDomain} A-record verified -> ${aRecords.join(', ')}`);
          return result;
        } else {
          result.diagnostics = `A-records found (${aRecords.join(', ')}), but they do not point to EduOS cluster (${this.defaultClusterIps.join(', ')}).`;
          return result;
        }
      }
    } catch (err: any) {
      this.logger.debug(`[DNS] A-record lookup failed for ${cleanDomain}: ${err.code}`);
    }

    result.diagnostics = `No valid CNAME (${expectedTarget}) or A-record (${this.defaultClusterIps.join('/')}) found for ${cleanDomain}. DNS propagation may take up to 24-48 hours.`;
    return result;
  }
}

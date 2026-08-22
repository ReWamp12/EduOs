import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
  Header,
} from '@nestjs/common';
import { DomainWorkerService } from './domain-worker.service';
import { SslProvisionerService } from './ssl-provisioner.service';

@Controller()
export class DomainController {
  constructor(
    private readonly domainWorker: DomainWorkerService,
    private readonly sslProvisioner: SslProvisionerService,
  ) {}

  /**
   * ACME HTTP-01 Automated Challenge Endpoint
   * Required for Let's Encrypt automated domain authorization
   */
  @Get('.well-known/acme-challenge/:token')
  @Header('Content-Type', 'text/plain')
  getAcmeChallenge(@Param('token') token: string): string {
    const response = this.sslProvisioner.getAcmeChallengeResponse(token);
    if (!response) {
      throw new NotFoundException(`ACME challenge token ${token} not found or expired`);
    }
    return response;
  }

  /**
   * Register a new custom domain for white-labeling
   */
  @Post('api/domains/request')
  async requestCustomDomain(
    @Body() body: { domain: string; tenantId: string },
  ) {
    if (!body.domain || !body.tenantId) {
      throw new BadRequestException('Domain and tenantId are required');
    }
    const record = await this.domainWorker.registerCustomDomain(body.domain, body.tenantId);
    return {
      success: true,
      message: 'Custom domain registered. DNS polling active.',
      data: record,
      instructions: {
        recordType: 'CNAME',
        host: body.domain,
        target: 'ingress.eduos.app',
        ttl: '300 (or Automatic)',
      },
    };
  }

  /**
   * Get domain propagation & SSL status
   */
  @Get('api/domains/status/:domain')
  getDomainStatus(@Param('domain') domain: string) {
    const record = this.domainWorker.getDomain(domain);
    if (!record) {
      throw new NotFoundException(`Domain ${domain} not registered in EduOS`);
    }
    return {
      success: true,
      data: record,
    };
  }

  /**
   * Trigger immediate manual re-check
   */
  @Post('api/domains/verify-now')
  async verifyDomainNow(@Body() body: { domain: string }) {
    if (!body.domain) {
      throw new BadRequestException('Domain is required');
    }
    const updated = await this.domainWorker.verifyDomainImmediate(body.domain);
    if (!updated) {
      throw new NotFoundException(`Domain ${body.domain} not found`);
    }
    return {
      success: true,
      message: updated.sslStatus === 'active_secured'
        ? 'DNS and SSL Certificate successfully verified and active.'
        : 'DNS check completed. Status updated.',
      data: updated,
    };
  }

  /**
   * Catalog of all registered domains (Super Admin)
   */
  @Get('api/domains/catalog')
  getAllDomains() {
    const domains = this.domainWorker.getAllDomains();
    return {
      success: true,
      total: domains.length,
      data: domains,
    };
  }

  /**
   * Download or inspect generated Nginx Reverse Proxy VHost config
   */
  @Get('api/domains/nginx-config/:domain')
  @Header('Content-Type', 'text/plain')
  getNginxConfig(@Param('domain') domain: string): string {
    const record = this.domainWorker.getDomain(domain);
    if (!record) {
      throw new NotFoundException(`Domain ${domain} not found`);
    }
    return this.sslProvisioner.generateNginxVhost(record.domain, record.tenantId);
  }
}

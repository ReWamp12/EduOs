import { Module } from '@nestjs/common';
import { DnsService } from './dns.service';
import { SslProvisionerService } from './ssl-provisioner.service';
import { DomainWorkerService } from './domain-worker.service';
import { DomainController } from './domain.controller';

@Module({
  controllers: [DomainController],
  providers: [DnsService, SslProvisionerService, DomainWorkerService],
  exports: [DnsService, SslProvisionerService, DomainWorkerService],
})
export class DnsSslModule {}

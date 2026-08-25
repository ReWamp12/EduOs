import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit/audit.service';
import { EventBusService } from './events/event-bus.service';
import { WorkflowService } from './workflow/workflow.service';
import { SupabaseService } from '../supabase.service';

@Global()
@Module({
  providers: [AuditService, EventBusService, WorkflowService, SupabaseService],
  exports: [AuditService, EventBusService, WorkflowService, SupabaseService],
})
export class CommonServicesModule {}

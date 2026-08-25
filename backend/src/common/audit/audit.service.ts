import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase.service';

export interface AuditEntry {
  tenantId: string;
  actorId?: string;
  actorRole: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'view_sensitive' | 'export';
  module: string;
  entityType?: string;
  recordId?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Records a mutation or access audit entry into the immutable audit ledger.
   */
  async log(entry: AuditEntry): Promise<void> {
    this.logger.log(
      `[AUDIT] Tenant: ${entry.tenantId} | Actor: ${entry.actorRole} (${entry.actorId || 'anon'}) | Action: ${entry.action} on ${entry.module}/${entry.entityType || 'record'}:${entry.recordId || '-'}`,
    );

    if (!this.supabaseService.isConfigured()) {
      return;
    }

    try {
      const client = this.supabaseService.getClient();
      const { error } = await client.from('audit_logs').insert([
        {
          tenant_id: entry.tenantId,
          actor_id: entry.actorId || null,
          actor_role: entry.actorRole,
          action: entry.action,
          module: entry.module,
          entity_type: entry.entityType || null,
          record_id: entry.recordId || null,
          before_state: entry.beforeState || null,
          after_state: entry.afterState || null,
          ip_address: entry.ipAddress || null,
          user_agent: entry.userAgent || null,
        },
      ]);

      if (error) {
        this.logger.error(`Failed to persist audit log: ${error.message}`, error);
      }
    } catch (err: any) {
      this.logger.error(`Exception while writing audit log: ${err.message}`);
    }
  }

  /**
   * Specifically logs sensitive read events (e.g. POCSO / POSH / Legal Complaint views)
   * required by Part 4 statutory compliance.
   */
  async logSensitiveView(
    tenantId: string,
    actorId: string,
    actorRole: string,
    module: string,
    recordId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      tenantId,
      actorId,
      actorRole,
      action: 'view_sensitive',
      module,
      recordId,
      ipAddress,
    });
  }
}

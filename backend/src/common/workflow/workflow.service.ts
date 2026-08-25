import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase.service';
import { EventBusService } from '../events/event-bus.service';
import { AuditService } from '../audit/audit.service';

export interface WorkflowStepConfig {
  step: number;
  role: string;
  name: string;
  sla_hours?: number;
}

export interface WorkflowActionParams {
  tenantId: string;
  requestId: string;
  actorId: string;
  actorRole: string;
  action: 'approve' | 'reject' | 'escalate';
  remarks?: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private supabaseService: SupabaseService,
    private eventBus: EventBusService,
    private auditService: AuditService,
  ) {}

  /**
   * Initiates a new multi-step approval workflow for an entity.
   */
  async initiateWorkflow(params: {
    tenantId: string;
    workflowCode: string;
    entityType: string;
    entityId: string;
    requesterId: string;
    requesterRole: string;
    initialRemarks?: string;
  }): Promise<{ id: string; status: string; currentStep: number }> {
    this.logger.log(
      `[WORKFLOW] Starting '${params.workflowCode}' for ${params.entityType}:${params.entityId} by ${params.requesterId}`,
    );

    const historyEntry = {
      actor_id: params.requesterId,
      role: params.requesterRole,
      action: 'initiate',
      remarks: params.initialRemarks || 'Workflow initiated',
      timestamp: new Date().toISOString(),
    };

    if (!this.supabaseService.isConfigured()) {
      return { id: crypto.randomUUID(), status: 'pending', currentStep: 1 };
    }

    const client = this.supabaseService.getClient();

    // Fetch definition to determine initial role
    const { data: def } = await client
      .from('workflow_definitions')
      .select('steps_config')
      .eq('workflow_code', params.workflowCode)
      .single();

    const steps: WorkflowStepConfig[] = def?.steps_config || [{ step: 1, role: 'principal', name: 'Standard Approval' }];
    const firstStep = steps[0];

    const { data, error } = await client
      .from('workflow_requests')
      .insert([
        {
          tenant_id: params.tenantId,
          workflow_code: params.workflowCode,
          entity_type: params.entityType,
          entity_id: params.entityId,
          current_step: 1,
          status: 'pending',
          requester_id: params.requesterId,
          assigned_role: firstStep.role,
          history_log: [historyEntry],
        },
      ])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to initiate workflow: ${error.message}`);
    }

    await this.auditService.log({
      tenantId: params.tenantId,
      actorId: params.requesterId,
      actorRole: params.requesterRole,
      action: 'create',
      module: 'workflow',
      entityType: params.entityType,
      recordId: params.entityId,
      afterState: data,
    });

    return { id: data.id, status: data.status, currentStep: data.current_step };
  }

  /**
   * Action a workflow step (Approve or Reject).
   */
  async actionStep(params: WorkflowActionParams): Promise<{ status: string; currentStep: number }> {
    if (!this.supabaseService.isConfigured()) {
      return { status: params.action === 'approve' ? 'approved' : 'rejected', currentStep: 1 };
    }

    const client = this.supabaseService.getClient();

    const { data: req, error: fetchErr } = await client
      .from('workflow_requests')
      .select('*')
      .eq('id', params.requestId)
      .eq('tenant_id', params.tenantId)
      .single();

    if (fetchErr || !req) {
      throw new NotFoundException(`Workflow request '${params.requestId}' not found.`);
    }

    if (req.status !== 'pending') {
      throw new BadRequestException(`Cannot action workflow with status '${req.status}'.`);
    }

    // Fetch steps config
    const { data: def } = await client
      .from('workflow_definitions')
      .select('steps_config')
      .eq('workflow_code', req.workflow_code)
      .single();

    const steps: WorkflowStepConfig[] = def?.steps_config || [{ step: 1, role: 'principal', name: 'Approval' }];
    const currentStepConfig = steps.find((s) => s.step === req.current_step);

    // Permission check: actor must match assigned role or be super_admin
    if (params.actorRole !== 'super_admin' && currentStepConfig && params.actorRole !== currentStepConfig.role) {
      throw new BadRequestException(
        `Step ${req.current_step} requires role '${currentStepConfig.role}', but actor is '${params.actorRole}'.`,
      );
    }

    const newHistory = [
      ...(req.history_log || []),
      {
        actor_id: params.actorId,
        role: params.actorRole,
        action: params.action,
        remarks: params.remarks || '',
        timestamp: new Date().toISOString(),
      },
    ];

    let newStatus = req.status;
    let nextStep = req.current_step;
    let nextRole = req.assigned_role;

    if (params.action === 'reject') {
      newStatus = 'rejected';
    } else if (params.action === 'approve') {
      if (req.current_step >= steps.length) {
        newStatus = 'approved';
      } else {
        nextStep = req.current_step + 1;
        const nextStepConfig = steps.find((s) => s.step === nextStep);
        nextRole = nextStepConfig?.role || null;
      }
    }

    const { error: updateErr } = await client
      .from('workflow_requests')
      .update({
        status: newStatus,
        current_step: nextStep,
        assigned_role: nextRole,
        history_log: newHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.id);

    if (updateErr) {
      throw new BadRequestException(`Failed to update workflow: ${updateErr.message}`);
    }

    await this.auditService.log({
      tenantId: params.tenantId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: 'approve',
      module: 'workflow',
      entityType: req.entity_type,
      recordId: req.entity_id,
      afterState: { status: newStatus, currentStep: nextStep },
    });

    return { status: newStatus, currentStep: nextStep };
  }
}

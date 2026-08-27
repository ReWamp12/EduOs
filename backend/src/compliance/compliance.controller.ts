import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { SupabaseService } from '../supabase.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';

@ApiTags('Compliance & Statutory Registers (Part 7 §7.5)')
@ApiBearerAuth('jwt-auth')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant UUID' })
@Controller('api/v1/compliance')
@UseGuards(PermissionsGuard)
export class ComplianceController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('documents')
  @ApiOperation({ summary: 'Get statutory certificates and compliance documents vault' })
  @RequirePermission({ module: 'compliance', action: 'statutory_vault.view' })
  async getComplianceDocuments() {
    const client = this.supabaseService.getClient();
    if (!client) return [];
    const { data, error } = await client
      .from('compliance_documents')
      .select('*')
      .eq('is_deleted', false)
      .order('expiry_date', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  @Get('cases')
  @ApiOperation({ summary: 'Get restricted POCSO/POSH grievance cases (restricted to committee & admin)' })
  @RequirePermission({ module: 'compliance', action: 'pocso_posh_vault.view', scope: 'tenant' })
  async getComplaintCases() {
    const client = this.supabaseService.getClient();
    if (!client) return [];
    const { data, error } = await client
      .from('complaint_cases')
      .select('*')
      .eq('is_deleted', false)
      .order('reported_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  @Get('smc-minutes')
  @ApiOperation({ summary: 'Get School Management Committee (SMC) meetings and minutes' })
  @RequirePermission({ module: 'governance', action: 'smc_minutes.view' })
  async getSmcMinutes() {
    const client = this.supabaseService.getClient();
    if (!client) return [];
    const { data, error } = await client
      .from('smc_minutes')
      .select('*')
      .eq('is_deleted', false)
      .order('meeting_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  @Get('udise')
  @ApiOperation({ summary: 'Get UDISE+ annual statutory submission records' })
  @RequirePermission({ module: 'compliance', action: 'udise.export' })
  async getUdiseRecords() {
    const client = this.supabaseService.getClient();
    if (!client) return [];
    const { data, error } = await client
      .from('udise_records')
      .select('*')
      .eq('is_deleted', false)
      .order('academic_year', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }
}

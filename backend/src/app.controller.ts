import { Controller, Get, Post, Put, Param, Body, Logger } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import * as mock from './mockData';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('student/overview/:id')
  async getStudentOverview(@Param('id') studentId: string) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('students')
          .select(`
            id,
            user_id,
            roll_number,
            admission_number,
            parent_name,
            parent_phone,
            qr_code_id,
            user_profiles (
              first_name,
              last_name,
              email,
              avatar_url
            ),
            batches (
              id,
              name,
              target_exam
            )
          `)
          .eq('id', studentId)
          .single();

        if (!error && data) {
          const studentData = data as any;
          const profile = studentData.user_profiles;
          const batch = studentData.batches;
          return {
            id: studentData.id,
            userId: studentData.user_id,
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
            email: profile?.email || '',
            rollNumber: studentData.roll_number,
            admissionNumber: studentData.admission_number || '',
            batchId: batch?.id || '',
            batchName: batch?.name || 'Unassigned Batch',
            targetExam: batch?.target_exam || 'General',
            attendancePct: 93.8,
            rankInBatch: 4,
            parentName: studentData.parent_name || 'Parent',
            parentPhone: studentData.parent_phone || '',
            qrCodeId: studentData.qr_code_id || '',
            avatarUrl: profile?.avatar_url || '/placeholder-avatar.jpg',
          };
        }
        this.logger.warn('Supabase query returned empty. Falling back to mock data.');
      } catch (err) {
        this.logger.error('Failed to query Supabase, fallback to mock data.', err);
      }
    }
    return mock.mockCurrentStudent;
  }

  @Get('teacher/timetable/:id')
  async getTeacherTimetable(@Param('id') teacherId: string) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('timetable_slots')
          .select('*')
          .eq('mentor_teacher_id', teacherId);

        if (!error && data) {
          return data.map((slot: any) => ({
            id: slot.id,
            dayOfWeek: slot.day_of_week,
            periodNumber: slot.period_number,
            startTime: slot.start_time,
            endTime: slot.end_time,
            subjectName: slot.subject_name || 'Subject',
            subjectColor: slot.subject_color || '#4F46E5',
            teacherName: slot.teacher_name || 'Faculty',
            roomNumber: slot.room_number || 'Hall 101',
            batchId: slot.batch_id || '',
          }));
        }
      } catch (err) {
        this.logger.error('Failed to query Supabase, fallback to mock data.', err);
      }
    }
    return mock.mockTimetable;
  }

  @Get('tenants')
  async getTenants() {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            name: t.name,
            subdomain: t.subdomain,
            institutionType: t.institution_type,
            primaryColor: t.primary_color,
            secondaryColor: t.secondary_color,
            accentColor: t.accent_color,
            logoUrl: t.logo_url,
            tagline: t.tagline,
          }));
        }
      } catch (err) {
        this.logger.error('Failed to query Supabase.', err);
      }
    }
    return [
      {
        id: 't-1',
        name: 'Apex Institute of Science (Offline Mode)',
        subdomain: 'apex',
        institutionType: 'coaching',
        primaryColor: '#4F46E5',
        secondaryColor: '#06B6D4',
        accentColor: '#F59E0B',
      },
    ];
  }

  @Post('tenants')
  async createTenant(@Body() body: any) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('tenants')
          .insert({
            name: body.name,
            subdomain: body.subdomain,
            institution_type: body.institutionType,
            primary_color: body.primaryColor,
            secondary_color: body.secondaryColor,
            accent_color: body.accentColor,
          })
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        this.logger.error('Failed to create tenant in Supabase.', err);
      }
    }
    return {
      id: `tenant-${Date.now()}`,
      ...body,
    };
  }

  @Put('tenants/:id/branding')
  async updateTenantBranding(@Param('id') tenantId: string, @Body() body: any) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { error } = await client
          .from('tenants')
          .update({
            primary_color: body.primaryColor,
            secondary_color: body.secondaryColor,
            accent_color: body.accentColor,
            name: body.name,
          })
          .eq('id', tenantId);

        return { success: !error };
      } catch (err) {
        this.logger.error('Failed to update tenant branding in Supabase.', err);
      }
    }
    return { success: true };
  }

  @Get('leaves')
  async getLeaveRequests() {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('leave_requests')
          .select('*')
          .order('applied_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        this.logger.error('Failed to fetch leave requests.', err);
      }
    }
    return mock.mockLeaveRequests;
  }
}

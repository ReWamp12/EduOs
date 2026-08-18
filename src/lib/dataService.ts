import { supabase, isSupabaseConfigured } from './supabase';
import * as mock from './mockData';
import { Student, TimetableSlot, Tenant, LeaveRequest } from './types';

export const dataService = {
  // --- Student Portal ---
  async getStudentOverview(studentId: string): Promise<Student> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
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
          attendancePct: 93.8, // Mocked fallback metric
          rankInBatch: 4,
          parentName: studentData.parent_name || 'Parent',
          parentPhone: studentData.parent_phone || '',
          qrCodeId: studentData.qr_code_id || '',
          avatarUrl: profile?.avatar_url || '/placeholder-avatar.jpg',
        };
      }
      console.warn('Supabase query failed or returned empty. Falling back to mock data.', error);
    }
    return Promise.resolve(mock.mockCurrentStudent);
  },

  // --- Teacher / Faculty Portal ---
  async getTeacherTimetable(teacherId: string): Promise<TimetableSlot[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
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
      console.warn('Supabase query failed. Falling back to mock data.', error);
    }
    return Promise.resolve(mock.mockTimetable);
  },

  // --- Super Admin Portal ---
  async getTenants(): Promise<Tenant[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((t: any) => ({
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          institutionType: t.institution_type as any,
          primaryColor: t.primary_color,
          secondaryColor: t.secondary_color,
          accentColor: t.accent_color,
          logoUrl: t.logo_url,
          tagline: t.tagline,
        }));
      }
      console.warn('Supabase query failed. Falling back to mock data.', error);
    }
    return Promise.resolve([
      {
        id: 't-1',
        name: 'Apex Institute of Science',
        subdomain: 'apex',
        institutionType: 'coaching',
        primaryColor: '#4F46E5',
        secondaryColor: '#06B6D4',
        accentColor: '#F59E0B',
      },
      {
        id: 't-2',
        name: 'Greenwood World School',
        subdomain: 'greenwood',
        institutionType: 'school',
        primaryColor: '#10B981',
        secondaryColor: '#3B82F6',
        accentColor: '#EF4444',
      },
    ]);
  },

  async createTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: tenant.name,
          subdomain: tenant.subdomain,
          institution_type: tenant.institutionType,
          primary_color: tenant.primaryColor,
          secondary_color: tenant.secondaryColor,
          accent_color: tenant.accentColor,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          subdomain: data.subdomain,
          institutionType: data.institution_type as any,
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          accentColor: data.accent_color,
        };
      }
      console.error('Supabase write error:', error);
    }
    // Static Fallback
    return Promise.resolve({
      id: `tenant-${Date.now()}`,
      ...tenant,
    });
  },

  async updateTenantBranding(tenantId: string, updates: Partial<Tenant>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('tenants')
        .update({
          primary_color: updates.primaryColor,
          secondary_color: updates.secondaryColor,
          accent_color: updates.accentColor,
          name: updates.name,
        })
        .eq('id', tenantId);

      if (!error) return true;
      console.error('Supabase update error:', error);
      return false;
    }
    return Promise.resolve(true);
  },

  // --- Principal Portal Leave Approvals ---
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('applied_at', { ascending: false });

      if (!error && data) {
        return data;
      }
    }
    return Promise.resolve(mock.mockLeaveRequests);
  },
};

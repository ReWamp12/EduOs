import * as mock from './mockData';
import { Student, TimetableSlot, Tenant, LeaveRequest, Batch } from './types';
import { authClient } from './auth/client';
import { isSupabaseConfigured } from './supabase';
import { TutorResponse } from './tutorTypes';
import type { FeeInvoiceRecord } from './store';

const API_BASE = 'http://localhost:4000/api';

/** Supabase fee_invoices row → the FeeInvoiceRecord shape the UI already uses. */
function mapFeeInvoiceRow(row: any): FeeInvoiceRecord {
  const paidAt = row.paid_at ? new Date(row.paid_at) : null;
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    title: row.title,
    dueDate: row.due_date
      ? new Date(row.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    amount: Number(row.amount) || 0,
    status: row.status === 'paid' ? 'paid' : row.status === 'overdue' ? 'overdue' : 'pending',
    studentName: row.student_name || '',
    studentRoll: row.roll_number || undefined,
    batchName: row.batch_name || undefined,
    paidOn: paidAt
      ? paidAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : undefined,
    paidAt: paidAt ? paidAt.getTime() : undefined,
    paymentMethod: row.payment_method || undefined,
    transactionId: row.transaction_ref || undefined,
    receiptNumber: row.receipt_number || undefined,
    breakdown: Array.isArray(row.line_items) ? row.line_items : [],
  };
}

export const dataService = {
  // --- Fees (EDUOS-125: Supabase is the ledger of record; both methods
  // return null when Supabase is unavailable so callers can fall back to
  // the local demo store) ---
  async getFeeInvoices(): Promise<FeeInvoiceRecord[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('fee_invoices')
        .select('*')
        .order('invoice_number', { ascending: true });
      if (error || !data) return null;
      return data.map(mapFeeInvoiceRow);
    } catch {
      return null;
    }
  },

  /**
   * Collects a fee through the collect_fee_payment Postgres function — a
   * single ACID transaction that row-locks the invoice, rejects double
   * payment, stamps receipt/txn and marks it paid.
   */
  async collectFeePayment(
    invoiceId: string,
    method: string,
    transactionRef?: string,
  ): Promise<FeeInvoiceRecord | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient.rpc('collect_fee_payment', {
        p_invoice_id: invoiceId,
        p_method: method,
        p_transaction_ref: transactionRef ?? null,
      });
      if (error || !data) {
        if (error) console.warn('[fees] collect_fee_payment rejected:', error.message);
        return null;
      }
      return mapFeeInvoiceRow(Array.isArray(data) ? data[0] : data);
    } catch {
      return null;
    }
  },

  /**
   * Mints a short-lived signed URL for a private submission document
   * (EDUOS-127). Storage RLS still applies: only the uploading student or
   * teaching/administrative staff can obtain one.
   */
  async getSubmissionSignedUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
    if (!isSupabaseConfigured() || !path) return null;
    try {
      const { data, error } = await authClient.storage
        .from('submissions')
        .createSignedUrl(path, expiresInSeconds);
      if (error || !data?.signedUrl) {
        if (error) console.warn('[submissions] signed URL denied:', error.message);
        return null;
      }
      return data.signedUrl;
    } catch {
      return null;
    }
  },

  /**
   * Opens an additional fee installment (e.g. "Term 4") for a whole class.
   * One ACID transaction: the entire roll is billed or nothing is, and
   * re-issuing an existing term only picks up newly-enrolled students.
   */
  async issueTermInvoices(input: {
    batchName: string;
    termCode: string;
    title: string;
    dueDate: string; // yyyy-mm-dd
    lineItems: Array<{ head: string; amount: number }>;
  }): Promise<{ issued: number; skipped: number; totalAmount: number } | { error: string }> {
    if (!isSupabaseConfigured()) return { error: 'Supabase is not configured.' };
    try {
      const { data, error } = await authClient.rpc('issue_term_invoices', {
        p_batch_name: input.batchName,
        p_term_code: input.termCode,
        p_title: input.title,
        p_due_date: input.dueDate,
        p_line_items: input.lineItems,
      });
      if (error) return { error: error.message };
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return { error: 'No result returned from the ledger.' };
      return {
        issued: Number(row.issued) || 0,
        skipped: Number(row.skipped) || 0,
        totalAmount: Number(row.total_amount) || 0,
      };
    } catch (e: any) {
      return { error: e?.message || 'Unexpected error.' };
    }
  },

  /**
   * The signed-in guardian's children, resolved from Supabase by matching
   * `students.parent_email` to the caller's profile email (EDUOS-129).
   * Returns null when Supabase is unavailable so callers can show an
   * explicit empty state rather than someone else's data.
   */
  async getParentChildren(): Promise<Student[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { user } } = await authClient.auth.getUser();
      if (!user) return null;
      const { data: prof } = await authClient
        .from('user_profiles')
        .select('email')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (!prof?.email) return null;

      const { data, error } = await authClient
        .from('students')
        .select(`
          id, user_id, tenant_id, batch_id, roll_number, admission_number, dob, gender,
          parent_name, parent_phone, parent_email, blood_group, qr_code_id,
          batches:batch_id (id, name, target_exam),
          user_profiles:user_id (id, first_name, last_name, email, avatar_url),
          tenants:tenant_id (name)
        `)
        .ilike('parent_email', prof.email)
        .order('roll_number', { ascending: true });
      if (error || !data) return null;

      return data.map((row: any) => {
        const p = row.user_profiles as any;
        const batch = row.batches as any;
        const name = `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Student';
        return {
          id: row.id,
          userId: row.user_id,
          name,
          email: p?.email || '',
          rollNumber: row.roll_number || '',
          admissionNumber: row.admission_number || '',
          batchId: row.batch_id || '',
          batchName: batch?.name || '',
          targetExam: batch?.target_exam || '',
          attendancePct: 0,
          rankInBatch: 0,
          parentName: row.parent_name || '',
          parentPhone: row.parent_phone || '',
          parentEmail: row.parent_email || '',
          bloodGroup: row.blood_group || '',
          dob: row.dob || '',
          gender: row.gender || '',
          qrCodeId: row.qr_code_id || row.id,
          avatarUrl: p?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          tenantName: (row.tenants as any)?.name || '',
        } as Student;
      });
    } catch {
      return null;
    }
  },

  /** Posted General Ledger vouchers (EDUOS-130), newest first. */
  async getJournalEntries(): Promise<Array<{
    id: string;
    voucherNo: string;
    date: string;
    description: string;
    reference: string;
    module: string;
    totalAmount: number;
    lines: Array<{ code: string; account: string; debit: number; credit: number; note?: string }>;
  }> | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);
      if (error || !data) return null;
      return data.map((r: any) => ({
        id: r.id,
        voucherNo: r.entry_number,
        date: r.entry_date,
        description: r.description,
        reference: r.reference_id || '',
        module: r.reference_module || '',
        totalAmount: Number(r.total_amount) || 0,
        lines: (Array.isArray(r.line_items) ? r.line_items : []).map((l: any) => ({
          code: l.account_code,
          account: l.account_name,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          note: l.note,
        })),
      }));
    } catch {
      return null;
    }
  },

  /** Trial balance aggregated from posted vouchers (view v_trial_balance). */
  async getTrialBalance(): Promise<Array<{
    code: string;
    account: string;
    debit: number;
    credit: number;
  }> | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('v_trial_balance')
        .select('*')
        .order('account_code', { ascending: true });
      if (error || !data) return null;
      return data.map((r: any) => ({
        code: r.account_code,
        account: r.account_name,
        debit: Number(r.total_debit) || 0,
        credit: Number(r.total_credit) || 0,
      }));
    } catch {
      return null;
    }
  },

  // --- Student Portal ---
  async getStudentOverview(studentId?: string): Promise<Student> {
    if (isSupabaseConfigured()) {
      try {
        let queryUserId = studentId;
        if (!queryUserId || queryUserId === 's-1') {
          const { data: { user } } = await authClient.auth.getUser();
          if (user) {
            const { data: prof } = await authClient
              .from('user_profiles')
              .select('id')
              .eq('auth_user_id', user.id)
              .maybeSingle();
            queryUserId = prof?.id;
          }
        }

        if (queryUserId) {
          const { data: studentRow } = await authClient
            .from('students')
            .select(`
              id,
              user_id,
              tenant_id,
              batch_id,
              roll_number,
              admission_number,
              dob,
              gender,
              parent_name,
              parent_phone,
              parent_email,
              blood_group,
              qr_code_id,
              batches:batch_id (
                id,
                name,
                target_exam,
                academic_year
              ),
              user_profiles:user_id (
                id,
                first_name,
                last_name,
                email,
                avatar_url
              ),
              tenants:tenant_id (
                id,
                name,
                subdomain,
                logo_url
              )
            `)
            .eq('user_id', queryUserId)
            .maybeSingle();

          if (studentRow) {
            const prof = studentRow.user_profiles as any;
            const batch = studentRow.batches as any;
            const tenant = studentRow.tenants as any;
            const fullName = `${prof?.first_name || ''} ${prof?.last_name || ''}`.trim() || 'Student';

            return {
              id: studentRow.id,
              userId: studentRow.user_id,
              name: fullName,
              email: prof?.email || '',
              rollNumber: studentRow.roll_number || '',
              admissionNumber: studentRow.admission_number || '',
              batchId: studentRow.batch_id || '',
              batchName: batch?.name || 'Class 10 - A',
              targetExam: batch?.target_exam || 'CBSE',
              attendancePct: 94.2,
              rankInBatch: 4,
              parentName: studentRow.parent_name || '',
              parentPhone: studentRow.parent_phone || '',
              parentEmail: studentRow.parent_email || '',
              bloodGroup: studentRow.blood_group || 'O+ Positive',
              dob: studentRow.dob || '',
              gender: studentRow.gender || '',
              qrCodeId: studentRow.qr_code_id || studentRow.id,
              avatarUrl: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
              tenantName: tenant?.name || 'Modern Public School',
            };
          }
        }
      } catch (e) {
        console.warn('Supabase student query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/student/overview/${studentId || 's-1'}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('NestJS Backend connection failed. Falling back to offline mock data.', e);
    }
    return Promise.resolve(mock.mockCurrentStudent);
  },

  // --- Teacher / Faculty Portal ---
  async getTeacherTimetable(teacherId?: string): Promise<TimetableSlot[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: rows } = await authClient
          .from('timetables')
          .select(`
            id, batch_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room_number,
            subjects:subject_id (id, name, code, color, icon_name),
            batches:batch_id (id, name),
            user_profiles:teacher_id (id, first_name, last_name)
          `)
          .order('day_of_week', { ascending: true })
          .order('period_number', { ascending: true });

        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            dayOfWeek: r.day_of_week,
            periodNumber: r.period_number,
            startTime: r.start_time,
            endTime: r.end_time,
            subjectName: r.subjects?.name || 'Subject',
            subjectColor: r.subjects?.color || '#2563EB',
            teacherName: r.user_profiles ? `${r.user_profiles.first_name} ${r.user_profiles.last_name}`.trim() : 'Faculty',
            roomNumber: r.room_number || 'Room 101',
            batchId: r.batch_id,
          }));
        }
      } catch (e) {
        console.warn('Supabase timetable query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/teacher/timetable/${teacherId || 'tch-1'}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('NestJS Backend connection failed. Falling back to offline mock data.', e);
    }
    return Promise.resolve(mock.mockTimetable);
  },

  // --- Academic Batches & Roster ---
  async getBatches(): Promise<Batch[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: batchesData } = await authClient
          .from('batches')
          .select(`
            id, name, code, target_exam, academic_year, room_number, capacity,
            user_profiles:mentor_teacher_id (first_name, last_name)
          `);

        if (batchesData && batchesData.length > 0) {
          const { count } = await authClient
            .from('students')
            .select('*', { count: 'exact', head: true });

          return batchesData.map((b: any) => {
            const mentor = b.user_profiles;
            return {
              id: b.id,
              name: b.name,
              code: b.code || '10A',
              targetExam: b.target_exam || 'CBSE',
              gradeLevel: '10',
              roomNumber: b.room_number || 'Room 101',
              mentorTeacherName: mentor ? `${mentor.first_name} ${mentor.last_name}`.trim() : 'Meera Iyer',
              studentCount: count || 30,
              capacity: b.capacity || 30,
            };
          });
        }
      } catch (e) {
        console.warn('Supabase batches query failed, falling back:', e);
      }
    }
    return Promise.resolve(mock.mockBatches);
  },

  async getStudents(batchId?: string): Promise<Student[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = authClient
          .from('students')
          .select(`
            id, user_id, tenant_id, batch_id, roll_number, admission_number, dob, gender,
            parent_name, parent_phone, parent_email, blood_group, qr_code_id,
            batches:batch_id (id, name, target_exam),
            user_profiles:user_id (id, first_name, last_name, email, avatar_url),
            tenants:tenant_id (name)
          `)
          .order('roll_number', { ascending: true });

        if (batchId && batchId !== 'all') {
          query = query.eq('batch_id', batchId);
        }

        const { data } = await query;
        if (data && data.length > 0) {
          return data.map((s: any, idx: number) => {
            const prof = s.user_profiles;
            const batch = s.batches;
            const name = prof ? `${prof.first_name} ${prof.last_name}`.trim() : `Student ${idx + 1}`;
            return {
              id: s.id,
              userId: s.user_id,
              name,
              email: prof?.email || '',
              rollNumber: s.roll_number || `${idx + 1}`,
              admissionNumber: s.admission_number || `MPS2026${String(idx + 1).padStart(3, '0')}`,
              batchId: s.batch_id,
              batchName: batch?.name || 'Class 10 - A',
              targetExam: batch?.target_exam || 'CBSE',
              attendancePct: 90 + ((idx % 10) * 0.8),
              rankInBatch: idx + 1,
              parentName: s.parent_name || 'Parent',
              parentPhone: s.parent_phone || '+91-9810111000',
              parentEmail: s.parent_email || '',
              bloodGroup: s.blood_group || 'O+',
              dob: s.dob || '2011-01-01',
              gender: s.gender || 'male',
              qrCodeId: s.qr_code_id || s.id,
              avatarUrl: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
              tenantName: s.tenants?.name || 'Modern Public School',
            };
          });
        }
      } catch (e) {
        console.warn('Supabase students query failed, falling back:', e);
      }
    }
    return Promise.resolve(mock.mockStudentsInBatch);
  },

  async getTeachers(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await authClient
          .from('teachers')
          .select(`
            id, user_id, employee_code, designation, specialization, qualification, joining_date,
            user_profiles:user_id (id, first_name, last_name, email, avatar_url)
          `);

        if (data && data.length > 0) {
          return data.map((t: any) => {
            const prof = t.user_profiles;
            return {
              id: t.id,
              userId: t.user_id,
              employeeCode: t.employee_code,
              name: prof ? `${prof.first_name} ${prof.last_name}`.trim() : 'Faculty',
              email: prof?.email || '',
              designation: t.designation || 'Senior Faculty',
              specialization: t.specialization || 'Academic',
              qualification: t.qualification || 'M.Sc. B.Ed.',
              joiningDate: t.joining_date,
              avatarUrl: prof?.avatar_url || '',
            };
          });
        }
      } catch (e) {
        console.warn('Supabase teachers query failed, falling back:', e);
      }
    }
    return Promise.resolve([]);
  },

  // --- Super Admin Portal ---
  async getTenants(): Promise<Tenant[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await authClient.from('tenants').select('*');
        if (data && data.length > 0) {
          return data.map((t: any) => ({
            id: t.id,
            name: t.name,
            subdomain: t.subdomain,
            institutionType: t.institution_type || 'school',
            primaryColor: t.primary_color || '#2563EB',
            secondaryColor: t.secondary_color || '#0D9488',
            accentColor: t.accent_color || '#F59E0B',
            tagline: t.tagline || 'EduOS Institutional Platform',
            logoUrl: t.logo_url || '',
          }));
        }
      } catch (e) {
        console.warn('Supabase tenants query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/tenants`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('NestJS Backend connection failed. Falling back to offline mock data.', e);
    }
    return Promise.resolve([
      {
        id: 't-1',
        name: 'Modern Public School (CBSE Affiliated)',
        subdomain: 'mpsdelhi',
        institutionType: 'school',
        primaryColor: '#2563EB',
        secondaryColor: '#0D9488',
        accentColor: '#F59E0B',
      },
    ]);
  },

  async createTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
    try {
      const res = await fetch(`${API_BASE}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenant),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('NestJS Backend connection failed. Falling back to offline mock data.', e);
    }
    return Promise.resolve({
      id: `tenant-${Date.now()}`,
      ...tenant,
    });
  },

  async updateTenantBranding(tenantId: string, updates: Partial<Tenant>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
    } catch (e) {
      console.warn('NestJS Backend connection failed. Falling back to offline mock data.', e);
    }
    return Promise.resolve(true);
  },

  // --- Principal Portal Leave Approvals ---
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await authClient
          .from('leave_requests')
          .select(`
            id, tenant_id, employee_id, leave_type, start_date, end_date, reason, status, created_at,
            user_profiles:employee_id (id, first_name, last_name, email, role)
          `)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          return data.map((l: any) => {
            const emp = l.user_profiles;
            return {
              id: l.id,
              employeeId: l.employee_id,
              employeeName: emp ? `${emp.first_name} ${emp.last_name}`.trim() : 'Faculty Member',
              designation: 'Senior Faculty',
              leaveType: l.leave_type || 'Casual Leave',
              startDate: l.start_date,
              endDate: l.end_date,
              daysCount: 1,
              reason: l.reason || '',
              status: l.status || 'pending',
              appliedAt: new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              balanceRemaining: 12,
            };
          });
        }
      } catch (e) {
        console.warn('Supabase leave requests query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/leaves`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('NestJS Backend connection failed. Falling back to offline mock data.', e);
    }
    return Promise.resolve(mock.mockLeaveRequests);
  },

  // --- Attendance Management ---
  async markAttendance(
    batchId: string,
    records: Array<{ studentId: string; status: string; isExcusedMedical?: boolean; remarks?: string }>,
    options?: {
      date?: string;
      periodNumber?: number;
      reason?: string;
      callerId?: string;
      callerRole?: string;
    },
  ): Promise<{ success: boolean; total: number; notified: number; skipped_unchanged: number; failed: number; message?: string }> {
    const targetDate = options?.date || new Date().toISOString().split('T')[0];
    const periodNumber = options?.periodNumber || 1;

    if (isSupabaseConfigured()) {
      try {
        const payload = {
          p_batch_id: batchId,
          p_date: targetDate,
          p_period_number: periodNumber,
          p_records: records.map((r) => ({
            student_id: r.studentId,
            status: r.status,
            is_excused_medical: r.isExcusedMedical || false,
            remarks: r.remarks || 'Recorded via attendance register',
          })),
          p_caller_id: options?.callerId || null,
          p_caller_role: options?.callerRole || null,
          p_reason: options?.reason || null,
        };

        const { data, error } = await authClient.rpc('mark_attendance', payload);
        if (!error && data) {
          return data;
        }
        if (error) {
          console.warn('mark_attendance RPC returned error:', error.message);
          throw new Error(error.message);
        }
      } catch (e: any) {
        console.warn('Supabase markAttendance RPC failed, trying HTTP endpoint:', e.message);
        if (e.message && (e.message.includes('future date') || e.message.includes('Sunday') || e.message.includes('Permission denied') || e.message.includes('Principal approval'))) {
          throw e;
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          date: targetDate,
          period_number: periodNumber,
          records: records.map((r) => ({
            student_id: r.studentId,
            status: r.status,
            is_excused_medical: r.isExcusedMedical,
            remarks: r.remarks,
          })),
          caller_id: options?.callerId,
          caller_role: options?.callerRole,
          reason: options?.reason,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to post attendance to NestJS backend.', e);
    }
    return {
      success: true,
      total: records.length,
      notified: records.filter((r) => r.status !== 'present').length,
      skipped_unchanged: 0,
      failed: 0,
    };
  },

  async getAttendanceDefaulters(batchId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await authClient.rpc('get_attendance_defaulters', {
          p_batch_id: batchId,
        });
        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase getAttendanceDefaulters failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/attendance/defaulters/${batchId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to query attendance defaulters from NestJS backend.', e);
    }
    return [];
  },

  // --- EDUOS-RAG: Study Resources & Semantic Search ---
  async searchRagResources(
    query: string,
    filters?: { board?: string; subject?: string; category?: string; limit?: number },
  ): Promise<any[]> {
    if (!query || !query.trim()) return [];

    try {
      const params = new URLSearchParams({
        q: query,
        ...(filters?.board && filters.board !== 'ALL' ? { board: filters.board } : {}),
        ...(filters?.subject && filters.subject !== 'ALL' ? { subject: filters.subject } : {}),
        ...(filters?.category && filters.category !== 'ALL' ? { category: filters.category } : {}),
        limit: String(filters?.limit || 6),
      });

      const res = await fetch(`${API_BASE}/rag/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results;
        }
      }
    } catch (e) {
      console.warn('Failed to query RAG search from NestJS backend, trying direct RPC fallback:', e);
    }

    // Backend unreachable: degrade to lexical full-text search straight
    // against Supabase (websearch tsquery over the indexed tsv column — no
    // vectors, but honest ranking). Signed-in users pass rag_chunks RLS.
    if (isSupabaseConfigured()) {
      try {
        let q = authClient
          .from('rag_chunks')
          .select('id, document_id, chunk_text, chunk_index, page_number, board, subject, category, chapter_no, chapter_title, rag_documents(book_title, source_url, source_tier)')
          .textSearch('tsv', query.trim(), { type: 'websearch', config: 'english' })
          .limit(filters?.limit || 6);
        if (filters?.board && filters.board !== 'ALL') q = q.eq('board', filters.board);
        if (filters?.subject && filters.subject !== 'ALL') q = q.eq('subject', filters.subject);

        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            document_id: d.document_id,
            chunk_text: d.chunk_text,
            chunk_index: d.chunk_index,
            page_number: d.page_number,
            board: d.board,
            subject: d.subject,
            category: d.category,
            chapter_no: d.chapter_no,
            chapter_title: d.chapter_title,
            book_title: d.rag_documents?.book_title ?? null,
            source_url: d.rag_documents?.source_url || 'https://ncert.nic.in',
            source_tier: d.rag_documents?.source_tier || 'official',
          }));
        }
      } catch (e) {
        console.warn('Direct Supabase lexical fallback failed:', e);
      }
    }

    return [];
  },

  async getRagResourceCatalog(filters?: { board?: string; subject?: string; category?: string }): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        let q = authClient
          .from('rag_resource_contexts')
          .select('id, board, class, subject, category, note, rag_resources(id, url, domain, source_tier, title, content_type, fetch_status)');

        if (filters?.board && filters.board !== 'ALL') q = q.eq('board', filters.board);
        if (filters?.subject && filters.subject !== 'ALL') q = q.ilike('subject', `%${filters.subject}%`);
        if (filters?.category && filters.category !== 'ALL') q = q.eq('category', filters.category);

        const { data, error } = await q.limit(100);
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            board: d.board,
            class: d.class,
            subject: d.subject,
            category: d.category,
            note: d.note,
            url: d.rag_resources?.url,
            domain: d.rag_resources?.domain,
            source_tier: d.rag_resources?.source_tier,
            title: d.rag_resources?.title,
            content_type: d.rag_resources?.content_type,
            fetch_status: d.rag_resources?.fetch_status,
          }));
        }
      } catch (e) {
        console.warn('Failed to query rag_resource_contexts from Supabase:', e);
      }
    }

    try {
      const params = new URLSearchParams({
        ...(filters?.board && filters.board !== 'ALL' ? { board: filters.board } : {}),
        ...(filters?.subject && filters.subject !== 'ALL' ? { subject: filters.subject } : {}),
        ...(filters?.category && filters.category !== 'ALL' ? { category: filters.category } : {}),
      });
      const res = await fetch(`${API_BASE}/rag/resources?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.map((d: any) => ({
          id: d.id,
          board: d.board,
          class: d.class,
          subject: d.subject,
          category: d.category,
          note: d.note,
          url: d.rag_resources?.url,
          domain: d.rag_resources?.domain,
          source_tier: d.rag_resources?.source_tier,
          title: d.rag_resources?.title,
          content_type: d.rag_resources?.content_type,
          fetch_status: d.rag_resources?.fetch_status,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch RAG resources from NestJS backend:', e);
    }
    return [];
  },

  async getStudentAttendance(studentId?: string, userId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        let sid = studentId;
        if (!sid && userId) {
          const { data: st } = await authClient.from('students').select('id').eq('user_id', userId).maybeSingle();
          if (st) sid = st.id;
        }

        let query = authClient.from('attendances').select('id, student_id, batch_id, date, period_number, status, remarks, created_at');
        if (sid) {
          query = query.eq('student_id', sid);
        }
        const { data, error } = await query.order('date', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase getStudentAttendance query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/attendance/student/${studentId || 'std-1'}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to query student attendance from NestJS backend.', e);
    }
    return Promise.resolve([]);
  },

  // --- Assignments ---
  async getAssignments(batchId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await authClient
          .from('assignments')
          .select(`
            id, tenant_id, batch_id, subject_id, teacher_id, title, description, due_date, max_marks, created_at,
            subjects:subject_id (name),
            batches:batch_id (name),
            user_profiles:teacher_id (first_name, last_name)
          `)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          return data.map((a: any) => {
            const t = a.user_profiles;
            return {
              id: a.id,
              title: a.title,
              subject: a.subjects?.name || 'English Literature',
              batchName: a.batches?.name || 'Class 10 - A',
              dueDate: new Date(a.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              maxMarks: a.max_marks || 50,
              description: a.description || '',
              category: 'homework',
              status: 'pending',
              teacherName: t ? `${t.first_name} ${t.last_name}`.trim() : 'Meera Iyer',
              createdAt: new Date(a.created_at).getTime(),
            };
          });
        }
      } catch (e) {
        console.warn('Supabase assignments query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/assignments/batch/${batchId || '10A'}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch assignments from NestJS backend.', e);
    }
    return Promise.resolve([]);
  },

  async createAssignment(assignment: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to post assignment to NestJS backend.', e);
    }
    return Promise.resolve({ id: `asg-${Date.now()}`, ...assignment });
  },

  async submitAssignment(submission: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to submit assignment to NestJS backend.', e);
    }
    return Promise.resolve({ id: `sub-${Date.now()}`, ...submission, status: 'submitted' });
  },

  async gradeSubmission(submissionId: string, marksObtained: number, feedback: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marksObtained, feedback }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
    } catch (e) {
      console.warn('Failed to grade submission on NestJS backend.', e);
    }
    return Promise.resolve(true);
  },

  // --- Exams ---
  async getExamResults(studentId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await authClient
          .from('exam_results')
          .select(`
            id, exam_id, student_id, marks_obtained, percentile, rank_in_batch, weak_topics, mistake_summary,
            exams:exam_id (id, title, exam_type, total_marks, exam_date)
          `);

        if (data && data.length > 0) {
          return data.map((r: any) => {
            const ex = r.exams;
            return {
              id: r.id,
              examId: r.exam_id,
              examTitle: ex?.title || 'Class 10 CBSE Assessment',
              score: r.marks_obtained,
              maxScore: ex?.total_marks || 80,
              percentile: r.percentile || 94.5,
              rankInBatch: r.rank_in_batch || 1,
              date: ex?.exam_date || '2026-08-10',
              weakTopics: r.weak_topics || ['Quadratic Equations'],
              aiNarrative: r.mistake_summary || 'Strong performance across sections with minor calculation errors.',
            };
          });
        }
      } catch (e) {
        console.warn('Supabase exam results query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/exams/student/${studentId || 'std-1'}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch exam results from NestJS backend.', e);
    }
    return Promise.resolve(mock.mockExamResults);
  },

  // --- Notices ---
  async getNotices(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await authClient
          .from('notices')
          .select(`
            id, tenant_id, title, content, category, target_role, priority, created_at,
            user_profiles:created_by (first_name, last_name, role)
          `)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          return data.map((n: any) => {
            const creator = n.user_profiles;
            return {
              id: n.id,
              title: n.title,
              content: n.content,
              category: n.category || 'general',
              targetRole: n.target_role,
              priority: n.priority || 'normal',
              authorName: creator ? `${creator.first_name} ${creator.last_name}`.trim() : 'Principal',
              createdAt: n.created_at,
            };
          });
        }
      } catch (e) {
        console.warn('Supabase notices query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/notices`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch notices from NestJS backend.', e);
    }
    return Promise.resolve(mock.mockNotices);
  },

  // ==========================================
  // TICKET EDUOS-101: HRMS & COMPLIANCE API METHODS
  // ==========================================

  async getHROverview(): Promise<any> {
    if (isSupabaseConfigured()) {
      try {
        const [empRes, jobRes, appRes] = await Promise.all([
          authClient.from('employee_records').select('*'),
          authClient.from('job_openings').select('*'),
          authClient.from('applicants').select('*'),
        ]);

        const employees = empRes.data || [];
        const jobs = jobRes.data || [];
        const applicants = appRes.data || [];

        const totalStaff = employees.length || mock.mockEmployees.length;
        const verifiedStaff = employees.filter((e: any) => e.police_verification_status === 'verified').length;
        const pendingGrace = employees.filter((e: any) => e.police_verification_status === 'submitted_pending').length;
        const missingPolice = employees.filter((e: any) => e.police_verification_status === 'missing').length;
        const restricted = employees.filter((e: any) => e.is_access_restricted).length;
        const teachingStaff = employees.filter((e: any) => e.employee_type === 'teaching');
        const fullyCompletedCPD = teachingStaff.filter((e: any) => (e.cpd_hours_completed || 0) >= 50).length;

        return {
          metrics: {
            totalStaff,
            teachingStaffCount: teachingStaff.length,
            nonTeachingStaffCount: totalStaff - teachingStaff.length,
            openPositions: jobs.filter((j: any) => j.status === 'published').length || 3,
            activeApplicants: applicants.length,
            policeVerificationCompliancePct: totalStaff > 0 ? Math.round((verifiedStaff / totalStaff) * 100) : 100,
            verifiedStaffCount: verifiedStaff,
            pendingGraceCount: pendingGrace,
            missingPoliceCount: missingPolice,
            restrictedAccessStaffCount: restricted,
            cpdMandatoryHoursTarget: 50,
            cpdCompletionRatePct: teachingStaff.length > 0 ? Math.round((fullyCompletedCPD / teachingStaff.length) * 100) : 100,
            totalCpdHoursLogged: teachingStaff.reduce((s: number, e: any) => s + (e.cpd_hours_completed || 0), 0),
          },
          criticalAlerts: [],
          recentApplicants: applicants.slice(0, 5),
        };
      } catch (e) {
        console.warn('Supabase HR overview query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/v1/hr/overview`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch HR overview from backend, using local store.', e);
    }
    const totalStaff = mock.mockEmployees.length;
    const verifiedStaff = mock.mockEmployees.filter(e => e.policeVerificationStatus === 'verified').length;
    const pendingGrace = mock.mockEmployees.filter(e => e.policeVerificationStatus === 'submitted_pending').length;
    const missingPolice = mock.mockEmployees.filter(e => e.policeVerificationStatus === 'missing').length;
    const restricted = mock.mockEmployees.filter(e => e.isAccessRestricted).length;
    const teachingStaff = mock.mockEmployees.filter(e => e.employeeType === 'teaching');
    const fullyCompletedCPD = teachingStaff.filter(e => (e.cpdHoursCompleted || 0) >= 50).length;

    return Promise.resolve({
      metrics: {
        totalStaff,
        teachingStaffCount: teachingStaff.length,
        nonTeachingStaffCount: totalStaff - teachingStaff.length,
        openPositions: mock.mockJobs.filter(j => j.status === 'published').length,
        activeApplicants: mock.mockApplicants.length,
        policeVerificationCompliancePct: totalStaff > 0 ? Math.round((verifiedStaff / totalStaff) * 100) : 100,
        verifiedStaffCount: verifiedStaff,
        pendingGraceCount: pendingGrace,
        missingPoliceCount: missingPolice,
        restrictedAccessStaffCount: restricted,
        cpdMandatoryHoursTarget: 50,
        cpdCompletionRatePct: teachingStaff.length > 0 ? Math.round((fullyCompletedCPD / teachingStaff.length) * 100) : 100,
        totalCpdHoursLogged: teachingStaff.reduce((s, e) => s + (e.cpdHoursCompleted || 0), 0),
      },
      criticalAlerts: [],
      recentApplicants: mock.mockApplicants.slice(0, 5),
    });
  },

  async getJobs(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await authClient
          .from('job_openings')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          return data.map((j: any) => ({
            id: j.id,
            tenantId: j.tenant_id,
            title: j.title,
            department: j.department,
            jobType: j.job_type || 'Full-time',
            designationCategory: j.designation_category || 'Teaching',
            experienceRequired: j.experience_required || '2-5 years',
            salaryRange: j.salary_range || 'As per norms',
            description: j.description || '',
            requirements: j.requirements || '',
            status: j.status || 'published',
            location: j.location || 'Main Campus, New Delhi',
            positionsCount: j.positions_count || 1,
            deadline: j.deadline || '2026-10-15',
            applicantsCount: 0,
            createdAt: j.created_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase jobs query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/v1/hr/jobs`);
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('eduos_hr_jobs');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Error reading stored jobs', err);
      }
    }
    return Promise.resolve(mock.mockJobs);
  },

  async createJob(jobData: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/hr/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    const newJob = {
      id: `job-${Date.now()}`,
      tenantId: 'tenant-cbse-dps-01',
      title: jobData.title,
      department: jobData.department,
      jobType: jobData.jobType || 'Full-time',
      designationCategory: jobData.designationCategory || 'Teaching',
      experienceRequired: jobData.experienceRequired || '2-5 years',
      salaryRange: jobData.salaryRange || 'As per norms',
      description: jobData.description,
      requirements: jobData.requirements || '',
      status: jobData.status || 'published',
      location: jobData.location || 'Main Campus, New Delhi',
      positionsCount: Number(jobData.positionsCount) || 1,
      deadline: jobData.deadline || '2026-10-15',
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
    };

    let allJobs = [...mock.mockJobs];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('eduos_hr_jobs');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            allJobs = parsed.filter(j => j && typeof j === 'object' && j.id);
          }
        }
        allJobs = [newJob, ...allJobs.filter(j => j.id !== newJob.id)];
        localStorage.setItem('eduos_hr_jobs', JSON.stringify(allJobs));
      } catch (err) {
        console.warn('Error storing job', err);
      }
    }
    mock.mockJobs.unshift(newJob as any);
    return Promise.resolve(newJob);
  },

  async getApplicants(jobId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = authClient.from('applicants').select('*').order('created_at', { ascending: false });
        if (jobId && jobId !== 'all') {
          query = query.eq('job_id', jobId);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          return data.map((a: any) => ({
            id: a.id,
            tenantId: a.tenant_id,
            jobId: a.job_id,
            jobTitle: a.job_title || 'Faculty Position',
            fullName: a.full_name,
            email: a.email,
            phone: a.phone,
            resumeUrl: a.resume_url,
            highestQualification: a.highest_qualification,
            experienceYears: a.experience_years,
            currentOrganization: a.current_organization,
            stage: a.stage || 'applied',
            appliedAt: a.created_at?.split('T')[0],
          }));
        }
      } catch (e) {
        console.warn('Supabase applicants query failed, falling back:', e);
      }
    }

    try {
      const url = jobId ? `${API_BASE}/v1/hr/applicants?jobId=${jobId}` : `${API_BASE}/v1/hr/applicants`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    let allApplicants = mock.mockApplicants;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('eduos_hr_applicants');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            allApplicants = parsed.filter(a => a && typeof a === 'object' && a.id);
          }
        }
      } catch (err) {
        console.warn('Error reading stored applicants', err);
      }
    }
    if (jobId && jobId !== 'all') {
      return Promise.resolve(allApplicants.filter(a => a && a.jobId === jobId));
    }
    return Promise.resolve(allApplicants.filter(a => a && typeof a === 'object' && a.id));
  },

  async submitPublicApplication(appData: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/hr/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    let allApplicants = [...mock.mockApplicants];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('eduos_hr_applicants');
        if (stored) allApplicants = JSON.parse(stored);
      } catch (err) {
        console.warn('Error reading applicants', err);
      }
    }

    const emailTrim = (appData.email || '').trim().toLowerCase();
    const existing = allApplicants.find(
      a => (a.email || '').trim().toLowerCase() === emailTrim && a.jobId === appData.jobId
    );

    if (existing) {
      return Promise.reject(
        new Error(`You have already submitted an application for this position using ${appData.email}.`)
      );
    }

    const newApplicant = {
      id: `app-${Date.now()}`,
      tenantId: 'tenant-cbse-dps-01',
      jobId: appData.jobId,
      jobTitle: appData.jobTitle || 'Faculty Position',
      fullName: appData.fullName,
      email: appData.email,
      phone: appData.phone,
      resumeUrl: appData.resumeUrl || 'https://storage.eduos.io/resumes/applicant_cv.pdf',
      highestQualification: appData.highestQualification,
      experienceYears: Number(appData.experienceYears) || 3,
      currentOrganization: appData.currentOrganization || 'Candidate Institution',
      stage: 'applied' as const,
      appliedAt: new Date().toISOString().split('T')[0],
    };

    if (typeof window !== 'undefined') {
      try {
        allApplicants = [newApplicant, ...allApplicants];
        localStorage.setItem('eduos_hr_applicants', JSON.stringify(allApplicants));
      } catch (err) {
        console.warn('Error storing applicant', err);
      }
    }
    mock.mockApplicants.unshift(newApplicant as any);
    return Promise.resolve(newApplicant);
  },

  async updateApplicantStage(applicantId: string, stage: string, extra?: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/hr/applicants/${applicantId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, ...extra }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }

    let allApplicants = [...mock.mockApplicants];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('eduos_hr_applicants');
        if (stored) allApplicants = JSON.parse(stored);
      } catch (err) { }
    }

    let updatedApp: any = null;
    allApplicants = allApplicants.map(a => {
      if (a.id === applicantId) {
        updatedApp = { ...a, stage: stage as any, ...extra };
        return updatedApp;
      }
      return a;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('eduos_hr_applicants', JSON.stringify(allApplicants));
      } catch (err) { }
    }

    const app = mock.mockApplicants.find(a => a.id === applicantId);
    if (app) {
      app.stage = stage as any;
      if (extra?.offeredSalary) app.offeredSalary = extra.offeredSalary;
      if (extra?.proposedJoiningDate) app.proposedJoiningDate = extra.proposedJoiningDate;

      if (stage === 'hired') {
        const joining = app.proposedJoiningDate || new Date().toISOString().split('T')[0];
        const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const newEmp = {
          id: `emp-${Date.now()}`,
          tenantId: 'tenant-cbse-dps-01',
          employeeCode: `MPS-FAC-${Math.floor(200 + Math.random() * 800)}`,
          fullName: app.fullName,
          email: app.email,
          phone: app.phone,
          designation: app.jobTitle || 'Faculty Member',
          department: 'Academic Wing',
          employeeType: 'teaching' as const,
          dateOfJoining: joining,
          employmentStatus: 'probationary' as const,
          policeVerificationStatus: 'submitted_pending' as const,
          gracePeriodExpiryDate: expiry,
          isAccessRestricted: false,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          cpdHoursCompleted: 0,
          serviceBook: {
            appointmentOrderNumber: `MPS/HR/2026/APP-${Math.floor(100 + Math.random() * 900)}`,
            appointmentDate: joining,
            casualLeaveBalance: 12,
            earnedLeaveBalance: 0,
            medicalLeaveBalance: 10,
            qualificationsList: [
              { degree: app.highestQualification, institution: 'Verified University', yearOfPassing: 2022, percentageOrGrade: 'Verified', isVerified: true },
            ],
            scaleHistory: [
              {
                id: `sc-${Date.now()}`,
                effectiveDate: joining,
                basicPay: 44900,
                gradePay: 4600,
                daHraAllowances: 22450,
                grossPay: 71950,
                orderNumber: `MPS/PAY/2026/099`,
                remarks: 'Entry pay scale on appointment',
              },
            ],
            promotionHistory: [],
          },
        };
        mock.mockEmployees.push(newEmp as any);
      }
    }
    return Promise.resolve(updatedApp || app);
  },

  async submitInterviewScorecard(applicantId: string, scorecardData: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/hr/applicants/${applicantId}/scorecard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scorecardData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Submitting scorecard locally', e);
    }

    const p = Number(scorecardData.pedagogyScore) || 4;
    const s = Number(scorecardData.subjectKnowledgeScore) || 4;
    const c = Number(scorecardData.classroomManagementScore) || 4;
    const com = Number(scorecardData.communicationScore) || 4;
    const scorecardObj = {
      pedagogyScore: p,
      subjectKnowledgeScore: s,
      classroomManagementScore: c,
      communicationScore: com,
      overallRating: Number(((p + s + c + com) / 4).toFixed(2)),
      recommendation: scorecardData.recommendation || 'hire',
      interviewerName: scorecardData.interviewerName || 'Evaluation Panel',
      notes: scorecardData.notes || '',
    };

    let allApplicants = [...mock.mockApplicants];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('eduos_hr_applicants');
        if (stored) {
          allApplicants = JSON.parse(stored);
        }
      } catch (err) { }
    }

    let updatedApplicant: any = null;
    allApplicants = allApplicants.map(a => {
      if (a && a.id === applicantId) {
        updatedApplicant = { ...a, scorecard: scorecardObj };
        return updatedApplicant;
      }
      return a;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('eduos_hr_applicants', JSON.stringify(allApplicants));
      } catch (err) { }
    }

    const app = mock.mockApplicants.find(a => a.id === applicantId);
    if (app) {
      app.scorecard = scorecardObj;
      if (!updatedApplicant) updatedApplicant = app;
    }

    return Promise.resolve(updatedApplicant || { id: applicantId, scorecard: scorecardObj });
  },

  async getEmployees(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await authClient
          .from('employee_records')
          .select('*, employee_service_records(*)')
          .order('employee_code', { ascending: true });

        if (data && data.length > 0) {
          return data.map((e: any) => {
            const sr = Array.isArray(e.employee_service_records)
              ? e.employee_service_records[0]
              : e.employee_service_records;
            return {
              id: e.id,
              tenantId: e.tenant_id,
              employeeCode: e.employee_code,
              fullName: e.full_name,
              email: e.email,
              phone: e.phone,
              designation: e.designation,
              department: e.department,
              employeeType: e.employee_type || 'teaching',
              dateOfJoining: e.date_of_joining,
              employmentStatus: e.employment_status || 'confirmed',
              policeVerificationStatus: e.police_verification_status || 'verified',
              policeVerificationDate: e.police_verification_date,
              policeAcknowledgmentNumber: e.police_acknowledgment_number,
              isAccessRestricted: e.is_access_restricted || false,
              cpdHoursCompleted: e.cpd_hours_completed || 50,
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(e.full_name || 'Staff')}`,
              serviceBook: sr
                ? {
                    appointmentOrderNumber: sr.appointment_order_number,
                    appointmentDate: sr.appointment_date,
                    confirmationOrderNumber: sr.confirmation_order_number,
                    confirmationDate: sr.confirmation_date,
                    providentFundUan: sr.provident_fund_uan,
                    esiInsuranceNumber: sr.esi_insurance_number,
                    panNumber: sr.pan_number,
                    casualLeaveBalance: sr.casual_leave_balance ?? 0,
                    earnedLeaveBalance: sr.earned_leave_balance ?? 0,
                    medicalLeaveBalance: sr.medical_leave_balance ?? 0,
                    qualificationsList: sr.qualifications_json || [],
                    scaleHistory: sr.scale_history_json || [],
                    promotionHistory: sr.promotion_history_json || [],
                    disciplinaryEntries: sr.disciplinary_entries || '',
                  }
                : undefined,
            };
          });
        }
      } catch (e) {
        console.warn('Supabase employee_records query failed, falling back:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/v1/hr/employees`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using local mockEmployees', e);
    }
    return Promise.resolve(mock.mockEmployees);
  },

  async updatePoliceVerification(employeeId: string, updateData: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/hr/police-verification/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Updating police verification locally', e);
    }
    const emp = mock.mockEmployees.find(e => e.id === employeeId);
    if (emp) {
      emp.policeVerificationStatus = updateData.status;
      if (updateData.status === 'verified') {
        emp.policeDocUrl = updateData.docUrl || 'https://storage.eduos.io/police/verified_clearance.pdf';
        emp.policeVerificationDate = updateData.verificationDate || new Date().toISOString().split('T')[0];
        emp.policeAcknowledgmentNumber = updateData.acknowledgmentNumber || `PCC/DL-ND/2026/${Math.floor(10000 + Math.random() * 90000)}`;
        emp.isAccessRestricted = false;
      } else if (updateData.status === 'missing') {
        emp.policeDocUrl = null;
        emp.policeVerificationDate = null;
      }
      if (updateData.isAccessRestricted !== undefined) {
        emp.isAccessRestricted = Boolean(updateData.isAccessRestricted);
      }
    }
    return Promise.resolve(emp);
  },

  async addScaleIncrement(employeeId: string, incData: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/hr/service-book/${employeeId}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Adding scale increment locally', e);
    }
    const emp = mock.mockEmployees.find(e => e.id === employeeId);
    if (emp && emp.serviceBook) {
      const newInc = {
        id: `sc-${Date.now()}`,
        effectiveDate: incData.effectiveDate || new Date().toISOString().split('T')[0],
        basicPay: Number(incData.basicPay),
        gradePay: Number(incData.gradePay || 0),
        daHraAllowances: Number(incData.daHraAllowances || 0),
        grossPay: Number(incData.basicPay) + Number(incData.daHraAllowances || 0),
        orderNumber: incData.orderNumber || `MPS/INC/2026/${Math.floor(100 + Math.random() * 900)}`,
        remarks: incData.remarks || 'Annual statutory increment',
      };
      emp.serviceBook.scaleHistory.push(newInc);
    }
    return Promise.resolve(emp);
  },

  async getTrainingRecords(employeeId?: string): Promise<any[]> {
    try {
      const url = employeeId ? `${API_BASE}/v1/hr/training-records?employeeId=${employeeId}` : `${API_BASE}/v1/hr/training-records`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using local mockTrainingRecords', e);
    }
    if (employeeId) {
      return Promise.resolve(mock.mockTrainingRecords.filter(t => t.employeeId === employeeId));
    }
    return Promise.resolve(mock.mockTrainingRecords);
  },

  async addTrainingRecord(tData: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/v1/hr/training-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Adding training record locally', e);
    }
    const newRecord = {
      id: `tr-${Date.now()}`,
      employeeId: tData.employeeId,
      trainingTitle: tData.trainingTitle,
      providerAgency: tData.providerAgency || 'CBSE Sahodaya',
      category: tData.category || 'pedagogy',
      durationHours: Number(tData.durationHours) || 6,
      startDate: tData.startDate || new Date().toISOString().split('T')[0],
      endDate: tData.endDate || new Date().toISOString().split('T')[0],
      academicYear: tData.academicYear || '2026-2027',
      mode: tData.mode || 'online',
      certificateUrl: tData.certificateUrl || 'https://storage.eduos.io/certs/cpd_cert.pdf',
      isVerifiedByPrincipal: true,
    };
    mock.mockTrainingRecords.unshift(newRecord as any);

    const emp = mock.mockEmployees.find(e => e.id === tData.employeeId);
    if (emp) {
      emp.cpdHoursCompleted = (emp.cpdHoursCompleted || 0) + newRecord.durationHours;
    }
    return Promise.resolve(newRecord);
  },

  // --- AI RAG Study Tutor (EDUOS-106) ---
  // All retrieval AND generation happen server-side (POST /api/rag/ask):
  // shared-embedder hybrid search over official textbook chunks, then Groq
  // synthesis (or extractive textbook passages when no LLM key is set).
  // No LLM keys in the browser; no canned client-side answers.
  async askRagTutor(
    query: string,
    options?: { board?: string; subject?: string },
  ): Promise<TutorResponse> {
    const res = await fetch(`${API_BASE}/rag/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        board: options?.board && options.board !== 'ALL' ? options.board : undefined,
        subject: options?.subject && options.subject !== 'ALL' ? options.subject : undefined,
      }),
    });
    if (!res.ok) throw new Error(`RAG tutor request failed: HTTP ${res.status}`);
    return (await res.json()) as TutorResponse;
  },

  async streamRagTutor(
    query: string,
    onToken: (token: string, fullText: string) => void,
    options?: { board?: string; subject?: string },
  ): Promise<TutorResponse> {
    const response = await this.askRagTutor(query, options);

    // The backend returns the full answer in one shot; reveal it word-by-word
    // so the chat UI keeps its streaming feel without shipping LLM keys to
    // the browser.
    const words = response.synthesized_answer.split(/(\s+)/);
    let acc = '';
    for (let i = 0; i < words.length; i += 4) {
      acc += words.slice(i, i + 4).join('');
      onToken(words[i] ?? '', acc);
      await new Promise((r) => setTimeout(r, 12));
    }
    onToken('', response.synthesized_answer);
    return response;
  },
};



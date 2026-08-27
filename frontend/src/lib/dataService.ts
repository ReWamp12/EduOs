import { Student, TimetableSlot, Tenant, LeaveRequest, Batch, LMSLesson, LMSCourse, LMSNote } from './types';
import { authClient } from './auth/client';
import { isSupabaseConfigured } from './supabase';
import { TutorResponse } from './tutorTypes';
import type { FeeInvoiceRecord, NoticeMessage } from './store';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

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

/** Supabase job_openings row → the JobOpening shape the ATS and careers board use. */
function mapJobRow(j: any) {
  return {
    id: j.id,
    tenantId: j.tenant_id,
    title: j.title,
    department: j.department,
    jobType: j.job_type || '',
    designationCategory: j.designation_category || '',
    experienceRequired: j.experience_required || '',
    salaryRange: j.salary_range || '',
    description: j.description || '',
    requirements: j.requirements || '',
    status: j.status || 'draft',
    location: j.location || '',
    positionsCount: j.positions_count ?? 1,
    deadline: j.deadline || null,
    createdAt: j.created_at,
  };
}

/** Supabase applicants row (+ joined scorecard) → the ATS pipeline shape. */
function mapApplicantRow(a: any) {
  const card = Array.isArray(a.interview_scorecards)
    ? a.interview_scorecards[0]
    : a.interview_scorecards;
  return {
    id: a.id,
    tenantId: a.tenant_id,
    jobId: a.job_id,
    fullName: a.full_name,
    email: a.email,
    phone: a.phone,
    resumeUrl: a.resume_url,
    portfolioUrl: a.portfolio_url,
    coverLetter: a.cover_letter,
    highestQualification: a.highest_qualification,
    experienceYears: a.experience_years == null ? null : Number(a.experience_years),
    currentOrganization: a.current_organization,
    stage: a.stage || 'applied',
    offeredSalary: a.offered_salary,
    proposedJoiningDate: a.proposed_joining_date,
    appliedAt: a.created_at ? String(a.created_at).split('T')[0] : null,
    scorecard: card
      ? {
          pedagogyScore: card.pedagogy_score,
          subjectKnowledgeScore: card.subject_knowledge_score,
          classroomManagementScore: card.classroom_management_score,
          communicationScore: card.communication_score,
          overallRating: Number(card.overall_rating),
          recommendation: card.recommendation,
          interviewerName: card.interviewer_name,
          notes: card.areas_of_improvement || card.strengths || '',
        }
      : undefined,
  };
}

export const dataService = {
  // --- Tenants & Branding ---
  async getTenants(): Promise<Tenant[]> {
    if (!isSupabaseConfigured()) {
      return [
        {
          id: '247afd96-506e-494c-a603-510b44316919',
          name: 'Greenfield International Academy',
          subdomain: 'greenfield',
          institutionType: 'school',
          primaryColor: '#1E40AF',
          secondaryColor: '#0D9488',
          accentColor: '#F59E0B',
          tagline: 'Nurturing Excellence, Inspiring Innovation',
        },
        {
          id: '3b8d9c12-789a-4123-bcde-567890abcdef',
          name: 'Heritage Valley World School',
          subdomain: 'heritage',
          institutionType: 'school',
          primaryColor: '#7C2D12',
          secondaryColor: '#D97706',
          accentColor: '#10B981',
          tagline: 'Tradition of Wisdom, Vision for Tomorrow',
        },
      ];
    }
    try {
      const { data, error } = await authClient
        .from('tenants')
        .select('*')
        .order('name', { ascending: true });
      if (error || !data) return [];
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        subdomain: row.subdomain,
        institutionType: row.institution_type || 'school',
        primaryColor: row.primary_color || '#1E40AF',
        secondaryColor: row.secondary_color || '#0D9488',
        accentColor: row.accent_color || '#F59E0B',
        logoUrl: row.logo_url,
        tagline: row.tagline,
      }));
    } catch {
      return [];
    }
  },

  async getPlatformOverview(): Promise<{
    totalTenants: number;
    activeStudents: number;
    totalTeachers: number;
    totalUsers: number;
    tenants: Array<{
      id: string;
      name: string;
      subdomain: string;
      type: string;
      students: number;
      branches: number;
      status: string;
      mrr: string;
    }>;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        totalTenants: 2,
        activeStudents: 16,
        totalTeachers: 10,
        totalUsers: 53,
        tenants: [
          {
            id: '247afd96-506e-494c-a603-510b44316919',
            name: 'Greenfield International Academy',
            subdomain: 'greenfield.eduos.app',
            type: 'K-12 School (CBSE)',
            students: 8,
            branches: 2,
            status: 'Active',
            mrr: '₹65,000/mo',
          },
          {
            id: '3b8d9c12-789a-4123-bcde-567890abcdef',
            name: 'Heritage Valley World School',
            subdomain: 'heritage.eduos.app',
            type: 'K-12 School (ICSE)',
            students: 8,
            branches: 2,
            status: 'Active',
            mrr: '₹75,000/mo',
          },
        ],
      };
    }
    try {
      const [tenantsRes, studentsRes, branchesRes, usersRes, teachersRes] = await Promise.all([
        authClient.from('tenants').select('*').order('name'),
        authClient.from('students').select('id, tenant_id'),
        authClient.from('branches').select('id, tenant_id'),
        authClient.from('user_profiles').select('id', { count: 'exact', head: true }),
        authClient.from('teachers').select('id', { count: 'exact', head: true }),
      ]);

      const tenantsData = tenantsRes.data || [];
      const studentsData = studentsRes.data || [];
      const branchesData = branchesRes.data || [];

      const mappedTenants = tenantsData.map((t: any) => {
        const studentCount = studentsData.filter((s: any) => s.tenant_id === t.id).length;
        const branchCount = branchesData.filter((b: any) => b.tenant_id === t.id).length || 2;
        const isCbse = t.name.toLowerCase().includes('greenfield') || t.subdomain.includes('greenfield');
        return {
          id: t.id,
          name: t.name,
          subdomain: `${t.subdomain}.eduos.app`,
          type: isCbse ? 'K-12 School (CBSE)' : 'K-12 School (ICSE)',
          students: studentCount || 8,
          branches: branchCount,
          status: 'Active',
          mrr: isCbse ? '₹65,000/mo' : '₹75,000/mo',
        };
      });

      return {
        totalTenants: tenantsData.length || 2,
        activeStudents: studentsData.length || 16,
        totalTeachers: teachersRes.count || 10,
        totalUsers: usersRes.count || 53,
        tenants: mappedTenants,
      };
    } catch (e) {
      console.warn('Failed to load platform overview:', e);
      return {
        totalTenants: 2,
        activeStudents: 16,
        totalTeachers: 10,
        totalUsers: 53,
        tenants: [
          {
            id: '247afd96-506e-494c-a603-510b44316919',
            name: 'Greenfield International Academy',
            subdomain: 'greenfield.eduos.app',
            type: 'K-12 School (CBSE)',
            students: 8,
            branches: 2,
            status: 'Active',
            mrr: '₹65,000/mo',
          },
          {
            id: '3b8d9c12-789a-4123-bcde-567890abcdef',
            name: 'Heritage Valley World School',
            subdomain: 'heritage.eduos.app',
            type: 'K-12 School (ICSE)',
            students: 8,
            branches: 2,
            status: 'Active',
            mrr: '₹75,000/mo',
          },
        ],
      };
    }
  },

  async getTenantById(id: string): Promise<Tenant | null> {
    if (!isSupabaseConfigured() || !id) return null;
    try {
      const { data, error } = await authClient
        .from('tenants')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id,
        name: data.name,
        subdomain: data.subdomain,
        institutionType: data.institution_type || 'school',
        primaryColor: data.primary_color || '#1E40AF',
        secondaryColor: data.secondary_color || '#0D9488',
        accentColor: data.accent_color || '#F59E0B',
        logoUrl: data.logo_url,
        tagline: data.tagline,
      };
    } catch {
      return null;
    }
  },

  async createTenant(tenant: {
    name: string;
    subdomain: string;
    institutionType: 'school' | 'coaching' | 'college' | 'university';
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    tagline?: string;
  }): Promise<Tenant | null> {
    if (!tenant.name || !tenant.subdomain) return null;
    try {
      if (isSupabaseConfigured()) {
        const cleanSubdomain = tenant.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        const insertPayload: Record<string, any> = {
          name: tenant.name.trim(),
          subdomain: cleanSubdomain,
          institution_type: tenant.institutionType || 'school',
          primary_color: tenant.primaryColor || '#1E40AF',
          secondary_color: tenant.secondaryColor || '#0D9488',
          accent_color: tenant.accentColor || '#F59E0B',
          tagline: tenant.tagline || 'Excellence in Education',
        };

        const { data, error } = await authClient
          .from('tenants')
          .insert(insertPayload)
          .select('*')
          .single();

        if (error) {
          console.error('[tenants] create error:', error.message);
          return null;
        }

        if (data) {
          // Automatically create a default main branch for this new institution
          await authClient.from('branches').insert({
            tenant_id: data.id,
            name: 'Main Campus',
            code: 'MAIN',
            is_main: true,
          });

          return {
            id: data.id,
            name: data.name,
            subdomain: data.subdomain,
            institutionType: data.institution_type || 'school',
            primaryColor: data.primary_color || '#1E40AF',
            secondaryColor: data.secondary_color || '#0D9488',
            accentColor: data.accent_color || '#F59E0B',
            tagline: data.tagline,
            logoUrl: data.logo_url,
          };
        }
      }
      return null;
    } catch (e) {
      console.error('[tenants] create exception:', e);
      return null;
    }
  },

  async updateTenantBranding(
    tenantId: string,
    branding: {
      name?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      customDomain?: string;
      tagline?: string;
    }
  ): Promise<boolean> {
    if (!tenantId) return false;
    try {
      if (isSupabaseConfigured()) {
        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (branding.name !== undefined) updates.name = branding.name;
        if (branding.primaryColor !== undefined) updates.primary_color = branding.primaryColor;
        if (branding.secondaryColor !== undefined) updates.secondary_color = branding.secondaryColor;
        if (branding.accentColor !== undefined) updates.accent_color = branding.accentColor;
        if (branding.customDomain !== undefined) updates.custom_domain = branding.customDomain;
        if (branding.tagline !== undefined) updates.tagline = branding.tagline;

        const { error } = await authClient
          .from('tenants')
          .update(updates)
          .eq('id', tenantId);

        if (error) {
          console.warn('[branding] update error:', error.message);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.warn('[branding] update exception:', e);
      return false;
    }
  },

  // --- Notices & Circulars (Live Supabase Postgres) ---
  async getNotices(tenantId?: string): Promise<NoticeMessage[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('notices')
        .select(`
          id,
          tenant_id,
          title,
          content,
          category,
          priority,
          audience,
          created_at,
          created_by,
          user_profiles:created_by (id, first_name, last_name, role)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error || !data) {
        console.warn('[notices] query error:', error?.message);
        return [];
      }

      return data.map((n: any) => {
        const prof = n.user_profiles;
        const senderName = prof ? `${prof.first_name} ${prof.last_name}`.trim() : 'Academic Staff';
        const senderRole = (prof?.role === 'principal' ? 'principal' : 'teacher') as 'principal' | 'teacher';
        const date = new Date(n.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        return {
          id: n.id,
          title: n.title,
          content: n.content,
          category: n.category || 'general',
          audience: n.audience || ['teacher', 'student', 'parent'],
          senderRole,
          senderName,
          date,
          createdAt: new Date(n.created_at).getTime(),
        };
      });
    } catch (e) {
      console.warn('[notices] exception:', e);
      return [];
    }
  },

  async createNotice(notice: {
    title: string;
    content: string;
    category: string;
    audience: string[];
    createdBy?: string;
    tenantId?: string;
  }): Promise<any> {
    if (!isSupabaseConfigured()) return null;
    try {
      const payload: Record<string, any> = {
        title: notice.title,
        content: notice.content,
        category: notice.category,
        audience: notice.audience,
        is_deleted: false,
        version: 1,
      };
      if (notice.createdBy) payload.created_by = notice.createdBy;
      if (notice.tenantId) payload.tenant_id = notice.tenantId;

      const { data, error } = await authClient
        .from('notices')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('[notices] create error:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error('[notices] create exception:', e);
      return null;
    }
  },

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
  /**
   * The signed-in student's own record. Returns null when there is no such
   * record rather than the `mockCurrentStudent` fixture ("Aarav Sharma", roll
   * 1, a fixed QR id) that every unmatched session used to receive — which
   * meant a student whose row was missing saw somebody else's identity, ID
   * card and QR code.
   */
  async getStudentOverview(studentId?: string): Promise<Student | null> {
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

            // Attendance and rank are computed from the register and the
            // results table (EDUOS-108 view). They used to be the literals
            // `attendancePct: 94.2, rankInBatch: 4` rendered beside the real
            // name and roll number, so every student's dashboard claimed the
            // same invented figures.
            const { data: summary } = await authClient
              .from('v_student_academic_summary')
              .select('attendance_pct, rank_in_batch')
              .eq('student_id', studentRow.id)
              .maybeSingle();

            return {
              id: studentRow.id,
              userId: studentRow.user_id,
              name: fullName,
              email: prof?.email || '',
              rollNumber: studentRow.roll_number || '',
              admissionNumber: studentRow.admission_number || '',
              batchId: studentRow.batch_id || '',
              batchName: batch?.name || '',
              targetExam: batch?.target_exam || '',
              // null (not 0, not a filler) when there is nothing to compute
              // from; the UI renders "—" rather than a plausible number.
              attendancePct: summary?.attendance_pct ?? null,
              rankInBatch: summary?.rank_in_batch ?? null,
              parentName: studentRow.parent_name || '',
              parentPhone: studentRow.parent_phone || '',
              parentEmail: studentRow.parent_email || '',
              bloodGroup: studentRow.blood_group || '',
              dob: studentRow.dob || '',
              gender: studentRow.gender || '',
              qrCodeId: studentRow.qr_code_id || studentRow.id,
              avatarUrl: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
              tenantName: tenant?.name || '',
            };
          }
        }
      } catch (e) {
        console.warn('Supabase student query failed, falling back:', e);
      }
    }

    // EDUOS-108 -- no NestJS tier and no fixture tail. API_BASE is hardcoded
    // to localhost:4000, so in any deployed environment this fetch always
    // failed and the fixture below was what users actually saw, presented as
    // real institutional data.
    return null;
  },

  // --- Teacher / Faculty Portal ---
  // --- Timetable & Academic Scheduling ---
  async getTimetableForBatch(batchId?: string, tenantId?: string): Promise<TimetableSlot[]> {
    if (!isSupabaseConfigured() || !batchId) return [];
    try {
      let query = authClient
        .from('timetables')
        .select(`
          id, tenant_id, batch_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room_number, type,
          subjects:subject_id (id, name, code, color, icon_name),
          batches:batch_id (id, name),
          user_profiles:teacher_id (id, first_name, last_name)
        `)
        .eq('batch_id', batchId)
        .order('day_of_week', { ascending: true })
        .order('period_number', { ascending: true });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: rows, error } = await query;
      if (error || !rows) {
        console.warn('[timetables] getTimetableForBatch error:', error?.message);
        return [];
      }

      const formatTimeStr = (t: string) => {
        if (!t) return '';
        if (t.includes('AM') || t.includes('PM')) return t;
        const parts = t.split(':');
        if (parts.length >= 2) {
          let h = parseInt(parts[0], 10);
          const m = parts[1];
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
        }
        return t;
      };

      const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      return rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenant_id,
        batchId: r.batch_id,
        batchName: r.batches?.name || 'Classroom',
        subjectId: r.subject_id,
        subjectName: r.subjects?.name || 'Subject',
        subjectColor: r.subjects?.color || '#2563EB',
        teacherId: r.teacher_id,
        teacherName: r.user_profiles ? `${r.user_profiles.first_name} ${r.user_profiles.last_name}`.trim() : 'Faculty',
        roomNumber: r.room_number || 'Room 101',
        dayOfWeek: r.day_of_week,
        dayName: dayNames[r.day_of_week] || 'Day',
        periodNumber: r.period_number,
        startTime: formatTimeStr(r.start_time),
        endTime: formatTimeStr(r.end_time),
        type: (r.type as any) || 'lecture',
      }));
    } catch (e) {
      console.warn('[timetables] getTimetableForBatch exception:', e);
      return [];
    }
  },

  async getTeacherTimetable(teacherId?: string, tenantId?: string): Promise<TimetableSlot[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('timetables')
        .select(`
          id, tenant_id, batch_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room_number, type,
          subjects:subject_id (id, name, code, color, icon_name),
          batches:batch_id (id, name),
          user_profiles:teacher_id (id, first_name, last_name)
        `)
        .order('day_of_week', { ascending: true })
        .order('period_number', { ascending: true });

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: rows, error } = await query;
      if (error || !rows) {
        console.warn('[timetables] getTeacherTimetable error:', error?.message);
        return [];
      }

      const formatTimeStr = (t: string) => {
        if (!t) return '';
        if (t.includes('AM') || t.includes('PM')) return t;
        const parts = t.split(':');
        if (parts.length >= 2) {
          let h = parseInt(parts[0], 10);
          const m = parts[1];
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
        }
        return t;
      };

      const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      return rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenant_id,
        batchId: r.batch_id,
        batchName: r.batches?.name || 'Classroom',
        subjectId: r.subject_id,
        subjectName: r.subjects?.name || 'Subject',
        subjectColor: r.subjects?.color || '#2563EB',
        teacherId: r.teacher_id,
        teacherName: r.user_profiles ? `${r.user_profiles.first_name} ${r.user_profiles.last_name}`.trim() : 'Faculty',
        roomNumber: r.room_number || 'Room 101',
        dayOfWeek: r.day_of_week,
        dayName: dayNames[r.day_of_week] || 'Day',
        periodNumber: r.period_number,
        startTime: formatTimeStr(r.start_time),
        endTime: formatTimeStr(r.end_time),
        type: (r.type as any) || 'lecture',
      }));
    } catch (e) {
      console.warn('Supabase timetable query failed, falling back:', e);
      return [];
    }
  },

  async saveTimetableSlot(slot: {
    id?: string;
    tenantId: string;
    batchId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number;
    periodNumber: number;
    startTime: string;
    endTime: string;
    roomNumber?: string;
    type?: string;
  }): Promise<TimetableSlot | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const payload: Record<string, any> = {
        tenant_id: slot.tenantId,
        batch_id: slot.batchId,
        subject_id: slot.subjectId,
        teacher_id: slot.teacherId,
        day_of_week: slot.dayOfWeek,
        period_number: slot.periodNumber,
        start_time: slot.startTime,
        end_time: slot.endTime,
        room_number: slot.roomNumber || 'Room 101',
        type: slot.type || 'lecture',
      };
      if (slot.id) payload.id = slot.id;

      const { data, error } = await authClient
        .from('timetables')
        .upsert(payload)
        .select(`
          id, tenant_id, batch_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room_number, type,
          subjects:subject_id (id, name, color),
          batches:batch_id (id, name),
          user_profiles:teacher_id (id, first_name, last_name)
        `)
        .single();

      if (error || !data) {
        console.error('[timetables] saveTimetableSlot error:', error?.message);
        return null;
      }

      const row = data as any;
      return {
        id: row.id,
        tenantId: row.tenant_id,
        batchId: row.batch_id,
        batchName: (Array.isArray(row.batches) ? row.batches[0]?.name : row.batches?.name) || 'Classroom',
        subjectId: row.subject_id,
        subjectName: (Array.isArray(row.subjects) ? row.subjects[0]?.name : row.subjects?.name) || 'Subject',
        subjectColor: (Array.isArray(row.subjects) ? row.subjects[0]?.color : row.subjects?.color) || '#2563EB',
        teacherId: row.teacher_id,
        teacherName: row.user_profiles
          ? `${Array.isArray(row.user_profiles) ? row.user_profiles[0]?.first_name : row.user_profiles.first_name} ${Array.isArray(row.user_profiles) ? row.user_profiles[0]?.last_name : row.user_profiles.last_name}`.trim()
          : 'Faculty',
        roomNumber: row.room_number,
        dayOfWeek: row.day_of_week,
        periodNumber: row.period_number,
        startTime: row.start_time,
        endTime: row.end_time,
        type: row.type,
      };

    } catch (e) {
      console.error('[timetables] saveTimetableSlot exception:', e);
      return null;
    }
  },

  async deleteTimetableSlot(slotId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !slotId) return false;
    try {
      const { error } = await authClient
        .from('timetables')
        .delete()
        .eq('id', slotId);

      if (error) {
        console.error('[timetables] deleteTimetableSlot error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[timetables] deleteTimetableSlot exception:', e);
      return false;
    }
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
    return [];
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
          // One extra read for the whole page rather than a filler value per
          // row. The previous code derived attendance from the array index
          // (`90 + ((idx % 10) * 0.8)`) and rank from the index itself, so the
          // numbers looked real, moved when the sort changed, and matched
          // nothing in the database.
          const { data: summaries } = await authClient
            .from('v_student_academic_summary')
            .select('student_id, attendance_pct, rank_in_batch')
            .in('student_id', data.map((s: any) => s.id));
          const summaryById = new Map(
            (summaries ?? []).map((r: any) => [r.student_id, r]),
          );

          return data.map((s: any) => {
            const prof = s.user_profiles;
            const batch = s.batches;
            const name = prof ? `${prof.first_name} ${prof.last_name}`.trim() : '';
            const summary = summaryById.get(s.id) as any;
            return {
              id: s.id,
              userId: s.user_id,
              name,
              email: prof?.email || '',
              rollNumber: s.roll_number || '',
              admissionNumber: s.admission_number || '',
              batchId: s.batch_id,
              batchName: batch?.name || '',
              targetExam: batch?.target_exam || '',
              attendancePct: summary?.attendance_pct ?? null,
              rankInBatch: summary?.rank_in_batch ?? null,
              parentName: s.parent_name || '',
              parentPhone: s.parent_phone || '',
              parentEmail: s.parent_email || '',
              bloodGroup: s.blood_group || '',
              dob: s.dob || '',
              gender: s.gender || '',
              qrCodeId: s.qr_code_id || s.id,
              avatarUrl: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Student')}`,
              tenantName: s.tenants?.name || '',
            };
          });
        }
      } catch (e) {
        console.warn('Supabase students query failed:', e);
      }
    }
    // Empty, never a fixture roster: a directory that silently shows 30
    // invented students is indistinguishable from a real one.
    return [];
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

    // EDUOS-108 -- no NestJS tier and no fixture tail. API_BASE is hardcoded
    // to localhost:4000, so in any deployed environment this fetch always
    // failed and the fixture below was what users actually saw, presented as
    // real institutional data.
    return [];
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
        // Advisory only since EDUOS-108: mark_attendance() resolves the acting
        // teacher from auth.uid() and rejects a p_caller_id that disagrees.
        p_caller_id: options?.callerId || null,
        p_caller_role: options?.callerRole || null,
        p_reason: options?.reason || null,
      };

      const { data, error } = await authClient.rpc('mark_attendance', payload);
      if (error) {
        // Every rejection is surfaced. This previously rethrew only when the
        // message matched a whitelist of four substrings; anything else — an
        // RLS denial, a network blip, a changed error string — fell through to
        // the fabricated success below and the register reported "Saved &
        // Synced" for a write that never happened.
        console.warn('[attendance] mark_attendance rejected:', error.message);
        throw new Error(error.message);
      }
      if (!data) {
        throw new Error('The attendance register returned no result. Nothing was saved.');
      }
      return data;
    }

    // Supabase is the register of record. There is no second tier: the NestJS
    // proxy at API_BASE forwards to this same RPC, and reaching for it here
    // only ever produced a hardcoded {success: true} when it was unreachable,
    // which is the exact failure this ticket exists to remove.
    throw new Error(
      'Attendance cannot be saved because the database is not configured. Nothing was recorded.',
    );
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

  /**
   * Publishes an assignment to a batch. Returns null when the write is
   * refused — previously it minted `asg-${Date.now()}` locally and handed it
   * back as though the row existed, so the teacher saw their assignment
   * appear while no student could ever load it.
   *
   * RLS (EDUOS-108) restricts the insert to leadership and to teachers who
   * actually hold the batch.
   */
  async createAssignment(assignment: {
    tenantId?: string;
    batchId: string;
    subjectId?: string | null;
    teacherId?: string | null;
    title: string;
    description?: string;
    dueDate: string;
    maxMarks?: number;
    attachmentUrl?: string | null;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('assignments')
        .insert({
          batch_id: assignment.batchId,
          subject_id: assignment.subjectId ?? null,
          teacher_id: assignment.teacherId ?? null,
          title: assignment.title,
          description: assignment.description ?? '',
          due_date: assignment.dueDate,
          max_marks: assignment.maxMarks ?? 50,
          attachment_url: assignment.attachmentUrl ?? null,
          ...(assignment.tenantId ? { tenant_id: assignment.tenantId } : {}),
        })
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[assignments] create rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[assignments] create failed:', e);
      return null;
    }
  },

  /**
   * Records a student's submission. Returns null on refusal rather than a
   * fabricated `sub-${Date.now()}`.
   *
   * `submission_url` carries the object path inside the private submissions
   * bucket (EDUOS-127), not a public link — viewers mint a signed URL from it.
   */
  async submitAssignment(submission: {
    assignmentId: string;
    studentId: string;
    submissionUrl?: string | null;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('assignment_submissions')
        .upsert(
          {
            assignment_id: submission.assignmentId,
            student_id: submission.studentId,
            submission_url: submission.submissionUrl ?? null,
            submitted_at: new Date().toISOString(),
            status: 'submitted',
          },
          { onConflict: 'assignment_id,student_id' },
        )
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[submissions] submit rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[submissions] submit failed:', e);
      return null;
    }
  },

  /**
   * Writes marks + feedback onto a submission. Returns false when the write
   * was refused so the gradebook can say so; it used to `return
   * Promise.resolve(true)` whenever the request failed, which reported every
   * grade as published regardless.
   *
   * The grader is authorised server-side: the guard_submission_grading trigger
   * (EDUOS-108) rejects marks/feedback/status changes from anyone who is not
   * teaching that student's batch, so a student cannot grade their own work
   * even though RLS lets them update their own submission row.
   */
  async gradeSubmission(submissionId: string, marksObtained: number, feedback: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await authClient
        .from('assignment_submissions')
        .update({
          marks_obtained: marksObtained,
          feedback,
          status: 'graded',
        })
        .eq('id', submissionId);
      if (error) {
        console.warn('[gradebook] grade rejected:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[gradebook] grade failed:', e);
      return false;
    }
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
              examTitle: ex?.title || '',
              score: r.marks_obtained,
              maxScore: ex?.total_marks ?? null,
              // Nulls, not stand-ins. These previously defaulted to
              // percentile 94.5, rank 1, a fixed date, a "Quadratic Equations"
              // weak topic and a canned AI narrative whenever the column was
              // empty — invented analysis attached to a real score.
              percentile: r.percentile ?? null,
              rankInBatch: r.rank_in_batch ?? null,
              date: ex?.exam_date || null,
              weakTopics: r.weak_topics ?? [],
              aiNarrative: r.mistake_summary || null,
            };
          });
        }
      } catch (e) {
        console.warn('Supabase exam results query failed, falling back:', e);
      }
    }

    // EDUOS-108 -- no NestJS tier and no fixture tail. API_BASE is hardcoded
    // to localhost:4000, so in any deployed environment this fetch always
    // failed and the fixture below was what users actually saw, presented as
    // real institutional data.
    return [];
  },



  /** Schedules an exam. Returns the row id, or null when refused. */
  async createExam(input: {
    batchId: string;
    title: string;
    examType: string;
    totalMarks: number;
    examDate: string;
    subjectId?: string | null;
    createdBy?: string | null;
    durationMinutes?: number;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('exams')
        .insert({
          batch_id: input.batchId,
          title: input.title,
          exam_type: input.examType,
          total_marks: input.totalMarks,
          exam_date: input.examDate,
          duration_minutes: input.durationMinutes ?? null,
          subject_id: input.subjectId ?? null,
          created_by: input.createdBy ?? null,
        })
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[exams] create rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[exams] create failed:', e);
      return null;
    }
  },

  /**
   * Publishes gradebook marks for a batch as exam_results rows, one ACID-ish
   * upsert keyed on (exam_id, student_id) — the natural key EDUOS-108 added.
   * Re-publishing overwrites rather than duplicating. `recordResults` in the
   * store previously only pushed parent alerts; the marks reached no table.
   *
   * Returns the number of rows written, or null on refusal. RLS + the
   * exam_results write policy restrict this to the teacher who holds the batch
   * (or leadership).
   */
  async publishExamResults(
    examId: string,
    rows: Array<{ studentId: string; marksObtained: number; feedback?: string }>,
    gradedBy?: string,
  ): Promise<number | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const payload = rows.map((r) => ({
        exam_id: examId,
        student_id: r.studentId,
        marks_obtained: r.marksObtained,
        feedback: r.feedback ?? null,
        graded_by: gradedBy ?? null,
        graded_at: new Date().toISOString(),
      }));
      const { data, error } = await authClient
        .from('exam_results')
        .upsert(payload, { onConflict: 'exam_id,student_id' })
        .select('id');
      if (error) {
        console.warn('[gradebook] publish rejected:', error.message);
        return null;
      }
      return data?.length ?? 0;
    } catch (e) {
      console.warn('[gradebook] publish failed:', e);
      return null;
    }
  },

  /**
   * Files a staff leave request for the signed-in employee. `employee_id` is
   * the caller's own profile id; the RLS insert policy rejects a request filed
   * on anyone else's behalf.
   */
  async applyForLeave(input: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    designation?: string;
    daysCount?: number;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('leave_requests')
        .insert({
          employee_id: input.employeeId,
          leave_type: input.leaveType,
          start_date: input.startDate,
          end_date: input.endDate,
          reason: input.reason,
          designation: input.designation ?? null,
          days_count: input.daysCount ?? null,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[leave] apply rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[leave] apply failed:', e);
      return null;
    }
  },

  /**
   * Approves or rejects a leave request. RLS restricts UPDATE to leadership,
   * so a teacher cannot approve their own leave even though they can read the
   * queue. Returns false on refusal — the approvals screen used to write to
   * localStorage only, so a Principal's decision never reached the applicant.
   */
  async decideLeave(
    leaveId: string,
    status: 'approved' | 'rejected',
    comment: string | undefined,
    reviewerId: string | undefined,
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { data, error } = await authClient
        .from('leave_requests')
        .update({
          status,
          actioned_by: reviewerId ?? null,
          reviewed_at: new Date().toISOString(),
          review_comment: comment ?? null,
        })
        .eq('id', leaveId)
        .select('id');
      if (error) {
        console.warn('[leave] decision rejected:', error.message);
        return false;
      }
      return Array.isArray(data) && data.length > 0;
    } catch (e) {
      console.warn('[leave] decision failed:', e);
      return false;
    }
  },

  // ==========================================
  // HR & STATUTORY REGISTERS (EDUOS-101, rewritten in EDUOS-108)
  // ------------------------------------------
  // Every method below previously ran: try the NestJS proxy on
  // localhost:4000 -> on failure write to localStorage AND mutate the
  // in-memory `mock.mock*` arrays -> return the mutated object so the screen
  // rendered a success. API_BASE is hardcoded to localhost, so the proxy is
  // unreachable in any deployed environment and the fallback WAS the product:
  // pay-scale increments, police-verification clearances and CPD hours were
  // recorded nowhere. `mock.mockEmployees` is `[]`, so several of those writes
  // landed in an empty array and vanished on reload.
  //
  // These now write to Supabase directly. RLS (EDUOS-108) restricts every one
  // of these tables to is_hr_staff(), so authorisation is enforced by the
  // database rather than by whoever can reach an unauthenticated HTTP port.
  // ==========================================

  async getHROverview(): Promise<any> {
    if (!isSupabaseConfigured()) return null;
    try {
      const [empRes, jobRes, appRes] = await Promise.all([
        authClient.from('employee_records').select('*'),
        authClient.from('job_openings').select('*'),
        authClient.from('applicants').select('*').order('created_at', { ascending: false }),
      ]);

      const employees = empRes.data || [];
      const jobs = jobRes.data || [];
      const applicants = appRes.data || [];

      const totalStaff = employees.length;
      const verifiedStaff = employees.filter((e: any) => e.police_verification_status === 'verified').length;
      const teachingStaff = employees.filter((e: any) => e.employee_type === 'teaching');
      const fullyCompletedCPD = teachingStaff.filter((e: any) => (e.cpd_hours_completed || 0) >= 50).length;

      return {
        metrics: {
          totalStaff,
          teachingStaffCount: teachingStaff.length,
          nonTeachingStaffCount: totalStaff - teachingStaff.length,
          // No `|| 3` filler: zero open positions is a fact, not a gap to hide.
          openPositions: jobs.filter((j: any) => j.status === 'published').length,
          activeApplicants: applicants.length,
          policeVerificationCompliancePct:
            totalStaff > 0 ? Math.round((verifiedStaff / totalStaff) * 100) : null,
          verifiedStaffCount: verifiedStaff,
          pendingGraceCount: employees.filter((e: any) => e.police_verification_status === 'submitted_pending').length,
          missingPoliceCount: employees.filter((e: any) => e.police_verification_status === 'missing').length,
          restrictedAccessStaffCount: employees.filter((e: any) => e.is_access_restricted).length,
          cpdMandatoryHoursTarget: 50,
          cpdCompletionRatePct:
            teachingStaff.length > 0 ? Math.round((fullyCompletedCPD / teachingStaff.length) * 100) : null,
          totalCpdHoursLogged: teachingStaff.reduce((s: number, e: any) => s + (e.cpd_hours_completed || 0), 0),
        },
        criticalAlerts: employees
          .filter((e: any) => e.police_verification_status === 'missing' || e.is_access_restricted)
          .slice(0, 5)
          .map((e: any) => ({
            employeeId: e.id,
            fullName: e.full_name,
            issue: e.is_access_restricted ? 'System access restricted' : 'Police verification missing',
            gracePeriodExpiryDate: e.grace_period_expiry_date,
          })),
        recentApplicants: applicants.slice(0, 5).map(mapApplicantRow),
      };
    } catch (e) {
      console.warn('[hr] overview failed:', e);
      return null;
    }
  },

  async getJobs(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('job_openings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return [];

      // Applicant counts come from the applicants table rather than the
      // hardcoded `applicantsCount: 0` the old mapper emitted.
      const { data: counts } = await authClient.from('applicants').select('job_id');
      const perJob = new Map<string, number>();
      (counts ?? []).forEach((r: any) => perJob.set(r.job_id, (perJob.get(r.job_id) || 0) + 1));

      return data.map((j: any) => ({ ...mapJobRow(j), applicantsCount: perJob.get(j.id) || 0 }));
    } catch (e) {
      console.warn('[hr] getJobs failed:', e);
      return [];
    }
  },

  /** Opens a vacancy. Returns null when refused, never a local job id. */
  async createJob(jobData: any): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('job_openings')
        .insert({
          title: jobData.title,
          department: jobData.department,
          job_type: jobData.jobType || 'Full-time',
          designation_category: jobData.designationCategory || 'Teaching',
          experience_required: jobData.experienceRequired || null,
          salary_range: jobData.salaryRange || null,
          description: jobData.description || '',
          requirements: jobData.requirements || '',
          status: jobData.status || 'published',
          location: jobData.location || null,
          positions_count: Number(jobData.positionsCount) || 1,
          deadline: jobData.deadline || null,
        })
        .select('*')
        .single();
      if (error || !data) {
        console.warn('[hr] createJob rejected:', error?.message);
        return null;
      }
      return { ...mapJobRow(data), applicantsCount: 0 };
    } catch (e) {
      console.warn('[hr] createJob failed:', e);
      return null;
    }
  },

  async getApplicants(jobId?: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('applicants')
        .select('*, interview_scorecards(*)')
        .order('created_at', { ascending: false });
      if (jobId && jobId !== 'all') query = query.eq('job_id', jobId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map(mapApplicantRow);
    } catch (e) {
      console.warn('[hr] getApplicants failed:', e);
      return [];
    }
  },

  /**
   * Public careers-board application, submitted with the anon key. The
   * applicants_public_apply policy (EDUOS-108) permits the INSERT while
   * keeping SELECT restricted to HR, so a candidate cannot read the pipeline.
   *
   * Throws rather than returning a fabricated applicant: the careers page
   * needs to tell a real candidate whether their application was received.
   */
  async submitPublicApplication(appData: any): Promise<{ id: string }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Applications cannot be submitted right now. Please try again later.');
    }

    // The duplicate check must be a database constraint. anon deliberately
    // cannot SELECT applicants, so a client-side "have you already applied?"
    // scan is impossible here -- and the old localStorage version only ever
    // checked the candidate's own browser.
    const { data, error } = await authClient
      .from('applicants')
      .insert({
        job_id: appData.jobId,
        tenant_id: appData.tenantId || null,
        full_name: appData.fullName,
        email: (appData.email || '').trim().toLowerCase(),
        phone: appData.phone,
        experience_years: Number(appData.experienceYears) || null,
        highest_qualification: appData.highestQualification || null,
        current_organization: appData.currentOrganization || null,
        resume_url: appData.resumeUrl || null,
        cover_letter: appData.coverLetter || null,
        stage: 'applied',
        source: 'careers_portal',
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          `You have already submitted an application for this position using ${appData.email}.`,
        );
      }
      throw new Error(error.message || 'Your application could not be submitted.');
    }
    return data;
  },

  /** Moves a candidate through the pipeline. Returns null when refused. */
  async updateApplicantStage(applicantId: string, stage: string, extra?: any): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const patch: Record<string, unknown> = { stage, updated_at: new Date().toISOString() };
      if (extra?.offeredSalary) patch.offered_salary = extra.offeredSalary;
      if (extra?.proposedJoiningDate) patch.proposed_joining_date = extra.proposedJoiningDate;

      const { data, error } = await authClient
        .from('applicants')
        .update(patch)
        .eq('id', applicantId)
        .select('*, interview_scorecards(*)')
        .maybeSingle();
      if (error || !data) {
        console.warn('[hr] stage change rejected:', error?.message);
        return null;
      }

      // Hiring opens a service book. This used to build a fake employee with a
      // random employee code, an invented entry pay scale of 44900/4600 and a
      // stock photo, then push it into `mock.mockEmployees` -- an empty array,
      // so the "Service Book created" toast referred to nothing at all.
      if (stage === 'hired') {
        const created = await dataService.createEmployeeFromApplicant(data);
        return { ...mapApplicantRow(data), employeeCreated: Boolean(created) };
      }
      return mapApplicantRow(data);
    } catch (e) {
      console.warn('[hr] stage change failed:', e);
      return null;
    }
  },

  /**
   * Promotes a hired applicant into employee_records plus an opening service
   * book entry. Idempotent on email so re-running a hire does not duplicate
   * a member of staff.
   */
  async createEmployeeFromApplicant(applicant: any): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: existing } = await authClient
        .from('employee_records')
        .select('id')
        .ilike('email', applicant.email)
        .maybeSingle();
      if (existing) return existing;

      const joining = applicant.proposed_joining_date || new Date().toISOString().split('T')[0];
      const grace = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: emp, error } = await authClient
        .from('employee_records')
        .insert({
          employee_code: `EMP-${Date.now().toString(36).toUpperCase()}`,
          full_name: applicant.full_name,
          email: applicant.email,
          phone: applicant.phone,
          designation: 'Faculty Member',
          department: 'Academic',
          employee_type: 'teaching',
          date_of_joining: joining,
          employment_status: 'probationary',
          // A new joiner has NOT submitted anything yet. The old code recorded
          // 'submitted_pending' on their behalf, which quietly satisfied the
          // safeguarding gate for someone with no paperwork on file.
          police_verification_status: 'missing',
          grace_period_expiry_date: grace,
          is_access_restricted: false,
          cpd_hours_completed: 0,
        })
        .select('id')
        .single();
      if (error || !emp) {
        console.warn('[hr] employee creation rejected:', error?.message);
        return null;
      }

      await authClient.from('employee_service_records').insert({
        employee_id: emp.id,
        appointment_date: joining,
        qualifications_json: applicant.highest_qualification
          ? [{ degree: applicant.highest_qualification, isVerified: false }]
          : [],
        // Empty, not an invented entry pay scale. A real increment is added
        // through the Service Books screen once HR has the sanctioned figure.
        scale_history_json: [],
        promotion_history_json: [],
      });

      return emp;
    } catch (e) {
      console.warn('[hr] employee creation failed:', e);
      return null;
    }
  },

  async submitInterviewScorecard(applicantId: string, scorecardData: any): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const p = Number(scorecardData.pedagogyScore) || 0;
      const s = Number(scorecardData.subjectKnowledgeScore) || 0;
      const c = Number(scorecardData.classroomManagementScore) || 0;
      const com = Number(scorecardData.communicationScore) || 0;

      const { data, error } = await authClient
        .from('interview_scorecards')
        .insert({
          applicant_id: applicantId,
          interviewer_name: scorecardData.interviewerName || null,
          round_name: scorecardData.roundName || 'Interview',
          pedagogy_score: p,
          subject_knowledge_score: s,
          classroom_management_score: c,
          communication_score: com,
          overall_rating: Number(((p + s + c + com) / 4).toFixed(2)),
          strengths: scorecardData.strengths || null,
          areas_of_improvement: scorecardData.areasOfImprovement || null,
          recommendation: scorecardData.recommendation || null,
        })
        .select('*')
        .single();
      if (error || !data) {
        console.warn('[hr] scorecard rejected:', error?.message);
        return null;
      }
      return {
        id: data.id,
        applicantId: data.applicant_id,
        pedagogyScore: data.pedagogy_score,
        subjectKnowledgeScore: data.subject_knowledge_score,
        classroomManagementScore: data.classroom_management_score,
        communicationScore: data.communication_score,
        overallRating: Number(data.overall_rating),
        recommendation: data.recommendation,
        interviewerName: data.interviewer_name,
      };
    } catch (e) {
      console.warn('[hr] scorecard failed:', e);
      return null;
    }
  },

  async getEmployees(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('employee_records')
        .select('*, employee_service_records(*)')
        .order('employee_code', { ascending: true });
      if (error || !data) return [];

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
          employmentStatus: e.employment_status,
          // These defaulted to 'verified' and 50 CPD hours when the column was
          // NULL -- an unchecked employee displayed as cleared, and someone
          // with no training displayed as fully compliant.
          policeVerificationStatus: e.police_verification_status ?? 'missing',
          policeVerificationDate: e.police_verification_date,
          policeAcknowledgmentNumber: e.police_acknowledgment_number,
          policeDocUrl: e.police_doc_url,
          gracePeriodExpiryDate: e.grace_period_expiry_date,
          isAccessRestricted: e.is_access_restricted || false,
          cpdHoursCompleted: e.cpd_hours_completed ?? 0,
          avatarUrl:
            e.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(e.full_name || 'Staff')}`,
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
    } catch (e) {
      console.warn('[hr] getEmployees failed:', e);
      return [];
    }
  },

  /**
   * Records a police-verification outcome and the access gate that follows
   * from it. This is a safeguarding control (POCSO); it previously mutated an
   * empty in-memory array, so restricting a member of staff's system access
   * had no effect beyond the current page render.
   */
  async updatePoliceVerification(employeeId: string, updateData: any): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updateData.status) patch.police_verification_status = updateData.status;

      if (updateData.status === 'verified') {
        // No stock clearance PDF and no invented acknowledgment number: a
        // clearance recorded without its document is not a clearance.
        patch.police_doc_url = updateData.docUrl || null;
        patch.police_verification_date =
          updateData.verificationDate || new Date().toISOString().split('T')[0];
        patch.police_acknowledgment_number = updateData.acknowledgmentNumber || null;
        patch.is_access_restricted = false;
      } else if (updateData.status === 'missing') {
        patch.police_doc_url = null;
        patch.police_verification_date = null;
        patch.police_acknowledgment_number = null;
      }
      if (updateData.isAccessRestricted !== undefined) {
        patch.is_access_restricted = Boolean(updateData.isAccessRestricted);
      }

      const { data, error } = await authClient
        .from('employee_records')
        .update(patch)
        .eq('id', employeeId)
        .select('*')
        .maybeSingle();
      if (error || !data) {
        console.warn('[hr] police verification rejected:', error?.message);
        return null;
      }
      return {
        id: data.id,
        fullName: data.full_name,
        policeVerificationStatus: data.police_verification_status,
        policeVerificationDate: data.police_verification_date,
        policeAcknowledgmentNumber: data.police_acknowledgment_number,
        isAccessRestricted: data.is_access_restricted,
      };
    } catch (e) {
      console.warn('[hr] police verification failed:', e);
      return null;
    }
  },

  /** Appends a sanctioned pay-scale increment to the statutory service book. */
  async addScaleIncrement(employeeId: string, incData: any): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: sr, error: readErr } = await authClient
        .from('employee_service_records')
        .select('id, scale_history_json')
        .eq('employee_id', employeeId)
        .maybeSingle();
      if (readErr) {
        console.warn('[hr] service book read rejected:', readErr.message);
        return null;
      }

      const basic = Number(incData.basicPay) || 0;
      const allowances = Number(incData.daHraAllowances) || 0;
      const increment = {
        id: `sc-${Date.now()}`,
        effectiveDate: incData.effectiveDate || new Date().toISOString().split('T')[0],
        basicPay: basic,
        gradePay: Number(incData.gradePay) || 0,
        daHraAllowances: allowances,
        grossPay: basic + allowances,
        // No generated order number: an increment order reference is a real
        // document or it is absent.
        orderNumber: incData.orderNumber || null,
        remarks: incData.remarks || null,
      };

      const history = Array.isArray(sr?.scale_history_json) ? sr.scale_history_json : [];
      const next = [...history, increment];

      const { error: writeErr } = sr
        ? await authClient
            .from('employee_service_records')
            .update({ scale_history_json: next, updated_at: new Date().toISOString() })
            .eq('id', sr.id)
        : await authClient
            .from('employee_service_records')
            .insert({ employee_id: employeeId, scale_history_json: next });

      if (writeErr) {
        console.warn('[hr] increment rejected:', writeErr.message);
        return null;
      }

      const { data: emp } = await authClient
        .from('employee_records')
        .select('id, full_name')
        .eq('id', employeeId)
        .maybeSingle();
      return { id: employeeId, fullName: emp?.full_name ?? '', scaleHistory: next };
    } catch (e) {
      console.warn('[hr] increment failed:', e);
      return null;
    }
  },

  /** CPD register. This never queried Supabase at all -- NestJS, then `[]`. */
  async getTrainingRecords(employeeId?: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('training_records')
        .select('*')
        .order('start_date', { ascending: false });
      if (employeeId) query = query.eq('employee_id', employeeId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((t: any) => ({
        id: t.id,
        employeeId: t.employee_id,
        trainingTitle: t.training_title,
        providerAgency: t.provider_agency,
        category: t.category,
        durationHours: Number(t.duration_hours) || 0,
        startDate: t.start_date,
        endDate: t.end_date,
        academicYear: t.academic_year,
        mode: t.mode,
        certificateUrl: t.certificate_url,
        isVerifiedByPrincipal: Boolean(t.is_verified_by_principal),
      }));
    } catch (e) {
      console.warn('[hr] getTrainingRecords failed:', e);
      return [];
    }
  },

  /**
   * Logs CPD hours and rolls the employee's running total forward.
   *
   * `is_verified_by_principal` is false on entry. The old code hardcoded it to
   * true, so HR logging a course also recorded the Principal's verification of
   * it -- a sign-off nobody performed, on a statutory 50-hour register.
   */
  async addTrainingRecord(tData: any): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const hours = Number(tData.durationHours) || 0;
      const { data, error } = await authClient
        .from('training_records')
        .insert({
          employee_id: tData.employeeId,
          training_title: tData.trainingTitle,
          provider_agency: tData.providerAgency || null,
          category: tData.category || null,
          duration_hours: hours,
          start_date: tData.startDate || new Date().toISOString().split('T')[0],
          end_date: tData.endDate || null,
          academic_year: tData.academicYear || null,
          mode: tData.mode || null,
          certificate_url: tData.certificateUrl || null,
          is_verified_by_principal: false,
        })
        .select('*')
        .single();
      if (error || !data) {
        console.warn('[hr] training record rejected:', error?.message);
        return null;
      }

      const { data: emp } = await authClient
        .from('employee_records')
        .select('cpd_hours_completed')
        .eq('id', tData.employeeId)
        .maybeSingle();
      if (emp) {
        await authClient
          .from('employee_records')
          .update({ cpd_hours_completed: (emp.cpd_hours_completed || 0) + hours })
          .eq('id', tData.employeeId);
      }

      return {
        id: data.id,
        employeeId: data.employee_id,
        trainingTitle: data.training_title,
        durationHours: hours,
        isVerifiedByPrincipal: false,
      };
    } catch (e) {
      console.warn('[hr] training record failed:', e);
      return null;
    }
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

  // ==========================================
  // CONSENT FORMS & RESPONSES (EDUOS-108 R2)
  // ==========================================
  async getConsentForms(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('consent_forms')
        .select('*, batches(name), user_profiles:author_id(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((f: any) => ({
        id: f.id,
        title: f.title,
        description: f.description || '',
        category: f.category || 'general',
        targetType: f.target_type || 'all',
        targetBatchId: f.target_batch_id || null,
        batchName: f.batches?.name || 'All Batches',
        authorName: f.user_profiles ? `${f.user_profiles.first_name} ${f.user_profiles.last_name}`.trim() : 'School Admin',
        authorRole: f.author_role || 'staff',
        eventDate: f.event_date || null,
        deadline: f.deadline || null,
        instructions: f.instructions || '',
        createdAt: f.created_at,
      }));
    } catch (e) {
      console.warn('[consent] getConsentForms failed:', e);
      return [];
    }
  },

  async createConsentForm(input: {
    title: string;
    description: string;
    category?: string;
    targetType?: string;
    targetBatchId?: string | null;
    authorId?: string;
    authorRole?: string;
    eventDate?: string;
    deadline?: string;
    instructions?: string;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('consent_forms')
        .insert({
          title: input.title,
          description: input.description,
          category: input.category || 'general',
          target_type: input.targetType || 'all',
          target_batch_id: input.targetBatchId || null,
          author_id: input.authorId || null,
          author_role: input.authorRole || 'staff',
          event_date: input.eventDate || null,
          deadline: input.deadline || null,
          instructions: input.instructions || null,
        })
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[consent] createConsentForm rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[consent] createConsentForm failed:', e);
      return null;
    }
  },

  async getConsentResponses(formId?: string, studentId?: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('consent_responses')
        .select('*, students(full_name, roll_number, admission_number)')
        .order('created_at', { ascending: false });
      if (formId) query = query.eq('form_id', formId);
      if (studentId) query = query.eq('student_id', studentId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((r: any) => ({
        id: r.id,
        formId: r.form_id,
        studentId: r.student_id,
        studentName: r.students?.full_name || '',
        studentRoll: r.students?.roll_number || '',
        status: r.status,
        signedByName: r.signed_by_name || '',
        parentRelation: r.parent_relation || '',
        signedAt: r.signed_at,
        declineReason: r.decline_reason || '',
      }));
    } catch (e) {
      console.warn('[consent] getConsentResponses failed:', e);
      return [];
    }
  },

  async submitConsentResponse(input: {
    formId: string;
    studentId: string;
    status: 'approved' | 'rejected';
    signedByName?: string;
    parentRelation?: string;
    declineReason?: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await authClient
        .from('consent_responses')
        .upsert(
          {
            form_id: input.formId,
            student_id: input.studentId,
            status: input.status,
            signed_by_name: input.signedByName || null,
            parent_relation: input.parentRelation || 'Parent',
            signed_at: new Date().toISOString(),
            decline_reason: input.declineReason || null,
          },
          { onConflict: 'form_id,student_id' }
        );
      if (error) {
        console.warn('[consent] submitConsentResponse rejected:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[consent] submitConsentResponse failed:', e);
      return false;
    }
  },

  // ==========================================
  // PTM BOOKINGS (EDUOS-108 R2)
  // ==========================================
  async getPtmBookings(studentId?: string, teacherId?: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('ptm_bookings')
        .select('*, students(full_name), user_profiles:teacher_id(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (studentId) query = query.eq('student_id', studentId);
      if (teacherId) query = query.eq('teacher_id', teacherId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((b: any) => ({
        id: b.id,
        teacherId: b.teacher_id,
        teacherName: b.user_profiles ? `${b.user_profiles.first_name} ${b.user_profiles.last_name}`.trim() : 'Teacher',
        studentId: b.student_id,
        studentName: b.students?.full_name || '',
        subject: b.subject || '',
        slot: b.slot,
        mode: b.mode || 'in_person',
        status: b.status,
        requestedBy: b.requested_by,
        notes: b.notes || '',
        createdAt: b.created_at,
      }));
    } catch (e) {
      console.warn('[ptm] getPtmBookings failed:', e);
      return [];
    }
  },

  async createPtmBooking(input: {
    teacherId: string;
    studentId: string;
    subject?: string;
    slot: string;
    mode?: string;
    requestedBy?: string;
    notes?: string;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('ptm_bookings')
        .insert({
          teacher_id: input.teacherId,
          student_id: input.studentId,
          subject: input.subject || null,
          slot: input.slot,
          mode: input.mode || 'in_person',
          status: 'pending',
          requested_by: input.requestedBy || 'guardian',
          notes: input.notes || null,
        })
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[ptm] createPtmBooking rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[ptm] createPtmBooking failed:', e);
      return null;
    }
  },

  async updatePtmBookingStatus(bookingId: string, status: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await authClient
        .from('ptm_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (error) {
        console.warn('[ptm] updatePtmBookingStatus rejected:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[ptm] updatePtmBookingStatus failed:', e);
      return false;
    }
  },

  // ==========================================
  // SUPPORT TICKETS (EDUOS-108 R2)
  // ==========================================
  async getSupportTickets(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('support_tickets')
        .select('*, user_profiles:raised_by(first_name, last_name, role)')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((t: any) => ({
        id: t.id,
        raisedBy: t.raised_by,
        authorName: t.user_profiles ? `${t.user_profiles.first_name} ${t.user_profiles.last_name}`.trim() : 'User',
        authorRole: t.user_profiles?.role || 'student',
        category: t.category,
        subject: t.subject,
        description: t.description,
        status: t.status,
        reply: t.reply || null,
        resolvedAt: t.resolved_at,
        createdAt: t.created_at,
      }));
    } catch (e) {
      console.warn('[support] getSupportTickets failed:', e);
      return [];
    }
  },

  async createSupportTicket(input: {
    raisedBy: string;
    category: string;
    subject: string;
    description: string;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('support_tickets')
        .insert({
          raised_by: input.raisedBy,
          category: input.category,
          subject: input.subject,
          description: input.description,
          status: 'open',
        })
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[support] createSupportTicket rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[support] createSupportTicket failed:', e);
      return null;
    }
  },

  async updateSupportTicket(ticketId: string, patch: { status?: string; reply?: string }): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const payload: Record<string, any> = { ...patch, updated_at: new Date().toISOString() };
      if (patch.status === 'resolved' || patch.status === 'closed') {
        payload.resolved_at = new Date().toISOString();
      }
      const { error } = await authClient
        .from('support_tickets')
        .update(payload)
        .eq('id', ticketId);
      if (error) {
        console.warn('[support] updateSupportTicket rejected:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[support] updateSupportTicket failed:', e);
      return false;
    }
  },

  // ==========================================
  // PARENT FEEDBACK (EDUOS-108 R2)
  // ==========================================
  async getParentFeedback(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('parent_feedback')
        .select('*, user_profiles:submitted_by(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((f: any) => ({
        id: f.id,
        submittedBy: f.submitted_by,
        parentName: f.user_profiles ? `${f.user_profiles.first_name} ${f.user_profiles.last_name}`.trim() : 'Parent',
        category: f.category,
        subject: f.subject,
        message: f.message,
        rating: f.rating || 5,
        status: f.status,
        adminResponse: f.admin_response || null,
        createdAt: f.created_at,
      }));
    } catch (e) {
      console.warn('[feedback] getParentFeedback failed:', e);
      return [];
    }
  },

  async createParentFeedback(input: {
    submittedBy: string;
    category: string;
    subject: string;
    message: string;
    rating?: number;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('parent_feedback')
        .insert({
          submitted_by: input.submittedBy,
          category: input.category,
          subject: input.subject,
          message: input.message,
          rating: input.rating ?? 5,
          status: 'submitted',
        })
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[feedback] createParentFeedback rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[feedback] createParentFeedback failed:', e);
      return null;
    }
  },

  // ==========================================
  // CURRICULUM TOPICS (EDUOS-108 R2)
  // ==========================================
  async getCurriculumTopics(batchId: string, subjectId?: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('curriculum_topics')
        .select('*, subjects(name, code)')
        .eq('batch_id', batchId)
        .order('sequence_order', { ascending: true });
      if (subjectId) query = query.eq('subject_id', subjectId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((t: any) => ({
        id: t.id,
        batchId: t.batch_id,
        subjectId: t.subject_id,
        subjectName: t.subjects?.name || 'Subject',
        unitName: t.unit_name,
        topicName: t.topic_name,
        isCompleted: Boolean(t.is_completed),
        completedAt: t.completed_at,
        sequenceOrder: t.sequence_order || 0,
      }));
    } catch (e) {
      console.warn('[curriculum] getCurriculumTopics failed:', e);
      return [];
    }
  },

  async updateCurriculumTopic(topicId: string, isCompleted: boolean): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await authClient
        .from('curriculum_topics')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', topicId);
      if (error) {
        console.warn('[curriculum] updateCurriculumTopic rejected:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[curriculum] updateCurriculumTopic failed:', e);
      return false;
    }
  },

  async createCurriculumTopic(input: {
    batchId: string;
    subjectId: string;
    unitName: string;
    topicName: string;
    sequenceOrder?: number;
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await authClient
        .from('curriculum_topics')
        .insert({
          batch_id: input.batchId,
          subject_id: input.subjectId,
          unit_name: input.unitName,
          topic_name: input.topicName,
          is_completed: false,
          sequence_order: input.sequenceOrder ?? 0,
        })
        .select('id')
        .single();
      if (error || !data) {
        console.warn('[curriculum] createCurriculumTopic rejected:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[curriculum] createCurriculumTopic failed:', e);
      return null;
    }
  },

  // --- LMS Digital Classroom (Curriculum Video Lectures & Notes) ---
  async getLmsCourses(tenantId?: string): Promise<LMSCourse[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('lms_courses')
        .select(`
          id,
          tenant_id,
          subject_id,
          title,
          description,
          thumbnail_url,
          lms_lessons (
            id,
            title,
            chapter,
            content_type,
            content_url,
            duration_minutes,
            order_index
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error || !data) {
        console.warn('[lms] getLmsCourses error:', error?.message);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        tenantId: row.tenant_id,
        subjectId: row.subject_id,
        title: row.title,
        description: row.description || '',
        thumbnailUrl: row.thumbnail_url || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600',
        lessons: (row.lms_lessons || []).map((l: any) => ({
          id: l.id,
          courseId: row.id,
          courseTitle: row.title,
          title: l.title,
          lessonTitle: l.title,
          chapter: l.chapter,
          chapterTitle: l.chapter,
          contentType: l.content_type || 'video',
          contentUrl: l.content_url || '/videos/quadratic_equations.mp4',
          url: l.content_url || '/videos/quadratic_equations.mp4',
          durationMinutes: l.duration_minutes || 20,
          orderIndex: l.order_index || 1,
          completed: false,
        })).sort((a: any, b: any) => a.orderIndex - b.orderIndex),
      }));
    } catch (e) {
      console.warn('[lms] getLmsCourses exception:', e);
      return [];
    }
  },

  async getLmsLessons(tenantId?: string): Promise<LMSLesson[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = authClient
        .from('lms_lessons')
        .select(`
          id,
          course_id,
          title,
          chapter,
          content_type,
          content_url,
          duration_minutes,
          order_index,
          lms_courses (
            id,
            tenant_id,
            title,
            thumbnail_url
          )
        `)
        .eq('is_deleted', false)
        .order('order_index', { ascending: true });

      const { data, error } = await query;
      if (error || !data) {
        console.warn('[lms] getLmsLessons error:', error?.message);
        return [];
      }

      const filtered = tenantId
        ? data.filter((row: any) => !row.lms_courses?.tenant_id || row.lms_courses?.tenant_id === tenantId)
        : data;

      return filtered.map((row: any) => ({
        id: row.id,
        courseId: row.course_id,
        title: row.title,
        lessonTitle: row.title,
        chapter: row.chapter,
        chapterTitle: row.chapter,
        courseTitle: row.lms_courses?.title || 'Curriculum Course',
        contentType: (row.content_type as any) || 'video',
        durationMinutes: row.duration_minutes || 20,
        contentUrl: row.content_url || '/videos/quadratic_equations.mp4',
        url: row.content_url || '/videos/quadratic_equations.mp4',
        orderIndex: row.order_index || 1,
        completed: false,
      }));

    } catch (e) {
      console.warn('[lms] getLmsLessons exception:', e);
      return [];
    }
  },

  async getLessonNotes(lessonId: string, userId?: string): Promise<LMSNote[]> {
    if (!isSupabaseConfigured() || !lessonId) return [];
    try {
      let query = authClient
        .from('lms_notes')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('timestamp_seconds', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error || !data) {
        console.warn('[lms] getLessonNotes error:', error?.message);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        lessonId: row.lesson_id,
        tenantId: row.tenant_id,
        timestampSeconds: row.timestamp_seconds || 0,
        timestampLabel: row.timestamp_label || '00:00',
        noteText: row.note_text || '',
        tag: row.tag || 'key_concept',
        color: row.color || '#2563eb',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (e) {
      console.warn('[lms] getLessonNotes exception:', e);
      return [];
    }
  },

  async saveLessonNote(note: {
    userId: string;
    lessonId: string;
    tenantId?: string;
    timestampSeconds: number;
    timestampLabel: string;
    noteText: string;
    tag: 'key_concept' | 'formula' | 'doubt' | 'summary';
    color?: string;
  }): Promise<LMSNote | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const payload: Record<string, any> = {
        user_id: note.userId,
        lesson_id: note.lessonId,
        timestamp_seconds: note.timestampSeconds,
        timestamp_label: note.timestampLabel,
        note_text: note.noteText.trim(),
        tag: note.tag || 'key_concept',
        color: note.color || '#2563eb',
      };
      if (note.tenantId) payload.tenant_id = note.tenantId;

      const { data, error } = await authClient
        .from('lms_notes')
        .insert(payload)
        .select('*')
        .single();

      if (error || !data) {
        console.error('[lms] saveLessonNote error:', error?.message);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        lessonId: data.lesson_id,
        tenantId: data.tenant_id,
        timestampSeconds: data.timestamp_seconds,
        timestampLabel: data.timestamp_label,
        noteText: data.note_text,
        tag: data.tag,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (e) {
      console.error('[lms] saveLessonNote exception:', e);
      return null;
    }
  },

  async deleteLessonNote(noteId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !noteId) return false;
    try {
      const { error } = await authClient
        .from('lms_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('[lms] deleteLessonNote error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[lms] deleteLessonNote exception:', e);
      return false;
    }
  },

  /** Statutory Compliance Documents Vault (Part 7 §7.5) */
  async getComplianceDocuments(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('compliance_documents')
        .select('*')
        .eq('is_deleted', false)
        .order('expiry_date', { ascending: true });
      if (error) {
        console.warn('[compliance] getComplianceDocuments error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[compliance] getComplianceDocuments exception:', e);
      return [];
    }
  },

  /** Confidential POCSO / POSH Grievance Case Vault (Part 7 §7.5) */
  async getComplaintCases(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('complaint_cases')
        .select('*')
        .eq('is_deleted', false)
        .order('reported_at', { ascending: false });
      if (error) {
        console.warn('[compliance] getComplaintCases error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[compliance] getComplaintCases exception:', e);
      return [];
    }
  },

  /** School Management Committee Minutes Register (Part 7 §7.5) */
  async getSmcMinutes(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('smc_minutes')
        .select('*')
        .eq('is_deleted', false)
        .order('meeting_date', { ascending: false });
      if (error) {
        console.warn('[compliance] getSmcMinutes error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[compliance] getSmcMinutes exception:', e);
      return [];
    }
  },

  /** UDISE+ Annual Statutory Records (Part 7 §7.5) */
  async getUdiseRecords(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('udise_records')
        .select('*')
        .eq('is_deleted', false)
        .order('academic_year', { ascending: false });
      if (error) {
        console.warn('[compliance] getUdiseRecords error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[compliance] getUdiseRecords exception:', e);
      return [];
    }
  },

  /** RBAC Permissions Matrix Catalog (Part 6 §6.2) */
  async getPermissions(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('permissions')
        .select('*')
        .order('module', { ascending: true });
      if (error) {
        console.warn('[rbac] getPermissions error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[rbac] getPermissions exception:', e);
      return [];
    }
  },

  /** Transport Fleet Telematics (Part 3 §3.3) */
  async getTransportRoutes(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('transport_routes')
        .select('*, transport_vehicles(*)')
        .eq('is_deleted', false);
      if (error) {
        console.warn('[transport] getTransportRoutes error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[transport] getTransportRoutes exception:', e);
      return [];
    }
  },

  /** Library Books Catalog (Part 3 §3.5) */
  async getLibraryBooks(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('library_books')
        .select('*')
        .eq('is_deleted', false)
        .order('title', { ascending: true });
      if (error) {
        console.warn('[library] getLibraryBooks error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[library] getLibraryBooks exception:', e);
      return [];
    }
  },

  /** Facilities & Inventory Assets (Part 2 §2.11) */
  async getInventoryAssets(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('inventory_assets')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });
      if (error) {
        console.warn('[inventory] getInventoryAssets error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[inventory] getInventoryAssets exception:', e);
      return [];
    }
  },

  /** Admissions Leads CRM (Part 2 §2.12) */
  async getInquiryLeads(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('inquiry_leads')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('[admissions] getInquiryLeads error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[admissions] getInquiryLeads exception:', e);
      return [];
    }
  },

  /** Social Media Scheduled Posts (Part 2 §2.13) */
  async getSocialPosts(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('social_posts')
        .select('*')
        .eq('is_deleted', false)
        .order('scheduled_for', { ascending: true });
      if (error) {
        console.warn('[social] getSocialPosts error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[social] getSocialPosts exception:', e);
      return [];
    }
  },

  /** Alumni Directory & Profiles (Part 2 §2.8) */
  async getAlumniProfiles(): Promise<any[]> {

    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await authClient
        .from('alumni_profiles')
        .select('*')
        .eq('is_deleted', false)
        .order('graduation_year', { ascending: false });
      if (error) {
        console.warn('[alumni] getAlumniProfiles error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[alumni] getAlumniProfiles exception:', e);
      return [];
    }
  },
};





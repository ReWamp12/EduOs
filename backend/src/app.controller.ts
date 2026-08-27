import { Controller, Get, Post, Put, Param, Body, Query, Logger } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { RagService } from './rag/rag.service';
import * as mock from './mockData';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly ragService: RagService,
  ) {}

  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      service: 'EduOS NestJS Backend API',
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      database: this.supabaseService.isConfigured() ? 'connected' : 'standalone',
    };
  }


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

  // --- Assignments & Homework ---
  @Get('assignments/batch/:id')
  async getAssignments(@Param('id') batchId: string) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('assignments')
          .select('*')
          .eq('batch_id', batchId);

        if (!error && data) {
          return data;
        }
      } catch (err) {
        this.logger.error('Failed to fetch assignments.', err);
      }
    }
    return [
      {
        id: 'asg-1',
        title: 'Rotational Dynamics Problem Sheet',
        description: 'Solve problems 1 to 15. Show step-by-step vector products.',
        dueDate: '2026-08-22T23:59:00Z',
        maxMarks: 50,
        subjectName: 'Physics',
      },
    ];
  }

  @Post('assignments')
  async createAssignment(@Body() body: any) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('assignments')
          .insert({
            batch_id: body.batchId,
            subject_id: body.subjectId,
            teacher_id: body.teacherId,
            title: body.title,
            description: body.description,
            due_date: body.dueDate,
            max_marks: body.maxMarks,
          })
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        this.logger.error('Failed to create assignment.', err);
      }
    }
    return { id: `asg-${Date.now()}`, ...body };
  }

  @Post('submissions')
  async submitAssignment(@Body() body: any) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('assignment_submissions')
          .insert({
            assignment_id: body.assignmentId,
            student_id: body.studentId,
            submission_url: body.submissionUrl,
            status: 'submitted',
          })
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        this.logger.error('Failed to upload submission.', err);
      }
    }
    return { id: `sub-${Date.now()}`, ...body, status: 'submitted' };
  }

  @Put('submissions/:id/grade')
  async gradeSubmission(@Param('id') submissionId: string, @Body() body: any) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { error } = await client
          .from('assignment_submissions')
          .update({
            marks_obtained: body.marksObtained,
            feedback: body.feedback,
            status: 'graded',
          })
          .eq('id', submissionId);

        return { success: !error };
      } catch (err) {
        this.logger.error('Failed to grade submission.', err);
      }
    }
    return { success: true };
  }

  // --- Exams & Results ---
  @Get('exams/student/:id')
  async getExamResults(@Param('id') studentId: string) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('exam_results')
          .select(`
            id,
            marks_obtained,
            percentile,
            rank_in_batch,
            weak_topics,
            mistake_summary,
            exams (
              title,
              exam_type,
              total_marks,
              exam_date
            )
          `)
          .eq('student_id', studentId);

        if (!error && data) {
          return data.map((res: any) => ({
            id: res.id,
            examTitle: res.exams.title,
            examType: res.exams.exam_type,
            totalMarks: res.exams.total_marks,
            examDate: res.exams.exam_date,
            marksObtained: res.marks_obtained,
            percentile: res.percentile,
            rankInBatch: res.rank_in_batch,
            weakTopics: res.weak_topics,
            mistakeSummary: res.mistake_summary,
          }));
        }
      } catch (err) {
        this.logger.error('Failed to fetch exam results.', err);
      }
    }
    return [
      {
        id: 'er-1',
        examTitle: 'JEE Advanced Mock Test 02',
        examType: 'mock_test',
        totalMarks: 300,
        examDate: '2026-08-10',
        marksObtained: 245,
        percentile: 98.4,
        rankInBatch: 3,
        weakTopics: ['Rotational Mechanics', 'Ionic Equilibrium'],
        mistakeSummary: '2 silly errors in physics calculation.',
      },
    ];
  }

  // --- Notices ---
  @Get('notices')
  async getNotices() {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('notices')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        this.logger.error('Failed to query notices.', err);
      }
    }
    return [
      {
        id: 'n-1',
        title: 'Independence Day Celebrations',
        content: 'Flag hoisting ceremony will commence at 8:00 AM in the central courtyard. Attendance is mandatory.',
        category: 'event',
        priority: 'normal',
        createdAt: '2026-08-14T09:00:00Z',
      },
    ];
  }

  // --- EDUOS-105: Attendance Engine Endpoints ---
  @Post('attendance/mark')
  async markAttendance(
    @Body()
    body: {
      batch_id: string;
      date: string;
      period_number: number;
      records: Array<{ student_id: string; status: string; is_excused_medical?: boolean; remarks?: string }>;
      caller_id?: string;
      caller_role?: string;
      reason?: string;
    },
  ) {
    const { batch_id, date, period_number, records, caller_id, caller_role, reason } = body;

    // 1. Reject future dates
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return {
        statusCode: 400,
        error: 'Bad Request',
        message: `Cannot mark attendance for a future date (${date}).`,
      };
    }

    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.rpc('mark_attendance', {
          p_batch_id: batch_id,
          p_date: date,
          p_period_number: period_number || 1,
          p_records: records,
          p_caller_id: caller_id || null,
          p_caller_role: caller_role || null,
          p_reason: reason || null,
        });

        if (error) {
          const is403 = error.message.includes('Permission denied') || error.message.includes('requires Principal approval');
          const is400 = error.message.includes('future date') || error.message.includes('Sunday') || error.message.includes('reason is required');
          return {
            statusCode: is403 ? 403 : is400 ? 400 : 500,
            error: is403 ? 'Forbidden' : is400 ? 'Bad Request' : 'Internal Server Error',
            message: error.message,
          };
        }

        return data;
      } catch (err: any) {
        this.logger.error('Failed to execute mark_attendance RPC.', err);
        return {
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message,
        };
      }
    }

    return {
      success: true,
      total: records?.length || 0,
      notified: records?.filter((r) => r.status !== 'present').length || 0,
      skipped_unchanged: 0,
      failed: 0,
    };
  }

  @Get('attendance/defaulters/:batchId')
  async getAttendanceDefaulters(@Param('batchId') batchId: string) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.rpc('get_attendance_defaulters', {
          p_batch_id: batchId,
        });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        this.logger.error('Failed to query attendance defaulters.', err);
      }
    }
    return [];
  }

  @Get('attendance/student/:studentId')
  async getStudentAttendance(@Param('studentId') studentId: string) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('attendances')
          .select('id, student_id, batch_id, date, period_number, status, is_excused_medical, remarks, created_at, updated_at')
          .eq('student_id', studentId)
          .order('date', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        this.logger.error('Failed to query student attendance.', err);
      }
    }
    return [];
  }

  // --- EDUOS-RAG: hybrid semantic search + grounded tutoring (EDUOS-106) ---
  // Retrieval: shared MiniLM embeddings -> match_rag_hybrid (RRF over
  // vector + lexical, SECURITY DEFINER). Generation: server-side Groq over
  // retrieved textbook context, extractive fallback without a key. The MD5
  // hash-bucket pseudo-embedding and canned keyword answers died here.
  @Get('rag/search')
  async searchRag(
    @Query('q') q: string,
    @Query('board') board?: string,
    @Query('subject') subject?: string,
    @Query('category') category?: string,
    @Query('limit') limit = '8',
  ) {
    if (!q || !q.trim()) {
      return { query: q, count: 0, results: [] };
    }
    try {
      const results = await this.ragService.search(q.trim(), {
        board,
        subject,
        category,
        limit: parseInt(limit, 10) || 8,
      });
      return { query: q, board: board || 'ALL', subject: subject || 'ALL', count: results.length, results };
    } catch (err) {
      this.logger.error('RAG search failed.', err);
      return { query: q, count: 0, results: [] };
    }
  }

  @Post('rag/ask')
  async askRagTutor(
    @Body() body: { query: string; board?: string; subject?: string; language?: string },
  ) {
    if (!body?.query || !body.query.trim()) {
      return {
        query: body?.query ?? '',
        mode: 'no_context',
        count: 0,
        synthesized_answer: 'Please ask a question about your Class 10 syllabus.',
        key_formulae_or_terms: [],
        citations: [],
        results: [],
      };
    }
    try {
      return await this.ragService.ask(body.query.trim(), {
        board: body.board,
        subject: body.subject,
        language: body.language,
      });
    } catch (err) {
      this.logger.error('RAG ask failed.', err);
      return {
        query: body.query,
        mode: 'no_context',
        count: 0,
        synthesized_answer: 'The tutoring service hit an internal error. Please try again.',
        key_formulae_or_terms: [],
        citations: [],
        results: [],
      };
    }
  }

  @Get('rag/resources')
  async getRagResources(
    @Query('board') board?: string,
    @Query('subject') subject?: string,
    @Query('category') category?: string,
  ) {
    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getClient();
        let query = client
          .from('rag_resource_contexts')
          .select('id, board, class, subject, category, note, rag_resources(id, url, domain, source_tier, title, content_type, license, author_publisher)');

        if (board) query = query.eq('board', board);
        if (subject) query = query.ilike('subject', `%${subject}%`);
        if (category) query = query.eq('category', category);

        const { data, error } = await query.limit(50);
        if (!error && data) return data;
      } catch (err) {
        this.logger.error('Failed to list RAG resources.', err);
      }
    }
    return [];
  }

}

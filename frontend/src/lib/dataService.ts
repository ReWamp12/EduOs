import * as mock from './mockData';
import { Student, TimetableSlot, Tenant, LeaveRequest } from './types';

const API_BASE = 'http://localhost:4000/api';

export const dataService = {
  // --- Student Portal ---
  async getStudentOverview(studentId: string): Promise<Student> {
    try {
      const res = await fetch(`${API_BASE}/student/overview/${studentId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('NestJS Backend connection failed. Falling back to offline mock data.', e);
    }
    return Promise.resolve(mock.mockCurrentStudent);
  },

  // --- Teacher / Faculty Portal ---
  async getTeacherTimetable(teacherId: string): Promise<TimetableSlot[]> {
    try {
      const res = await fetch(`${API_BASE}/teacher/timetable/${teacherId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('NestJS Backend connection failed. Falling back to offline mock data.', e);
    }
    return Promise.resolve(mock.mockTimetable);
  },

  // --- Super Admin Portal ---
  async getTenants(): Promise<Tenant[]> {
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
  async markAttendance(batchId: string, records: Array<{ studentId: string; status: string; remarks?: string }>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, records }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
    } catch (e) {
      console.warn('Failed to post attendance to NestJS backend.', e);
    }
    return Promise.resolve(true);
  },

  async getStudentAttendance(studentId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/attendance/student/${studentId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to query student attendance from NestJS backend.', e);
    }
    return Promise.resolve([
      { id: 'att-1', date: '2026-08-17', status: 'present', remarks: 'On time' },
      { id: 'att-2', date: '2026-08-18', status: 'present', remarks: 'On time' },
    ]);
  },

  // --- Assignments ---
  async getAssignments(batchId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/assignments/batch/${batchId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch assignments from NestJS backend.', e);
    }
    return Promise.resolve([
      {
        id: 'asg-1',
        title: 'Rotational Dynamics Problem Sheet',
        description: 'Solve problems 1 to 15. Show step-by-step vector products.',
        dueDate: '2026-08-22T23:59:00Z',
        maxMarks: 50,
        subjectName: 'Physics',
      },
    ]);
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
  async getExamResults(studentId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/exams/student/${studentId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch exam results from NestJS backend.', e);
    }
    return Promise.resolve([
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
    ]);
  },

  // --- Notices ---
  async getNotices(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/notices`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch notices from NestJS backend.', e);
    }
    return Promise.resolve([
      {
        id: 'n-1',
        title: 'Independence Day Celebrations',
        content: 'Flag hoisting ceremony will commence at 8:00 AM in the central courtyard. Attendance is mandatory.',
        category: 'event',
        priority: 'normal',
        createdAt: '2026-08-14T09:00:00Z',
      },
    ]);
  },
};

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
};

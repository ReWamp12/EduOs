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
        name: 'Modern Public School (CBSE Affiliated)',
        subdomain: 'mps',
        institutionType: 'school',
        primaryColor: '#2563EB',
        secondaryColor: '#0D9488',
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
    return Promise.resolve([]);
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
  async getExamResults(studentId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/exams/student/${studentId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch exam results from NestJS backend.', e);
    }
    return Promise.resolve([]);
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
    return Promise.resolve([]);
  },

  // ==========================================
  // TICKET EDUOS-101: HRMS & COMPLIANCE API METHODS
  // ==========================================

  async getHROverview(): Promise<any> {
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
    }

    const app = mock.mockApplicants.find(a => a.id === applicantId);
    if (app) {
      app.scorecard = scorecardObj;
      if (!updatedApplicant) updatedApplicant = app;
    }

    return Promise.resolve(updatedApplicant || { id: applicantId, scorecard: scorecardObj });
  },

  async getEmployees(): Promise<any[]> {
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
};


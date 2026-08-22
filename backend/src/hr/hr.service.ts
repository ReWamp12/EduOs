import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

export interface JobFilter {
  department?: string;
  status?: string;
  category?: string;
}

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);

  // In-memory store (empty)
  private mockJobs: any[] = [];
  private mockApplicants: any[] = [];
  private mockEmployees: any[] = [];
  private mockTrainingRecords: any[] = [];

  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. HR Overview Summary
  async getHROverview() {
    const totalStaff = this.mockEmployees.length;
    const verifiedStaff = this.mockEmployees.filter(e => e.policeVerificationStatus === 'verified').length;
    const pendingGraceStaff = this.mockEmployees.filter(e => e.policeVerificationStatus === 'submitted_pending').length;
    const missingPoliceStaff = this.mockEmployees.filter(e => e.policeVerificationStatus === 'missing').length;
    const restrictedStaff = this.mockEmployees.filter(e => e.isAccessRestricted).length;
    const policeVerificationRate = totalStaff > 0 ? Math.round((verifiedStaff / totalStaff) * 100) : 100;

    // 50-Hour CPD calculation
    const teachingStaff = this.mockEmployees.filter(e => e.employeeType === 'teaching');
    const fullyCompletedCPD = teachingStaff.filter(e => (e.cpdHoursCompleted || 0) >= 50).length;
    const cpdCompletionRate = teachingStaff.length > 0 ? Math.round((fullyCompletedCPD / teachingStaff.length) * 100) : 100;
    const totalCpdHoursLogged = teachingStaff.reduce((sum, e) => sum + (e.cpdHoursCompleted || 0), 0);

    const openJobsCount = this.mockJobs.filter(j => j.status === 'published').length;
    const totalApplicants = this.mockApplicants.length;

    return {
      metrics: {
        totalStaff,
        teachingStaffCount: teachingStaff.length,
        nonTeachingStaffCount: totalStaff - teachingStaff.length,
        openPositions: openJobsCount,
        activeApplicants: totalApplicants,
        policeVerificationCompliancePct: policeVerificationRate,
        verifiedStaffCount: verifiedStaff,
        pendingGraceCount: pendingGraceStaff,
        missingPoliceCount: missingPoliceStaff,
        restrictedAccessStaffCount: restrictedStaff,
        cpdMandatoryHoursTarget: 50,
        cpdCompletionRatePct: cpdCompletionRate,
        totalCpdHoursLogged,
      },
      criticalAlerts: [
        {
          id: 'alt-1',
          type: 'danger',
          title: 'Police Verification Grace Period Expired',
          message: 'Mohd. Imran Khan (PET Coach) has exceeded the 30-day statutory grace period with missing verification. Unsupervised role access is restricted.',
          employeeId: 'emp-104',
          employeeCode: 'EDU-FAC-119',
        },
        {
          id: 'alt-2',
          type: 'warning',
          title: 'Grace Window Expiring in 3 Days',
          message: 'Vikramaditya Bose (TGT Computer Science) has 3 days left in the 30-day police clearance window.',
          employeeId: 'emp-103',
          employeeCode: 'EDU-FAC-112',
        },
      ],
      recentApplicants: this.mockApplicants.slice(0, 5),
    };
  }

  // 2. Jobs ATS
  async getJobs(filters?: JobFilter) {
    let result = [...this.mockJobs];
    if (filters && filters.department) {
      const dept = filters.department.toLowerCase();
      result = result.filter(j => j.department.toLowerCase().includes(dept));
    }
    if (filters?.status) {
      result = result.filter(j => j.status === filters.status);
    }
    return result;
  }

  async createJob(jobData: any) {
    const newJob = {
      id: `job-${Date.now()}`,
      tenantId: 't-1',
      title: jobData.title || 'New Faculty Position',
      department: jobData.department || 'General',
      jobType: jobData.jobType || 'Full-time',
      designationCategory: jobData.designationCategory || 'Teaching',
      experienceRequired: jobData.experienceRequired || '2-5 years',
      salaryRange: jobData.salaryRange || 'As per norms',
      description: jobData.description || '',
      requirements: jobData.requirements || '',
      status: jobData.status || 'published',
      location: jobData.location || 'Main Campus',
      positionsCount: Number(jobData.positionsCount) || 1,
      deadline: jobData.deadline || '2026-10-30',
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.mockJobs.unshift(newJob);
    return newJob;
  }

  // 3. Applicants & Pipeline
  async getApplicants(jobId?: string) {
    let list = [...this.mockApplicants];
    if (jobId) {
      list = list.filter(a => a.jobId === jobId);
    }
    return list;
  }

  async createApplicant(applicantData: any) {
    const emailTrim = (applicantData.email || '').trim().toLowerCase();
    const jobId = applicantData.jobId || 'job-1';

    const existing = this.mockApplicants.find(
      a => a.email.trim().toLowerCase() === emailTrim && a.jobId === jobId,
    );

    if (existing) {
      throw new ConflictException(
        `An application for this position using ${applicantData.email} has already been submitted.`,
      );
    }

    const newApplicant = {
      id: `app-${Date.now()}`,
      jobId,
      tenantId: 't-1',
      fullName: applicantData.fullName,
      email: applicantData.email,
      phone: applicantData.phone,
      experienceYears: Number(applicantData.experienceYears) || 3.0,
      highestQualification: applicantData.highestQualification || 'B.Ed.',
      currentOrganization: applicantData.currentOrganization || '',
      resumeUrl: applicantData.resumeUrl || 'https://storage.eduos.io/resumes/applicant_cv.pdf',
      stage: 'applied' as const,
      appliedAt: new Date().toISOString(),
      jobTitle: applicantData.jobTitle || 'Faculty Position',
    };
    this.mockApplicants.unshift(newApplicant as any);
    return newApplicant;
  }

  async updateApplicantStage(applicantId: string, stage: string, extraData?: any) {
    const applicant = this.mockApplicants.find(a => a.id === applicantId);
    if (!applicant) {
      throw new Error(`Applicant ${applicantId} not found`);
    }
    applicant.stage = stage as any;
    if (extraData?.offeredSalary) {
      applicant.offeredSalary = extraData.offeredSalary;
    }
    if (extraData?.proposedJoiningDate) {
      applicant.proposedJoiningDate = extraData.proposedJoiningDate;
    }

    // If candidate is hired, auto-convert to EmployeeRecord
    if (stage === 'hired') {
      const joiningDate = applicant.proposedJoiningDate || new Date().toISOString().split('T')[0];
      const gracePeriodExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const newEmpCode = `EDU-FAC-${Math.floor(100 + Math.random() * 900)}`;

      const newEmployee = {
        id: `emp-${Date.now()}`,
        tenantId: 't-1',
        employeeCode: newEmpCode,
        fullName: applicant.fullName,
        email: applicant.email,
        phone: applicant.phone,
        designation: applicant.jobTitle,
        department: 'Academic Wing',
        employeeType: 'teaching' as any,
        dateOfJoining: joiningDate,
        employmentStatus: 'probationary' as any,
        policeVerificationStatus: 'submitted_pending' as any,
        policeDocUrl: null,
        policeVerificationDate: null,
        policeAcknowledgmentNumber: null,
        gracePeriodExpiryDate: gracePeriodExpiry,
        isAccessRestricted: false,
        emergencyContactName: 'Not Provided',
        emergencyContactPhone: applicant.phone,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        cpdHoursCompleted: 0,
        serviceBook: {
          appointmentOrderNumber: `DVN/HR/${new Date().getFullYear()}/APP-${Math.floor(100 + Math.random() * 900)}`,
          appointmentDate: joiningDate,
          confirmationOrderNumber: null,
          confirmationDate: null,
          providentFundUan: null,
          esiInsuranceNumber: null,
          panNumber: null,
          casualLeaveBalance: 12,
          earnedLeaveBalance: 0,
          medicalLeaveBalance: 10,
          qualificationsList: [
            { degree: applicant.highestQualification, institution: 'Verified Board/University', yearOfPassing: 2022, percentageOrGrade: 'Verified', isVerified: true },
          ],
          scaleHistory: [
            {
              id: `sc-${Date.now()}`,
              effectiveDate: joiningDate,
              basicPay: 44900,
              gradePay: 4600,
              daHraAllowances: 22450,
              grossPay: 71950,
              orderNumber: `DVN/PAY/${new Date().getFullYear()}/${newEmpCode}`,
              remarks: 'Entry pay scale on appointment',
            },
          ],
          promotionHistory: [],
        },
      };
      this.mockEmployees.push(newEmployee as any);
    }

    return applicant;
  }

  async submitInterviewScorecard(applicantId: string, scorecardData: any) {
    const applicant = this.mockApplicants.find(a => a.id === applicantId);
    if (!applicant) {
      throw new Error(`Applicant ${applicantId} not found`);
    }

    const pedagogy = Number(scorecardData.pedagogyScore) || 4;
    const subject = Number(scorecardData.subjectKnowledgeScore) || 4;
    const classroom = Number(scorecardData.classroomManagementScore) || 4;
    const comm = Number(scorecardData.communicationScore) || 4;
    const overall = Number(((pedagogy + subject + classroom + comm) / 4).toFixed(2));

    applicant.scorecard = {
      pedagogyScore: pedagogy,
      subjectKnowledgeScore: subject,
      classroomManagementScore: classroom,
      communicationScore: comm,
      overallRating: overall,
      recommendation: scorecardData.recommendation || 'hire',
      interviewerName: scorecardData.interviewerName || 'Interview Panel',
      notes: scorecardData.notes || 'Completed rubric assessment successfully.',
    };

    return applicant;
  }

  // 4. Employees & Service Book
  async getEmployees() {
    return this.mockEmployees;
  }

  async getEmployeeById(employeeId: string) {
    const emp = this.mockEmployees.find(e => e.id === employeeId);
    if (!emp) {
      throw new Error(`Employee ${employeeId} not found`);
    }
    return emp;
  }

  async updateServiceBook(employeeId: string, serviceBookUpdate: any) {
    const emp = this.mockEmployees.find(e => e.id === employeeId);
    if (!emp) {
      throw new Error(`Employee ${employeeId} not found`);
    }
    emp.serviceBook = {
      ...emp.serviceBook,
      ...serviceBookUpdate,
    };
    return emp;
  }

  async addScaleIncrement(employeeId: string, increment: any) {
    const emp = this.mockEmployees.find(e => e.id === employeeId);
    if (!emp) throw new Error('Employee not found');
    const newInc = {
      id: `sc-${Date.now()}`,
      effectiveDate: increment.effectiveDate || new Date().toISOString().split('T')[0],
      basicPay: Number(increment.basicPay),
      gradePay: Number(increment.gradePay || 0),
      daHraAllowances: Number(increment.daHraAllowances || 0),
      grossPay: Number(increment.basicPay) + Number(increment.daHraAllowances || 0),
      orderNumber: increment.orderNumber || `DVN/INC/${Date.now()}`,
      remarks: increment.remarks || 'Annual statutory increment',
    };
    emp.serviceBook.scaleHistory.push(newInc);
    return emp;
  }

  // 5. Police Verification Gate
  async updatePoliceVerification(employeeId: string, data: any) {
    const emp = this.mockEmployees.find(e => e.id === employeeId);
    if (!emp) throw new Error('Employee not found');

    emp.policeVerificationStatus = data.status;
    if (data.status === 'verified') {
      emp.policeDocUrl = data.docUrl || 'https://storage.eduos.io/police/verified_clearance.pdf';
      emp.policeVerificationDate = data.verificationDate || new Date().toISOString().split('T')[0];
      emp.policeAcknowledgmentNumber = data.acknowledgmentNumber || `PCC/DL/${Date.now()}`;
      emp.isAccessRestricted = false;
    } else if (data.status === 'submitted_pending') {
      emp.policeAcknowledgmentNumber = data.acknowledgmentNumber || emp.policeAcknowledgmentNumber;
      emp.policeDocUrl = data.docUrl || emp.policeDocUrl;
    } else if (data.status === 'missing') {
      emp.policeDocUrl = null;
      emp.policeVerificationDate = null;
    }

    if (data.isAccessRestricted !== undefined) {
      emp.isAccessRestricted = Boolean(data.isAccessRestricted);
    }

    return emp;
  }

  // 6. Training CPD Records
  async getTrainingRecords(employeeId?: string) {
    if (employeeId) {
      return this.mockTrainingRecords.filter(t => t.employeeId === employeeId);
    }
    return this.mockTrainingRecords;
  }

  async addTrainingRecord(trainingData: any) {
    const newRecord = {
      id: `tr-${Date.now()}`,
      employeeId: trainingData.employeeId,
      trainingTitle: trainingData.trainingTitle,
      providerAgency: trainingData.providerAgency || 'CBSE Sahodaya',
      category: trainingData.category || 'pedagogy',
      durationHours: Number(trainingData.durationHours) || 6,
      startDate: trainingData.startDate || new Date().toISOString().split('T')[0],
      endDate: trainingData.endDate || new Date().toISOString().split('T')[0],
      academicYear: trainingData.academicYear || '2026-2027',
      mode: trainingData.mode || 'online',
      certificateUrl: trainingData.certificateUrl || 'https://storage.eduos.io/certs/training_cert.pdf',
      isVerifiedByPrincipal: true,
    };
    this.mockTrainingRecords.unshift(newRecord);

    // Update employee total CPD hours
    const emp = this.mockEmployees.find(e => e.id === trainingData.employeeId);
    if (emp) {
      emp.cpdHoursCompleted = (emp.cpdHoursCompleted || 0) + newRecord.durationHours;
    }

    return newRecord;
  }
}

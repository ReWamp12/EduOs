import {
  UserProfile,
  Tenant,
  Batch,
  Student,
  TimetableSlot,
  AttendanceRecord,
  LMSLesson,
  Assignment,
  ExamResult,
  LeaveRequest,
  Notice,
  JobOpening,
  Applicant,
  EmployeeRecord,
  TrainingRecord,
} from './types';

export const mockTenant: Tenant = {
  id: 'tenant-default',
  name: 'Modern Public School',
  subdomain: 'mps',
  institutionType: 'school',
  primaryColor: '#2563EB',
  secondaryColor: '#0D9488',
  accentColor: '#F59E0B',
  tagline: 'EduOS Institutional Platform',
  logoUrl: '',
};

export const mockProfiles: Record<string, UserProfile> = {
  student: {
    id: 'user-std-01',
    email: '',
    firstName: 'Student',
    lastName: '',
    role: 'student',
    phone: '',
    avatarUrl: '',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  teacher: {
    id: 'user-tch-01',
    email: '',
    firstName: 'Teacher',
    lastName: '',
    role: 'teacher',
    phone: '',
    avatarUrl: '',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  principal: {
    id: 'user-prn-01',
    email: '',
    firstName: 'Principal',
    lastName: '',
    role: 'principal',
    phone: '',
    avatarUrl: '',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  parent: {
    id: 'user-par-01',
    email: '',
    firstName: 'Parent',
    lastName: '',
    role: 'parent',
    phone: '',
    avatarUrl: '',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  super_admin: {
    id: 'user-adm-01',
    email: '',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
    phone: '',
    avatarUrl: '',
    tenantId: mockTenant.id,
  },
  hr_manager: {
    id: 'user-hr-01',
    email: '',
    firstName: 'HR',
    lastName: 'Manager',
    role: 'hr_manager',
    phone: '',
    avatarUrl: '',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
};

export const mockBatches: Batch[] = [];

export const mockCurrentStudent: Student = {
  id: '',
  userId: '',
  name: '',
  email: '',
  rollNumber: '',
  admissionNumber: '',
  batchId: '',
  batchName: '',
  targetExam: '',
  attendancePct: 0,
  rankInBatch: 0,
  parentName: '',
  parentPhone: '',
  qrCodeId: '',
  avatarUrl: '',
};

export const mockStudentsInBatch: Student[] = [];
export const mockTimetable: TimetableSlot[] = [];
export const mockSubjects: Array<{ id: string; name: string; code: string; color: string; icon: string }> = [];
export const mockAttendanceHistory: AttendanceRecord[] = [];
export const mockLMSLessons: LMSLesson[] = [];
export const mockAssignments: Assignment[] = [];
export const mockExamResults: ExamResult[] = [];
export const mockLeaveRequests: LeaveRequest[] = [];
export const mockNotices: Notice[] = [];
export const mockPTMSlots: Array<{
  id: string;
  teacherName: string;
  subject: string;
  date: string;
  time: string;
  mode: string;
  status: string;
  room: string;
  availableSlots: string[];
}> = [];

export const mockFeesBreakdown = {
  totalAnnualFee: 0,
  paidAmount: 0,
  pendingAmount: 0,
  dueDate: '',
  items: [] as Array<{ name: string; amount: number; status: string }>,
};

export interface BusRfidLog {
  event: string;
  location: string;
  time: string;
  verified: boolean;
}

export const mockBusLiveTracking: {
  routeNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  attendantName: string;
  currentSpeedKmph: number;
  speedKmH: number;
  currentStop: string;
  nextStop: string;
  etaMinutes: number;
  latitude: number;
  longitude: number;
  status: string;
  rfidLogs: BusRfidLog[];
} = {
  routeNumber: 'N/A',
  vehicleNumber: '',
  driverName: '',
  driverPhone: '',
  attendantName: '',
  currentSpeedKmph: 0,
  speedKmH: 0,
  currentStop: '',
  nextStop: '',
  etaMinutes: 0,
  latitude: 0,
  longitude: 0,
  status: 'idle',
  rfidLogs: [],
};

export const mockConsentForms: Array<{
  id: string;
  title: string;
  date: string;
  deadline: string;
  signedOn?: string;
  category: string;
  status: string;
  description: string;
}> = [];

export const mockMedicalRecord = {
  bloodGroup: '',
  allergies: [] as string[],
  emergencyContact1: '',
  emergencyContact2: '',
  doctorName: '',
  doctorPhone: '',
  specialInstructions: '',
};

export const mockAIQuestions: Array<{
  id: string;
  topic: string;
  question: string;
  difficulty: string;
  type: string;
  source: string;
}> = [];

export const mockStatutoryStandards: Array<{
  id: string;
  code: string;
  title: string;
  authority: string;
  jurisdiction: string;
  frequency: string;
  mandatoryDocuments: string[];
  status: string;
  validUntil: string;
}> = [];

export const mockParentChildren: Array<{
  id: string;
  name: string;
  rollNumber: string;
  grade: string;
  batchName: string;
  branch: string;
  targetExam: string;
  avatarUrl: string;
  attendance: number;
  attendancePct: number;
  latestScore: string;
  rankInBatch: number;
  unreadAlerts: number;
}> = [];

export const mockParentAINarrative = {
  studentName: '',
  english: '',
  hindi: '',
  executiveSummary: 'No academic report generated yet.',
  keyStrengths: [] as string[],
  recommendedFocusAreas: [] as string[],
  teacherObservations: '',
  nextMilestone: '',
};

export const mockFeeInvoices: Array<{
  id: string;
  invoiceNumber: string;
  title: string;
  dueDate: string;
  paidOn?: string;
  transactionId?: string;
  amount: number;
  status: string;
  studentName: string;
  receiptUrl?: string;
  breakdown: Array<{ head: string; amount: number }>;
}> = [];

// ==========================================
// TICKET EDUOS-101: HRMS & COMPLIANCE MOCK DATA (EMPTIED)
// ==========================================

export const mockJobs: JobOpening[] = [];
export const mockApplicants: Applicant[] = [];
export const mockEmployees: EmployeeRecord[] = [];
export const mockTrainingRecords: TrainingRecord[] = [];

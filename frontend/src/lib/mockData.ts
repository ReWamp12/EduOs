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
    email: 'aarav.sharma@mps.eduos.in',
    firstName: 'Aarav',
    lastName: 'Sharma',
    role: 'student',
    phone: '+91-9810111001',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  teacher: {
    id: 'user-tch-01',
    email: 'amit.verma@mps.eduos.in',
    firstName: 'Amit',
    lastName: 'Verma',
    role: 'teacher',
    phone: '+91-9810111099',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  principal: {
    id: 'user-prn-01',
    email: 'principal@mps.eduos.in',
    firstName: 'Dr. Meenakshi',
    lastName: 'Sundaram',
    role: 'principal',
    phone: '+91-9810111088',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meenakshi',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  parent: {
    id: 'user-par-01',
    email: 'rajesh.sharma@parents.mps.eduos.in',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    role: 'parent',
    phone: '+91-9810111001',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  super_admin: {
    id: 'user-adm-01',
    email: 'admin@eduos.io',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'super_admin',
    phone: '+91-9810111000',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    tenantId: mockTenant.id,
  },
  hr_manager: {
    id: 'user-hr-01',
    email: 'hr@mps.eduos.in',
    firstName: 'Priya',
    lastName: 'Nambiar',
    role: 'hr_manager',
    phone: '+91-9810111077',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  finance_officer: {
    id: 'user-fin-01',
    email: 'finance@mps.eduos.in',
    firstName: 'Rajesh',
    lastName: 'Nair',
    role: 'finance_officer',
    phone: '+91-9810111055',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshNair',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
  accountant: {
    id: 'user-acc-01',
    email: 'accounts@mps.eduos.in',
    firstName: 'Suresh',
    lastName: 'Gupta',
    role: 'accountant',
    phone: '+91-9810111044',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
    tenantId: mockTenant.id,
    branchId: 'branch-main-campus',
  },
};

export const mockBatches: Batch[] = [];

export const mockCurrentStudent: Student = {
  id: 'std-seeded-001',
  userId: 'user-std-01',
  name: 'Aarav Sharma',
  email: 'student@gmail.com',
  rollNumber: '1',
  admissionNumber: 'MPS2026001',
  batchId: 'batch-10a',
  batchName: 'Class 10 - A',
  targetExam: 'CBSE',
  attendancePct: 94.2,
  rankInBatch: 4,
  parentName: 'Rajesh Sharma',
  parentPhone: '+91-9810111001',
  parentEmail: 'parent@gmail.com',
  bloodGroup: 'O+',
  dob: '2011-03-15',
  gender: 'male',
  qrCodeId: '91889637-7d93-4c96-b1e5-ed170d505641',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
  tenantName: 'Modern Public School',
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

// Mirrors the first two students of the seeded Class 10-A roll (batchData's
// SEEDED_STUDENTS_LIST) so the Parent portal references students that exist in
// the fee ledger, attendance and gradebook. Kept as literals — importing
// batchData here creates a circular module graph via auth/* that crashes SSR.
// Real guardian↔student links land with EDUOS-105.
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
}> = [
  {
    id: 'std-1',
    name: 'Aarav Sharma',
    rollNumber: '1',
    grade: 'Class 10 - A',
    batchName: 'Class 10 - A',
    branch: 'Senior Wing',
    targetExam: 'CBSE',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    attendance: 96.5,
    attendancePct: 96.5,
    latestScore: '78/80 (97.5%)',
    rankInBatch: 1,
    unreadAlerts: 0,
  },
  {
    id: 'std-2',
    name: 'Aditi Verma',
    rollNumber: '2',
    grade: 'Class 10 - A',
    batchName: 'Class 10 - A',
    branch: 'Senior Wing',
    targetExam: 'CBSE',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi',
    attendance: 94.0,
    attendancePct: 94.0,
    latestScore: '75/80 (93.8%)',
    rankInBatch: 2,
    unreadAlerts: 0,
  },
];

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

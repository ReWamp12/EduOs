export type UserRole = 'student' | 'teacher' | 'principal' | 'parent' | 'super_admin' | 'hr_manager';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string;
  phone?: string;
  tenantId: string;
  branchId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  institutionType: 'coaching' | 'school' | 'college' | 'university';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  tagline?: string;
}

export interface Batch {
  id: string;
  name: string;
  code: string;
  targetExam: string;
  gradeLevel: string;
  roomNumber: string;
  mentorTeacherName: string;
  studentCount: number;
  capacity: number;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  admissionNumber: string;
  batchId: string;
  batchName: string;
  targetExam: string;
  attendancePct: number;
  rankInBatch: number;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentRelation?: string;
  bloodGroup?: string;
  dob?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  qrCodeId: string;
  avatarUrl: string;
  feeStatus?: 'paid' | 'partial' | 'due';
  medicalNotes?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 1 = Monday
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectColor: string;
  teacherName: string;
  roomNumber: string;
  batchId: string;
}

export interface AttendanceRecord {
  id: string;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  periodNumber?: number;
  remarks?: string;
}

export interface LMSLesson {
  id: string;
  courseTitle?: string;
  subject?: string;
  chapter?: string;
  chapterTitle?: string;
  title?: string;
  lessonTitle?: string;
  contentType: 'video' | 'pdf' | 'notes' | 'quiz';
  durationMinutes: number;
  url?: string;
  contentUrl?: string;
  completed?: boolean;
}

export interface AssignmentAttachment {
  name: string;
  url: string;
  size: string;
  type: 'pdf' | 'doc' | 'image' | 'sheet';
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  batchId?: string;
  batchName: string;
  dueDate: string;
  maxMarks: number;
  description?: string;
  instructions?: string;
  category?: 'dpp' | 'homework' | 'project' | 'worksheet';
  teacherId?: string;
  teacherName?: string;
  attachments?: AssignmentAttachment[];
  tags?: string[];
  createdAt?: number;
  status: 'pending' | 'submitted' | 'graded';
  obtainedMarks?: number;
  feedback?: string;
}


export interface ExamResult {
  id: string;
  examTitle: string;
  subject: string;
  examDate: string;
  marksObtained: number;
  totalMarks: number;
  percentile: number;
  rankInBatch: number;
  weakTopics: string[];
  mistakeSummary: string; // AI Diagnosis
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  designation: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount?: number;
  reason: string;
  substitutionTeacher?: string;
  documentUrl?: string;
  documentName?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'academic' | 'exam' | 'event' | 'urgent';
  priority?: 'normal' | 'urgent' | 'emergency';
  targetRole?: string;
  date: string;
  author: string;
}

export interface ConsentResponse {
  studentId: string;
  studentName: string;
  rollNumber: string;
  batchName: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentRelation?: string;
  signedByName?: string; // Full legal name entered by parent
  status: 'signed' | 'declined' | 'pending';
  signedAt?: number;
  declineReason?: string;
}

export interface DigitalConsentForm {
  id: string;
  title: string;
  description: string;
  category: 'Excursion & Field Visit' | 'Academic Remedial' | 'Medical & Health Camp' | 'Sports & Tournaments' | 'Media & Photography' | 'General Authorization';
  targetType: 'batch' | 'all_school' | 'custom_batches';
  targetBatchIds: string[];
  targetBatchNames: string[];
  authorRole: 'teacher' | 'principal';
  authorName: string;
  eventDate?: string;
  deadline: string;
  createdAt: number;
  instructions?: string;
  responses: ConsentResponse[];
}

// ==========================================
// TICKET EDUOS-101: HRMS & STATUTORY COMPLIANCE TYPES
// ==========================================

export interface JobOpening {
  id: string;
  tenantId: string;
  title: string;
  department: string;
  jobType: string;
  designationCategory: 'Teaching' | 'Non-Teaching' | 'Administrative' | 'Leadership';
  experienceRequired: string;
  salaryRange: string;
  description: string;
  requirements: string;
  status: 'draft' | 'published' | 'closed' | 'filled';
  location: string;
  positionsCount: number;
  deadline: string;
  applicantsCount?: number;
  createdAt: string;
}

export type ApplicantStage =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer_extended'
  | 'e_signed'
  | 'hired'
  | 'rejected';

export interface InterviewScorecard {
  pedagogyScore: number;
  subjectKnowledgeScore: number;
  classroomManagementScore: number;
  communicationScore: number;
  overallRating: number;
  recommendation: 'strong_hire' | 'hire' | 'hold' | 'reject';
  interviewerName: string;
  notes: string;
}

export interface Applicant {
  id: string;
  jobId: string;
  tenantId: string;
  fullName: string;
  email: string;
  phone: string;
  experienceYears: number;
  highestQualification: string;
  currentOrganization?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  stage: ApplicantStage;
  offeredSalary?: string;
  proposedJoiningDate?: string;
  appliedAt: string;
  jobTitle?: string;
  scorecard?: InterviewScorecard | null;
}

export interface QualificationEntry {
  degree: string;
  institution: string;
  yearOfPassing: number;
  percentageOrGrade: string;
  isVerified: boolean;
  docUrl?: string;
}

export interface ScaleIncrementEntry {
  id: string;
  effectiveDate: string;
  basicPay: number;
  gradePay?: number;
  daHraAllowances: number;
  grossPay: number;
  orderNumber: string;
  remarks: string;
}

export interface PromotionEntry {
  id: string;
  effectiveDate: string;
  fromDesignation: string;
  toDesignation: string;
  orderNumber: string;
  remarks: string;
}

export interface EmployeeServiceRecord {
  appointmentOrderNumber: string;
  appointmentDate: string;
  confirmationOrderNumber?: string | null;
  confirmationDate?: string | null;
  providentFundUan?: string | null;
  esiInsuranceNumber?: string | null;
  panNumber?: string | null;
  casualLeaveBalance: number;
  earnedLeaveBalance: number;
  medicalLeaveBalance: number;
  qualificationsList: QualificationEntry[];
  scaleHistory: ScaleIncrementEntry[];
  promotionHistory: PromotionEntry[];
  disciplinaryEntries?: string;
}

export type PoliceVerificationStatus = 'verified' | 'submitted_pending' | 'missing';

export interface EmployeeRecord {
  id: string;
  tenantId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  employeeType: 'teaching' | 'non_teaching' | 'administrative' | 'support';
  dateOfJoining: string;
  employmentStatus: 'probationary' | 'confirmed' | 'notice_period' | 'resigned' | 'retired';
  policeVerificationStatus: PoliceVerificationStatus;
  policeDocUrl?: string | null;
  policeVerificationDate?: string | null;
  policeAcknowledgmentNumber?: string | null;
  gracePeriodExpiryDate?: string | null;
  isAccessRestricted: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
  cpdHoursCompleted?: number;
  serviceBook?: EmployeeServiceRecord;
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  trainingTitle: string;
  providerAgency: string;
  category: 'pedagogy' | 'nep2020' | 'subject_enrichment' | 'child_safety_pocso' | 'ict_digital' | 'inclusive_education';
  durationHours: number;
  startDate: string;
  endDate: string;
  academicYear: string;
  mode: 'online' | 'offline_workshop' | 'hybrid';
  certificateUrl?: string;
  isVerifiedByPrincipal: boolean;
}




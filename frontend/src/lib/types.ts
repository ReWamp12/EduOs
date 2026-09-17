export type UserRole =
  | 'student'
  | 'teacher'
  | 'principal'
  | 'parent'
  | 'super_admin'
  | 'hr_manager'
  | 'finance_officer'
  | 'accountant';

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
  mentorTeacherId?: string;
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
  /**
   * EDUOS-108 — nullable on purpose.
   *
   * These are computed from the attendance register and the results table
   * (`v_student_academic_summary`). A student with no register entries has no
   * attendance percentage, and one who has sat no exam has no rank. They were
   * previously typed non-null and filled with literals (94.2 / rank 4, or a
   * value derived from the array index), which is what let invented figures
   * render beside genuine name and roll-number data.
   *
   * Render them through `formatPct` / `formatRank` in `lib/format.ts` so an
   * absent value shows as "—" rather than "0%" or "Rank #0".
   */
  attendancePct: number | null;
  rankInBatch: number | null;
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
  tenantName?: string;
  feeStatus?: 'paid' | 'partial' | 'due';
  medicalNotes?: string;
}

export interface TimetableSlot {
  id: string;
  tenantId?: string;
  batchId: string;
  batchName?: string;
  subjectId?: string;
  subjectName: string;
  subjectColor: string;
  teacherId?: string;
  teacherName: string;
  roomNumber: string;
  dayOfWeek: number; // 1 = Monday, ..., 6 = Saturday, 7 = Sunday
  dayName?: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  type?: 'lecture' | 'lab' | 'activity' | 'remedial';
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

export interface LMSNote {
  id: string;
  userId: string;
  lessonId: string;
  tenantId?: string;
  timestampSeconds: number;
  timestampLabel: string;
  noteText: string;
  tag: 'key_concept' | 'formula' | 'doubt' | 'summary';
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LMSCourse {
  id: string;
  tenantId?: string;
  subjectId?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  lessons: LMSLesson[];
}

export interface LMSLesson {
  id: string;
  courseId?: string;
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
  notesCount?: number;
  orderIndex?: number;
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
  status: 'pending' | 'submitted' | 'graded' | 'late' | 'reviewed' | 'returned' | 'under_review';
  obtainedMarks?: number;
  feedback?: string;
  chapterId?: string;
  topicId?: string;
  chapterTitle?: string;
  topicTitle?: string;
  issueDate?: string;
  submissionType?: 'file' | 'text' | 'both';
  allowResubmission?: boolean;
  lifecycleStatus?: 'draft' | 'published' | 'open' | 'closed' | 'archived';
  closedAt?: string;
  isLate?: boolean;
}

export type ExamMode = 'online' | 'offline';
export type ExamLifecycleStatus =
  | 'draft'
  | 'scheduled'
  | 'live'
  | 'grading'
  | 'completed'
  | 'result_pending'
  | 'result_published'
  | 'archived';
export type QuestionType =
  | 'mcq'
  | 'single_choice'
  | 'multiple_choice'
  | 'numerical'
  | 'subjective'
  | 'true_false'
  | 'short_answer'
  | 'descriptive';

export interface ExamQuestionOption {
  id?: string;
  key?: string;
  optionKey?: string;
  text?: string;
  optionText?: string;
  is_correct?: boolean;
  isCorrect?: boolean;
}

export interface ExamQuestion {
  id: string;
  tenantId: string;
  examId: string;
  sequenceOrder: number;
  questionText: string;
  questionType: QuestionType;
  options?: ExamQuestionOption[] | null;
  correctAnswer?: string | null;
  marks: number;
  negativeMarks?: number;
  explanation?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ExamAttemptStatus = 'in_progress' | 'submitted' | 'evaluated' | 'published';

export interface ExamAttempt {
  id: string;
  tenantId: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string | null;
  autoSubmitted: boolean;
  status: ExamAttemptStatus;
  obtainedMarks?: number | null;
  maxMarks?: number | null;
  percentage?: number | null;
  evaluatedAt?: string | null;
  evaluatedBy?: string | null;
  facultyRemark?: string | null;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  examTitle?: string;
  subjectName?: string;
  studentName?: string;
  rollNumber?: string;
}

export interface ExamAttemptResponse {
  id: string;
  tenantId: string;
  attemptId: string;
  questionId: string;
  responseText?: string | null;
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
  facultyFeedback?: string | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  question?: ExamQuestion;
}

export interface AcademicNotification {
  id: string;
  tenantId: string;
  userId: string;
  eventType: string;
  title: string;
  body?: string | null;
  assignmentId?: string | null;
  examId?: string | null;
  submissionId?: string | null;
  attemptId?: string | null;
  readAt?: string | null;
  createdAt: string;
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

/* -------------------------------------------------------------------------- */
/*                      Syllabus & Learning Types (Phase 1)                   */
/* -------------------------------------------------------------------------- */

export type TopicStatus = 'not_started' | 'in_progress' | 'completed';
export type MaterialType = 'pdf' | 'video' | 'notes' | 'link' | 'image';

export interface LearningMaterial {
  id: string;
  tenantId: string;
  subjectId: string;
  batchId: string;
  chapterId?: string;
  topicId?: string;
  title: string;
  materialType: MaterialType;
  fileUrl: string;
  fileSize?: string;
  authorId?: string;
  authorName: string;
  createdAt: string;
}

export interface SyllabusTopic {
  id: string;
  tenantId: string;
  chapterId: string;
  subjectId: string;
  batchId: string;
  title: string;
  description?: string;
  sequenceOrder: number;
  status: TopicStatus;
  completionDate?: string;
  facultyNotes?: string;
  estimatedPeriods: number;
  targetDate?: string;
  materials?: LearningMaterial[];
}

export interface SyllabusChapter {
  id: string;
  tenantId: string;
  batchId: string;
  subjectId: string;
  chapterNumber: number;
  title: string;
  description?: string;
  unitName?: string;
  sequenceOrder: number;
  status: TopicStatus;
  topics: SyllabusTopic[];
  materials?: LearningMaterial[];
  progressPct?: number;
}

export interface SyllabusProgressSummary {
  subjectId: string;
  subjectName: string;
  totalChapters: number;
  completedChapters: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  progressPercentage: number;
}

/* -------------------------------------------------------------------------- */
/*                  Student Performance Types (Phase 2 - EDUOS-113)           */
/* -------------------------------------------------------------------------- */

export interface StudentPerformanceSummary {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  rollNumber?: string;
  overallScore: number; // weighted composite score: 60% Exam, 15% Attendance, 10% Assignments, 15% Syllabus
  attendancePercentage: number;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  syllabusProgressPercentage: number;
  assignmentsTotal: number;
  assignmentsCompleted: number;
  assignmentsPercentage: number;
  assessmentsAverage: number;
  totalExamsTaken: number;
  attentionStatus: 'good' | 'attention';
  attentionReasons: string[];
}

export interface SubjectPerformanceBreakdown {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  color?: string;
  assessmentAvg: number;
  attendancePct: number;
  assignmentPct: number;
  syllabusPct: number;
  compositeScore: number;
  status: 'good' | 'attention';
}

export interface AssessmentScoreHistoryItem {
  examId: string;
  examTitle: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  feedback?: string;
}

export type AssessmentTrendDirection = 'improving' | 'steady' | 'declining';

export interface AssessmentTrendSummary {
  direction: AssessmentTrendDirection;
  label: string;
  firstScore: number;
  latestScore: number;
  scoreProgression: number[];
}

export interface FacultyRemarkItem {
  id: string;
  studentId: string;
  facultyId?: string;
  facultyName: string;
  subjectId?: string;
  subjectName?: string;
  remarkText: string;
  category: 'academic' | 'attendance' | 'behavior' | 'general';
  createdAt: string;
}

export interface ClassStudentPerformanceRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  admissionNumber: string;
  avatarUrl?: string;
  overallScore: number;
  attendancePct: number;
  syllabusPct: number;
  assignmentPct: number;
  assessmentAvg: number;
  status: 'good' | 'attention';
  attentionReasons: string[];
  remarksCount: number;
  latestRemark?: string;
}

export interface AdminAcademicOverviewData {
  totalStudents: number;
  averagePerformance: number;
  averageAttendance: number;
  averageSyllabusProgress: number;
  studentsNeedingAttentionCount: number;
  subjectAverages: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    averagePerformance: number;
    averageAttendance: number;
    averageSyllabusProgress: number;
    completedTopics: number;
    totalTopics: number;
  }[];
}


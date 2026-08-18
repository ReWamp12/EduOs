export type UserRole = 'student' | 'teacher' | 'principal' | 'parent' | 'super_admin';

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
  qrCodeId: string;
  avatarUrl: string;
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
  studentId: string;
  studentName: string;
  rollNumber: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  periodNumber?: number;
  remarks?: string;
}

export interface LMSLesson {
  id: string;
  courseTitle: string;
  chapter: string;
  title: string;
  contentType: 'video' | 'pdf' | 'notes' | 'quiz';
  durationMinutes: number;
  url?: string;
  completed?: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  batchName: string;
  dueDate: string;
  maxMarks: number;
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
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'academic' | 'exam' | 'event' | 'urgent';
  date: string;
  author: string;
}

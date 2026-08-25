import { Student, TimetableSlot, Batch } from './types';
import { authClient } from './auth/client';
import { isSupabaseConfigured } from './supabase';

export const seededClass10Batch: Batch = {
  id: '21cf1f85-8d48-4843-9216-7457a3f6fe10',
  name: 'Class 10 - A',
  code: '10A',
  targetExam: 'CBSE',
  gradeLevel: '10',
  roomNumber: 'Room 101',
  mentorTeacherName: 'Meera Iyer',
  studentCount: 30,
  capacity: 30,
};

export const SEEDED_STUDENTS_LIST: Student[] = [
  { id: 'std-1', userId: 'usr-std-1', name: 'Aarav Sharma', email: 'aarav.sharma@mpsdelhi.eduos.app', rollNumber: '1', admissionNumber: 'MPS2026001', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 96.5, rankInBatch: 1, parentName: 'Rajesh Sharma', parentPhone: '+91-9810111001', parentEmail: 'rajesh.sharma@example.com', bloodGroup: 'O+', dob: '2011-03-15', gender: 'male', qrCodeId: '91889637-7d93-4c96-b1e5-ed170d505641', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav' },
  { id: 'std-2', userId: 'usr-std-2', name: 'Aditi Verma', email: 'aditi.verma@mpsdelhi.eduos.app', rollNumber: '2', admissionNumber: 'MPS2026002', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 94.0, rankInBatch: 2, parentName: 'Manoj Verma', parentPhone: '+91-9810111002', parentEmail: 'manoj.verma@example.com', bloodGroup: 'A+', dob: '2011-05-22', gender: 'female', qrCodeId: 'QR-MPS2026002', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi' },
  { id: 'std-3', userId: 'usr-std-3', name: 'Aditya Gupta', email: 'aditya.gupta@mpsdelhi.eduos.app', rollNumber: '3', admissionNumber: 'MPS2026003', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 91.5, rankInBatch: 5, parentName: 'Sunil Gupta', parentPhone: '+91-9810111003', parentEmail: 'sunil.gupta@example.com', bloodGroup: 'B+', dob: '2010-11-10', gender: 'male', qrCodeId: 'QR-MPS2026003', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya' },
  { id: 'std-4', userId: 'usr-std-4', name: 'Ananya Singh', email: 'ananya.singh@mpsdelhi.eduos.app', rollNumber: '4', admissionNumber: 'MPS2026004', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 98.0, rankInBatch: 3, parentName: 'Vikram Singh', parentPhone: '+91-9810111004', parentEmail: 'vikram.singh@example.com', bloodGroup: 'AB+', dob: '2011-01-18', gender: 'female', qrCodeId: 'QR-MPS2026004', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya' },
  { id: 'std-5', userId: 'usr-std-5', name: 'Aryan Patel', email: 'aryan.patel@mpsdelhi.eduos.app', rollNumber: '5', admissionNumber: 'MPS2026005', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 88.5, rankInBatch: 12, parentName: 'Hitesh Patel', parentPhone: '+91-9810111005', parentEmail: 'hitesh.patel@example.com', bloodGroup: 'O+', dob: '2010-09-25', gender: 'male', qrCodeId: 'QR-MPS2026005', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan' },
  { id: 'std-6', userId: 'usr-std-6', name: 'Avani Joshi', email: 'avani.joshi@mpsdelhi.eduos.app', rollNumber: '6', admissionNumber: 'MPS2026006', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 95.0, rankInBatch: 4, parentName: 'Prakash Joshi', parentPhone: '+91-9810111006', parentEmail: 'prakash.joshi@example.com', bloodGroup: 'A-', dob: '2011-04-30', gender: 'female', qrCodeId: 'QR-MPS2026006', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avani' },
  { id: 'std-7', userId: 'usr-std-7', name: 'Ayush Kumar', email: 'ayush.kumar@mpsdelhi.eduos.app', rollNumber: '7', admissionNumber: 'MPS2026007', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 86.0, rankInBatch: 18, parentName: 'Anil Kumar', parentPhone: '+91-9810111007', parentEmail: 'anil.kumar@example.com', bloodGroup: 'B+', dob: '2010-12-05', gender: 'male', qrCodeId: 'QR-MPS2026007', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayush' },
  { id: 'std-8', userId: 'usr-std-8', name: 'Bhavya Rao', email: 'bhavya.rao@mpsdelhi.eduos.app', rollNumber: '8', admissionNumber: 'MPS2026008', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 93.5, rankInBatch: 7, parentName: 'Sridhar Rao', parentPhone: '+91-9810111008', parentEmail: 'sridhar.rao@example.com', bloodGroup: 'O-', dob: '2011-07-14', gender: 'female', qrCodeId: 'QR-MPS2026008', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bhavya' },
  { id: 'std-9', userId: 'usr-std-9', name: 'Devansh Mehta', email: 'devansh.mehta@mpsdelhi.eduos.app', rollNumber: '9', admissionNumber: 'MPS2026009', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 92.0, rankInBatch: 8, parentName: 'Nilesh Mehta', parentPhone: '+91-9810111009', parentEmail: 'nilesh.mehta@example.com', bloodGroup: 'A+', dob: '2010-08-19', gender: 'male', qrCodeId: 'QR-MPS2026009', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Devansh' },
  { id: 'std-10', userId: 'usr-std-10', name: 'Diya Reddy', email: 'diya.reddy@mpsdelhi.eduos.app', rollNumber: '10', admissionNumber: 'MPS2026010', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 97.0, rankInBatch: 6, parentName: 'Venkat Reddy', parentPhone: '+91-9810111010', parentEmail: 'venkat.reddy@example.com', bloodGroup: 'B+', dob: '2011-02-28', gender: 'female', qrCodeId: 'QR-MPS2026010', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diya' },
  { id: 'std-11', userId: 'usr-std-11', name: 'Harsh Vardhan', email: 'harsh.vardhan@mpsdelhi.eduos.app', rollNumber: '11', admissionNumber: 'MPS2026011', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 89.0, rankInBatch: 14, parentName: 'Rakesh Vardhan', parentPhone: '+91-9810111011', parentEmail: 'rakesh.vardhan@example.com', bloodGroup: 'AB+', dob: '2010-10-12', gender: 'male', qrCodeId: 'QR-MPS2026011', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harsh' },
  { id: 'std-12', userId: 'usr-std-12', name: 'Ishaan Malhotra', email: 'ishaan.malhotra@mpsdelhi.eduos.app', rollNumber: '12', admissionNumber: 'MPS2026012', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 90.5, rankInBatch: 11, parentName: 'Rajiv Malhotra', parentPhone: '+91-9810111012', parentEmail: 'rajiv.malhotra@example.com', bloodGroup: 'O+', dob: '2011-06-03', gender: 'male', qrCodeId: 'QR-MPS2026012', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishaan' },
  { id: 'std-13', userId: 'usr-std-13', name: 'Ishita Saxena', email: 'ishita.saxena@mpsdelhi.eduos.app', rollNumber: '13', admissionNumber: 'MPS2026013', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 94.5, rankInBatch: 9, parentName: 'Alok Saxena', parentPhone: '+91-9810111013', parentEmail: 'alok.saxena@example.com', bloodGroup: 'A+', dob: '2011-09-17', gender: 'female', qrCodeId: 'QR-MPS2026013', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishita' },
  { id: 'std-14', userId: 'usr-std-14', name: 'Kabir Das', email: 'kabir.das@mpsdelhi.eduos.app', rollNumber: '14', admissionNumber: 'MPS2026014', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 87.5, rankInBatch: 19, parentName: 'Sourav Das', parentPhone: '+91-9810111014', parentEmail: 'sourav.das@example.com', bloodGroup: 'B-', dob: '2010-07-21', gender: 'male', qrCodeId: 'QR-MPS2026014', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir' },
  { id: 'std-15', userId: 'usr-std-15', name: 'Kavya Nair', email: 'kavya.nair@mpsdelhi.eduos.app', rollNumber: '15', admissionNumber: 'MPS2026015', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 96.0, rankInBatch: 10, parentName: 'Madhavan Nair', parentPhone: '+91-9810111015', parentEmail: 'madhavan.nair@example.com', bloodGroup: 'O+', dob: '2011-08-08', gender: 'female', qrCodeId: 'QR-MPS2026015', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya' },
  { id: 'std-16', userId: 'usr-std-16', name: 'Manav Choudhary', email: 'manav.choudhary@mpsdelhi.eduos.app', rollNumber: '16', admissionNumber: 'MPS2026016', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 85.0, rankInBatch: 22, parentName: 'Surender Choudhary', parentPhone: '+91-9810111016', parentEmail: 'surender.choudhary@example.com', bloodGroup: 'A+', dob: '2010-05-16', gender: 'male', qrCodeId: 'QR-MPS2026016', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manav' },
  { id: 'std-17', userId: 'usr-std-17', name: 'Meera Nambiar', email: 'meera.nambiar@mpsdelhi.eduos.app', rollNumber: '17', admissionNumber: 'MPS2026017', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 95.5, rankInBatch: 13, parentName: 'Unnikrishnan Nambiar', parentPhone: '+91-9810111017', parentEmail: 'unnikrishnan.nambiar@example.com', bloodGroup: 'B+', dob: '2011-10-24', gender: 'female', qrCodeId: 'QR-MPS2026017', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeeraN' },
  { id: 'std-18', userId: 'usr-std-18', name: 'Nikhil Sen', email: 'nikhil.sen@mpsdelhi.eduos.app', rollNumber: '18', admissionNumber: 'MPS2026018', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 83.0, rankInBatch: 25, parentName: 'Subhash Sen', parentPhone: '+91-9810111018', parentEmail: 'subhash.sen@example.com', bloodGroup: 'AB-', dob: '2010-04-11', gender: 'male', qrCodeId: 'QR-MPS2026018', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil' },
  { id: 'std-19', userId: 'usr-std-19', name: 'Pooja Banerjee', email: 'pooja.banerjee@mpsdelhi.eduos.app', rollNumber: '19', admissionNumber: 'MPS2026019', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 93.0, rankInBatch: 15, parentName: 'Debashis Banerjee', parentPhone: '+91-9810111019', parentEmail: 'debashis.banerjee@example.com', bloodGroup: 'O+', dob: '2011-03-09', gender: 'female', qrCodeId: 'QR-MPS2026019', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja' },
  { id: 'std-20', userId: 'usr-std-20', name: 'Pranav Agarwal', email: 'pranav.agarwal@mpsdelhi.eduos.app', rollNumber: '20', admissionNumber: 'MPS2026020', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 91.0, rankInBatch: 16, parentName: 'Sanjay Agarwal', parentPhone: '+91-9810111020', parentEmail: 'sanjay.agarwal@example.com', bloodGroup: 'A+', dob: '2010-06-30', gender: 'male', qrCodeId: 'QR-MPS2026020', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pranav' },
  { id: 'std-21', userId: 'usr-std-21', name: 'Riya Kapoor', email: 'riya.kapoor@mpsdelhi.eduos.app', rollNumber: '21', admissionNumber: 'MPS2026021', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 92.5, rankInBatch: 17, parentName: 'Raman Kapoor', parentPhone: '+91-9810111021', parentEmail: 'raman.kapoor@example.com', bloodGroup: 'B+', dob: '2011-12-14', gender: 'female', qrCodeId: 'QR-MPS2026021', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riya' },
  { id: 'std-22', userId: 'usr-std-22', name: 'Rohan Mishra', email: 'rohan.mishra@mpsdelhi.eduos.app', rollNumber: '22', admissionNumber: 'MPS2026022', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 88.0, rankInBatch: 21, parentName: 'Ajay Mishra', parentPhone: '+91-9810111022', parentEmail: 'ajay.mishra@example.com', bloodGroup: 'O+', dob: '2010-03-27', gender: 'male', qrCodeId: 'QR-MPS2026022', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
  { id: 'std-23', userId: 'usr-std-23', name: 'Saanvi Chatterjee', email: 'saanvi.chatterjee@mpsdelhi.eduos.app', rollNumber: '23', admissionNumber: 'MPS2026023', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 97.5, rankInBatch: 20, parentName: 'Anirban Chatterjee', parentPhone: '+91-9810111023', parentEmail: 'anirban.chatterjee@example.com', bloodGroup: 'A-', dob: '2011-01-05', gender: 'female', qrCodeId: 'QR-MPS2026023', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Saanvi' },
  { id: 'std-24', userId: 'usr-std-24', name: 'Samar Sheikh', email: 'samar.sheikh@mpsdelhi.eduos.app', rollNumber: '24', admissionNumber: 'MPS2026024', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 86.5, rankInBatch: 24, parentName: 'Tariq Sheikh', parentPhone: '+91-9810111024', parentEmail: 'tariq.sheikh@example.com', bloodGroup: 'B+', dob: '2010-11-29', gender: 'male', qrCodeId: 'QR-MPS2026024', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samar' },
  { id: 'std-25', userId: 'usr-std-25', name: 'Shreya Kulkarni', email: 'shreya.kulkarni@mpsdelhi.eduos.app', rollNumber: '25', admissionNumber: 'MPS2026025', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 95.0, rankInBatch: 23, parentName: 'Milind Kulkarni', parentPhone: '+91-9810111025', parentEmail: 'milind.kulkarni@example.com', bloodGroup: 'AB+', dob: '2011-04-19', gender: 'female', qrCodeId: 'QR-MPS2026025', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shreya' },
  { id: 'std-26', userId: 'usr-std-26', name: 'Siddharth Rao', email: 'siddharth.rao@mpsdelhi.eduos.app', rollNumber: '26', admissionNumber: 'MPS2026026', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 89.5, rankInBatch: 26, parentName: 'Keshava Rao', parentPhone: '+91-9810111026', parentEmail: 'keshava.rao@example.com', bloodGroup: 'O+', dob: '2010-09-02', gender: 'male', qrCodeId: 'QR-MPS2026026', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siddharth' },
  { id: 'std-27', userId: 'usr-std-27', name: 'Sneha Namboodiri', email: 'sneha.namboodiri@mpsdelhi.eduos.app', rollNumber: '27', admissionNumber: 'MPS2026027', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 94.0, rankInBatch: 27, parentName: 'Narayanan Namboodiri', parentPhone: '+91-9810111027', parentEmail: 'narayanan.namboodiri@example.com', bloodGroup: 'A+', dob: '2011-07-26', gender: 'female', qrCodeId: 'QR-MPS2026027', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha' },
  { id: 'std-28', userId: 'usr-std-28', name: 'Tanvi Bhatia', email: 'tanvi.bhatia@mpsdelhi.eduos.app', rollNumber: '28', admissionNumber: 'MPS2026028', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 91.5, rankInBatch: 28, parentName: 'Deepak Bhatia', parentPhone: '+91-9810111028', parentEmail: 'deepak.bhatia@example.com', bloodGroup: 'B-', dob: '2011-11-11', gender: 'female', qrCodeId: 'QR-MPS2026028', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanvi' },
  { id: 'std-29', userId: 'usr-std-29', name: 'Varun Tiwari', email: 'varun.tiwari@mpsdelhi.eduos.app', rollNumber: '29', admissionNumber: 'MPS2026029', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 87.0, rankInBatch: 29, parentName: 'Govind Tiwari', parentPhone: '+91-9810111029', parentEmail: 'govind.tiwari@example.com', bloodGroup: 'O+', dob: '2010-02-14', gender: 'male', qrCodeId: 'QR-MPS2026029', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Varun' },
  { id: 'std-30', userId: 'usr-std-30', name: 'Yashraj Singhania', email: 'yashraj.singhania@mpsdelhi.eduos.app', rollNumber: '30', admissionNumber: 'MPS2026030', batchId: seededClass10Batch.id, batchName: 'Class 10 - A', targetExam: 'CBSE', attendancePct: 92.0, rankInBatch: 30, parentName: 'Vijay Singhania', parentPhone: '+91-9810111030', parentEmail: 'vijay.singhania@example.com', bloodGroup: 'AB+', dob: '2010-10-08', gender: 'male', qrCodeId: 'QR-MPS2026030', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yashraj' },
];

export const SEEDED_TIMETABLE: TimetableSlot[] = [
  { id: 'tt-1', dayOfWeek: 1, periodNumber: 1, startTime: '09:00 AM', endTime: '09:45 AM', subjectName: 'English Literature', subjectColor: '#3B82F6', teacherName: 'Meera Iyer', roomNumber: 'Room 101', batchId: seededClass10Batch.id },
  { id: 'tt-2', dayOfWeek: 2, periodNumber: 2, startTime: '09:45 AM', endTime: '10:30 AM', subjectName: 'Hindi Course A', subjectColor: '#EC4899', teacherName: 'Suresh Pillai', roomNumber: 'Room 101', batchId: seededClass10Batch.id },
  { id: 'tt-3', dayOfWeek: 3, periodNumber: 3, startTime: '10:30 AM', endTime: '11:15 AM', subjectName: 'Mathematics', subjectColor: '#10B981', teacherName: 'Anjali Deshmukh', roomNumber: 'Room 101', batchId: seededClass10Batch.id },
  { id: 'tt-4', dayOfWeek: 4, periodNumber: 4, startTime: '11:30 AM', endTime: '12:15 PM', subjectName: 'Science', subjectColor: '#8B5CF6', teacherName: 'Karan Bhatt', roomNumber: 'Science Lab 1', batchId: seededClass10Batch.id },
  { id: 'tt-5', dayOfWeek: 5, periodNumber: 5, startTime: '12:15 PM', endTime: '01:00 PM', subjectName: 'Social Science', subjectColor: '#F59E0B', teacherName: 'Priya Menon', roomNumber: 'Room 101', batchId: seededClass10Batch.id },
];

/** Roster per batch id */
export const studentsByBatch: Record<string, Student[]> = {
  [seededClass10Batch.id]: SEEDED_STUDENTS_LIST,
  '10A': SEEDED_STUDENTS_LIST,
};

/** All students across all classes */
export let allStudentsInSchool: Student[] = [...SEEDED_STUDENTS_LIST];

/** Batches in the school */
export let teacherBatches: Batch[] = [seededClass10Batch];

/** Default active batch */
export const defaultTeacherBatch: Batch = seededClass10Batch;

/** Timetable per batch */
export const timetableByBatch: Record<string, TimetableSlot[]> = {
  [seededClass10Batch.id]: SEEDED_TIMETABLE,
  '10A': SEEDED_TIMETABLE,
};

/** Look up students for a batch id */
export function getStudentsForBatch(batchId: string | null | undefined): Student[] {
  if (!batchId) return SEEDED_STUDENTS_LIST;
  return studentsByBatch[batchId] || SEEDED_STUDENTS_LIST;
}

export const studentsForBatch = getStudentsForBatch;

/** Look up timetable for a batch id */
export function getTimetableForBatch(batchId: string | null | undefined): TimetableSlot[] {
  if (!batchId) return SEEDED_TIMETABLE;
  return timetableByBatch[batchId] || SEEDED_TIMETABLE;
}

export const timetableForBatch = getTimetableForBatch;

/** Look up batch metadata by id */
export function getBatchById(batchId: string | null | undefined): Batch | undefined {
  if (!batchId) return seededClass10Batch;
  return teacherBatches.find((b) => b.id === batchId || b.code === batchId) || seededClass10Batch;
}

/** Async loader to sync live data from Supabase directly */
export async function syncBatchDataFromSupabase(): Promise<{ batches: Batch[]; students: Student[] }> {
  if (!isSupabaseConfigured()) {
    return { batches: teacherBatches, students: allStudentsInSchool };
  }

  try {
    const { data: batchesData } = await authClient
      .from('batches')
      .select(`
        id, name, code, target_exam, academic_year, room_number, capacity,
        user_profiles:mentor_teacher_id (first_name, last_name)
      `);

    const { data: studentsData } = await authClient
      .from('students')
      .select(`
        id, user_id, tenant_id, batch_id, roll_number, admission_number, dob, gender,
        parent_name, parent_phone, parent_email, blood_group, qr_code_id,
        batches:batch_id (id, name, target_exam),
        user_profiles:user_id (id, first_name, last_name, email, avatar_url),
        tenants:tenant_id (name)
      `)
      .order('roll_number', { ascending: true });

    if (batchesData && batchesData.length > 0) {
      teacherBatches = batchesData.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code || '10A',
        targetExam: b.target_exam || 'CBSE',
        gradeLevel: '10',
        roomNumber: b.room_number || 'Room 101',
        mentorTeacherName: b.user_profiles ? `${b.user_profiles.first_name} ${b.user_profiles.last_name}` : 'Meera Iyer',
        studentCount: studentsData ? studentsData.filter((s: any) => s.batch_id === b.id).length : 30,
        capacity: b.capacity || 30,
      }));
    }

    if (studentsData && studentsData.length > 0) {
      allStudentsInSchool = studentsData.map((s: any, idx: number) => {
        const prof = s.user_profiles;
        const batch = s.batches;
        const name = prof ? `${prof.first_name} ${prof.last_name}`.trim() : `Student ${idx + 1}`;
        return {
          id: s.id,
          userId: s.user_id,
          name,
          email: prof?.email || '',
          rollNumber: s.roll_number || `${idx + 1}`,
          admissionNumber: s.admission_number || `MPS2026${String(idx + 1).padStart(3, '0')}`,
          batchId: s.batch_id || seededClass10Batch.id,
          batchName: batch?.name || 'Class 10 - A',
          targetExam: batch?.target_exam || 'CBSE',
          attendancePct: 90 + ((idx % 10) * 0.8),
          rankInBatch: idx + 1,
          parentName: s.parent_name || 'Parent',
          parentPhone: s.parent_phone || '+91-9810111000',
          parentEmail: s.parent_email || '',
          bloodGroup: s.blood_group || 'O+',
          dob: s.dob || '2011-01-01',
          gender: s.gender || 'male',
          qrCodeId: s.qr_code_id || s.id,
          avatarUrl: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          tenantName: s.tenants?.name || 'Modern Public School',
        };
      });

      if (teacherBatches[0]) {
        studentsByBatch[teacherBatches[0].id] = allStudentsInSchool;
      }
    }

    return { batches: teacherBatches, students: allStudentsInSchool };
  } catch (err) {
    console.warn('Failed to sync batch data from Supabase:', err);
    return { batches: teacherBatches, students: allStudentsInSchool };
  }
}

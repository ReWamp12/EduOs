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

  // In-memory mock store for local/fallback execution
  private mockJobs = [
    {
      id: 'job-1',
      tenantId: 't-1',
      title: 'PGT Physics Faculty',
      department: 'Science & Senior Secondary',
      jobType: 'Full-time',
      designationCategory: 'Teaching',
      experienceRequired: '3-6 years',
      salaryRange: '₹6,50,000 - ₹9,00,000 P.A.',
      description: 'Looking for an experienced PGT Physics educator proficient in CBSE syllabus, JEE Foundation integration, and modern laboratory pedagogy.',
      requirements: 'M.Sc. Physics + B.Ed. (Mandatory). Minimum 3 years teaching Class 11-12.',
      status: 'published',
      location: 'Main Campus, New Delhi',
      positionsCount: 2,
      deadline: '2026-09-15',
      applicantsCount: 14,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-2',
      tenantId: 't-1',
      title: 'TGT Mathematics & Robotics',
      department: 'Mathematics & STEM',
      jobType: 'Full-time',
      designationCategory: 'Teaching',
      experienceRequired: '2-4 years',
      salaryRange: '₹4,80,000 - ₹6,80,000 P.A.',
      description: 'Dynamic Mathematics teacher with passion for interactive pedagogy, Atal Tinkering Lab / Robotics curriculum and Olympiad training.',
      requirements: 'B.Sc./M.Sc. Mathematics + B.Ed. CTET qualification preferred.',
      status: 'published',
      location: 'Main Campus, New Delhi',
      positionsCount: 1,
      deadline: '2026-09-10',
      applicantsCount: 9,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-3',
      tenantId: 't-1',
      title: 'PRT English & Primary Pedagogy Lead',
      department: 'Primary Wing',
      jobType: 'Full-time',
      designationCategory: 'Teaching',
      experienceRequired: '1-3 years',
      salaryRange: '₹3,60,000 - ₹5,20,000 P.A.',
      description: 'Passionate primary educator focusing on phonics, creative writing, and NEP 2020 experiential learning methodologies.',
      requirements: 'B.A. English + D.El.Ed. or B.Ed. Strong spoken and written English.',
      status: 'published',
      location: 'Junior Wing, New Delhi',
      positionsCount: 2,
      deadline: '2026-09-20',
      applicantsCount: 21,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-4',
      tenantId: 't-1',
      title: 'Student Wellness & POCSO Counselor',
      department: 'Counseling & Student Care',
      jobType: 'Full-time',
      designationCategory: 'Administrative',
      experienceRequired: '3-5 years',
      salaryRange: '₹5,00,000 - ₹7,20,000 P.A.',
      description: 'Certified child psychologist to manage student mental health, conduct POCSO awareness sessions, and support inclusive education.',
      requirements: 'M.A. Clinical/Child Psychology + RCI certification preferred.',
      status: 'published',
      location: 'Main Campus, New Delhi',
      positionsCount: 1,
      deadline: '2026-09-05',
      applicantsCount: 6,
      createdAt: new Date().toISOString(),
    },
  ];

  private mockApplicants = [
    {
      id: 'app-1',
      jobId: 'job-1',
      tenantId: 't-1',
      fullName: 'Dr. Vivek Swaminathan',
      email: 'dr.vivek.swami@example.com',
      phone: '+91 98110 44231',
      experienceYears: 5.5,
      highestQualification: 'Ph.D. in Applied Physics (IIT Delhi)',
      currentOrganization: 'DPS R.K. Puram',
      resumeUrl: 'https://storage.eduos.io/resumes/vivek_swami.pdf',
      stage: 'interview_scheduled',
      appliedAt: '2026-08-14T10:30:00Z',
      jobTitle: 'PGT Physics Faculty',
      scorecard: {
        pedagogyScore: 4.5,
        subjectKnowledgeScore: 5.0,
        classroomManagementScore: 4.0,
        communicationScore: 4.5,
        overallRating: 4.5,
        recommendation: 'strong_hire',
        interviewerName: 'Principal Dr. Shalini Verma',
        notes: 'Outstanding grasp of quantum mechanics and CBSE question design. Conducted demo class effectively.',
      },
    },
    {
      id: 'app-2',
      jobId: 'job-1',
      tenantId: 't-1',
      fullName: 'Pooja Bhattacharya',
      email: 'pooja.bhatt@example.com',
      phone: '+91 97188 99120',
      experienceYears: 4.0,
      highestQualification: 'M.Sc. Physics (DU) + B.Ed.',
      currentOrganization: 'Amity International School',
      resumeUrl: 'https://storage.eduos.io/resumes/pooja_bhatt.pdf',
      stage: 'offer_extended',
      offeredSalary: '₹7,80,000 P.A.',
      proposedJoiningDate: '2026-09-01',
      appliedAt: '2026-08-10T14:15:00Z',
      jobTitle: 'PGT Physics Faculty',
      scorecard: {
        pedagogyScore: 4.2,
        subjectKnowledgeScore: 4.4,
        classroomManagementScore: 4.8,
        communicationScore: 4.6,
        overallRating: 4.5,
        recommendation: 'hire',
        interviewerName: 'HOD Science Rajesh Sharma',
        notes: 'Excellent student engagement and lab demonstration. Offer approved by Principal.',
      },
    },
    {
      id: 'app-3',
      jobId: 'job-2',
      tenantId: 't-1',
      fullName: 'Karan Mehra',
      email: 'karan.mehra@example.com',
      phone: '+91 99203 11849',
      experienceYears: 3.2,
      highestQualification: 'B.Tech Robotics + B.Ed.',
      currentOrganization: 'Modern Vidya Mandir',
      resumeUrl: 'https://storage.eduos.io/resumes/karan_mehra.pdf',
      stage: 'shortlisted',
      appliedAt: '2026-08-16T11:00:00Z',
      jobTitle: 'TGT Mathematics & Robotics',
      scorecard: null,
    },
    {
      id: 'app-4',
      jobId: 'job-3',
      tenantId: 't-1',
      fullName: 'Ananya Deshmukh',
      email: 'ananya.desh@example.com',
      phone: '+91 98450 77123',
      experienceYears: 2.5,
      highestQualification: 'M.A. English (Lady Shri Ram) + B.Ed.',
      currentOrganization: 'Springdales School',
      resumeUrl: 'https://storage.eduos.io/resumes/ananya_d.pdf',
      stage: 'hired',
      offeredSalary: '₹4,80,000 P.A.',
      appliedAt: '2026-08-01T09:00:00Z',
      jobTitle: 'PRT English & Primary Pedagogy Lead',
      scorecard: {
        pedagogyScore: 4.8,
        subjectKnowledgeScore: 4.7,
        classroomManagementScore: 4.5,
        communicationScore: 5.0,
        overallRating: 4.75,
        recommendation: 'strong_hire',
        interviewerName: 'Primary Coordinator Sunita Rao',
        notes: 'Superb command of phonetics and gamified primary learning.',
      },
    },
    {
      id: 'app-5',
      jobId: 'job-4',
      tenantId: 't-1',
      fullName: 'Rhea Sengupta',
      email: 'rhea.sengupta@example.com',
      phone: '+91 96500 33412',
      experienceYears: 4.0,
      highestQualification: 'M.A. Child Psychology + RCI License',
      currentOrganization: 'Fortis Mental Health Clinic',
      resumeUrl: 'https://storage.eduos.io/resumes/rhea_s.pdf',
      stage: 'applied',
      appliedAt: '2026-08-18T16:45:00Z',
      jobTitle: 'Student Wellness & POCSO Counselor',
      scorecard: null,
    },
  ];

  private mockEmployees = [
    {
      id: 'emp-101',
      tenantId: 't-1',
      employeeCode: 'EDU-FAC-041',
      fullName: 'Rajesh Sharma',
      email: 'rajesh.sharma@delhividya.edu.in',
      phone: '+91 98101 22340',
      designation: 'Senior Faculty & HOD Science',
      department: 'Science & Senior Secondary',
      employeeType: 'teaching',
      dateOfJoining: '2021-06-15',
      employmentStatus: 'confirmed',
      policeVerificationStatus: 'verified',
      policeDocUrl: 'https://storage.eduos.io/police/PCC_DEL_2021_041.pdf',
      policeVerificationDate: '2021-07-02',
      policeAcknowledgmentNumber: 'PCC/DL-ND/2021/88392',
      gracePeriodExpiryDate: '2021-07-15',
      isAccessRestricted: false,
      emergencyContactName: 'Geeta Sharma (Wife)',
      emergencyContactPhone: '+91 98101 22349',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      cpdHoursCompleted: 44.5,
      serviceBook: {
        appointmentOrderNumber: 'DVN/HR/2021/APP-041',
        appointmentDate: '2021-06-15',
        confirmationOrderNumber: 'DVN/HR/2022/CONF-019',
        confirmationDate: '2022-06-15',
        providentFundUan: '100928374821',
        esiInsuranceNumber: '3109283746001',
        panNumber: 'ABCPS1234F',
        casualLeaveBalance: 8,
        earnedLeaveBalance: 24,
        medicalLeaveBalance: 9,
        qualificationsList: [
          { degree: 'M.Sc. Physics (Gold Medalist)', institution: 'Delhi University', yearOfPassing: 2014, percentageOrGrade: '84.2%', isVerified: true },
          { degree: 'B.Ed. Physical Sciences', institution: 'Jamia Millia Islamia', yearOfPassing: 2016, percentageOrGrade: '81.0%', isVerified: true },
          { degree: 'Central Teacher Eligibility Test (CTET Paper II)', institution: 'CBSE', yearOfPassing: 2017, percentageOrGrade: 'Qualified (122/150)', isVerified: true },
        ],
        scaleHistory: [
          { id: 'sc-1', effectiveDate: '2021-06-15', basicPay: 47600, gradePay: 4800, daHraAllowances: 23800, grossPay: 76200, orderNumber: 'DVN/PAY/2021/041', remarks: 'Entry Pay Scale Level 8 per 7th CPC' },
          { id: 'sc-2', effectiveDate: '2022-07-01', basicPay: 49000, gradePay: 4800, daHraAllowances: 26950, grossPay: 80750, orderNumber: 'DVN/INC/2022/108', remarks: 'Annual statutory increment 3%' },
          { id: 'sc-3', effectiveDate: '2023-07-01', basicPay: 50500, gradePay: 4800, daHraAllowances: 30300, grossPay: 85600, orderNumber: 'DVN/INC/2023/114', remarks: 'Annual statutory increment 3%' },
          { id: 'sc-4', effectiveDate: '2024-07-01', basicPay: 52000, gradePay: 4800, daHraAllowances: 33800, grossPay: 90600, orderNumber: 'DVN/INC/2024/092', remarks: 'Annual statutory increment 3%' },
          { id: 'sc-5', effectiveDate: '2025-07-01', basicPay: 53600, gradePay: 5400, daHraAllowances: 37520, grossPay: 96520, orderNumber: 'DVN/PROM/2025/012', remarks: 'Promoted to HOD Science (Level 9)' },
        ],
        promotionHistory: [
          { id: 'pr-1', effectiveDate: '2025-07-01', fromDesignation: 'PGT Physics', toDesignation: 'Senior Faculty & HOD Science', orderNumber: 'DVN/PROM/2025/012', remarks: 'Promoted on merit and academic excellence' },
        ],
      },
    },
    {
      id: 'emp-102',
      tenantId: 't-1',
      employeeCode: 'EDU-FAC-078',
      fullName: 'Sunita Rao',
      email: 'sunita.rao@delhividya.edu.in',
      phone: '+91 98200 41109',
      designation: 'Primary Academic Coordinator & PRT Lead',
      department: 'Primary Wing',
      employeeType: 'teaching',
      dateOfJoining: '2022-04-01',
      employmentStatus: 'confirmed',
      policeVerificationStatus: 'verified',
      policeDocUrl: 'https://storage.eduos.io/police/PCC_DEL_2022_078.pdf',
      policeVerificationDate: '2022-04-20',
      policeAcknowledgmentNumber: 'PCC/DL-SW/2022/41009',
      gracePeriodExpiryDate: '2022-05-01',
      isAccessRestricted: false,
      emergencyContactName: 'Manoj Rao (Husband)',
      emergencyContactPhone: '+91 98200 41110',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      cpdHoursCompleted: 52.0,
      serviceBook: {
        appointmentOrderNumber: 'DVN/HR/2022/APP-078',
        appointmentDate: '2022-04-01',
        confirmationOrderNumber: 'DVN/HR/2023/CONF-031',
        confirmationDate: '2023-04-01',
        providentFundUan: '100882716301',
        esiInsuranceNumber: '3108827163001',
        panNumber: 'BKRPR4490M',
        casualLeaveBalance: 11,
        earnedLeaveBalance: 28,
        medicalLeaveBalance: 10,
        qualificationsList: [
          { degree: 'M.A. Child Pedagogy', institution: 'IGNOU', yearOfPassing: 2018, percentageOrGrade: '76.5%', isVerified: true },
          { degree: 'B.Ed. Primary Education', institution: 'Amity University', yearOfPassing: 2016, percentageOrGrade: '83.0%', isVerified: true },
          { degree: 'CTET (Primary Stage I & II)', institution: 'CBSE', yearOfPassing: 2017, percentageOrGrade: 'Qualified (128/150)', isVerified: true },
        ],
        scaleHistory: [
          { id: 'sc-1', effectiveDate: '2022-04-01', basicPay: 35400, gradePay: 4200, daHraAllowances: 17700, grossPay: 57300, orderNumber: 'DVN/PAY/2022/078', remarks: 'PRT Level 6 Entry Scale' },
          { id: 'sc-2', effectiveDate: '2023-07-01', basicPay: 36500, gradePay: 4200, daHraAllowances: 20075, grossPay: 60775, orderNumber: 'DVN/INC/2023/118', remarks: 'Annual statutory increment' },
          { id: 'sc-3', effectiveDate: '2024-07-01', basicPay: 37600, gradePay: 4600, daHraAllowances: 24440, grossPay: 66640, orderNumber: 'DVN/PROM/2024/007', remarks: 'Promoted to Primary Academic Coordinator' },
        ],
        promotionHistory: [
          { id: 'pr-1', effectiveDate: '2024-07-01', fromDesignation: 'PRT Senior Teacher', toDesignation: 'Primary Academic Coordinator', orderNumber: 'DVN/PROM/2024/007', remarks: 'Promoted for leadership excellence' },
        ],
      },
    },
    {
      id: 'emp-103',
      tenantId: 't-1',
      employeeCode: 'EDU-FAC-112',
      fullName: 'Vikramaditya Bose',
      email: 'vikram.bose@delhividya.edu.in',
      phone: '+91 97115 88990',
      designation: 'TGT Computer Science & AI',
      department: 'Computer Science',
      employeeType: 'teaching',
      dateOfJoining: '2026-07-25', // Joined 27 days ago! Grace ending soon
      employmentStatus: 'probationary',
      policeVerificationStatus: 'submitted_pending',
      policeDocUrl: 'https://storage.eduos.io/police/PCC_APP_REC_112.pdf',
      policeVerificationDate: null,
      policeAcknowledgmentNumber: 'DEL-POL-ACK/2026/99120',
      gracePeriodExpiryDate: '2026-08-24', // 3 days remaining
      isAccessRestricted: false,
      emergencyContactName: 'Debashree Bose (Mother)',
      emergencyContactPhone: '+91 97115 88995',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      cpdHoursCompleted: 18.0,
      serviceBook: {
        appointmentOrderNumber: 'DVN/HR/2026/APP-112',
        appointmentDate: '2026-07-25',
        confirmationOrderNumber: null,
        confirmationDate: null,
        providentFundUan: '101992019920',
        esiInsuranceNumber: '3109920199001',
        panNumber: 'CZQPB9921K',
        casualLeaveBalance: 12,
        earnedLeaveBalance: 0,
        medicalLeaveBalance: 10,
        qualificationsList: [
          { degree: 'B.Tech Computer Science & AI', institution: 'IIIT Delhi', yearOfPassing: 2022, percentageOrGrade: '8.4 CGPA', isVerified: true },
          { degree: 'B.Ed. Computer Pedagogy', institution: 'GGSIPU', yearOfPassing: 2024, percentageOrGrade: '78.5%', isVerified: true },
        ],
        scaleHistory: [
          { id: 'sc-1', effectiveDate: '2026-07-25', basicPay: 44900, gradePay: 4600, daHraAllowances: 22450, grossPay: 71950, orderNumber: 'DVN/PAY/2026/112', remarks: 'TGT Level 7 Entry Scale' },
        ],
        promotionHistory: [],
      },
    },
    {
      id: 'emp-104',
      tenantId: 't-1',
      employeeCode: 'EDU-FAC-119',
      fullName: 'Mohd. Imran Khan',
      email: 'imran.khan@delhividya.edu.in',
      phone: '+91 99100 81772',
      designation: 'Physical Education Teacher (PET) & Swimming Coach',
      department: 'Sports & Physical Education',
      employeeType: 'teaching',
      dateOfJoining: '2026-06-20', // Joined 62 days ago! Grace EXPIRED (over 30 days)
      employmentStatus: 'probationary',
      policeVerificationStatus: 'missing',
      policeDocUrl: null,
      policeVerificationDate: null,
      policeAcknowledgmentNumber: null,
      gracePeriodExpiryDate: '2026-07-20', // Expired
      isAccessRestricted: true, // System Gate Enforced!
      emergencyContactName: 'Farida Khan (Sister)',
      emergencyContactPhone: '+91 99100 81779',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      cpdHoursCompleted: 12.0,
      serviceBook: {
        appointmentOrderNumber: 'DVN/HR/2026/APP-119',
        appointmentDate: '2026-06-20',
        confirmationOrderNumber: null,
        confirmationDate: null,
        providentFundUan: '102001928371',
        esiInsuranceNumber: '3102001928001',
        panNumber: 'DFEPK8820Q',
        casualLeaveBalance: 10,
        earnedLeaveBalance: 0,
        medicalLeaveBalance: 10,
        qualificationsList: [
          { degree: 'M.P.Ed. (Master of Physical Education)', institution: 'LNIPE Gwalior', yearOfPassing: 2021, percentageOrGrade: '82.0%', isVerified: true },
          { degree: 'National Swimming Coaching Diploma (NIS)', institution: 'SAI NSNIS Patiala', yearOfPassing: 2022, percentageOrGrade: 'Grade A', isVerified: true },
        ],
        scaleHistory: [
          { id: 'sc-1', effectiveDate: '2026-06-20', basicPay: 44900, gradePay: 4600, daHraAllowances: 22450, grossPay: 71950, orderNumber: 'DVN/PAY/2026/119', remarks: 'PET Level 7 Scale' },
        ],
        promotionHistory: [],
      },
    },
    {
      id: 'emp-105',
      tenantId: 't-1',
      employeeCode: 'EDU-SUP-012',
      fullName: 'Rameshwar Yadav',
      email: 'rameshwar.transport@delhividya.edu.in',
      phone: '+91 98711 00293',
      designation: 'Senior Bus Driver & Fleet In-Charge',
      department: 'Transport & Safety',
      employeeType: 'support',
      dateOfJoining: '2020-03-10',
      employmentStatus: 'confirmed',
      policeVerificationStatus: 'verified',
      policeDocUrl: 'https://storage.eduos.io/police/PCC_DEL_2020_012.pdf',
      policeVerificationDate: '2020-03-25',
      policeAcknowledgmentNumber: 'PCC/DL-NORTH/2020/19022',
      gracePeriodExpiryDate: '2020-04-10',
      isAccessRestricted: false,
      emergencyContactName: 'Ram Devi (Wife)',
      emergencyContactPhone: '+91 98711 00299',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      cpdHoursCompleted: 24.0,
      serviceBook: {
        appointmentOrderNumber: 'DVN/HR/2020/APP-012',
        appointmentDate: '2020-03-10',
        confirmationOrderNumber: 'DVN/HR/2021/CONF-005',
        confirmationDate: '2021-03-10',
        providentFundUan: '100441992011',
        esiInsuranceNumber: '3104419920001',
        panNumber: 'BNYPY1120K',
        casualLeaveBalance: 6,
        earnedLeaveBalance: 32,
        medicalLeaveBalance: 8,
        qualificationsList: [
          { degree: 'Heavy Motor Vehicle Commercial License (HMV)', institution: 'Delhi Transport Authority', yearOfPassing: 2015, percentageOrGrade: 'Endorsed', isVerified: true },
          { degree: 'First Aid & Passenger Safety Certification', institution: 'St. John Ambulance Association', yearOfPassing: 2023, percentageOrGrade: 'Grade A', isVerified: true },
        ],
        scaleHistory: [
          { id: 'sc-1', effectiveDate: '2020-03-10', basicPay: 21700, gradePay: 2000, daHraAllowances: 10850, grossPay: 34550, orderNumber: 'DVN/PAY/2020/012', remarks: 'Commercial Driver Level 3' },
          { id: 'sc-2', effectiveDate: '2024-07-01', basicPay: 24500, gradePay: 2400, daHraAllowances: 15925, grossPay: 42825, orderNumber: 'DVN/INC/2024/033', remarks: 'Annual increment + Fleet Lead Allowance' },
        ],
        promotionHistory: [
          { id: 'pr-1', effectiveDate: '2024-07-01', fromDesignation: 'School Bus Driver', toDesignation: 'Senior Bus Driver & Fleet In-Charge', orderNumber: 'DVN/PROM/2024/002', remarks: 'Flawless 4-year zero accident record' },
        ],
      },
    },
  ];

  private mockTrainingRecords = [
    {
      id: 'tr-1',
      employeeId: 'emp-101',
      trainingTitle: 'CBSE Sahodaya: NEP 2020 Competency-Based Assessment in Physics',
      providerAgency: 'CBSE Sahodaya Complex, Delhi Chapter',
      category: 'nep2020',
      durationHours: 12.0,
      startDate: '2026-05-10',
      endDate: '2026-05-12',
      academicYear: '2026-2027',
      mode: 'offline_workshop',
      certificateUrl: 'https://storage.eduos.io/certs/CBSE_NEP_PHYSICS_2026_041.pdf',
      isVerifiedByPrincipal: true,
    },
    {
      id: 'tr-2',
      employeeId: 'emp-101',
      trainingTitle: 'NCERT NISHTHA 3.0: Experiential Learning & Hands-On Science Labs',
      providerAgency: 'NCERT (DIKSHA Portal)',
      category: 'pedagogy',
      durationHours: 18.0,
      startDate: '2026-06-01',
      endDate: '2026-06-15',
      academicYear: '2026-2027',
      mode: 'online',
      certificateUrl: 'https://storage.eduos.io/certs/NCERT_NISHTHA_041.pdf',
      isVerifiedByPrincipal: true,
    },
    {
      id: 'tr-3',
      employeeId: 'emp-101',
      trainingTitle: 'Institutional POCSO & Child Sexual Abuse Prevention Sensitization',
      providerAgency: 'In-House Pedagogy / Legal Cell',
      category: 'child_safety_pocso',
      durationHours: 6.0,
      startDate: '2026-07-04',
      endDate: '2026-07-04',
      academicYear: '2026-2027',
      mode: 'offline_workshop',
      certificateUrl: 'https://storage.eduos.io/certs/DVN_POCSO_2026_041.pdf',
      isVerifiedByPrincipal: true,
    },
    {
      id: 'tr-4',
      employeeId: 'emp-101',
      trainingTitle: 'AI-Assisted Lesson Planning and Interactive Lab Simulators (PhET)',
      providerAgency: 'Google for Education / External Partner',
      category: 'ict_digital',
      durationHours: 8.5,
      startDate: '2026-08-05',
      endDate: '2026-08-06',
      academicYear: '2026-2027',
      mode: 'online',
      certificateUrl: 'https://storage.eduos.io/certs/GOOGLE_AI_EDU_041.pdf',
      isVerifiedByPrincipal: true,
    },
    {
      id: 'tr-5',
      employeeId: 'emp-102',
      trainingTitle: 'Foundational Literacy and Numeracy (FLN) & Phonics Mastery',
      providerAgency: 'NCERT NISHTHA / NIPUN Bharat',
      category: 'pedagogy',
      durationHours: 24.0,
      startDate: '2026-05-15',
      endDate: '2026-05-30',
      academicYear: '2026-2027',
      mode: 'online',
      certificateUrl: 'https://storage.eduos.io/certs/NIPUN_FLN_078.pdf',
      isVerifiedByPrincipal: true,
    },
    {
      id: 'tr-6',
      employeeId: 'emp-102',
      trainingTitle: 'Inclusive Classroom Strategies for Children with Special Needs (CWSN)',
      providerAgency: 'CBSE Sahodaya Complex',
      category: 'inclusive_education',
      durationHours: 16.0,
      startDate: '2026-06-22',
      endDate: '2026-06-24',
      academicYear: '2026-2027',
      mode: 'offline_workshop',
      certificateUrl: 'https://storage.eduos.io/certs/CBSE_CWSN_078.pdf',
      isVerifiedByPrincipal: true,
    },
    {
      id: 'tr-7',
      employeeId: 'emp-102',
      trainingTitle: 'Institutional POCSO & Mandatory Child Protection Reporting Protocol',
      providerAgency: 'In-House Pedagogy / Legal Cell',
      category: 'child_safety_pocso',
      durationHours: 6.0,
      startDate: '2026-07-04',
      endDate: '2026-07-04',
      academicYear: '2026-2027',
      mode: 'offline_workshop',
      certificateUrl: 'https://storage.eduos.io/certs/DVN_POCSO_2026_078.pdf',
      isVerifiedByPrincipal: true,
    },
    {
      id: 'tr-8',
      employeeId: 'emp-102',
      trainingTitle: 'Gamified Storytelling & Experiential Mathematics for Primary Grades',
      providerAgency: 'State DIET Delhi',
      category: 'subject_enrichment',
      durationHours: 6.0,
      startDate: '2026-08-11',
      endDate: '2026-08-11',
      academicYear: '2026-2027',
      mode: 'offline_workshop',
      certificateUrl: 'https://storage.eduos.io/certs/DIET_MATH_078.pdf',
      isVerifiedByPrincipal: true,
    },
  ];

  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. HR Overview Summary
  async getHROverview() {
    const totalStaff = this.mockEmployees.length;
    const verifiedStaff = this.mockEmployees.filter(e => e.policeVerificationStatus === 'verified').length;
    const pendingGraceStaff = this.mockEmployees.filter(e => e.policeVerificationStatus === 'submitted_pending').length;
    const missingPoliceStaff = this.mockEmployees.filter(e => e.policeVerificationStatus === 'missing').length;
    const restrictedStaff = this.mockEmployees.filter(e => e.isAccessRestricted).length;
    const policeVerificationRate = Math.round((verifiedStaff / totalStaff) * 100);

    // 50-Hour CPD calculation
    const teachingStaff = this.mockEmployees.filter(e => e.employeeType === 'teaching');
    const fullyCompletedCPD = teachingStaff.filter(e => (e.cpdHoursCompleted || 0) >= 50).length;
    const cpdCompletionRate = Math.round((fullyCompletedCPD / teachingStaff.length) * 100);
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

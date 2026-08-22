'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DemoModeBanner } from '@/components/common/DemoModeBanner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/toast';
import { NoticeBoard } from '@/components/common/NoticeBoard';
import { TeacherWorkspace } from '@/components/teacher/TeacherWorkspace';

// Student Components
import { StudentOverview } from '@/components/student/StudentOverview';
import { StudentAttendance } from '@/components/student/StudentAttendance';
import { StudentLMS } from '@/components/student/StudentLMS';
import { StudentAssignments } from '@/components/student/StudentAssignments';
import { StudentExams } from '@/components/student/StudentExams';
import { StudentIDCard } from '@/components/student/StudentIDCard';
import { StudentNotices } from '@/components/student/StudentNotices';
import { StudentSupport } from '@/components/student/StudentSupport';

// Parent Components
import { ParentOverview } from '@/components/parent/ParentOverview';
import { ParentFees } from '@/components/parent/ParentFees';
import { ParentConsentForms } from '@/components/parent/ParentConsentForms';
import { ParentPTM } from '@/components/parent/ParentPTM';
import { ParentBusTracking } from '@/components/parent/ParentBusTracking';
import { ParentAIReport } from '@/components/parent/ParentAIReport';
import { ParentFeedback } from '@/components/parent/ParentFeedback';
import { ParentExamHistory } from '@/components/parent/ParentExamHistory';

// Teacher Components
import { TeacherOverview } from '@/components/teacher/TeacherOverview';
import { TeacherAttendance } from '@/components/teacher/TeacherAttendance';
import { TeacherStudentDirectory } from '@/components/teacher/TeacherStudentDirectory';
import { TeacherAssignments } from '@/components/teacher/TeacherAssignments';
import { TeacherGradebook } from '@/components/teacher/TeacherGradebook';
import { TeacherAIQuestions } from '@/components/teacher/TeacherAIQuestions';
import { TeacherTimetable } from '@/components/teacher/TeacherTimetable';
import { TeacherExams } from '@/components/teacher/TeacherExams';
import { TeacherConsentForms } from '@/components/teacher/TeacherConsentForms';
import { TeacherLeavePortal } from '@/components/teacher/TeacherLeavePortal';

// Principal Components
import { PrincipalOverview } from '@/components/principal/PrincipalOverview';
import { PrincipalStudentDirectory } from '@/components/principal/PrincipalStudentDirectory';
import { PrincipalConsentForms } from '@/components/principal/PrincipalConsentForms';
import { PrincipalApprovals } from '@/components/principal/PrincipalApprovals';
import { PrincipalInspection } from '@/components/principal/PrincipalInspection';

// Super Admin Components
import { AdminOverview } from '@/components/admin/AdminOverview';
import { TenantManager } from '@/components/admin/TenantManager';
import { BrandingStudio } from '@/components/admin/BrandingStudio';
import { FeatureMatrix } from '@/components/admin/FeatureMatrix';
import { ComplianceLib } from '@/components/admin/ComplianceLib';

// HR Manager Components (EDUOS-101)
import { HROverview } from '@/components/hr/HROverview';
import { HRCareersATS } from '@/components/hr/HRCareersATS';
import { HRServiceBooks } from '@/components/hr/HRServiceBooks';
import { HRPoliceVerificationGate } from '@/components/hr/HRPoliceVerificationGate';
import { HRTeacherCPDRegister } from '@/components/hr/HRTeacherCPDRegister';

export default function Home() {
  // EDUOS-102 — the viewing role now comes from the authenticated session
  // instead of `useState<UserRole>('student')`, which let any visitor pick
  // Principal or Super Admin out of the sidebar.
  const { session, status, isDemo, setDemoRole } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Teacher workspace is scoped to a selected batch; kept for the whole session.
  const [teacherBatchId, setTeacherBatchId] = useState<string | null>(null);

  const activeRole: UserRole = session?.roles[0] ?? 'student';

  const handleRoleChange = (role: UserRole) => {
    // Only meaningful in the fixture sandbox. With a real session the sidebar
    // offers just the roles the user actually holds, and `setDemoRole` is a
    // no-op — EDUOS-107 removes the control from the authenticated UI entirely.
    setDemoRole(role);
    setActiveTab('overview');
    setMobileNavOpen(false);
  };

  // Middleware already redirects unauthenticated requests, so this covers the
  // window before the client has resolved its session, plus the signed-in user
  // whose profile was deactivated mid-session.
  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-2.5 text-body text-text-secondary">
          <Loader2 size={16} className="animate-spin" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-title text-foreground">No access</h1>
          <p className="mt-2 text-body text-text-secondary">
            This account is not linked to an active institution profile. Ask your
            administrator to invite you.
          </p>
          <a
            href="/login"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeRole) {
      case 'student':
        switch (activeTab) {
          case 'overview':
            return <StudentOverview onNavigate={setActiveTab} />;
          case 'attendance':
            return <StudentAttendance />;
          case 'lms':
            return <StudentLMS />;
          case 'assignments':
            return <StudentAssignments />;
          case 'exams':
            return <StudentExams />;
          case 'id_card':
            return <StudentIDCard />;
          case 'support':
            return <StudentSupport />;
          case 'notices':
            return <NoticeBoard role={activeRole} />;
          default:
            return <StudentOverview onNavigate={setActiveTab} />;
        }

      case 'parent':
        switch (activeTab) {
          case 'overview':
            return <ParentOverview onNavigate={setActiveTab} />;
          case 'fees':
            return <ParentFees />;
          case 'consent':
            return <ParentConsentForms />;
          case 'ptm':
            return <ParentPTM />;
          case 'bus':
            return <ParentBusTracking />;
          case 'ai_report':
            return <ParentAIReport />;
          case 'exam_history':
            return <ParentExamHistory />;
          case 'feedback':
            return <ParentFeedback />;
          case 'notices':
            return <NoticeBoard role={activeRole} />;
          default:
            return <ParentOverview onNavigate={setActiveTab} />;
        }

      case 'teacher':
        switch (activeTab) {
          case 'overview':
            return <TeacherOverview onNavigate={setActiveTab} />;
          case 'attendance':
            return <TeacherAttendance />;
          case 'students':
            return <TeacherStudentDirectory />;
          case 'assignments':
            return <TeacherAssignments />;
          case 'consent':
            return <TeacherConsentForms />;
          case 'gradebook':
            return <TeacherGradebook />;
          case 'ai_question_studio':
            return <TeacherAIQuestions />;
          case 'timetable':
            return <TeacherTimetable />;
          case 'leave':
            return <TeacherLeavePortal />;
          case 'exams':
            return <TeacherExams />;
          case 'notices':
            return <NoticeBoard role={activeRole} />;
          default:
            return <TeacherOverview onNavigate={setActiveTab} />;
        }

      case 'principal':
        switch (activeTab) {
          case 'overview':
            return <PrincipalOverview onNavigate={setActiveTab} />;
          case 'students':
            return <PrincipalStudentDirectory />;
          case 'consent':
            return <PrincipalConsentForms />;
          case 'approvals':
            return <PrincipalApprovals />;
          case 'academic_heatmaps':
            return <TeacherGradebook />;
          case 'inspection_mode':
            return <PrincipalInspection />;
          case 'notices':
            return <NoticeBoard role={activeRole} />;
          default:
            return <PrincipalOverview onNavigate={setActiveTab} />;
        }

      case 'super_admin':
        switch (activeTab) {
          case 'overview':
            return <AdminOverview onNavigate={setActiveTab} />;
          case 'tenants':
            return <TenantManager />;
          case 'feature_matrix':
            return <FeatureMatrix />;
          case 'branding_studio':
            return <BrandingStudio />;
          case 'compliance_lib':
            return <ComplianceLib />;
          default:
            return <AdminOverview onNavigate={setActiveTab} />;
        }

      case 'hr_manager':
        switch (activeTab) {
          case 'overview':
            return <HROverview onNavigate={setActiveTab} />;
          case 'ats':
            return <HRCareersATS />;
          case 'service_books':
            return <HRServiceBooks />;
          case 'police_gate':
            return <HRPoliceVerificationGate />;
          case 'cpd_register':
            return <HRTeacherCPDRegister />;
          default:
            return <HROverview onNavigate={setActiveTab} />;
        }
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Role-aware sidebar (sticky on desktop, drawer on mobile) */}
      <Sidebar
        activeRole={activeRole}
        setActiveRole={handleRoleChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {isDemo && <DemoModeBanner />}
        <Navbar activeRole={activeRole} activeTab={activeTab} onOpenMobile={() => setMobileNavOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div key={`${activeRole}-${activeTab}`} className="mx-auto max-w-[1360px] animate-fade-in">
            {activeRole === 'teacher' ? (
              <TeacherWorkspace
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                batchId={teacherBatchId}
                setBatchId={setTeacherBatchId}
              />
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}

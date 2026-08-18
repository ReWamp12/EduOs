'use client';

import React, { useState } from 'react';
import { UserRole } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

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

// Teacher Components
import { TeacherOverview } from '@/components/teacher/TeacherOverview';
import { TeacherAttendance } from '@/components/teacher/TeacherAttendance';
import { TeacherGradebook } from '@/components/teacher/TeacherGradebook';
import { TeacherAIQuestions } from '@/components/teacher/TeacherAIQuestions';
import { TeacherTimetable } from '@/components/teacher/TeacherTimetable';

// Principal Components
import { PrincipalOverview } from '@/components/principal/PrincipalOverview';
import { PrincipalApprovals } from '@/components/principal/PrincipalApprovals';
import { PrincipalInspection } from '@/components/principal/PrincipalInspection';

// Super Admin Components
import { AdminOverview } from '@/components/admin/AdminOverview';
import { TenantManager } from '@/components/admin/TenantManager';
import { BrandingStudio } from '@/components/admin/BrandingStudio';
import { FeatureMatrix } from '@/components/admin/FeatureMatrix';
import { ComplianceLib } from '@/components/admin/ComplianceLib';

export default function Home() {
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState<string>('overview');

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setActiveTab('overview');
  };

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
            return <StudentNotices />;
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
          case 'feedback':
            return <ParentFeedback />;
          case 'notices':
            return <StudentNotices />;
          default:
            return <ParentOverview onNavigate={setActiveTab} />;
        }

      case 'teacher':
        switch (activeTab) {
          case 'overview':
            return <TeacherOverview onNavigate={setActiveTab} />;
          case 'attendance':
            return <TeacherAttendance />;
          case 'gradebook':
            return <TeacherGradebook />;
          case 'lms_creator':
            return <StudentLMS />;
          case 'ai_question_studio':
            return <TeacherAIQuestions />;
          case 'timetable':
            return <TeacherTimetable />;
          case 'notices':
            return <StudentNotices />;
          default:
            return <TeacherOverview onNavigate={setActiveTab} />;
        }

      case 'principal':
        switch (activeTab) {
          case 'overview':
            return <PrincipalOverview onNavigate={setActiveTab} />;
          case 'approvals':
            return <PrincipalApprovals />;
          case 'academic_heatmaps':
            return <TeacherGradebook />;
          case 'inspection_mode':
            return <PrincipalInspection />;
          case 'notices':
            return <StudentNotices />;
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
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Top Navbar with Bottom-Up Live Role Switcher */}
      <Navbar activeRole={activeRole} setActiveRole={handleRoleChange} activeTab={activeTab} />

      {/* Main App Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Role-Aware Sidebar */}
        <Sidebar activeRole={activeRole} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main Stage */}
        <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', maxHeight: 'calc(100vh - 63px)' }}>
          <div className="animate-fade-in">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

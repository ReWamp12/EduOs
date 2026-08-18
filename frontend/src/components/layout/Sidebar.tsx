'use client';

import React from 'react';
import { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  CalendarCheck2,
  BookOpen,
  FileText,
  Trophy,
  QrCode,
  BellRing,
  ClipboardList,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Building2,
  Sliders,
  Palette,
  Scale,
  Calendar,
  Layers,
  CreditCard,
  Bus,
  FileCheck2,
  HelpCircle,
  HeartPulse,
} from 'lucide-react';

interface SidebarProps {
  activeRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeRole, activeTab, setActiveTab }) => {
  const getNavItems = () => {
    switch (activeRole) {
      case 'student':
        return [
          { id: 'overview', label: 'My Dashboard', icon: <LayoutDashboard size={18} /> },
          { id: 'attendance', label: 'Attendance Track', icon: <CalendarCheck2 size={18} /> },
          { id: 'lms', label: 'LMS Classroom', icon: <BookOpen size={18} /> },
          { id: 'assignments', label: 'Assignments / DPP', icon: <FileText size={18} /> },
          { id: 'exams', label: 'Exams & AI Insights', icon: <Trophy size={18} /> },
          { id: 'id_card', label: 'Digital QR ID', icon: <QrCode size={18} /> },
          { id: 'support', label: 'Support & Counseling', icon: <HelpCircle size={18} /> },
          { id: 'notices', label: 'Circulars & Notices', icon: <BellRing size={18} /> },
        ];
      case 'parent':
        return [
          { id: 'overview', label: 'Child Overview', icon: <LayoutDashboard size={18} /> },
          { id: 'fees', label: 'Fee Payments', icon: <CreditCard size={18} /> },
          { id: 'consent', label: 'Digital Consent', icon: <FileCheck2 size={18} /> },
          { id: 'ptm', label: 'PTM Scheduler', icon: <Calendar size={18} /> },
          { id: 'bus', label: 'Live Bus Tracking', icon: <Bus size={18} /> },
          { id: 'ai_report', label: 'AI Progress Card', icon: <Sparkles size={18} /> },
          { id: 'feedback', label: 'Profile & Feedback', icon: <HeartPulse size={18} /> },
          { id: 'notices', label: 'School Notices', icon: <BellRing size={18} /> },
        ];
      case 'teacher':
        return [
          { id: 'overview', label: 'Teacher Overview', icon: <LayoutDashboard size={18} /> },
          { id: 'attendance', label: 'Mark Attendance', icon: <CalendarCheck2 size={18} /> },
          { id: 'gradebook', label: 'Gradebook & Publish', icon: <ClipboardList size={18} /> },
          { id: 'lms_creator', label: 'Course Materials', icon: <BookOpen size={18} /> },
          { id: 'ai_question_studio', label: 'AI Question Studio', icon: <Sparkles size={18} /> },
          { id: 'timetable', label: 'My Timetable', icon: <Calendar size={18} /> },
          { id: 'notices', label: 'Notices', icon: <BellRing size={18} /> },
        ];
      case 'principal':
        return [
          { id: 'overview', label: 'Operations Command', icon: <LayoutDashboard size={18} /> },
          { id: 'approvals', label: 'Staff Leave Approvals', icon: <ClipboardList size={18} /> },
          { id: 'academic_heatmaps', label: 'Academic Heatmaps', icon: <GraduationCap size={18} /> },
          { id: 'inspection_mode', label: 'Board Inspection Mode', icon: <ShieldAlert size={18} /> },
          { id: 'notices', label: 'Broadcast Notices', icon: <BellRing size={18} /> },
        ];
      case 'super_admin':
        return [
          { id: 'overview', label: 'Platform Health', icon: <LayoutDashboard size={18} /> },
          { id: 'tenants', label: 'Tenant Onboarding', icon: <Building2 size={18} /> },
          { id: 'feature_matrix', label: 'Feature Flag Matrix', icon: <Sliders size={18} /> },
          { id: 'branding_studio', label: 'Branding Studio', icon: <Palette size={18} /> },
          { id: 'compliance_lib', label: 'Compliance Library', icon: <Scale size={18} /> },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      gap: '6px',
      minHeight: 'calc(100vh - 63px)',
    }}>
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        padding: '0 12px 10px',
      }}>
        {activeRole.replace('_', ' ')} Navigation
      </div>

      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(6, 182, 212, 0.15))' : 'transparent',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ color: isActive ? 'var(--primary)' : 'inherit', display: 'flex' }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}

      {/* Bottom Tenant Info Card */}
      <div style={{
        marginTop: 'auto',
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Current Academic Term
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
          2026-2027 Term 1
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          RLS Isolation: <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active</span>
        </div>
      </div>
    </aside>
  );
};

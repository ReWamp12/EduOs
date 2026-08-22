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
  CreditCard,
  Bus,
  FileCheck2,
  HelpCircle,
  HeartPulse,
  Users,
  IdCard,
  FileSignature,
  UserCheck,
  Briefcase,
  UserPlus,
  ShieldCheck,
  Award,
  BookMarked,
  FolderLock,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeTone?: 'primary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' | 'gradient';
  isFlagged?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ICON = 18;

/**
 * Canonical navigation config per stakeholder role.
 * Item ids/labels are unchanged from the original build so routing/state stay intact —
 * they are only organised into labelled sections for the redesigned sidebar, and reused
 * by the topbar breadcrumb so there is a single source of truth.
 */
export const NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  student: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'My Dashboard', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Academics', items: [
      { id: 'attendance', label: 'Attendance', icon: <CalendarCheck2 size={ICON} /> },
      { id: 'lms', label: 'LMS Classroom', icon: <BookOpen size={ICON} /> },
      { id: 'assignments', label: 'Assignments / DPP', icon: <FileText size={ICON} /> },
      { id: 'exams', label: 'Exams & AI Insights', icon: <Trophy size={ICON} /> },
    ]},
    { label: 'Campus Life', items: [
      { id: 'id_card', label: 'Digital QR ID', icon: <QrCode size={ICON} /> },
      { id: 'support', label: 'Support & Counseling', icon: <HelpCircle size={ICON} /> },
      { id: 'notices', label: 'Circulars & Notices', icon: <BellRing size={ICON} /> },
    ]},
  ],
  parent: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'Child Overview', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Academics', items: [
      { id: 'exam_history', label: 'Exam History', icon: <Trophy size={ICON} /> },
      { id: 'notices', label: 'School Notices', icon: <BellRing size={ICON} /> },
    ]},
    { label: 'Payments & Consent', items: [
      { id: 'fees', label: 'Fee Payments', icon: <CreditCard size={ICON} /> },
      { id: 'consent', label: 'Digital Consent', icon: <FileCheck2 size={ICON} /> },
    ]},
    { label: 'Engagement', items: [
      { id: 'ptm', label: 'PTM Scheduler', icon: <Calendar size={ICON} /> },
      { id: 'feedback', label: 'Profile & Feedback', icon: <HeartPulse size={ICON} /> },
    ]},
  ],
  teacher: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'Teacher Overview', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Teaching', items: [
      { id: 'attendance', label: 'Mark Attendance', icon: <CalendarCheck2 size={ICON} /> },
      { id: 'students', label: 'Student Directory & IDs', icon: <Users size={ICON} /> },
      { id: 'assignments', label: 'Assignments & DPPs', icon: <FileText size={ICON} /> },
      { id: 'consent', label: 'Digital Consent & Trips', icon: <FileSignature size={ICON} /> },
      { id: 'gradebook', label: 'Gradebook & Publish', icon: <ClipboardList size={ICON} /> },
      { id: 'exams', label: 'Exams', icon: <Trophy size={ICON} /> },
      { id: 'ai_question_studio', label: 'AI Question Studio', icon: <Sparkles size={ICON} /> },
    ]},
    { label: 'Schedule & Leave', items: [
      { id: 'timetable', label: 'My Timetable', icon: <Calendar size={ICON} /> },
      { id: 'leave', label: 'Apply Leave & History', icon: <UserCheck size={ICON} /> },
      { id: 'notices', label: 'Notices', icon: <BellRing size={ICON} /> },
    ]},
  ],
  principal: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'Operations Command', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Operations', items: [
      { id: 'students', label: 'Institutional Student Directory', icon: <Users size={ICON} /> },
      { id: 'consent', label: 'Digital Consent Hub', icon: <FileSignature size={ICON} /> },
      { id: 'approvals', label: 'Staff Leave Approvals', icon: <ClipboardList size={ICON} /> },
      { id: 'academic_heatmaps', label: 'Academic Heatmaps', icon: <GraduationCap size={ICON} /> },
    ]},
    { label: 'Governance', items: [
      { id: 'inspection_mode', label: 'Board Inspection Mode', icon: <ShieldAlert size={ICON} /> },
      { id: 'notices', label: 'Broadcast Notices', icon: <BellRing size={ICON} /> },
    ]},
  ],
  super_admin: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'Platform Health', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Tenants', items: [
      { id: 'tenants', label: 'Tenant Onboarding', icon: <Building2 size={ICON} /> },
      { id: 'feature_matrix', label: 'Feature Flag Matrix', icon: <Sliders size={ICON} /> },
    ]},
    { label: 'Configuration', items: [
      { id: 'branding_studio', label: 'Branding Studio', icon: <Palette size={ICON} /> },
      { id: 'compliance_lib', label: 'Compliance Library', icon: <Scale size={ICON} /> },
    ]},
  ],
  hr_manager: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'HR & Statutory Command', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Recruitment & ATS', items: [
      { id: 'ats', label: 'Career ATS & Pipelines', icon: <UserPlus size={ICON} />, badge: '4 Active', badgeTone: 'primary' },
    ]},
    { label: 'Staff & Governance', items: [
      { id: 'service_books', label: 'Statutory Service Books', icon: <BookMarked size={ICON} /> },
      { id: 'police_gate', label: 'Police Verification Gate', icon: <ShieldCheck size={ICON} />, badge: '1 Overdue', badgeTone: 'danger' },
    ]},
  ],
};

export const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Student',
  parent: 'Parent',
  teacher: 'Teacher',
  principal: 'Principal',
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
};

/** Section + item label lookup for the current tab (used by breadcrumbs & page title). */
export function getNavMeta(role: UserRole, tabId: string): { section: string; label: string; item?: NavItem } {
  for (const group of NAV_CONFIG[role]) {
    const item = group.items.find((i) => i.id === tabId);
    if (item) return { section: group.label, label: item.label, item };
  }
  return { section: 'Overview', label: 'Overview' };
}

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
  Settings,
  Bot,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeTone?: 'primary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' | 'gradient';
  isFlagged?: boolean;
  disabled?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ICON = 18;

/**
 * Canonical navigation config per stakeholder role.
 */
export const NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  student: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'My Dashboard', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Academics', items: [
      { id: 'performance', label: 'Academic Performance', icon: <TrendingUp size={ICON} />, badge: 'Live', badgeTone: 'primary' },
      { id: 'ai_chatbot', label: 'AI Study Chatbot', icon: <Bot size={ICON} />, badge: 'RAG AI', badgeTone: 'primary', isFlagged: true },
      { id: 'syllabus', label: 'Syllabus & Learning', icon: <BookOpen size={ICON} />, badge: 'Live', badgeTone: 'primary' },
      { id: 'attendance', label: 'Attendance', icon: <CalendarCheck2 size={ICON} /> },
      { id: 'lms', label: 'LMS Classroom', icon: <BookMarked size={ICON} /> },
      { id: 'assignments', label: 'Assignments / DPP', icon: <FileText size={ICON} /> },
      { id: 'exams', label: 'Exams & AI Insights', icon: <Trophy size={ICON} /> },
    ]},
    { label: 'Campus Life', items: [
      { id: 'id_card', label: 'Digital QR ID', icon: <QrCode size={ICON} /> },
      { id: 'support', label: 'Support & Counseling', icon: <HelpCircle size={ICON} /> },
      { id: 'notices', label: 'Circulars & Notices', icon: <BellRing size={ICON} /> },
    ]},
    { label: 'Account', items: [
      { id: 'settings', label: 'Settings & Preferences', icon: <Settings size={ICON} /> },
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
    { label: 'Account', items: [
      { id: 'settings', label: 'Settings & Preferences', icon: <Settings size={ICON} /> },
    ]},
  ],
  teacher: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'Teacher Overview', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Teaching', items: [
      { id: 'performance', label: 'Class Performance', icon: <TrendingUp size={ICON} />, badge: 'Live', badgeTone: 'primary' },
      { id: 'attendance', label: 'Mark Attendance', icon: <CalendarCheck2 size={ICON} /> },
      { id: 'students', label: 'Student Directory & IDs', icon: <Users size={ICON} /> },
      { id: 'curriculum', label: 'Curriculum & Syllabus', icon: <BookOpen size={ICON} /> },
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
    { label: 'Account', items: [
      { id: 'settings', label: 'Settings & Preferences', icon: <Settings size={ICON} /> },
    ]},
  ],
  principal: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'Operations Command', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Operations & Finance', items: [
      { id: 'academic_overview', label: 'Academic Overview', icon: <BarChart3 size={ICON} />, badge: 'Live', badgeTone: 'primary' },
      { id: 'finance', label: 'Finance, Fees & Ledger', icon: <CreditCard size={ICON} /> },
      { id: 'students', label: 'Institutional Student Directory', icon: <Users size={ICON} /> },
      { id: 'consent', label: 'Digital Consent Hub', icon: <FileSignature size={ICON} /> },
      { id: 'approvals', label: 'Staff Leave Approvals', icon: <ClipboardList size={ICON} /> },
      { id: 'academic_heatmaps', label: 'Academic Heatmaps', icon: <GraduationCap size={ICON} /> },
    ]},
    { label: 'Governance', items: [
      { id: 'inspection_mode', label: 'Board Inspection Mode', icon: <ShieldAlert size={ICON} /> },
      { id: 'notices', label: 'Broadcast Notices', icon: <BellRing size={ICON} /> },
    ]},
    { label: 'System', items: [
      { id: 'settings', label: 'Settings & Controls', icon: <Settings size={ICON} /> },
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
      { id: 'finance', label: 'Institutional Finance', icon: <CreditCard size={ICON} /> },
      { id: 'branding_studio', label: 'Branding Studio', icon: <Palette size={ICON} /> },
      { id: 'compliance_lib', label: 'Compliance Library', icon: <Scale size={ICON} /> },
    ]},
    { label: 'System', items: [
      { id: 'settings', label: 'Platform Settings', icon: <Settings size={ICON} /> },
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
    { label: 'System', items: [
      { id: 'settings', label: 'HR & Workspace Settings', icon: <Settings size={ICON} /> },
    ]},
  ],
  finance_officer: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'Financial Command Center', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Institutional Accounts', items: [
      { id: 'general_ledger', label: 'General Ledger & Statements', icon: <FileText size={ICON} /> },
      { id: 'fee_structures', label: 'Fee Structures & Blueprints', icon: <CreditCard size={ICON} /> },
      { id: 'payroll', label: 'Staff Payroll & Taxes', icon: <Users size={ICON} /> },
    ]},
    { label: 'System', items: [
      { id: 'settings', label: 'Finance Preferences', icon: <Settings size={ICON} /> },
    ]},
  ],
  accountant: [
    { label: 'Overview', items: [
      { id: 'overview', label: 'Cashier & Counter Overview', icon: <LayoutDashboard size={ICON} /> },
    ]},
    { label: 'Fee Counter Operations', items: [
      { id: 'cashier_pos', label: 'Counter POS & Invoicing', icon: <CreditCard size={ICON} /> },
      { id: 'fee_structures', label: 'Fee Structure Schedules', icon: <FileText size={ICON} /> },
    ]},
    { label: 'System', items: [
      { id: 'settings', label: 'Accounts Preferences', icon: <Settings size={ICON} /> },
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
  finance_officer: 'Finance Officer (CFO)',
  accountant: 'Accountant / Cashier',
};

/** Section + item label lookup for the current tab (used by breadcrumbs & page title). */
export function getNavMeta(role: UserRole, tabId: string): { section: string; label: string; item?: NavItem } {
  if (tabId === 'settings') {
    return { section: 'Preferences', label: 'Settings & Workspace Preferences' };
  }
  const groups = NAV_CONFIG[role] || [];
  for (const group of groups) {
    const item = group.items.find((i) => i.id === tabId && !i.isFlagged);
    if (item) return { section: group.label, label: item.label, item };
  }
  return { section: 'Overview', label: 'Overview' };
}

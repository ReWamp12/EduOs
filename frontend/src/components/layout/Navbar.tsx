'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { getNavMeta, ROLE_LABEL } from '@/lib/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  Menu,
  ChevronRight,
  GraduationCap,
  Users,
  ShieldCheck,
  Briefcase,
  Crown,
  ChevronsUpDown,
  Check,
  Sparkles,
  Landmark,
  Receipt,
} from 'lucide-react';
import { Badge, cn } from '@/components/ui';

interface NavbarProps {
  activeRole: UserRole;
  setActiveRole?: (role: UserRole) => void;
  activeTab: string;
  onOpenMobile: () => void;
}

const ROLE_OPTIONS: { role: UserRole; label: string; icon: React.ReactNode }[] = [
  { role: 'student', label: 'Student', icon: <GraduationCap size={15} /> },
  { role: 'teacher', label: 'Teacher', icon: <Users size={15} /> },
  { role: 'principal', label: 'Principal', icon: <ShieldCheck size={15} /> },
  { role: 'finance_officer', label: 'Finance Officer (CFO)', icon: <Landmark size={15} /> },
  { role: 'accountant', label: 'Accountant / Cashier', icon: <Receipt size={15} /> },
  { role: 'hr_manager', label: 'HR Manager', icon: <Briefcase size={15} /> },
  { role: 'parent', label: 'Parent', icon: <Users size={15} /> },
  { role: 'super_admin', label: 'Super Admin', icon: <Crown size={15} /> },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  setActiveRole,
  activeTab,
  onOpenMobile,
}) => {
  const meta = getNavMeta(activeRole, activeTab);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { session, isDemo } = useAuth();

  // EDUOS-108 — second copy of the Sidebar's stakeholder switcher, and it had
  // the same defect: rendered for every session, offering Super Admin to
  // anyone. See Sidebar.tsx for the reasoning; the rule is kept identical here
  // so the two cannot drift apart.
  const switchableRoles = isDemo
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((item) => (session?.roles ?? []).includes(item.role));
  const canSwitch = Boolean(setActiveRole) && switchableRoles.length > 1;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile menu + Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobile}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-muted lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb + title */}
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-micro text-text-tertiary sm:flex">
            <span>EduOS</span>
            <ChevronRight size={13} className="text-text-disabled" />
            <span>{meta.section}</span>
          </nav>
          <h1 className="truncate text-[1.0625rem] font-semibold leading-tight text-foreground">
            {meta.label}
          </h1>
        </div>
      </div>

      {/* Right: Live Cloud Badge + stakeholder switcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloud Active</span>
        </div>

        {canSwitch && setActiveRole && (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft/40 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary-soft hover:border-primary/50 shadow-2xs"
              aria-label="Switch Dashboard Role"
            >

            <Sparkles size={14} className="text-primary animate-pulse" />
            <span className="hidden sm:inline text-text-secondary font-medium">Switch Role:</span>
            <span className="font-bold text-primary">{ROLE_LABEL[activeRole]}</span>
            <ChevronsUpDown size={14} className="text-primary/70" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-xl animate-scale-in">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-border mb-1">
                Switch stakeholder view
              </div>
              <div className="space-y-0.5">
                {switchableRoles.map((item) => {
                  const isActive = item.role === activeRole;
                  return (
                    <button
                      key={item.role}
                      onClick={() => {
                        setActiveRole(item.role);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                          : 'text-foreground hover:bg-muted font-medium',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {isActive && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </header>
  );
};


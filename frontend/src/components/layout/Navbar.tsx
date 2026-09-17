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
  Bell,
  CheckCheck,
  FileText,
  Radio,
  Award,
} from 'lucide-react';
import { Badge, cn } from '@/components/ui';
import { dataService } from '@/lib/dataService';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { session, isDemo } = useAuth();

  const loadNotifications = async () => {
    if (session?.userId) {
      const list = await dataService.getNotifications(session.userId);
      if (list) setNotifications(list);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 25000);
    return () => clearInterval(interval);
  }, [session?.userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (session?.userId) {
      await dataService.markAllNotificationsRead(session.userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await dataService.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
  };

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
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
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

      {/* Right: Live Cloud Badge + Notification Bell + stakeholder switcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloud Active</span>
        </div>

        {/* Notification Bell */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-text-secondary hover:bg-muted hover:text-foreground transition-colors shadow-2xs"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-xs animate-scale-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-meta font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge tone="primary" className="text-micro">{unreadCount} new</Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-micro font-semibold text-primary hover:underline"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-meta text-text-tertiary">
                    <Bell size={24} className="mx-auto mb-2 opacity-40" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !n.isRead;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          'flex items-start gap-3 p-3.5 cursor-pointer transition-colors text-left',
                          isUnread ? 'bg-primary-soft/15 hover:bg-primary-soft/25' : 'hover:bg-muted/40'
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-lg mt-0.5 text-micro',
                            n.eventType?.includes('exam')
                              ? 'bg-destructive/15 text-destructive'
                              : n.eventType?.includes('assignment')
                              ? 'bg-primary-soft text-primary'
                              : 'bg-surface-muted text-text-secondary'
                          )}
                        >
                          {n.eventType?.includes('live') ? (
                            <Radio size={14} className="animate-pulse" />
                          ) : n.eventType?.includes('graded') ? (
                            <Award size={14} />
                          ) : (
                            <FileText size={14} />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className={cn('text-meta font-semibold truncate', isUnread ? 'text-foreground font-bold' : 'text-text-secondary')}>
                              {n.title}
                            </h5>
                            {isUnread && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          {n.body && (
                            <p className="mt-0.5 text-micro text-text-secondary line-clamp-2 leading-relaxed">
                              {n.body}
                            </p>
                          )}
                          <span className="mt-1 block text-[10px] text-text-tertiary">
                            {new Date(n.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
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


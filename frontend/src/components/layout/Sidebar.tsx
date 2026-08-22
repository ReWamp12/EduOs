'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { NAV_CONFIG, ROLE_LABEL } from '@/lib/navigation';
import { mockTenant, mockProfiles } from '@/lib/mockData';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  Crown,
  ChevronsUpDown,
  Check,
  Settings,
  LogOut,
  X,
  Briefcase,
} from 'lucide-react';

interface SidebarProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const ROLE_META: { role: UserRole; icon: React.ReactNode }[] = [
  { role: 'student', icon: <GraduationCap size={16} /> },
  { role: 'parent', icon: <Users size={16} /> },
  { role: 'teacher', icon: <Users size={16} /> },
  { role: 'principal', icon: <ShieldCheck size={16} /> },
  { role: 'hr_manager', icon: <Briefcase size={16} /> },
  { role: 'super_admin', icon: <Crown size={16} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const groups = NAV_CONFIG[activeRole];
  const { session, isDemo, signOut } = useAuth();

  // EDUOS-102 — the switcher offers every stakeholder view in the fixture
  // sandbox (that is the point of the demo), but a real session may only view
  // the roles it actually holds. `session.roles` carries one entry today; when
  // EDUOS-105 lands multi-role, a genuine Teacher-and-Parent gets both here
  // with no change to this component.
  const availableRoles = isDemo
    ? ROLE_META
    : ROLE_META.filter(({ role }) => session?.roles.includes(role));

  const canSwitch = availableRoles.length > 1;

  // Identity in the sandbox comes from fixtures; a real session shows the
  // signed-in person, not a stand-in for their role.
  const mockProfile = mockProfiles[activeRole];
  const profile = isDemo
    ? mockProfile
    : {
        firstName: session?.firstName ?? '',
        lastName: session?.lastName ?? '',
        email: session?.email ?? '',
        // Fixture portrait as a fallback so a profile with no uploaded avatar
        // does not render a broken image. EDUOS-114 adds real avatar storage.
        avatarUrl: session?.avatarUrl ?? mockProfile?.avatarUrl,
      };

  const switcherLabel = isDemo
    ? ROLE_LABEL[activeRole]
    : `${profile.firstName} ${profile.lastName}`.trim() || ROLE_LABEL[activeRole];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[1px] lg:hidden animate-fade-in-fast"
          aria-hidden
        />
      )}

      <aside
        className={[
          'fixed lg:sticky top-0 z-50 lg:z-auto',
          'flex h-screen lg:h-[100dvh] w-[264px] shrink-0 flex-col',
          'border-r border-border bg-surface',
          'transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-primary-foreground font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              {mockTenant.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[0.9rem] font-semibold text-foreground leading-tight">
                {mockTenant.name}
              </div>
              <div className="truncate text-micro text-text-tertiary">
                {mockTenant.institutionType === 'school' ? 'CBSE School Edition' : 'Coaching Edition'}
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Persona / workspace switcher */}
        <div className="px-3 pt-3" ref={switcherRef}>
          <div className="relative">
            <button
              onClick={() => canSwitch && setSwitcherOpen((v) => !v)}
              disabled={!canSwitch}
              className="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface-muted px-2.5 py-2 text-left transition-colors enabled:hover:border-border-strong disabled:cursor-default"
              aria-haspopup="listbox"
              aria-expanded={switcherOpen}
            >
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="text-micro text-text-tertiary">
                  {isDemo ? 'Viewing as' : 'Signed in as'}
                </div>
                <div className="truncate text-meta font-semibold text-foreground">
                  {switcherLabel}
                </div>
                {!isDemo && (
                  <div className="truncate text-micro text-text-tertiary">
                    {ROLE_LABEL[activeRole]}
                  </div>
                )}
              </div>
              {canSwitch && <ChevronsUpDown size={15} className="shrink-0 text-text-tertiary" />}
            </button>

            {switcherOpen && canSwitch && (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-lg animate-scale-in origin-top"
              >
                <div className="px-2.5 py-1.5 text-micro font-semibold uppercase tracking-wide text-text-tertiary">
                  Switch stakeholder view
                </div>
                {availableRoles.map(({ role, icon }) => {
                  const active = role === activeRole;
                  return (
                    <button
                      key={role}
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setActiveRole(role);
                        setSwitcherOpen(false);
                      }}
                      className={[
                        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-meta transition-colors',
                        active ? 'bg-primary-soft text-primary font-semibold' : 'text-text-secondary hover:bg-muted',
                      ].join(' ')}
                    >
                      <span className={active ? 'text-primary' : 'text-text-tertiary'}>{icon}</span>
                      <span className="flex-1 text-left">{ROLE_LABEL[role]}</span>
                      {active && <Check size={15} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {groups.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <div className="px-2.5 pb-1.5 eyebrow">{group.label}</div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-meta transition-colors',
                        active
                          ? 'bg-primary-soft font-semibold text-primary'
                          : 'font-medium text-text-secondary hover:bg-muted hover:text-foreground',
                      ].join(' ')}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <span className={active ? 'text-primary' : 'text-text-tertiary group-hover:text-text-secondary'}>
                        {item.icon}
                      </span>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span
                          className={[
                            'ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            item.badgeTone === 'gradient'
                              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-2xs'
                              : item.badgeTone === 'info'
                              ? 'bg-info-soft text-info'
                              : 'bg-primary-soft text-primary',
                          ].join(' ')}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Term status */}
        <div className="px-3">
          <div className="rounded-md border border-border bg-surface-muted px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-micro font-medium text-text-tertiary">Academic Term</span>
              <span className="inline-flex items-center gap-1 text-micro font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
              </span>
            </div>
            <div className="mt-0.5 text-meta font-semibold text-foreground">2026–2027 · Term 1</div>
          </div>
        </div>

        {/* User profile */}
        <div className="border-t border-border p-3 mt-3">
          <div className="flex items-center gap-2.5">
            <img src={profile.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-border" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-meta font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="truncate text-micro text-text-tertiary">{profile.email}</div>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground" aria-label="Settings">
                <Settings size={16} />
              </button>
              <button
                onClick={() => void signOut()}
                disabled={isDemo}
                title={isDemo ? 'No session to end in the demo sandbox' : 'Sign out'}
                className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary transition-colors enabled:hover:bg-muted enabled:hover:text-foreground disabled:opacity-40"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

'use client';

import React from 'react';
import { UserRole } from '@/lib/types';
import { getNavMeta } from '@/lib/navigation';
import { Bell, Search, HelpCircle, Menu, ChevronRight } from 'lucide-react';

interface NavbarProps {
  activeRole: UserRole;
  activeTab: string;
  onOpenMobile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeRole, activeTab, onOpenMobile }) => {
  const meta = getNavMeta(activeRole, activeTab);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile menu */}
      <button
        onClick={onOpenMobile}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-secondary hover:bg-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb + title */}
      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-micro text-text-tertiary sm:flex">
          <span>Apex Institute</span>
          <ChevronRight size={13} className="text-text-disabled" />
          <span>{meta.section}</span>
        </nav>
        <h1 className="truncate text-[1.0625rem] font-semibold leading-tight text-foreground">
          {meta.label}
        </h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search…"
          className="input h-9 w-56 lg:w-72 pl-9"
          aria-label="Global search"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-text-tertiary">
          ⌘K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="grid h-9 w-9 place-items-center rounded-md text-text-secondary hover:bg-muted md:hidden"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
        <button
          className="grid h-9 w-9 place-items-center rounded-md text-text-secondary hover:bg-muted"
          aria-label="Help"
        >
          <HelpCircle size={18} />
        </button>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-md text-text-secondary hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-surface" />
        </button>
      </div>
    </header>
  );
};

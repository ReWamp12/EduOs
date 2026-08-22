'use client';

import React from 'react';
import { UserRole } from '@/lib/types';
import { getNavMeta } from '@/lib/navigation';
import { mockTenant } from '@/lib/mockData';
import { Menu, ChevronRight } from 'lucide-react';

interface NavbarProps {
  activeRole: UserRole;
  activeTab: string;
  onOpenMobile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeRole, activeTab, onOpenMobile }) => {
  const meta = getNavMeta(activeRole, activeTab);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
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
            <span>{mockTenant.name}</span>
            <ChevronRight size={13} className="text-text-disabled" />
            <span>{meta.section}</span>
          </nav>
          <h1 className="truncate text-[1.0625rem] font-semibold leading-tight text-foreground">
            {meta.label}
          </h1>
        </div>
      </div>
    </header>
  );
};

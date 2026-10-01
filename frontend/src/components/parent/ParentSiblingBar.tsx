'use client';

import React from 'react';
import { useFamily } from '@/lib/familyContext';
import { cn } from '@/components/ui';

/** Persistent child switcher; hidden for single-child families. */
export const ParentSiblingBar: React.FC = () => {
  const { kids, activeChild, selectChild } = useFamily();
  if (kids.length < 2) return null;

  return (
    <div
      role="tablist"
      aria-label="Select child"
      className="mb-6 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-1 shadow-xs"
    >
      <span className="px-2 text-micro font-semibold uppercase tracking-wider text-text-tertiary">Ward</span>
      {kids.map((kid) => {
        const selected = kid.id === activeChild?.id;
        return (
          <button
            key={kid.id}
            role="tab"
            aria-selected={selected}
            onClick={() => selectChild(kid.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-meta transition-colors',
              selected ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-text-secondary hover:bg-muted',
            )}
          >
            <img src={kid.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
            {kid.name.split(' ')[0]} · {kid.batchName}
          </button>
        );
      })}
    </div>
  );
};

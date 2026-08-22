'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * EDUOS-102 — permanent marker for the no-Supabase fixture sandbox.
 *
 * Demo mode grants a session without anyone signing in. That is safe only
 * because it cannot be reached once real credentials are configured (see
 * lib/auth/demo.ts), but it must never be mistaken for a live deployment —
 * so it announces itself instead of relying on whoever is looking to
 * remember which environment they opened.
 */
export const DemoModeBanner: React.FC = () => (
  <div
    role="status"
    className="flex items-center justify-center gap-2 border-b border-border bg-warning-soft px-4 py-1.5 text-center text-xs text-warning-foreground"
  >
    <ShieldAlert size={13} className="shrink-0" />
    <span>
      <strong className="font-semibold">Demo sandbox</strong> — no database connected and no
      one is signed in. Role switching is a preview control, not a permission.
    </span>
  </div>
);

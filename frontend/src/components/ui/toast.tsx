'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Tiny global toast store (no external deps)                         */
/* ------------------------------------------------------------------ */
export type ToastTone = 'success' | 'error' | 'info' | 'warning';
export interface ToastItem {
  id: number;
  message: string;
  description?: string;
  tone: ToastTone;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let listeners: Listener[] = [];
let seq = 1;

function emit() {
  listeners.forEach((l) => l(items));
}

export function toast(message: string, tone: ToastTone = 'success', description?: string) {
  const id = seq++;
  items = [...items, { id, message, tone, description }];
  emit();
  setTimeout(() => dismiss(id), 3800);
  return id;
}

export function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

const toneStyles: Record<ToastTone, { icon: React.ReactNode; bar: string }> = {
  success: { icon: <CheckCircle2 size={18} className="text-success" />, bar: 'bg-success' },
  error: { icon: <XCircle size={18} className="text-destructive" />, bar: 'bg-destructive' },
  warning: { icon: <AlertTriangle size={18} className="text-warning" />, bar: 'bg-warning' },
  info: { icon: <Info size={18} className="text-info" />, bar: 'bg-info' },
};

/* ------------------------------------------------------------------ */
/*  Toaster — mount once near the app root                            */
/* ------------------------------------------------------------------ */
export const Toaster: React.FC = () => {
  const [list, setList] = useState<ToastItem[]>(items);

  useEffect(() => {
    const l: Listener = (next) => setList([...next]);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const close = useCallback((id: number) => dismiss(id), []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5">
      {list.map((t) => {
        const s = toneStyles[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-lg border border-border bg-surface p-3.5 pl-3 shadow-lg animate-slide-in-right"
          >
            <span className={`mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full ${s.bar}`} />
            <span className="mt-0.5 shrink-0">{s.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-meta font-semibold text-foreground">{t.message}</div>
              {t.description && <div className="mt-0.5 text-micro text-text-secondary">{t.description}</div>}
            </div>
            <button
              onClick={() => close(t.id)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-text-tertiary hover:bg-muted"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

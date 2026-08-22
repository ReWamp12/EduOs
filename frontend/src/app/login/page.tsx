'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Loader2, Lock, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { signInWithPassword } from '@/lib/auth/client';

/**
 * EDUOS-102 — sign-in (part1 §5).
 *
 * The only route that mints a session when Supabase is configured. Before this
 * existed, `page.tsx` chose a role with `useState<UserRole>('student')` and any
 * visitor could select Principal or Super Admin from the sidebar.
 */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    setNoProfile(false);

    const result = await signInWithPassword(email, password);

    if (result.ok) {
      // Only same-origin relative paths are honoured. `next` arrives from the
      // query string, so accepting an absolute URL would turn the login page
      // into an open redirect for phishing links.
      const next = params.get('next');
      const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
      router.replace(target);
      router.refresh();
      return;
    }

    setPending(false);
    if (result.noProfile) {
      setNoProfile(true);
    } else {
      setError(result.error ?? 'Unable to sign in.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap size={22} />
          </div>
          <h1 className="text-title text-foreground">Sign in to EduOS</h1>
          <p className="mt-1 text-body text-text-secondary">
            Use the credentials issued by your institution.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {!configured && (
            <div
              role="status"
              className="mb-5 flex gap-2.5 rounded-lg border border-border bg-warning-soft p-3"
            >
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-warning" />
              <div className="text-sm text-warning-foreground">
                <p className="font-medium">Demo sandbox — no database connected</p>
                <p className="mt-1">
                  Sign-in is disabled because no Supabase project is configured. The app is
                  running on local fixtures. Add{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{' '}
                  and{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>{' '}
                  to <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> to
                  enable real accounts.
                </p>
                <button
                  type="button"
                  onClick={() => router.replace('/')}
                  className="mt-2.5 font-medium underline underline-offset-2"
                >
                  Continue to the demo
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={!configured || pending}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@institution.edu.in"
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:bg-muted disabled:text-text-disabled"
                />
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={!configured || pending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:bg-muted disabled:text-text-disabled"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-border bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {noProfile && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-border bg-warning-soft px-3 py-2.5 text-sm text-warning-foreground"
              >
                <p className="font-medium">No active profile for this account</p>
                <p className="mt-1">
                  Your credentials are valid, but no institution has granted this address
                  access. Ask your administrator to invite you.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!configured || pending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && <Loader2 size={15} className="animate-spin" />}
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
          <ShieldCheck size={13} />
          Privileged roles require two-factor authentication.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary to avoid opting the whole route
  // into client-side rendering at build time.
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}

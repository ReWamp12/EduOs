import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * EDUOS-102 — route protection (part1 §5).
 *
 * Runs before any page renders, so an unauthenticated request never reaches a
 * dashboard route. Client-side redirects alone would not do: the page would
 * still be served and its data fetches still issued, leaving the gate as a
 * cosmetic flicker rather than a control.
 *
 * This gate proves identity only. Deciding what an authenticated user may then
 * see is EDUOS-106 (server-side RBAC) backed by EDUOS-103/104 (RLS).
 */

/** Reachable signed out. `/careers` is the public job board from EDUOS-101. */
const PUBLIC_PATHS = ['/login', '/careers'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
      url !== 'https://placeholder-eduos.supabase.co' &&
      key &&
      key !== 'placeholder-anon-key',
  );
}

export async function middleware(request: NextRequest) {
  // No database configured means the app is running the fixture sandbox
  // documented in the README. There is no account to sign in to, so gating
  // would lock the demo out of itself. See lib/auth/demo.ts for why this is
  // safe: it is unreachable the moment real credentials are present.
  if (!supabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Written to both request and response: the request copy is what
          // getUser() reads later in this same invocation, the response copy is
          // what reaches the browser. Setting only one produces a session that
          // works on this request but not the next, or vice versa.
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  // Revalidates the token against the auth server and refreshes it when close
  // to expiry. getSession() would merely decode the cookie and believe it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = '/login';
    // Preserve where they were headed so login can return them there.
    target.searchParams.set('next', pathname);
    return NextResponse.redirect(target);
  }

  if (user && pathname === '/login') {
    const target = request.nextUrl.clone();
    target.pathname = '/';
    target.search = '';
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets. Excluding these keeps
     * an auth round-trip off every image and chunk request.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

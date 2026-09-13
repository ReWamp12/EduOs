'use client';

/**
 * Signed-in tenant lookup — real Supabase fetch, not the mockTenant constant.
 *
 * Every branded screen (careers, finance, parent, HR, principal, teacher
 * modals) used to import `mockTenant` from lib/mockData to show the school
 * name/logo. That was a single hardcoded Greenfield tenant, wrong for every
 * other school on the platform. This hook resolves the real tenant of the
 * signed-in session; unauthenticated callers get null and the UI should show
 * a neutral label instead of a fake school.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import type { Tenant } from '@/lib/types';

export function useTenant(): { tenant: Tenant | null; loading: boolean } {
  const { session } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      if (!session?.tenantId) {
        setTenant(null);
        setLoading(false);
        return;
      }
      const t = await dataService.getTenantById(session.tenantId);
      if (cancelled) return;
      setTenant(t);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session?.tenantId]);

  return { tenant, loading };
}

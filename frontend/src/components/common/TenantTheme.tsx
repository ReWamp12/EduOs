'use client';

import { useEffect } from 'react';
import { useTenant } from '@/lib/useTenant';
import { applyBrandColors } from '@/lib/branding';

/** Applies the signed-in school's saved brand colors for every role, on every page load. */
export function TenantTheme(): null {
  const { tenant } = useTenant();

  useEffect(() => {
    if (!tenant) return;
    applyBrandColors({
      primary: tenant.primaryColor,
      secondary: tenant.secondaryColor,
      accent: tenant.accentColor,
    });
  }, [tenant]);

  return null;
}

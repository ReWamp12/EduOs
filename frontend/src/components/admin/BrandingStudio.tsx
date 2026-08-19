'use client';

import React, { useState } from 'react';
import { Palette, Check, Eye, RotateCcw } from 'lucide-react';
import { dataService } from '@/lib/dataService';
import { PageHeader, SectionCard, Badge } from '@/components/ui';
import { toast } from '@/components/ui/toast';

const DEFAULTS = { primary: '#4F46E5', secondary: '#06B6D4', accent: '#F59E0B', name: 'Apex Institute of Science' };

export const BrandingStudio: React.FC = () => {
  const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primary);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULTS.secondary);
  const [accentColor, setAccentColor] = useState(DEFAULTS.accent);
  const [appName, setAppName] = useState(DEFAULTS.name);
  const [saving, setSaving] = useState(false);

  const applyTokens = (p: string, s: string, a: string) => {
    // White-label runtime theming — updates the live CSS custom properties the
    // entire app reads. Must be preserved: this is how tenant branding applies
    // instantly with no rebuild.
    const root = document.documentElement;
    root.style.setProperty('--primary', p);
    root.style.setProperty('--secondary', s);
    root.style.setProperty('--accent', a);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dataService.updateTenantBranding('t-1', {
        name: appName,
        primaryColor,
        secondaryColor,
        accentColor,
      });
      applyTokens(primaryColor, secondaryColor, accentColor);
      toast('Branding applied', 'success', 'Theme tokens saved and applied live across the workspace.');
    } catch (e) {
      console.error(e);
      toast('Could not save branding', 'error', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrimaryColor(DEFAULTS.primary);
    setSecondaryColor(DEFAULTS.secondary);
    setAccentColor(DEFAULTS.accent);
    setAppName(DEFAULTS.name);
    applyTokens(DEFAULTS.primary, DEFAULTS.secondary, DEFAULTS.accent);
    toast('Reset to defaults', 'info');
  };

  const colorFields: { label: string; value: string; set: (v: string) => void }[] = [
    { label: 'Primary', value: primaryColor, set: setPrimaryColor },
    { label: 'Secondary', value: secondaryColor, set: setSecondaryColor },
    { label: 'Accent', value: accentColor, set: setAccentColor },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary">
              <Palette size={18} />
            </span>
            White-Label Branding Studio
          </span>
        }
        subtitle="Live runtime theme generator — zero-rebuild dynamic styling per tenant."
        actions={
          <>
            <button onClick={handleReset} className="btn-secondary">
              <RotateCcw size={15} /> Reset
            </button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              <Check size={16} /> {saving ? 'Applying…' : 'Save & apply'}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* Editor */}
        <SectionCard title="Brand identity & colors" bodyClassName="flex flex-col gap-5">
          <div>
            <label className="label" htmlFor="brand-name">Institution display name</label>
            <input
              id="brand-name"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {colorFields.map((f) => (
              <div key={f.label}>
                <label className="label">{f.label} color</label>
                <div className="flex items-center gap-2.5 rounded-md border border-border-strong bg-surface p-2">
                  <input
                    type="color"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
                    aria-label={`${f.label} color`}
                  />
                  <code className="text-meta font-medium uppercase text-text-secondary">{f.value}</code>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-info/20 bg-info-soft p-3.5 text-meta text-info-foreground">
            These values map to the semantic <code className="font-semibold">--primary</code>,{' '}
            <code className="font-semibold">--secondary</code> and <code className="font-semibold">--accent</code> tokens.
            Saving updates them live for every screen in this tenant.
          </div>
        </SectionCard>

        {/* Live preview */}
        <SectionCard
          title="Live rendering preview"
          icon={<Eye size={18} />}
          bodyClassName="flex flex-col gap-4"
        >
          <div className="rounded-lg border border-border bg-surface-muted p-5">
            <div className="flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-md text-lg font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {appName.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-section text-foreground">{appName || 'Institution name'}</div>
                <div className="text-micro text-text-tertiary">Student & Faculty Portal</div>
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-md py-2.5 text-meta font-semibold text-white shadow-xs"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              Primary branded button
            </button>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-micro font-semibold"
                style={{
                  background: `${accentColor}1f`,
                  color: accentColor,
                  border: `1px solid ${accentColor}3d`,
                }}
              >
                Accent tag
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-micro font-semibold"
                style={{ background: `${primaryColor}14`, color: primaryColor, border: `1px solid ${primaryColor}33` }}
              >
                Primary chip
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-micro font-semibold"
                style={{ background: `${secondaryColor}14`, color: secondaryColor, border: `1px solid ${secondaryColor}33` }}
              >
                Secondary chip
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-micro text-text-tertiary">
            <Badge tone="success">Live</Badge>
            Preview reflects unsaved changes. Click “Save & apply” to push tokens tenant-wide.
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

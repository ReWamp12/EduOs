'use client';

import React, { useState } from 'react';
import { Palette, Check, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { dataService } from '@/lib/dataService';

export const BrandingStudio: React.FC = () => {
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState('#06B6D4');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [appName, setAppName] = useState('Apex Institute of Science');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save variables in runtime database
      await dataService.updateTenantBranding('t-1', {
        name: appName,
        primaryColor,
        secondaryColor,
        accentColor,
      });

      // Update CSS custom properties dynamically at runtime!
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.documentElement.style.setProperty('--secondary', secondaryColor);
      document.documentElement.style.setProperty('--accent', accentColor);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette size={24} color="#F59E0B" /> White-Label Branding Studio
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Live runtime theme generator &bull; Zero code-rebuild dynamic styling
          </p>
        </div>

        <button onClick={handleSave} className="btn-primary" style={{ fontSize: '0.85rem' }} disabled={saving}>
          <Check size={16} /> {saving ? 'Applying Tokens...' : 'Save & Apply Live Tokens'}
        </button>
      </div>

      {saved && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
        }}>
          <Check size={18} /> Theme variables applied instantly and saved to database!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Editor Controls */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Brand Identity &amp; Colors</h3>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>INSTITUTION DISPLAY NAME</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: '6px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRIMARY COLOR</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: '42px', height: '42px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <code style={{ fontSize: '0.85rem' }}>{primaryColor}</code>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>SECONDARY COLOR</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{ width: '42px', height: '42px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <code style={{ fontSize: '0.85rem' }}>{secondaryColor}</code>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACCENT COLOR</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ width: '42px', height: '42px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <code style={{ fontSize: '0.85rem' }}>{accentColor}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Live Portal Rendering Preview</h3>
          </div>

          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#fff',
              }}>
                A
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{appName}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Student &amp; Faculty Portal</div>
              </div>
            </div>

            <button style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}>
              Primary Branded Button
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                background: `${accentColor}22`,
                color: accentColor,
                border: `1px solid ${accentColor}44`,
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                Accent Badge Tag
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

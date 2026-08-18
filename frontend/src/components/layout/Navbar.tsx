'use client';

import React from 'react';
import { UserRole } from '@/lib/types';
import { mockTenant, mockProfiles } from '@/lib/mockData';
import { 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Crown, 
  Bell, 
  Search, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeRole, setActiveRole, activeTab }) => {
  const currentProfile = mockProfiles[activeRole];

  const roleConfigs: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { role: 'student', label: 'Student', icon: <GraduationCap size={16} />, color: '#4F46E5' },
    { role: 'parent', label: 'Parent', icon: <Users size={16} />, color: '#EC4899' },
    { role: 'teacher', label: 'Teacher', icon: <Users size={16} />, color: '#06B6D4' },
    { role: 'principal', label: 'Principal', icon: <ShieldCheck size={16} />, color: '#10B981' },
    { role: 'super_admin', label: 'Admin', icon: <Crown size={16} />, color: '#F59E0B' },
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: Tenant Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: '1.2rem',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
        }}>
          A
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {mockTenant.name}
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              Coaching Edition
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {mockTenant.tagline}
          </span>
        </div>
      </div>

      {/* Center: Live Bottom-Up Role Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '4px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        gap: '4px',
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Sparkles size={13} color="#F59E0B" /> Bottom-Up View:
        </div>
        {roleConfigs.map((item) => {
          const isActive = activeRole === item.role;
          return (
            <button
              key={item.role}
              onClick={() => setActiveRole(item.role)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? item.color : 'transparent',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 2px 8px ${item.color}66` : 'none',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right: Quick actions & user profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notification Bell */}
        <button style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '8px',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--danger)',
            boxShadow: '0 0 6px var(--danger)',
          }} />
        </button>

        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 10px 4px 4px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
        }}>
          <img
            src={currentProfile.avatarUrl}
            alt={currentProfile.firstName}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--primary)',
            }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentProfile.firstName} {currentProfile.lastName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {currentProfile.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

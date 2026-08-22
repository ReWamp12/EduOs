'use client';

import React, { useState } from 'react';
import { mockParentAINarrative } from '@/lib/mockData';
import { Card, SectionCard, StatCard, Badge, PageHeader, ProgressBar, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Download,
  MessageCircle,
  CalendarCheck,
  Brain,
  ShieldCheck,
  Target,
  Zap,
  Layers,
  ChevronRight,
  Bot,
} from 'lucide-react';

type Lang = 'english' | 'hindi';

export const ParentAIReport: React.FC = () => {
  const [lang, setLang] = useState<Lang>('english');
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
  const narrative = mockParentAINarrative;

  const handleDownloadPdf = () => {
    toast('Report Generating', 'info', `${narrative.studentName}'s Comprehensive AI Diagnostic Card · PDF downloading...`);
  };

  const handleWhatsAppVoice = () => {
    setIsSynthesizingVoice(true);
    setTimeout(() => {
      setIsSynthesizingVoice(false);
      toast(
        'Voice Summary Sent',
        'success',
        `${lang === 'english' ? 'English' : 'Hindi'} AI Audio Voice note synthesized and dispatched to your registered WhatsApp number (+91 98111 22334).`,
      );
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Flagged Feature Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-primary/20 bg-gradient-to-r from-primary-soft/40 via-surface to-secondary-soft/30 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-xs">
            <Sparkles size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-section font-semibold text-foreground">AI Progress Narrative</span>
              <span className="rounded-md bg-gradient-to-r from-primary to-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                AI Pro Flagged
              </span>
            </div>
            <p className="text-micro text-text-secondary">
              Real-time cognitive learning diagnostic powered by CBSE Bloom Taxonomy Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="success" className="gap-1">
            <ShieldCheck size={13} /> Active Feature Flag
          </Badge>
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-2xs">
            {(['english', 'hindi'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'rounded-md px-3 py-1 text-meta font-medium transition-colors',
                  lang === l
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-text-secondary hover:bg-muted',
                )}
                aria-pressed={lang === l}
              >
                {l === 'english' ? 'English' : 'हिंदी (Hindi)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Supporting metric tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mock Trajectory"
          value="72%"
          icon={<TrendingUp size={16} />}
          tone="success"
          trend={{ value: '+8.0%', direction: 'up' }}
          hint="64% → 68% → 72% across term"
        />
        <StatCard
          label="Mathematics Average"
          value="78%"
          icon={<CheckCircle2 size={16} />}
          tone="primary"
          hint="Strongest subject (Calculus)"
        />
        <StatCard
          label="Physics (Rotational)"
          value="56%"
          icon={<AlertCircle size={16} />}
          tone="warning"
          hint="Targeted remedial session allocated"
        />
        <StatCard
          label="Overall Attendance"
          value="94.2%"
          icon={<CalendarCheck size={16} />}
          tone="info"
          hint="Class average: 88.4%"
        />
      </div>

      {/* Personalized AI Narrative Box */}
      <SectionCard
        title="Personalized Cognitive Summary"
        icon={<Brain size={18} />}
        action={
          <div className="flex items-center gap-2">
            <span className="text-micro text-text-tertiary">Diagnostic Model:</span>
            <Badge tone="primary">EduOS-Cognitive-v2.5</Badge>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Trajectory banner */}
          <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary-soft/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="text-micro font-medium text-text-tertiary">3-Test Performance Trajectory</div>
                <div className="inline-flex items-center gap-2 text-meta font-bold text-foreground">
                  64% → 68% → 72% <span className="text-success font-semibold">(+8.0% Net Improvement)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-micro text-text-secondary">Predicted Board Score:</span>
              <span className="rounded-md bg-surface px-2.5 py-1 text-meta font-mono font-bold text-primary border border-border">
                88.5% - 92.0%
              </span>
            </div>
          </div>

          {/* Narrative text block */}
          <blockquote className="rounded-xl border border-border/80 bg-surface-muted/60 p-5 text-body leading-relaxed text-foreground shadow-2xs font-normal">
            &ldquo;{narrative[lang]}&rdquo;
          </blockquote>

          {/* Strengths / Remedial Focus */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-success/30 bg-success-soft/30 p-4">
              <div className="inline-flex items-center gap-1.5 text-meta font-semibold text-success-foreground">
                <CheckCircle2 size={16} className="text-success" /> Key Strengths & Concepts Mastered
              </div>
              <p className="mt-2 text-meta leading-relaxed text-text-secondary">
                Calculus conceptual derivation, inorganic chemistry retention, and consistent daily homework submission without missing deadlines.
              </p>
            </div>

            <div className="rounded-xl border border-warning/30 bg-warning-soft/30 p-4">
              <div className="inline-flex items-center gap-1.5 text-meta font-semibold text-warning-foreground">
                <AlertCircle size={16} className="text-warning" /> Recommended Immediate Focus Area
              </div>
              <p className="mt-2 text-meta leading-relaxed text-text-secondary">
                Physics application calculation speed under timed pressure (moment-of-inertia numerical integration and Lenz&apos;s law vector diagrams).
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 text-micro text-text-tertiary">
              <Bot size={14} className="text-primary" />
              Verified by Class Teacher: <strong>Prof. Amit Verma</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleWhatsAppVoice}
                disabled={isSynthesizingVoice}
                className="btn-secondary gap-1.5"
              >
                <MessageCircle size={16} className="text-success" />
                {isSynthesizingVoice ? 'Synthesizing...' : 'Get WhatsApp Voice Note'}
              </button>
              <button onClick={handleDownloadPdf} className="btn-primary gap-1.5">
                <Download size={16} /> Download Official PDF Report
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

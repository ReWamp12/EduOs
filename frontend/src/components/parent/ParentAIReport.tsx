'use client';

import React, { useState, useEffect } from 'react';
import { dataService } from '@/lib/dataService';
import { Student } from '@/lib/types';
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
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    let active = true;
    dataService.getParentChildren().then((kids) => {
      if (!active) return;
      if (kids && kids.length > 0) {
        setChildren(kids);
        setSelectedChildId(kids[0].id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const activeChild = children.find((c) => c.id === selectedChildId) || children[0];
  const childName = activeChild?.name || 'Student';
  const attendanceDisplay = `${Math.round(activeChild?.attendancePct || 94.2)}%`;

  const narrativeText = {
    english: `${childName} has demonstrated steady academic growth across the current evaluation term, maintaining an attendance record of ${attendanceDisplay}. Mathematics and conceptual problem solving remain strong competencies, while speed in numerical physics integration is targeted for revision prior to pre-board exams.`,
    hindi: `${childName} ने वर्तमान मूल्यांकन सत्र में निरंतर शैक्षणिक प्रगति दिखाई है और ${attendanceDisplay} उपस्थिति बनाए रखी है। गणित और अवधारणात्मक समस्या समाधान में प्रदर्शन उत्कृष्ट है, जबकि भौतिकी संख्यात्मक अभ्यास में गति सुधार के लिए विशेष अभ्यास की सिफारिश की गई है।`,
  };

  const handleDownloadPdf = () => {
    toast('Report Generating', 'info', `${childName}'s Comprehensive AI Diagnostic Card · PDF downloading...`);
  };

  const handleWhatsAppVoice = () => {
    setIsSynthesizingVoice(true);
    setTimeout(() => {
      setIsSynthesizingVoice(false);
      toast(
        'Voice Summary Sent',
        'success',
        `${lang === 'english' ? 'English' : 'Hindi'} AI Audio Voice note synthesized and dispatched to your registered WhatsApp number.`,
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
                AI Diagnostic
              </span>
            </div>
            <p className="text-micro text-text-secondary">
              Real-time cognitive learning diagnostic for <strong className="text-foreground">{childName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {children.length > 1 && (
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-2xs mr-2">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildId(c.id)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-meta font-medium transition-colors',
                    selectedChildId === c.id
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-text-secondary hover:bg-muted',
                  )}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
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
          label="Overall Attendance"
          value={attendanceDisplay}
          icon={<CalendarCheck size={16} />}
          tone="success"
          hint="CBSE minimum: 75%"
        />
        <StatCard
          label="Target Examination"
          value={activeChild?.targetExam || 'CBSE 2026'}
          icon={<Target size={16} />}
          tone="primary"
          hint={activeChild?.batchName || 'Class 10'}
        />
        <StatCard
          label="Performance Trajectory"
          value="74%"
          icon={<TrendingUp size={16} />}
          tone="success"
          trend={{ value: '+8.0%', direction: 'up' }}
          hint="Across unit assessments"
        />
        <StatCard
          label="Diagnostic Status"
          value="On Track"
          icon={<CheckCircle2 size={16} />}
          tone="info"
          hint="Verified by Class Faculty"
        />
      </div>

      {/* Personalized AI Narrative Box */}
      <SectionCard
        title={`Personalized Cognitive Summary for ${childName}`}
        icon={<Brain size={18} />}
        action={
          <div className="flex items-center gap-2">
            <span className="text-micro text-text-tertiary">Diagnostic Model:</span>
            <Badge tone="primary">EduOS-Cognitive-v2.5</Badge>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Narrative text block */}
          <blockquote className="rounded-xl border border-border/80 bg-surface-muted/60 p-5 text-body leading-relaxed text-foreground shadow-2xs font-normal">
            &ldquo;{narrativeText[lang]}&rdquo;
          </blockquote>

          {/* Strengths / Remedial Focus */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-success/30 bg-success-soft/30 p-4">
              <div className="inline-flex items-center gap-1.5 text-meta font-semibold text-success-foreground">
                <CheckCircle2 size={16} className="text-success" /> Key Strengths & Concepts Mastered
              </div>
              <p className="mt-2 text-meta leading-relaxed text-text-secondary">
                Calculus conceptual derivation, structured assignment submissions, and consistent attendance.
              </p>
            </div>

            <div className="rounded-xl border border-warning/30 bg-warning-soft/30 p-4">
              <div className="inline-flex items-center gap-1.5 text-meta font-semibold text-warning-foreground">
                <AlertCircle size={16} className="text-warning" /> Recommended Immediate Focus Area
              </div>
              <p className="mt-2 text-meta leading-relaxed text-text-secondary">
                Physics calculation speed under timed examination pressure and step-by-step diagram labeling.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 text-micro text-text-tertiary">
              <Bot size={14} className="text-primary" />
              Verified by Faculty Mentors
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

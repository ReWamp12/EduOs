'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { SyllabusChapter, SyllabusTopic, LearningMaterial, TopicStatus, MaterialType } from '@/lib/types';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Video,
  StickyNote,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
  BarChart3,
  Eye,
  X,
} from 'lucide-react';
import { PageHeader, StatCard, Badge, ProgressBar, cn } from '@/components/ui';

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

const DEFAULT_STUDENT_SUBJECTS: SubjectOption[] = [
  { id: 'a6000000-0000-0000-0000-000000000001', name: 'Mathematics', code: 'MATH-10' },
  { id: 'a6000000-0000-0000-0000-000000000002', name: 'Physics', code: 'PHY-10' },
  { id: 'a6000000-0000-0000-0000-000000000003', name: 'Chemistry', code: 'CHEM-10' },
  { id: 'a6000000-0000-0000-0000-000000000004', name: 'Biology', code: 'BIO-10' },
  { id: 'a6000000-0000-0000-0000-000000000005', name: 'Computer Science', code: 'CS-10' },
];

interface StudentSyllabusProps {
  onNavigate?: (tab: string) => void;
}

export const StudentSyllabus: React.FC<StudentSyllabusProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const [subjects] = useState<SubjectOption[]>(DEFAULT_STUDENT_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(DEFAULT_STUDENT_SUBJECTS[0].id);
  const [chapters, setChapters] = useState<SyllabusChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);

  // Batch ID for Class 10
  const studentBatchId = 'a5000000-0000-0000-0000-000000000001';

  const loadSyllabus = async () => {
    setLoading(true);
    try {
      const data = await dataService.getSyllabus(studentBatchId, selectedSubjectId, session?.tenantId);
      setChapters(data);
      const exp: Record<string, boolean> = {};
      data.forEach((c) => {
        exp[c.id] = true;
      });
      setExpandedChapters(exp);
    } catch (e) {
      console.warn('[StudentSyllabus] error loading syllabus:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyllabus();
  }, [selectedSubjectId, session?.tenantId]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0],
    [subjects, selectedSubjectId]
  );

  const allTopics = useMemo(() => chapters.flatMap((c) => c.topics), [chapters]);
  const allMaterials = useMemo(() => {
    const list: LearningMaterial[] = [];
    chapters.forEach((c) => {
      if (c.materials) list.push(...c.materials);
      c.topics.forEach((t) => {
        if (t.materials) list.push(...t.materials);
      });
    });
    return list;
  }, [chapters]);

  const completedTopicsCount = allTopics.filter((t) => t.status === 'completed').length;
  const inProgressTopicsCount = allTopics.filter((t) => t.status === 'in_progress').length;
  const totalTopicsCount = allTopics.length;
  const syllabusProgressPct =
    totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  const toggleChapter = (chId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));
  };

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
      case 'in_progress':
        return <Clock size={16} className="text-amber-500 shrink-0 animate-pulse" />;
      default:
        return <div className="h-3.5 w-3.5 rounded-full border-2 border-text-tertiary shrink-0" />;
    }
  };

  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case 'pdf':
        return <FileText size={13} className="text-rose-500" />;
      case 'video':
        return <Video size={13} className="text-blue-500" />;
      case 'notes':
        return <StickyNote size={13} className="text-amber-500" />;
      default:
        return <ExternalLink size={13} className="text-emerald-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="My Syllabus & Learning Portal"
        subtitle="Track your academic course milestones, access notes, and prepare for upcoming tests."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5">
              <BookOpen size={15} className="text-primary" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-hidden cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('performance')}
                className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
              >
                <BarChart3 size={14} /> My Performance
              </button>
            )}
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Syllabus Progress"
          value={<>{syllabusProgressPct}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone={syllabusProgressPct >= 50 ? 'success' : 'primary'}
          icon={<CheckCircle2 size={16} />}
          hint={`${completedTopicsCount} of ${totalTopicsCount} topics finished`}
        />
        <StatCard
          label="Currently Learning"
          value={<>{inProgressTopicsCount}<span className="text-base font-medium text-text-tertiary"> topics</span></>}
          tone="info"
          icon={<Clock size={16} />}
          hint="Topics being taught this week"
        />
        <StatCard
          label="Study Materials"
          value={<>{allMaterials.length}<span className="text-base font-medium text-text-tertiary"> resources</span></>}
          tone="primary"
          icon={<Layers size={16} />}
          hint="Verified PDF notes, links & handouts"
        />
      </div>

      {/* Progress Bar Card */}
      <div className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span>{selectedSubject.name} — Academic Completion</span>
          </span>
          <span className="font-mono text-primary font-bold">{syllabusProgressPct}% Finished</span>
        </div>
        <ProgressBar value={syllabusProgressPct} tone={syllabusProgressPct >= 75 ? 'success' : 'primary'} />
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-12 rounded-xl border border-border bg-surface flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-text-secondary">Loading your syllabus topics...</p>
        </div>
      ) : chapters.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-border bg-surface text-center space-y-3">
          <AlertCircle size={36} className="mx-auto text-text-tertiary" />
          <h3 className="font-bold text-foreground">No Topics Found</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Your teacher has not yet posted chapters for {selectedSubject.name}. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const isExpanded = expandedChapters[chapter.id] ?? true;
            const completedCount = chapter.topics.filter((t) => t.status === 'completed').length;
            const totalCount = chapter.topics.length;
            const chapterPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div key={chapter.id} className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
                {/* Chapter Header */}
                <div
                  onClick={() => toggleChapter(chapter.id)}
                  className="p-4 bg-muted/15 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-text-tertiary shrink-0" />
                    ) : (
                      <ChevronRight size={18} className="text-text-tertiary shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          Chapter {chapter.chapterNumber}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                          {chapter.title}
                        </h3>
                      </div>
                      {chapter.description && (
                        <p className="text-xs text-text-secondary mt-0.5">{chapter.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline text-xs text-text-tertiary font-mono">
                      {completedCount}/{totalCount} topics
                    </span>
                    <Badge tone={chapterPct === 100 ? 'success' : chapterPct > 0 ? 'primary' : 'neutral'}>
                      {chapterPct}%
                    </Badge>
                  </div>
                </div>

                {/* Topics & Learning Materials */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-border space-y-3 bg-surface">
                    <div className="grid grid-cols-1 gap-2.5">
                      {chapter.topics.map((topic) => (
                        <div
                          key={topic.id}
                          className={cn(
                            'p-3.5 rounded-lg border transition-all flex flex-col gap-2.5',
                            topic.status === 'completed'
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : topic.status === 'in_progress'
                              ? 'border-amber-500/25 bg-amber-500/5'
                              : 'border-border bg-surface'
                          )}
                        >
                          <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div className="mt-0.5 sm:mt-0">{getStatusIcon(topic.status)}</div>
                              <div className="min-w-0">
                                <span
                                  className={cn(
                                    'text-sm font-semibold text-foreground',
                                    topic.status === 'completed' && 'line-through text-text-secondary'
                                  )}
                                >
                                  {topic.title}
                                </span>
                                {topic.description && (
                                  <p className="text-xs text-text-secondary mt-0.5">{topic.description}</p>
                                )}
                              </div>
                            </div>

                            <Badge
                              tone={
                                topic.status === 'completed'
                                  ? 'success'
                                  : topic.status === 'in_progress'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              className="text-[10px] shrink-0"
                            >
                              {topic.status === 'completed'
                                ? 'Completed ✓'
                                : topic.status === 'in_progress'
                                ? 'Learning Now ◐'
                                : 'Upcoming ○'}
                            </Badge>
                          </div>

                          {/* Learning Materials Attached */}
                          {topic.materials && topic.materials.length > 0 && (
                            <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                                Resources:
                              </span>
                              {topic.materials.map((mat) => (
                                <button
                                  key={mat.id}
                                  onClick={() => setViewingMaterial(mat)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/40 border border-border text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all group"
                                >
                                  {getMaterialIcon(mat.materialType)}
                                  <span className="truncate max-w-[220px]">{mat.title}</span>
                                  <Eye size={12} className="text-text-tertiary group-hover:text-primary" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Interactive Material Previewer for Students */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getMaterialIcon(viewingMaterial.materialType)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">{viewingMaterial.title}</h3>
                  <p className="text-xs text-text-secondary">
                    Provided by {viewingMaterial.authorName || 'Class Teacher'} · {viewingMaterial.fileSize}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingMaterial(null)}
                className="rounded-md p-1.5 hover:bg-muted text-text-tertiary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-6 flex flex-col items-center justify-center text-center space-y-3">
              {viewingMaterial.materialType === 'video' ? (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <Video size={28} />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">Class Video Lesson</h4>
                  <p className="text-xs text-text-secondary max-w-sm">
                    Watch the full topic recording explaining key concepts and solved examples.
                  </p>
                  <a
                    href={viewingMaterial.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} /> Watch Video
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                    <FileText size={28} />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">{viewingMaterial.title}</h4>
                  <p className="text-xs text-text-secondary max-w-sm">
                    Class notes, summary formulas, and textbook solutions attached for your study.
                  </p>
                  <a
                    href={viewingMaterial.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs inline-flex items-center gap-1.5"
                  >
                    <Download size={13} /> Download / Open Document
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-border">
              <button
                onClick={() => setViewingMaterial(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

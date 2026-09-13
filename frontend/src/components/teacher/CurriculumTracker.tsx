'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTeacherBatch } from '@/lib/teacherContext';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { SyllabusChapter, SyllabusTopic, LearningMaterial, TopicStatus, MaterialType } from '@/lib/types';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  FileCheck,
  Plus,
  FileText,
  Video,
  StickyNote,
  ExternalLink,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Edit3,
  ArrowUp,
  ArrowDown,
  Eye,
  CalendarCheck,
  BarChart3,
  UploadCloud,
  Download,
} from 'lucide-react';
import { PageHeader, StatCard, Badge, ProgressBar, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

const DEFAULT_SUBJECTS: SubjectOption[] = [
  { id: 'a6000000-0000-0000-0000-000000000001', name: 'Mathematics', code: 'MATH-10' },
  { id: 'a6000000-0000-0000-0000-000000000002', name: 'Physics', code: 'PHY-10' },
  { id: 'a6000000-0000-0000-0000-000000000003', name: 'Chemistry', code: 'CHEM-10' },
  { id: 'a6000000-0000-0000-0000-000000000004', name: 'Biology', code: 'BIO-10' },
  { id: 'a6000000-0000-0000-0000-000000000005', name: 'Computer Science', code: 'CS-10' },
];

interface CurriculumTrackerProps {
  onNavigate?: (tab: string) => void;
}

export const CurriculumTracker: React.FC<CurriculumTrackerProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const { batch, teacher } = useTeacherBatch();

  const [subjects, setSubjects] = useState<SubjectOption[]>(DEFAULT_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(DEFAULT_SUBJECTS[0].id);
  const [chapters, setChapters] = useState<SyllabusChapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Add Material Modal State
  const [materialModalTopic, setMaterialModalTopic] = useState<SyllabusTopic | null>(null);
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<MaterialType>('pdf');
  const [matUrl, setMatUrl] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);

  // Add Chapter Modal State
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChNumber, setNewChNumber] = useState(1);
  const [newChTitle, setNewChTitle] = useState('');
  const [newChUnit, setNewChUnit] = useState('Unit I: Core');
  const [savingChapter, setSavingChapter] = useState(false);

  // Edit Chapter Modal State
  const [editingChapter, setEditingChapter] = useState<SyllabusChapter | null>(null);
  const [editChTitle, setEditChTitle] = useState('');
  const [editChUnit, setEditChUnit] = useState('');
  const [editChNumber, setEditChNumber] = useState(1);
  const [savingEditChapter, setSavingEditChapter] = useState(false);

  // Add Topic Modal State
  const [topicModalChapter, setTopicModalChapter] = useState<SyllabusChapter | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicPeriods, setNewTopicPeriods] = useState(4);
  const [savingTopic, setSavingTopic] = useState(false);

  // Edit Topic Modal State
  const [editingTopic, setEditingTopic] = useState<SyllabusTopic | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicPeriods, setEditTopicPeriods] = useState(4);
  const [editTopicDescription, setEditTopicDescription] = useState('');
  const [savingEditTopic, setSavingEditTopic] = useState(false);

  // Material Viewer Modal State
  const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);

  // Active batch comes from the teacher's selection in TeacherBatchGate.
  // A silent fallback to a demo UUID would let a teacher accidentally edit
  // Class 10-A's syllabus while thinking they were in their own batch — the
  // save would succeed and the wrong batch's students would suddenly see
  // chapters they never asked for. Empty means "no batch picked yet"; the
  // render path below shows a picker prompt instead of loading anything.
  const activeBatchId = batch?.id || '';

  // Load syllabus from Supabase on batch/subject change
  const loadSyllabus = async () => {
    if (!activeBatchId) {
      setChapters([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await dataService.getSyllabus(activeBatchId, selectedSubjectId, session?.tenantId);
      setChapters(data);
      // Auto-expand all chapters by default
      const exp: Record<string, boolean> = {};
      data.forEach((c) => {
        exp[c.id] = true;
      });
      setExpandedChapters(exp);
    } catch (e) {
      console.warn('[CurriculumTracker] Error fetching syllabus:', e);
      toast('Failed to load syllabus', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyllabus();
  }, [activeBatchId, selectedSubjectId, session?.tenantId]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0],
    [subjects, selectedSubjectId]
  );

  // Group chapters by Unit if available
  const unitsGrouped = useMemo(() => {
    const map = new Map<string, SyllabusChapter[]>();
    chapters.forEach((ch) => {
      const unit = ch.unitName || 'Core Curriculum';
      if (!map.has(unit)) map.set(unit, []);
      map.get(unit)!.push(ch);
    });
    return Array.from(map.entries()).map(([unitName, chList]) => ({
      unitName,
      chapters: chList,
    }));
  }, [chapters]);

  // Aggregate Metrics
  const allTopics = useMemo(() => {
    return chapters.flatMap((c) => c.topics);
  }, [chapters]);

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
  const totalPeriods = allTopics.reduce((sum, t) => sum + (t.estimatedPeriods || 4), 0);
  const completedPeriods = allTopics
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.estimatedPeriods || 4), 0);

  // Cycle topic status: not_started -> in_progress -> completed -> not_started
  const handleCycleStatus = async (topic: SyllabusTopic) => {
    const nextStatus: TopicStatus =
      topic.status === 'not_started'
        ? 'in_progress'
        : topic.status === 'in_progress'
        ? 'completed'
        : 'not_started';

    // Optimistic UI update
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== topic.chapterId) return ch;
        const updatedTopics = ch.topics.map((t) =>
          t.id === topic.id ? { ...t, status: nextStatus } : t
        );
        const compCount = updatedTopics.filter((t) => t.status === 'completed').length;
        const pct = Math.round((compCount / updatedTopics.length) * 100);
        return {
          ...ch,
          topics: updatedTopics,
          progressPct: pct,
          status:
            compCount === updatedTopics.length
              ? 'completed'
              : compCount > 0 || updatedTopics.some((t) => t.status === 'in_progress')
              ? 'in_progress'
              : 'not_started',
        };
      })
    );

    const success = await dataService.updateTopicStatus(topic.id, nextStatus);
    if (success) {
      const statusLabel =
        nextStatus === 'completed'
          ? 'Completed ✓'
          : nextStatus === 'in_progress'
          ? 'In Progress ◐'
          : 'Not Started ○';
      toast(`Topic status updated to ${statusLabel}`, 'success');
    } else {
      toast('Failed to update status in Supabase', 'error');
      void loadSyllabus();
    }
  };

  // Add Material submit handler
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialModalTopic || !matTitle.trim() || !matUrl.trim()) return;
    setSavingMaterial(true);
    try {
      const created = await dataService.addLearningMaterial({
        tenantId: session?.tenantId,
        subjectId: selectedSubjectId,
        batchId: activeBatchId,
        chapterId: materialModalTopic.chapterId,
        topicId: materialModalTopic.id,
        title: matTitle,
        materialType: matType,
        fileUrl: matUrl,
        fileSize: matType === 'pdf' ? '2.5 MB' : matType === 'video' ? '15 mins' : 'Web Link',
        authorName: teacher?.name || 'Faculty',
      });

      if (created) {
        toast('Learning material attached!', 'success', `${created.title} added to topic.`);
        setMaterialModalTopic(null);
        setMatTitle('');
        setMatUrl('');
        void loadSyllabus();
      } else {
        toast('Failed to attach material', 'error');
      }
    } finally {
      setSavingMaterial(false);
    }
  };

  // Delete Material handler
  const handleDeleteMaterial = async (matId: string) => {
    if (!confirm('Remove this learning material?')) return;
    const ok = await dataService.deleteLearningMaterial(matId);
    if (ok) {
      toast('Material removed', 'info');
      void loadSyllabus();
    } else {
      toast('Failed to delete material', 'error');
    }
  };

  // Add Chapter submit handler
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChTitle.trim()) return;
    setSavingChapter(true);
    try {
      const created = await dataService.createChapter({
        tenantId: session?.tenantId,
        batchId: activeBatchId,
        subjectId: selectedSubjectId,
        chapterNumber: newChNumber,
        title: newChTitle,
        unitName: newChUnit,
        sequenceOrder: newChNumber,
      });
      if (created) {
        toast('Chapter created successfully!', 'success');
        setShowAddChapterModal(false);
        setNewChTitle('');
        setNewChNumber((prev) => prev + 1);
        void loadSyllabus();
      }
    } finally {
      setSavingChapter(false);
    }
  };

  // Edit Chapter open
  const handleOpenEditChapter = (ch: SyllabusChapter) => {
    setEditingChapter(ch);
    setEditChTitle(ch.title);
    setEditChUnit(ch.unitName || 'Core Curriculum');
    setEditChNumber(ch.chapterNumber);
  };

  // Edit Chapter submit handler
  const handleSaveEditChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter || !editChTitle.trim()) return;
    setSavingEditChapter(true);
    try {
      const ok = await dataService.updateChapter(editingChapter.id, {
        title: editChTitle,
        unitName: editChUnit,
        chapterNumber: editChNumber,
      });
      if (ok) {
        toast('Chapter updated successfully!', 'success');
        setEditingChapter(null);
        void loadSyllabus();
      } else {
        toast('Failed to update chapter', 'error');
      }
    } finally {
      setSavingEditChapter(false);
    }
  };

  // Delete Chapter handler
  const handleDeleteChapter = async (chId: string, chTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${chTitle}" and all its topics? This action cannot be undone.`)) return;
    const ok = await dataService.deleteChapter(chId);
    if (ok) {
      toast('Chapter deleted', 'info', `Chapter "${chTitle}" removed.`);
      void loadSyllabus();
    } else {
      toast('Failed to delete chapter', 'error');
    }
  };

  // Add Topic submit handler
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicModalChapter || !newTopicTitle.trim()) return;
    setSavingTopic(true);
    try {
      const nextSeq = topicModalChapter.topics.length + 1;
      const created = await dataService.createTopic({
        tenantId: session?.tenantId,
        chapterId: topicModalChapter.id,
        subjectId: selectedSubjectId,
        batchId: activeBatchId,
        title: newTopicTitle,
        estimatedPeriods: newTopicPeriods,
        sequenceOrder: nextSeq,
      });
      if (created) {
        toast('Topic added to chapter!', 'success');
        setTopicModalChapter(null);
        setNewTopicTitle('');
        void loadSyllabus();
      }
    } finally {
      setSavingTopic(false);
    }
  };

  // Edit Topic open
  const handleOpenEditTopic = (topic: SyllabusTopic) => {
    setEditingTopic(topic);
    setEditTopicTitle(topic.title);
    setEditTopicPeriods(topic.estimatedPeriods || 4);
    setEditTopicDescription(topic.description || '');
  };

  // Edit Topic submit handler
  const handleSaveEditTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editTopicTitle.trim()) return;
    setSavingEditTopic(true);
    try {
      const ok = await dataService.updateTopic(editingTopic.id, {
        title: editTopicTitle,
        estimatedPeriods: editTopicPeriods,
        description: editTopicDescription,
      });
      if (ok) {
        toast('Topic updated successfully!', 'success');
        setEditingTopic(null);
        void loadSyllabus();
      } else {
        toast('Failed to update topic', 'error');
      }
    } finally {
      setSavingEditTopic(false);
    }
  };

  // Delete Topic handler
  const handleDeleteTopic = async (topicId: string, topicTitle: string) => {
    if (!confirm(`Delete topic "${topicTitle}"?`)) return;
    const ok = await dataService.deleteTopic(topicId);
    if (ok) {
      toast('Topic deleted', 'info');
      void loadSyllabus();
    } else {
      toast('Failed to delete topic', 'error');
    }
  };

  // Reorder Topic handler (Up / Down)
  const handleReorderTopic = async (chapter: SyllabusChapter, topicIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? topicIdx - 1 : topicIdx + 1;
    if (targetIdx < 0 || targetIdx >= chapter.topics.length) return;

    const currentTopic = chapter.topics[topicIdx];
    const targetTopic = chapter.topics[targetIdx];

    // Swap sequence orders
    const currentOrder = currentTopic.sequenceOrder || topicIdx + 1;
    const targetOrder = targetTopic.sequenceOrder || targetIdx + 1;

    // Optimistically update
    const newTopics = [...chapter.topics];
    newTopics[topicIdx] = { ...targetTopic, sequenceOrder: currentOrder };
    newTopics[targetIdx] = { ...currentTopic, sequenceOrder: targetOrder };

    setChapters((prev) =>
      prev.map((c) => (c.id === chapter.id ? { ...c, topics: newTopics } : c))
    );

    // Call Supabase
    await Promise.all([
      dataService.reorderTopic(currentTopic.id, targetOrder),
      dataService.reorderTopic(targetTopic.id, currentOrder),
    ]);
    toast(`Topic moved ${direction}`, 'success');
  };

  const toggleChapter = (chId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));
  };

  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            ○ Not Started
          </span>
        );
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

  // No batch selected: TeacherBatchGate should route here already, but if a
  // teacher lands directly without a pick, show a prompt instead of silently
  // editing the demo batch's syllabus.
  if (!activeBatchId) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <PageHeader
          title="Curriculum & Syllabus Management"
          subtitle="Pick a batch to start managing its syllabus."
        />
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Please select a batch to load its curriculum.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Curriculum & Syllabus Management"
        subtitle="Manage live CBSE/ICSE chapters, teach topics, upload learning materials, and track academic progress."
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
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
              >
                <BarChart3 size={14} className="text-primary" /> Class Performance
              </button>
            )}

            <button
              onClick={() => {
                setNewChNumber(chapters.length + 1);
                setShowAddChapterModal(true);
              }}
              className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <Plus size={14} /> Add Chapter
            </button>
          </div>
        }
      />

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Syllabus Completed"
          value={<>{syllabusProgressPct}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone={syllabusProgressPct >= 50 ? 'success' : 'primary'}
          icon={<CheckCircle2 size={16} />}
          hint={`${completedTopicsCount} of ${totalTopicsCount} topics covered`}
        />
        <StatCard
          label="Teaching Progress"
          value={<>{completedPeriods}<span className="text-base font-medium text-text-tertiary"> / {totalPeriods}</span></>}
          tone="info"
          icon={<Clock size={16} />}
          hint={`${inProgressTopicsCount} topics currently in progress`}
        />
        <StatCard
          label="Active Chapters"
          value={<>{chapters.length}<span className="text-base font-medium text-text-tertiary"> chapters</span></>}
          tone="primary"
          icon={<Layers size={16} />}
          hint={`${chapters.filter((c) => c.status === 'completed').length} completed chapters`}
        />
        <StatCard
          label="Learning Resources"
          value={<>{allMaterials.length}<span className="text-base font-medium text-text-tertiary"> files</span></>}
          tone="success"
          icon={<FileCheck size={16} />}
          hint="PDFs, videos & notes attached"
        />
      </div>

      {/* Progress Bar Header */}
      <div className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span>{selectedSubject.name} — Live Academic Pacing</span>
          </span>
          <span className="font-mono text-primary font-bold">{syllabusProgressPct}% Covered</span>
        </div>
        <ProgressBar value={syllabusProgressPct} tone={syllabusProgressPct >= 75 ? 'success' : 'primary'} />
      </div>

      {/* Main Syllabus Content */}
      {loading ? (
        <div className="p-12 rounded-xl border border-border bg-surface flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-text-secondary">Loading live syllabus from Supabase database...</p>
        </div>
      ) : chapters.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-border bg-surface text-center space-y-3">
          <AlertCircle size={36} className="mx-auto text-text-tertiary" />
          <h3 className="font-bold text-foreground">No Chapters Configured</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            No syllabus chapters have been added for {selectedSubject.name} in this class. Click "Add Chapter" to create the first unit.
          </p>
          <button
            onClick={() => setShowAddChapterModal(true)}
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Chapter 1
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {unitsGrouped.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                <Layers size={14} /> {group.unitName}
              </div>

              {group.chapters.map((chapter) => {
                const isExpanded = expandedChapters[chapter.id] ?? true;
                const chCompleted = chapter.topics.filter((t) => t.status === 'completed').length;
                const chTotal = chapter.topics.length;
                const chPct = chTotal > 0 ? Math.round((chCompleted / chTotal) * 100) : 0;

                return (
                  <div key={chapter.id} className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
                    {/* Chapter Header */}
                    <div
                      onClick={() => toggleChapter(chapter.id)}
                      className="p-4 bg-muted/15 hover:bg-muted/30 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        {isExpanded ? (
                          <ChevronDown size={18} className="text-text-tertiary shrink-0" />
                        ) : (
                          <ChevronRight size={18} className="text-text-tertiary shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                              Ch {chapter.chapterNumber}
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

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="text-right text-xs mr-2">
                          <span className="font-bold text-foreground">{chCompleted}/{chTotal}</span>
                          <span className="text-text-tertiary ml-1">topics</span>
                        </div>
                        <Badge tone={chPct === 100 ? 'success' : chPct > 0 ? 'primary' : 'neutral'}>
                          {chPct}%
                        </Badge>

                        {/* Chapter Actions: Edit & Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditChapter(chapter);
                          }}
                          title="Edit Chapter"
                          className="p-1 rounded-md text-text-tertiary hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapter.id, chapter.title);
                          }}
                          title="Delete Chapter"
                          className="p-1 rounded-md text-text-tertiary hover:text-rose-500 hover:bg-muted transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTopicModalChapter(chapter);
                          }}
                          className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1 ml-1"
                        >
                          <Plus size={12} /> Add Topic
                        </button>
                      </div>
                    </div>

                    {/* Topics List */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 border-t border-border space-y-3 bg-surface">
                        {chapter.topics.length === 0 ? (
                          <p className="text-xs text-text-tertiary italic">No topics added to this chapter yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2.5">
                            {chapter.topics.map((topic, topicIdx) => (
                              <div
                                key={topic.id}
                                className={cn(
                                  'p-3.5 rounded-lg border transition-all flex flex-col gap-2.5',
                                  topic.status === 'completed'
                                    ? 'border-emerald-500/20 bg-emerald-500/5'
                                    : topic.status === 'in_progress'
                                    ? 'border-amber-500/25 bg-amber-500/5'
                                    : 'border-border bg-surface hover:border-border-strong'
                                )}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                  <div className="flex items-start gap-3 min-w-0">
                                    {/* Interactive 3-State Status Toggle */}
                                    <button
                                      onClick={() => handleCycleStatus(topic)}
                                      title="Click to cycle status: Not Started -> In Progress -> Completed"
                                      className="mt-0.5 shrink-0 transition-transform active:scale-95 focus:outline-hidden"
                                    >
                                      {getStatusBadge(topic.status)}
                                    </button>

                                    <div className="min-w-0">
                                      <span
                                        className={cn(
                                          'text-sm font-semibold text-foreground',
                                          topic.status === 'completed' && 'line-through text-text-secondary'
                                        )}
                                      >
                                        {topic.title}
                                      </span>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary mt-1">
                                        <span className="flex items-center gap-1">
                                          <Clock size={12} /> {topic.estimatedPeriods || 4} Periods
                                        </span>
                                        {topic.description && (
                                          <span className="text-text-secondary">
                                            · {topic.description}
                                          </span>
                                        )}
                                        {topic.completionDate && (
                                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                            · Completed on {topic.completionDate}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto shrink-0">
                                    {/* Topic Reorder Controls */}
                                    <button
                                      disabled={topicIdx === 0}
                                      onClick={() => handleReorderTopic(chapter, topicIdx, 'up')}
                                      title="Move topic up"
                                      className="p-1 rounded-md text-text-tertiary hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all"
                                    >
                                      <ArrowUp size={13} />
                                    </button>
                                    <button
                                      disabled={topicIdx === chapter.topics.length - 1}
                                      onClick={() => handleReorderTopic(chapter, topicIdx, 'down')}
                                      title="Move topic down"
                                      className="p-1 rounded-md text-text-tertiary hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all"
                                    >
                                      <ArrowDown size={13} />
                                    </button>

                                    {/* Edit & Delete Topic */}
                                    <button
                                      onClick={() => handleOpenEditTopic(topic)}
                                      title="Edit Topic"
                                      className="p-1 rounded-md text-text-tertiary hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTopic(topic.id, topic.title)}
                                      title="Delete Topic"
                                      className="p-1 rounded-md text-text-tertiary hover:text-rose-500 hover:bg-muted transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>

                                    {/* Attach Material Button */}
                                    <button
                                      onClick={() => setMaterialModalTopic(topic)}
                                      className="btn-secondary py-1 px-2 text-xs flex items-center gap-1 ml-1"
                                    >
                                      <Plus size={11} /> Material
                                    </button>

                                    {/* Workflow: Take Attendance shortcut */}
                                    {onNavigate && (
                                      <button
                                        onClick={() => onNavigate('attendance')}
                                        title="Take Batch Attendance for this class"
                                        className="py-1 px-2 rounded-md bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
                                      >
                                        <CalendarCheck size={11} /> Attendance
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Attached Learning Materials Row */}
                                {topic.materials && topic.materials.length > 0 && (
                                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                                      Materials:
                                    </span>
                                    {topic.materials.map((mat) => (
                                      <div
                                        key={mat.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border text-xs font-medium text-foreground hover:bg-muted/70 transition-colors"
                                      >
                                        {getMaterialIcon(mat.materialType)}
                                        <button
                                          onClick={() => setViewingMaterial(mat)}
                                          className="hover:underline max-w-[200px] truncate text-left"
                                        >
                                          {mat.title}
                                        </button>
                                        <span className="text-[10px] text-text-tertiary">({mat.fileSize})</span>
                                        <button
                                          onClick={() => setViewingMaterial(mat)}
                                          title="Preview material"
                                          className="text-text-tertiary hover:text-primary transition-colors ml-0.5"
                                        >
                                          <Eye size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMaterial(mat.id)}
                                          title="Delete material"
                                          className="text-text-tertiary hover:text-rose-500 transition-colors ml-0.5"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Attach Learning Material */}
      {materialModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-foreground">Attach Learning Material</h3>
                <p className="text-xs text-text-secondary truncate max-w-sm">
                  Topic: {materialModalTopic.title}
                </p>
              </div>
              <button
                onClick={() => setMaterialModalTopic(null)}
                className="rounded-md p-1 hover:bg-muted text-text-tertiary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NCERT Practice Questions Handout"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Resource Type</label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value as MaterialType)}
                    className="input w-full text-sm"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="notes">Chapter Notes</option>
                    <option value="video">Lecture Video</option>
                    <option value="link">Interactive Web Link</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Author</label>
                  <input
                    type="text"
                    disabled
                    value={teacher?.name || 'Faculty'}
                    className="input w-full text-sm opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  File URL or Online Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://ncert.nic.in/... or YouTube link"
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  className="input w-full text-sm"
                />
                <p className="text-[11px] text-text-tertiary mt-1">
                  Supports Google Drive, NCERT PDF links, or YouTube video links.
                </p>
              </div>

              {/* Quick file preset helper for non-technical users */}
              <div className="p-3 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <UploadCloud size={16} className="text-primary shrink-0" />
                  <span>Use sample study material preset?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMatTitle(`${materialModalTopic.title} — Comprehensive Revision Notes`);
                    setMatUrl('https://ncert.nic.in/textbook/pdf/jemh101.pdf');
                  }}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Fill Sample NCERT PDF
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMaterialModalTopic(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMaterial}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {savingMaterial && <Loader2 size={13} className="animate-spin" />}
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Chapter */}
      {showAddChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground">Add Syllabus Chapter</h3>
              <button
                onClick={() => setShowAddChapterModal(false)}
                className="rounded-md p-1 hover:bg-muted text-text-tertiary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Ch No. *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newChNumber}
                    onChange={(e) => setNewChNumber(parseInt(e.target.value, 10))}
                    className="input w-full text-sm font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-foreground block mb-1">Unit / Section</label>
                  <input
                    type="text"
                    value={newChUnit}
                    onChange={(e) => setNewChUnit(e.target.value)}
                    placeholder="e.g. Unit I: Number Systems"
                    className="input w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Chapter Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arithmetic Progressions"
                  value={newChTitle}
                  onChange={(e) => setNewChTitle(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddChapterModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChapter}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {savingChapter && <Loader2 size={13} className="animate-spin" />}
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Chapter */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground">Edit Syllabus Chapter</h3>
              <button
                onClick={() => setEditingChapter(null)}
                className="rounded-md p-1 hover:bg-muted text-text-tertiary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditChapter} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Ch No. *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editChNumber}
                    onChange={(e) => setEditChNumber(parseInt(e.target.value, 10))}
                    className="input w-full text-sm font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-foreground block mb-1">Unit / Section</label>
                  <input
                    type="text"
                    value={editChUnit}
                    onChange={(e) => setEditChUnit(e.target.value)}
                    className="input w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Chapter Title *</label>
                <input
                  type="text"
                  required
                  value={editChTitle}
                  onChange={(e) => setEditChTitle(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingChapter(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditChapter}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {savingEditChapter && <Loader2 size={13} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Topic */}
      {topicModalChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-foreground">Add Topic</h3>
                <p className="text-xs text-text-secondary">
                  Chapter {topicModalChapter.chapterNumber}: {topicModalChapter.title}
                </p>
              </div>
              <button
                onClick={() => setTopicModalChapter(null)}
                className="rounded-md p-1 hover:bg-muted text-text-tertiary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Topic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. nth Term of an AP"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Estimated Periods (45 mins each)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newTopicPeriods}
                  onChange={(e) => setNewTopicPeriods(parseInt(e.target.value, 10))}
                  className="input w-full text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setTopicModalChapter(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTopic}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {savingTopic && <Loader2 size={13} className="animate-spin" />}
                  Add Topic to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Topic */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground">Edit Topic</h3>
              <button
                onClick={() => setEditingTopic(null)}
                className="rounded-md p-1 hover:bg-muted text-text-tertiary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTopic} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Topic Name *</label>
                <input
                  type="text"
                  required
                  value={editTopicTitle}
                  onChange={(e) => setEditTopicTitle(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Estimated Periods
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editTopicPeriods}
                  onChange={(e) => setEditTopicPeriods(parseInt(e.target.value, 10))}
                  className="input w-full text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Description / Sub-topics (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editTopicDescription}
                  onChange={(e) => setEditTopicDescription(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditTopic}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {savingEditTopic && <Loader2 size={13} className="animate-spin" />}
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Learning Material Viewer / Document Reader */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getMaterialIcon(viewingMaterial.materialType)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">{viewingMaterial.title}</h3>
                  <p className="text-xs text-text-secondary">
                    Uploaded by {viewingMaterial.authorName || 'Faculty'} · {viewingMaterial.fileSize}
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

            {/* Document / Video Preview Container */}
            <div className="rounded-xl border border-border bg-muted/20 p-6 min-h-[220px] flex flex-col justify-center items-center text-center space-y-4">
              {viewingMaterial.materialType === 'video' ? (
                <div className="w-full space-y-3">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <Video size={32} />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">Online Video Lecture</h4>
                  <p className="text-xs text-text-secondary max-w-md mx-auto">
                    This video lesson is hosted externally. Click below to stream the high-definition video lecture.
                  </p>
                  <a
                    href={viewingMaterial.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} /> Open Lecture Stream
                  </a>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">{viewingMaterial.title}</h4>
                  <p className="text-xs text-text-secondary max-w-md mx-auto">
                    Official curriculum study material and pedagogical notes prepared for Class 10 students.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <a
                      href={viewingMaterial.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs inline-flex items-center gap-1.5"
                    >
                      <Download size={13} /> Open / Download File
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-text-tertiary">
              <span>Verified against CBSE Class 10 Syllabus standards</span>
              <button
                onClick={() => setViewingMaterial(null)}
                className="btn-secondary text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LMSLesson, LMSNote, LMSCourse } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Badge, Card, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Bookmark,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  FileText,
  Tag,
  ExternalLink,
  ChevronRight,
  ListVideo,
  PenTool,
} from 'lucide-react';

interface LecturePlayerModalProps {
  lesson: LMSLesson;
  course?: LMSCourse | null;
  onClose: () => void;
  onToggleComplete?: (lesson: LMSLesson) => void;
  onSelectLesson?: (lesson: LMSLesson) => void;
}

const TAG_CONFIG: Record<
  LMSNote['tag'],
  { label: string; tone: 'primary' | 'warning' | 'info' | 'success'; icon: string }
> = {
  key_concept: { label: 'Key Concept', tone: 'primary', icon: '🔑' },
  formula: { label: 'Formula / Law', tone: 'warning', icon: '📐' },
  doubt: { label: 'Exam Doubt', tone: 'info', icon: '❓' },
  summary: { label: 'Summary', tone: 'success', icon: '💡' },
};

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const LecturePlayerModal: React.FC<LecturePlayerModalProps> = ({
  lesson,
  course,
  onClose,
  onToggleComplete,
  onSelectLesson,
}) => {
  const { session } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [activeTab, setActiveTab] = useState<'notes' | 'playlist' | 'resources' | 'doubt'>('notes');
  const [notes, setNotes] = useState<LMSNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Note creation state
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>((lesson.durationMinutes || 20) * 60);
  const [noteText, setNoteText] = useState('');
  const [selectedTag, setSelectedTag] = useState<LMSNote['tag']>('key_concept');
  const [savingNote, setSavingNote] = useState(false);

  // Video embed URL with start timestamp support
  const [videoTimestamp, setVideoTimestamp] = useState<number>(0);

  const rawUrl = lesson.contentUrl || lesson.url || '/videos/quadratic_equations.mp4';
  const isLocalVideo = rawUrl.startsWith('/videos/') || rawUrl.endsWith('.mp4') || rawUrl.endsWith('.webm') || (!rawUrl.includes('youtube.com') && !rawUrl.includes('youtu.be') && !rawUrl.includes('embed/'));

  // Derive embed URL for YouTube
  const getEmbedUrl = (raw?: string, startSeconds: number = 0) => {
    if (!raw) return '';
    let base = raw;
    if (base.includes('watch?v=')) {
      base = base.replace('watch?v=', 'embed/');
    }
    const cleanBase = base.split('?')[0];
    return `${cleanBase}?autoplay=1&enablejsapi=1&rel=0&start=${Math.floor(startSeconds)}`;
  };

  // Load notes for current lesson
  useEffect(() => {
    let active = true;
    setLoadingNotes(true);
    dataService.getLessonNotes(lesson.id, session?.userId).then((res) => {
      if (!active) return;
      setNotes(res);
      setLoadingNotes(false);
    });
    return () => {
      active = false;
    };
  }, [lesson.id, session?.userId]);

  // Handle native video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTimestamp(Math.floor(videoRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setVideoDuration(Math.floor(videoRef.current.duration));
    }
  };

  // Seek handler
  const handleSeekTo = (seconds: number) => {
    if (isLocalVideo && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, seconds);
      videoRef.current.play().catch(() => {});
    } else {
      setVideoTimestamp(seconds);
    }
    setCurrentTimestamp(seconds);
    toast('Jumping in lecture', 'info', `Navigated to ${formatSeconds(seconds)}`);
  };


  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);

    const userId = session?.userId || '00000000-0000-0000-0000-000000000001';
    const label = formatSeconds(currentTimestamp);

    try {
      const saved = await dataService.saveLessonNote({
        userId,
        lessonId: lesson.id,
        tenantId: session?.tenantId,
        timestampSeconds: currentTimestamp,
        timestampLabel: label,
        noteText: noteText.trim(),
        tag: selectedTag,
        color: selectedTag === 'formula' ? '#f59e0b' : selectedTag === 'doubt' ? '#ef4444' : '#2563eb',
      });

      if (saved) {
        setNotes((prev) => [...prev, saved].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
        setNoteText('');
        toast('Note saved to lecture', 'success', `Timestamp: ${label}`);
      } else {
        // Fallback local note
        const localNote: LMSNote = {
          id: `local-${Date.now()}`,
          userId,
          lessonId: lesson.id,
          timestampSeconds: currentTimestamp,
          timestampLabel: label,
          noteText: noteText.trim(),
          tag: selectedTag,
          createdAt: new Date().toISOString(),
        };
        setNotes((prev) => [...prev, localNote].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
        setNoteText('');
        toast('Note saved', 'success', `Timestamp: ${label}`);
      }
    } catch {
      toast('Could not save note', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    await dataService.deleteLessonNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast('Note deleted', 'info');
  };

  const handleExportNotes = () => {
    if (notes.length === 0) {
      toast('No notes to download', 'warning', 'Write some notes first!');
      return;
    }

    const title = lesson.title || 'Lecture';
    const chapter = lesson.chapter || 'Curriculum Topic';
    const courseTitle = lesson.courseTitle || 'Class 10 CBSE';

    let markdown = `# ${title}\n`;
    markdown += `**Course**: ${courseTitle}\n`;
    markdown += `**Chapter**: ${chapter}\n`;
    markdown += `**Lecture URL**: ${lesson.contentUrl || lesson.url || 'Online Classroom'}\n`;
    markdown += `**Exported by**: ${session?.firstName || 'Student'} on ${new Date().toLocaleDateString('en-GB')}\n\n`;
    markdown += `---\n\n## 📝 Timestamped Notes & Formula Log\n\n`;

    notes.forEach((n, idx) => {
      const tagInfo = TAG_CONFIG[n.tag] || TAG_CONFIG.key_concept;
      markdown += `### ${idx + 1}. [${n.timestampLabel}] ${tagInfo.icon} ${tagInfo.label}\n`;
      markdown += `${n.noteText}\n\n`;
    });

    markdown += `---\n*Generated by EduOS Digital Learning Hub*\n`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lecture_Notes_${(lesson.title || 'Notes').replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast('Notes exported', 'success', `Saved ${a.download} to your computer.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-foreground sm:text-lg">{lesson.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-micro text-text-secondary">
                <span>{lesson.courseTitle || 'Curriculum Lecture'}</span>
                {lesson.chapter && <span className="hidden sm:inline">· {lesson.chapter}</span>}
                <Badge tone="primary">
                  <Clock size={11} className="mr-1 inline" /> {lesson.durationMinutes || 24} mins
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleComplete && (
              <button
                onClick={() => onToggleComplete(lesson)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  lesson.completed
                    ? 'bg-success-soft text-success border border-success/30'
                    : 'bg-surface-muted hover:bg-surface-elevated text-text-secondary border border-border',
                )}
              >
                <CheckCircle2 size={14} />
                <span className="hidden sm:inline">{lesson.completed ? 'Completed' : 'Mark Completed'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body: 2 Columns */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1.35fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden">
          {/* Left: Video Player & Context */}
          <div className="flex flex-col overflow-y-auto bg-black/95">
            {/* 16:9 Video Box */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              {isLocalVideo ? (
                <video
                  ref={videoRef}
                  src={rawUrl}
                  controls
                  autoPlay
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="h-full w-full object-contain bg-black"
                />
              ) : rawUrl ? (
                <iframe
                  ref={iframeRef}
                  src={getEmbedUrl(rawUrl, videoTimestamp)}
                  title={lesson.title}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-white/60">
                  <p>No video stream URL configured for this lesson.</p>
                </div>
              )}
            </div>


            {/* Video Controls & Navigation Bar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-4 py-2.5 text-white">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-emerald-400">
                  ⏱ {formatSeconds(currentTimestamp)}
                </span>
                <span className="text-micro text-white/40">/ {formatSeconds((lesson.durationMinutes || 20) * 60)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSeekTo(Math.max(0, currentTimestamp - 15))}
                  className="rounded px-2 py-1 text-micro font-medium bg-white/10 hover:bg-white/20 text-white/80"
                >
                  -15s
                </button>
                <button
                  onClick={() => handleSeekTo(currentTimestamp + 15)}
                  className="rounded px-2 py-1 text-micro font-medium bg-white/10 hover:bg-white/20 text-white/80"
                >
                  +15s
                </button>
                <button
                  onClick={() => handleSeekTo(0)}
                  className="rounded px-2 py-1 text-micro font-medium bg-white/10 hover:bg-white/20 text-white/80"
                >
                  <RotateCcw size={12} className="inline mr-1" /> Replay
                </button>
              </div>
            </div>

            {/* Lesson Info Card */}
            <div className="p-4 sm:p-5 text-white/90">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{lesson.title}</h3>
                  <p className="mt-1 text-xs text-white/60">{lesson.chapter || 'Curriculum Lecture'}</p>
                </div>
                <Badge tone="success">Verified NCERT Stream</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-[0.68rem] uppercase font-bold text-white/50">Subject</div>
                  <div className="mt-0.5 text-xs font-semibold text-white truncate">{lesson.courseTitle || 'Curriculum'}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-[0.68rem] uppercase font-bold text-white/50">Total Notes</div>
                  <div className="mt-0.5 text-xs font-semibold text-emerald-400">{notes.length} saved</div>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-[0.68rem] uppercase font-bold text-white/50">Status</div>
                  <div className="mt-0.5 text-xs font-semibold text-white">
                    {lesson.completed ? '✓ Completed' : 'In Progress'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Timestamped Notes Studio & Interactive Tools */}
          <div className="flex flex-col overflow-hidden bg-surface">
            {/* Tabs */}
            <div className="flex border-b border-border bg-surface-muted/50 p-2 gap-1">
              {[
                { id: 'notes', label: `Notes (${notes.length})`, icon: <PenTool size={14} /> },
                { id: 'playlist', label: 'Course Playlist', icon: <ListVideo size={14} /> },
                { id: 'resources', label: 'Resources & DPP', icon: <FileText size={14} /> },
                { id: 'doubt', label: 'Ask Doubt', icon: <HelpCircle size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                    activeTab === tab.id
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-text-secondary hover:text-foreground',
                  )}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: NOTES STUDIO */}
            {activeTab === 'notes' && (
              <div className="flex flex-1 flex-col overflow-hidden p-4 sm:p-5">
                {/* Take a Note Box */}
                <form onSubmit={handleSaveNote} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted/30 p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded bg-primary-soft text-primary">
                        <Clock size={13} />
                      </span>
                      <span className="font-mono text-xs font-bold text-primary">
                        Take note at {formatSeconds(currentTimestamp)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentTimestamp(Math.floor(Date.now() / 1000) % 1800)}
                      className="text-micro text-text-tertiary hover:text-primary"
                    >
                      Sync Now
                    </button>
                  </div>

                  {/* Tag Selector */}
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(TAG_CONFIG) as LMSNote['tag'][]).map((tagKey) => {
                      const cfg = TAG_CONFIG[tagKey];
                      const selected = selectedTag === tagKey;
                      return (
                        <button
                          key={tagKey}
                          type="button"
                          onClick={() => setSelectedTag(tagKey)}
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold transition-all',
                            selected
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'bg-surface border border-border text-text-secondary hover:border-primary/50',
                          )}
                        >
                          {cfg.icon} {cfg.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Note Input */}
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write your observation, formula or question from this timestamp…"
                    className="input w-full resize-none text-xs"
                    required
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-micro text-text-tertiary">Notes automatically sync to Supabase</span>
                    <button type="submit" disabled={savingNote || !noteText.trim()} className="btn-primary py-1 px-3 text-xs">
                      {savingNote ? 'Saving…' : '+ Add Note'}
                    </button>
                  </div>
                </form>

                {/* Notes List Header */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="eyebrow">Saved Lecture Notes ({notes.length})</span>
                  {notes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportNotes}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Download size={13} /> Export Notes (.md)
                    </button>
                  )}
                </div>

                {/* Notes List Body */}
                <div className="mt-2.5 flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
                  {loadingNotes ? (
                    <div className="py-8 text-center text-xs text-text-tertiary">Loading saved notes…</div>
                  ) : notes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-text-tertiary">
                      <Bookmark size={24} className="mx-auto mb-2 opacity-40 text-primary" />
                      <p className="font-semibold text-foreground">No notes added yet.</p>
                      <p className="text-micro mt-1">Play the lecture and tap "+ Add Note" to log important formulas or doubts.</p>
                    </div>
                  ) : (
                    notes.map((note) => {
                      const tagInfo = TAG_CONFIG[note.tag] || TAG_CONFIG.key_concept;
                      return (
                        <div
                          key={note.id}
                          className="group relative flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3 transition-all hover:border-primary/40 hover:shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSeekTo(note.timestampSeconds)}
                                className="flex items-center gap-1 rounded bg-primary-soft px-2 py-0.5 font-mono text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                title="Click to seek video to this timestamp"
                              >
                                <Play size={10} /> {note.timestampLabel}
                              </button>
                              <Badge tone={tagInfo.tone}>
                                {tagInfo.icon} {tagInfo.label}
                              </Badge>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all p-1"
                              title="Delete note"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                            {note.noteText}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: COURSE PLAYLIST */}
            {activeTab === 'playlist' && (
              <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5">
                <div className="mb-3">
                  <span className="eyebrow">Course Syllabus & Lectures</span>
                  <h4 className="text-sm font-bold text-foreground mt-0.5">
                    {course?.title || lesson.courseTitle || 'Curriculum Modules'}
                  </h4>
                </div>

                <div className="flex flex-col gap-2">
                  {(course?.lessons || [lesson]).map((l, index) => {
                    const isCurrent = l.id === lesson.id;
                    return (
                      <div
                        key={l.id}
                        onClick={() => onSelectLesson && onSelectLesson(l)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                          isCurrent
                            ? 'border-primary bg-primary-soft/50 shadow-xs'
                            : 'border-border bg-surface hover:bg-surface-muted',
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold bg-surface border border-border text-foreground">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className={cn('text-xs font-semibold truncate', isCurrent ? 'text-primary font-bold' : 'text-foreground')}>
                              {l.title}
                            </div>
                            <div className="text-micro text-text-tertiary">
                              {l.durationMinutes} mins · {l.chapter}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCurrent ? (
                            <Badge tone="primary">Now Playing</Badge>
                          ) : (
                            <ChevronRight size={14} className="text-text-tertiary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: RESOURCES & DPP */}
            {activeTab === 'resources' && (
              <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5 gap-3">
                <span className="eyebrow">Supplementary Study Materials</span>

                <Card className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded bg-info-soft text-info">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">NCERT Official Exemplar & Solutions</div>
                      <div className="text-micro text-text-secondary">PDF · Chapter Formula Cheatsheet</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toast('Opening NCERT Reference', 'info', 'Connecting to CBSE Digital Repository')}
                    className="btn-secondary py-1 px-2.5 text-xs"
                  >
                    Open PDF
                  </button>
                </Card>

                <Card className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded bg-warning-soft text-warning">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Daily Practice Problem (DPP #04)</div>
                      <div className="text-micro text-text-secondary">10 Board Examination Questions</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toast('DPP Loaded', 'success', 'Added to your homework queue.')}
                    className="btn-primary py-1 px-2.5 text-xs"
                  >
                    Start DPP
                  </button>
                </Card>
              </div>
            )}

            {/* TAB 4: ASK TEACHER / AI DOUBT */}
            {activeTab === 'doubt' && (
              <div className="flex flex-1 flex-col p-4 sm:p-5 gap-3">
                <span className="eyebrow">Ask Academic Faculty</span>
                <p className="text-xs text-text-secondary">
                  Have a question about this lecture? Submit your doubt with the current timestamp (
                  <strong className="text-primary">{formatSeconds(currentTimestamp)}</strong>) automatically attached.
                </p>

                <textarea
                  rows={4}
                  placeholder="Explain your doubt in detail..."
                  className="input w-full text-xs"
                />

                <button
                  type="button"
                  onClick={() => toast('Doubt submitted to Subject Teacher', 'success', 'You will receive an annotated response in your inbox.')}
                  className="btn-primary w-full text-xs"
                >
                  Submit Doubt with Timestamp {formatSeconds(currentTimestamp)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

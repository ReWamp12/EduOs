'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { dataService } from '@/lib/dataService';
import { useAuth } from '@/lib/auth/AuthProvider';
import { LMSLesson, LMSCourse } from '@/lib/types';
import { PageHeader, SectionCard, Badge, ProgressBar, Card, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { LecturePlayerModal } from './LecturePlayerModal';
import {
  PlayCircle,
  FileText,
  StickyNote,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  Clock,
  RotateCcw,
  Check,
  Sparkles,
  ArrowRight,
  Video,
  PenTool,
  Bookmark,
  Layers,
} from 'lucide-react';

type ContentType = LMSLesson['contentType'];

const contentMeta: Record<ContentType, { icon: React.ReactNode; label: string; tone: 'primary' | 'info' | 'warning' | 'neutral' }> = {
  video: { icon: <PlayCircle size={16} />, label: 'Video Lecture', tone: 'primary' },
  pdf: { icon: <FileText size={16} />, label: 'NCERT PDF', tone: 'info' },
  notes: { icon: <StickyNote size={16} />, label: 'Chapter Notes', tone: 'warning' },
  quiz: { icon: <HelpCircle size={16} />, label: 'DPP Quiz', tone: 'neutral' },
};

export const StudentLMS: React.FC = () => {
  const { session } = useAuth();
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Active video player modal state
  const [activeLesson, setActiveLesson] = useState<LMSLesson | null>(null);
  const [activeCourse, setActiveCourse] = useState<LMSCourse | null>(null);

  useEffect(() => {
    let active = true;
    dataService.getLmsCourses(session?.tenantId).then((data) => {
      if (!active) return;
      setCourses(data || []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [session?.tenantId]);

  // Extract distinct subjects
  const subjectList = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.title.includes('Mathematics')) set.add('Mathematics');
      else if (c.title.includes('Physics')) set.add('Physics');
      else if (c.title.includes('Chemistry')) set.add('Chemistry');
      else if (c.title.includes('Biology')) set.add('Biology');
      else if (c.title.includes('Python') || c.title.includes('Information')) set.add('Computer Science');
      else set.add('General');
    });
    return ['all', ...Array.from(set)];
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    if (selectedSubject === 'all') return courses;
    return courses.filter((c) => {
      if (selectedSubject === 'Mathematics') return c.title.includes('Mathematics');
      if (selectedSubject === 'Physics') return c.title.includes('Physics');
      if (selectedSubject === 'Chemistry') return c.title.includes('Chemistry');
      if (selectedSubject === 'Biology') return c.title.includes('Biology');
      if (selectedSubject === 'Computer Science') return c.title.includes('Python') || c.title.includes('Information');
      return true;
    });
  }, [courses, selectedSubject]);

  const allLessons = useMemo(() => {
    return courses.flatMap((c) => c.lessons);
  }, [courses]);

  const totalCompleted = allLessons.filter((l) => l.completed).length;

  const toggleComplete = (lesson: LMSLesson) => {
    const nowComplete = !lesson.completed;
    setCourses((prevCourses) =>
      prevCourses.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => (l.id === lesson.id ? { ...l, completed: nowComplete } : l)),
      })),
    );
    if (activeLesson && activeLesson.id === lesson.id) {
      setActiveLesson((prev) => (prev ? { ...prev, completed: nowComplete } : null));
    }
    const title = lesson.title || 'Lesson';
    if (nowComplete) {
      toast('Lesson completed', 'success', title);
    } else {
      toast('Marked as in-progress', 'info', title);
    }
  };

  const handleOpenLesson = (lesson: LMSLesson, parentCourse?: LMSCourse) => {
    const foundCourse = parentCourse || courses.find((c) => c.id === lesson.courseId) || null;
    setActiveCourse(foundCourse);
    setActiveLesson(lesson);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="LMS Digital Classroom & Video Lectures"
        subtitle="Subject video lectures linked to your curriculum timetable with interactive timestamped notes"
        actions={
          <Badge tone="primary">
            <BookOpen size={14} /> {totalCompleted}/{allLessons.length} completed
          </Badge>
        }
      />

      {/* Subject Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <span className="text-micro font-bold uppercase tracking-wider text-text-tertiary mr-1 flex items-center gap-1">
          <Layers size={13} /> Subjects:
        </span>
        {subjectList.map((subj) => {
          const isSelected = selectedSubject === subj;
          const label = subj === 'all' ? 'All Timetable Subjects' : subj;
          return (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-muted hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card className="p-8 text-center text-text-tertiary">Loading digital classroom lectures from Supabase...</Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="p-8 text-center text-text-tertiary">
          <BookOpen className="mx-auto mb-2 opacity-40" size={32} />
          <p className="font-semibold text-foreground">No digital classroom lessons available for this filter.</p>
          <p className="text-micro text-text-secondary mt-1">Select "All Timetable Subjects" to view full curriculum.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredCourses.map((course) => {
            const courseLessons = course.lessons || [];
            const done = courseLessons.filter((l) => l.completed).length;
            const pct = courseLessons.length > 0 ? Math.round((done / courseLessons.length) * 100) : 0;

            return (
              <SectionCard
                key={course.id}
                title={course.title}
                icon={<Video size={18} />}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={pct === 100 ? 'success' : 'neutral'}>{pct}% complete</Badge>
                  </div>
                }
                bodyClassName="flex flex-col gap-4"
              >
                {course.description && (
                  <p className="text-meta text-text-secondary -mt-1">{course.description}</p>
                )}

                <div className="flex items-center gap-3">
                  <ProgressBar value={pct} tone={pct === 100 ? 'success' : 'primary'} className="flex-1" />
                  <span className="shrink-0 text-micro font-semibold text-text-secondary">
                    {done}/{courseLessons.length} lessons
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {courseLessons.map((lesson) => {
                    const meta = contentMeta[lesson.contentType] || contentMeta.video;
                    return (
                      <Card
                        key={lesson.id}
                        className={cn(
                          'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-primary/40',
                          lesson.completed && 'bg-surface-muted',
                        )}
                      >
                        <div className="flex min-w-0 items-start gap-3.5">
                          <span
                            className={cn(
                              'grid h-10 w-10 shrink-0 place-items-center rounded-lg shadow-2xs',
                              meta.tone === 'primary' && 'bg-primary-soft text-primary',
                              meta.tone === 'info' && 'bg-info-soft text-info',
                              meta.tone === 'warning' && 'bg-warning-soft text-warning',
                              meta.tone === 'neutral' && 'bg-muted text-text-secondary',
                            )}
                          >
                            {meta.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="text-meta font-bold text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenLesson(lesson, course)}>
                              {lesson.title}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-micro text-text-tertiary">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                              <span className="inline-flex items-center gap-1 font-medium">
                                <Clock size={12} /> {lesson.durationMinutes} mins
                              </span>
                              {lesson.chapter && <span className="truncate">· {lesson.chapter}</span>}
                              <span className="text-primary font-medium flex items-center gap-1">
                                <PenTool size={11} /> Timestamped Notes Enabled
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                          <button
                            className="btn-primary"
                            onClick={() => handleOpenLesson(lesson, course)}
                          >
                            <PlayCircle size={15} />
                            {lesson.completed ? 'Rewatch' : 'Play Lecture'}
                          </button>

                          <button
                            className={lesson.completed ? 'btn-secondary' : 'btn-tertiary'}
                            onClick={() => toggleComplete(lesson)}
                            title={lesson.completed ? 'Mark as in-progress' : 'Mark as completed'}
                          >
                            {lesson.completed ? (
                              <>
                                <RotateCcw size={14} />
                              </>
                            ) : (
                              <>
                                <Check size={14} />
                              </>
                            )}
                          </button>
                          {lesson.completed && <CheckCircle2 size={18} className="text-success" />}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      {/* Interactive Video Lecture Player & Notes Studio Modal */}
      {activeLesson && (
        <LecturePlayerModal
          lesson={activeLesson}
          course={activeCourse}
          onClose={() => setActiveLesson(null)}
          onToggleComplete={toggleComplete}
          onSelectLesson={(nextLesson) => {
            setActiveLesson(nextLesson);
          }}
        />
      )}
    </div>
  );
};

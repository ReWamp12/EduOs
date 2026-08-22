'use client';

import React, { useMemo, useState } from 'react';
import { mockLMSLessons } from '@/lib/mockData';
import { LMSLesson } from '@/lib/types';
import { PageHeader, SectionCard, Badge, ProgressBar, Card, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
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
} from 'lucide-react';

type ContentType = LMSLesson['contentType'];

const contentMeta: Record<ContentType, { icon: React.ReactNode; label: string; tone: 'primary' | 'info' | 'warning' | 'neutral' }> = {
  video: { icon: <PlayCircle size={16} />, label: 'Video', tone: 'primary' },
  pdf: { icon: <FileText size={16} />, label: 'PDF', tone: 'info' },
  notes: { icon: <StickyNote size={16} />, label: 'Notes', tone: 'warning' },
  quiz: { icon: <HelpCircle size={16} />, label: 'Quiz', tone: 'neutral' },
};

export const StudentLMS: React.FC = () => {
  const [lessons, setLessons] = useState<LMSLesson[]>(() => mockLMSLessons.map((l) => ({ ...l })));

  const courses = useMemo(() => {
    const map = new Map<string, LMSLesson[]>();
    lessons.forEach((l) => {
      const courseKey = l.courseTitle || l.subject || 'General Curriculum';
      const list = map.get(courseKey) ?? [];
      list.push(l);
      map.set(courseKey, list);
    });
    return Array.from(map.entries());
  }, [lessons]);

  const totalCompleted = lessons.filter((l) => l.completed).length;

  const toggleComplete = (lesson: LMSLesson) => {
    const nowComplete = !lesson.completed;
    setLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, completed: nowComplete } : l)));
    const title = lesson.title || lesson.lessonTitle || 'Lesson';
    if (nowComplete) {
      toast('Lesson completed', 'success', title);
    } else {
      toast('Marked as pending', 'info', title);
    }
  };

  const openLesson = (lesson: LMSLesson) => {
    const verb = lesson.contentType === 'video' ? 'Playing' : 'Opening';
    const title = lesson.title || lesson.lessonTitle || 'Lesson';
    toast(`${verb} lesson`, 'info', title);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="LMS Digital Classroom"
        subtitle="Curriculum lectures, Daily Practice Problems (DPP) & chapter notes"
        actions={
          <Badge tone="primary">
            <BookOpen size={14} /> {totalCompleted}/{lessons.length} completed
          </Badge>
        }
      />

      <div className="flex flex-col gap-5">
        {courses.map(([courseTitle, courseLessons]) => {
          const done = courseLessons.filter((l) => l.completed).length;
          const pct = Math.round((done / courseLessons.length) * 100);
          return (
            <SectionCard
              key={courseTitle}
              title={courseTitle}
              icon={<BookOpen size={18} />}
              action={<Badge tone={pct === 100 ? 'success' : 'neutral'}>{pct}% complete</Badge>}
              bodyClassName="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <ProgressBar value={pct} tone={pct === 100 ? 'success' : 'primary'} className="flex-1" />
                <span className="shrink-0 text-micro font-semibold text-text-secondary">
                  {done}/{courseLessons.length} lessons
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {courseLessons.map((lesson) => {
                  const meta = contentMeta[lesson.contentType];
                  return (
                    <Card
                      key={lesson.id}
                      className={cn(
                        'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
                        lesson.completed && 'bg-surface-muted',
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-md',
                            meta.tone === 'primary' && 'bg-primary-soft text-primary',
                            meta.tone === 'info' && 'bg-info-soft text-info',
                            meta.tone === 'warning' && 'bg-warning-soft text-warning',
                            meta.tone === 'neutral' && 'bg-muted text-text-secondary',
                          )}
                        >
                          {meta.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="text-meta font-semibold text-foreground">{lesson.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-micro text-text-tertiary">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} /> {lesson.durationMinutes} mins
                            </span>
                            <span className="truncate">· {lesson.chapter}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                        <button className="btn-tertiary" onClick={() => openLesson(lesson)}>
                          {lesson.contentType === 'video' ? (
                            <>
                              <PlayCircle size={15} /> {lesson.completed ? 'Rewatch' : 'Play'}
                            </>
                          ) : (
                            <>
                              <FileText size={15} /> Open
                            </>
                          )}
                        </button>
                        <button
                          className={lesson.completed ? 'btn-secondary' : 'btn-primary'}
                          onClick={() => toggleComplete(lesson)}
                        >
                          {lesson.completed ? (
                            <>
                              <RotateCcw size={15} /> Undo
                            </>
                          ) : (
                            <>
                              <Check size={15} /> Mark complete
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
    </div>
  );
};

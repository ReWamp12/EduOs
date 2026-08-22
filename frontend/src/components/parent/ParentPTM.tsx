'use client';

import React, { useState } from 'react';
import { Card, Badge, PageHeader, cn } from '@/components/ui';
import { Calendar, Clock, Video, MapPin, Check, CalendarCheck } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { mockPTMSlots, mockCurrentStudent, mockProfiles } from '@/lib/mockData';
import { useAppStore, addPtmBooking } from '@/lib/store';

export const ParentPTM: React.FC = () => {
  const { ptmBookings } = useAppStore();
  const [selected, setSelected] = useState<Record<string, string>>({});

  const studentName = mockCurrentStudent?.name || 'Student';

  const bookingFor = (teacherId: string, slot: string) =>
    ptmBookings.find(
      (b) => b.teacherId === teacherId && b.slot === slot && b.studentName === studentName,
    );

  const handleBook = (ptmId: string, teacherName: string, subject: string, mode: string) => {
    const slot = selected[ptmId];
    if (!slot) return;

    addPtmBooking({
      teacherId: ptmId,
      teacherName,
      subject,
      slot,
      mode,
      studentName,
      parentName: `${mockProfiles.parent?.firstName || 'Parent'} ${mockProfiles.parent?.lastName || ''}`.trim(),
    });

    setSelected((prev) => {
      const next = { ...prev };
      delete next[ptmId];
      return next;
    });

    toast('PTM slot booked', 'success', `${teacherName} · ${slot} · request sent to faculty`);
  };

  const isVideo = (mode: string) => (mode || '').toLowerCase().includes('video');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Parent–teacher meetings"
        subtitle="Book 1-on-1 consultations with faculty mentors (in-person or video call)"
      />

      {(!mockPTMSlots || mockPTMSlots.length === 0) ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Calendar size={40} className="text-text-tertiary mb-3 opacity-50" />
          <h3 className="text-section font-semibold text-foreground">No PTM Slots Scheduled</h3>
          <p className="mt-1 text-body text-text-secondary max-w-md">
            There are currently no active parent-teacher meeting slots published. You will receive an alert when faculty publish open consultation slots.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {mockPTMSlots.map((ptm) => {
            const chosen = selected[ptm.id];
            const slots: string[] = ptm.availableSlots || [];
            const ptmMode = ptm.mode || 'In-Person';
            const activeBooking = slots
              .map((s: string) => bookingFor(ptm.id, s))
              .find(Boolean);

            return (
              <Card key={ptm.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge tone="primary">{ptm.subject}</Badge>
                    <h3 className="mt-2 text-section text-foreground">{ptm.teacherName}</h3>
                    <div className="mt-1 inline-flex items-center gap-1.5 text-meta text-text-secondary">
                      {isVideo(ptmMode) ? (
                        <Video size={14} className="text-text-tertiary" />
                      ) : (
                        <MapPin size={14} className="text-text-tertiary" />
                      )}
                      {ptmMode}
                    </div>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                    <Calendar size={17} />
                  </span>
                </div>

                <div className="mt-4">
                  <div className="eyebrow mb-2">Available Saturday slots</div>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot: string) => {
                      const isBooked = !!bookingFor(ptm.id, slot);
                      const isChosen = chosen === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => !isBooked && setSelected((p) => ({ ...p, [ptm.id]: slot }))}
                          disabled={isBooked}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-meta font-medium transition-colors',
                            isBooked
                              ? 'cursor-not-allowed border-border bg-muted text-text-tertiary line-through'
                              : isChosen
                                ? 'border-primary bg-surface text-primary shadow-xs'
                                : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-muted',
                          )}
                          aria-pressed={isChosen}
                        >
                          {isBooked ? <CalendarCheck size={14} /> : <Clock size={14} />}
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeBooking && (
                  <div
                    className={cn(
                      'mt-4 flex items-start gap-2.5 rounded-md border p-3 text-meta',
                      activeBooking.status === 'confirmed'
                        ? 'border-success/20 bg-success-soft text-success-foreground'
                        : 'border-info/20 bg-info-soft text-info-foreground',
                    )}
                  >
                    <Check size={16} className="mt-0.5 shrink-0" />
                    <span>
                      {activeBooking.status === 'confirmed' ? 'Confirmed' : 'Requested'} with{' '}
                      <span className="font-semibold">{ptm.teacherName}</span> at{' '}
                      <span className="font-semibold">{activeBooking.slot}</span>.{' '}
                      {activeBooking.status === 'confirmed'
                        ? 'Calendar invite & link sent.'
                        : 'Awaiting faculty confirmation.'}
                    </span>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleBook(ptm.id, ptm.teacherName, ptm.subject, ptm.mode)}
                    className="btn-primary"
                    disabled={!chosen}
                  >
                    <CalendarCheck size={16} /> Book slot
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

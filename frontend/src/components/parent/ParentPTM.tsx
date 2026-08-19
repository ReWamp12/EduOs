'use client';

import React, { useState } from 'react';
import { mockPTMSlots, mockCurrentStudent, mockProfiles } from '@/lib/mockData';
import { useAppStore, addPtmBooking } from '@/lib/store';
import { Card, Badge, PageHeader, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { Calendar, Video, MapPin, Clock, Check, CalendarCheck } from 'lucide-react';

export const ParentPTM: React.FC = () => {
  const { ptmBookings } = useAppStore();
  // teacherId -> currently selected (but not yet booked) slot
  const [selected, setSelected] = useState<Record<string, string>>({});

  // A slot is booked if a shared-store booking exists for this teacher + slot.
  const bookingFor = (teacherId: string, slot: string) =>
    ptmBookings.find((b) => b.teacherId === teacherId && b.slot === slot);

  const handleBook = (teacherId: string, teacherName: string, subject: string, mode: string) => {
    const slot = selected[teacherId];
    if (!slot) {
      toast('Select a slot first', 'info', `Pick an available time for ${teacherName}`);
      return;
    }
    // Write to the shared store so the teacher's view receives the request.
    addPtmBooking({
      teacherId,
      teacherName,
      subject,
      slot,
      mode,
      studentName: mockCurrentStudent.name,
      parentName: `${mockProfiles.parent.firstName} ${mockProfiles.parent.lastName}`,
    });
    setSelected((prev) => {
      const next = { ...prev };
      delete next[teacherId];
      return next;
    });
    toast('PTM slot booked', 'success', `${teacherName} · ${slot} · request sent to faculty`);
  };

  const isVideo = (mode: string) => mode.toLowerCase().includes('video');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Parent–teacher meetings"
        subtitle="Book 1-on-1 consultations with faculty mentors (in-person or video call)"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {mockPTMSlots.map((ptm) => {
          const chosen = selected[ptm.id];
          const slots = ptm.availableSlots || ['10:00 AM', '10:30 AM', '11:00 AM'];
          const ptmMode = ptm.mode || 'In-Person';
          const activeBooking = slots
            .map((s) => bookingFor(ptm.id, s))
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
                  {slots.map((slot) => {
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
    </div>
  );
};

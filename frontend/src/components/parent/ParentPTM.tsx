'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { Student } from '@/lib/types';
import { Card, Badge, PageHeader, cn } from '@/components/ui';
import { Calendar, Clock, Video, MapPin, Check, CalendarCheck } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { mockPTMSlots } from '@/lib/mockData';
import { useAppStore, addPtmBooking } from '@/lib/store';

export const ParentPTM: React.FC = () => {
  const { session } = useAuth();
  const { ptmBookings } = useAppStore();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [dbBookings, setDbBookings] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    dataService.getParentChildren().then((kids) => {
      if (!active) return;
      if (kids && kids.length > 0) {
        setChildren(kids);
        setSelectedChildId((prev) => prev || kids[0].id);
        dataService.getPtmBookings(kids[0].id).then((b) => {
          if (active && b) setDbBookings(b);
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const activeChild = children.find((c) => c.id === selectedChildId) || children[0];
  const studentName = activeChild?.name || 'Student';

  const bookingFor = (teacherId: string, slot: string) =>
    dbBookings.find((b) => b.teacherId === teacherId && b.slot === slot) ||
    ptmBookings.find(
      (b) => b.teacherId === teacherId && b.slot === slot && b.studentName === studentName,
    );

  const handleBook = async (ptmId: string, teacherName: string, subject: string, mode: string) => {
    const slot = selected[ptmId];
    if (!slot || !activeChild) return;

    const parentName = session
      ? `${session.firstName || 'Parent'} ${session.lastName || ''}`.trim()
      : 'Parent';

    // Teacher ID resolution (use default teacher profile if mock id is passed)
    const teacherId = ptmId.includes('-') && ptmId.length > 20
      ? ptmId
      : '4d9ada55-6040-4d40-a853-18a7359fae50'; // Suresh Pillai / default teacher profile

    if (activeChild.id) {
      await dataService.createPtmBooking({
        teacherId,
        studentId: activeChild.id,
        subject,
        slot,
        mode: mode.toLowerCase().includes('video') ? 'online' : 'in_person',
        requestedBy: 'guardian',
      });
    }

    addPtmBooking({
      teacherId: ptmId,
      teacherName,
      subject,
      slot,
      mode,
      studentName,
      parentName,
    });

    setSelected((prev) => {
      const next = { ...prev };
      delete next[ptmId];
      return next;
    });

    toast('PTM slot booked', 'success', `${teacherName} · ${slot} · request sent to faculty & saved to database.`);
  };

  const isVideo = (mode: string) => (mode || '').toLowerCase().includes('video');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Parent–teacher meetings"
          subtitle="Book 1-on-1 consultations with faculty mentors (in-person or video call)"
        />
        {children.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-border/80 bg-surface p-1.5 shadow-2xs">
            <span className="text-micro font-medium text-text-tertiary px-2">Child:</span>
            {children.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChildId(ch.id)}
                className={cn(
                  'rounded-lg px-3 py-1 text-meta font-medium transition-colors',
                  selectedChildId === ch.id
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-text-secondary hover:bg-muted',
                )}
              >
                {ch.name ? ch.name.split(' ')[0] : 'Child'}
              </button>
            ))}
          </div>
        )}
      </div>

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
                            'rounded-md px-3 py-1.5 text-meta font-medium transition-colors',
                            isBooked
                              ? 'bg-muted text-text-tertiary line-through cursor-not-allowed'
                              : isChosen
                              ? 'bg-primary text-white shadow-2xs'
                              : 'border border-border bg-surface text-foreground hover:bg-muted',
                          )}
                        >
                          <Clock size={13} className="inline mr-1 opacity-70" />
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeBooking && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5">
                    <div className="flex items-center gap-2 text-meta text-success font-medium">
                      <CalendarCheck size={16} />
                      Booked for {activeBooking.slot} ({studentName})
                    </div>
                    <Badge tone="success">Confirmed</Badge>
                  </div>
                )}

                {chosen && !activeBooking && (
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div className="text-meta text-text-secondary">
                      Selected slot: <span className="font-semibold text-foreground">{chosen}</span>
                    </div>
                    <button
                      onClick={() => handleBook(ptm.id, ptm.teacherName, ptm.subject, ptmMode)}
                      className="btn-primary"
                    >
                      <Check size={16} /> Confirm Booking
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

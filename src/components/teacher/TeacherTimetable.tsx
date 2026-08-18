'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ArrowLeftRight, Check, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { dataService } from '@/lib/dataService';
import { TimetableSlot } from '@/lib/types';

export const TeacherTimetable: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1 = Monday
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [substitutionRequests, setSubstitutionRequests] = useState([
    {
      id: 'sub-1',
      requestor: 'Prof. Amit Verma',
      subject: 'Mathematics (Calculus)',
      batch: 'Class 11 - JEE Advanced Alpha',
      period: 'Period 3 (11:30 AM - 01:00 PM)',
      date: 'Tomorrow, Aug 19',
      reason: 'Attending CBSE Regional Academic Conclave',
      status: 'Open for Coverage',
    },
    {
      id: 'sub-2',
      requestor: 'Dr. Sunita Rao',
      subject: 'Organic Chemistry',
      batch: 'Class 12 - NEET Medical Top 50',
      period: 'Period 4 (02:00 PM - 03:30 PM)',
      date: 'Wednesday, Aug 20',
      reason: 'Medical Leave',
      status: 'Open for Coverage',
    },
  ]);

  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    dataService.getTeacherTimetable('t-1').then((res) => {
      if (active) {
        setTimetable(res);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const handleClaim = (id: string, name: string) => {
    setSubstitutionRequests((prev) => prev.filter((r) => r.id !== id));
    setClaimedNotice(`You have agreed to cover ${name}'s class. Timetable updated and notifications sent to Principal.`);
    setTimeout(() => setClaimedNotice(null), 4000);
  };

  const days = [
    { dayNumber: 1, name: 'Monday' },
    { dayNumber: 2, name: 'Tuesday' },
    { dayNumber: 3, name: 'Wednesday' },
    { dayNumber: 4, name: 'Thursday' },
    { dayNumber: 5, name: 'Friday' },
    { dayNumber: 6, name: 'Saturday' },
  ];

  const currentSlots = timetable.filter((s) => s.dayOfWeek === selectedDay);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
        Loading faculty timetable entries from database...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={26} color="#06B6D4" /> Faculty Master Timetable &amp; Coverage Marketplace
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Interactive period schedule &bull; Instant peer class coverage and substitution trading
          </p>
        </div>
      </div>

      {claimedNotice && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
        }}>
          <Check size={18} /> {claimedNotice}
        </div>
      )}

      {/* Day Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {days.map((d) => {
          const isSelected = selectedDay === d.dayNumber;
          return (
            <button
              key={d.dayNumber}
              onClick={() => setSelectedDay(d.dayNumber)}
              className={isSelected ? 'btn-primary' : 'btn-secondary'}
              style={{
                fontSize: '0.85rem',
                padding: '8px 18px',
                background: isSelected ? 'linear-gradient(135deg, #06B6D4, #4F46E5)' : undefined,
              }}
            >
              {d.name}
            </button>
          );
        })}
      </div>

      {/* Timetable Grid & Substitution Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Schedule List */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {days.find((d) => d.dayNumber === selectedDay)?.name} Assigned Teaching Periods
            </h3>
            <span className="badge badge-primary">{currentSlots.length} Scheduled</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentSlots.length > 0 ? (
              currentSlots.map((slot) => (
                <div
                  key={slot.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `4px solid ${slot.subjectColor}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                        Period {slot.periodNumber} &bull; {slot.subjectName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} color="var(--primary)" /> {slot.startTime} - {slot.endTime}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="var(--accent)" /> {slot.roomNumber}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    onClick={() => alert(`Requested substitution for Period ${slot.periodNumber}. Posted to coverage marketplace.`)}
                  >
                    <ArrowLeftRight size={13} /> Request Swap
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active lectures scheduled for this day. Free for research &amp; lesson prep!
              </div>
            )}
          </div>
        </div>

        {/* Peer Substitution Marketplace */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeftRight size={20} color="#F59E0B" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Substitution Marketplace</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Help fellow faculty by claiming open coverage requests. Claimed hours count towards institutional service credits.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {substitutionRequests.length > 0 ? (
              substitutionRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{req.requestor}</div>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{req.date}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>{req.subject}</strong> ({req.period})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Reason: {req.reason}
                  </div>

                  <button
                    onClick={() => handleClaim(req.id, req.requestor)}
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                      fontSize: '0.78rem',
                      padding: '6px 12px',
                      marginTop: '4px',
                    }}
                  >
                    <UserCheck size={14} /> Accept &amp; Cover Class
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#34D399', fontSize: '0.85rem' }}>
                <Check size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
                All peer substitutions have been covered!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

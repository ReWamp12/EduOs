'use client';

import React, { useState } from 'react';
import { mockTenant, mockCurrentStudent } from '@/lib/mockData';
import {
  X,
  Printer,
  Grid3X3,
  Award,
  QrCode,
  ShieldCheck,
  User,
  Users,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

interface ExamSeatingProps {
  examTitle: string;
  batchName: string;
  onClose: () => void;
}

interface DeskSlot {
  deskNumber: string;
  studentName: string;
  rollNumber: string;
  batchCode: string;
  row: number;
  col: number;
}

const SAMPLE_SEATS: DeskSlot[] = [
  { deskNumber: 'D-01', studentName: 'Aarav Sharma', rollNumber: '10-A-14', batchCode: 'Sec 10-A', row: 1, col: 1 },
  { deskNumber: 'D-02', studentName: 'Rohan Deshmukh', rollNumber: '10-B-08', batchCode: 'Sec 10-B', row: 1, col: 2 },
  { deskNumber: 'D-03', studentName: 'Ananya Iyer', rollNumber: '10-A-21', batchCode: 'Sec 10-A', row: 1, col: 3 },
  { deskNumber: 'D-04', studentName: 'Pooja Hegde', rollNumber: '10-B-19', batchCode: 'Sec 10-B', row: 1, col: 4 },
  { deskNumber: 'D-05', studentName: 'Kabir Mehta', rollNumber: '10-A-03', batchCode: 'Sec 10-A', row: 2, col: 1 },
  { deskNumber: 'D-06', studentName: 'Sneha Kulkarni', rollNumber: '10-B-27', batchCode: 'Sec 10-B', row: 2, col: 2 },
  { deskNumber: 'D-07', studentName: 'Aditya Verma', rollNumber: '10-A-32', batchCode: 'Sec 10-A', row: 2, col: 3 },
  { deskNumber: 'D-08', studentName: 'Neha Pillai', rollNumber: '10-B-11', batchCode: 'Sec 10-B', row: 2, col: 4 },
  { deskNumber: 'D-09', studentName: 'Tanvi Shah', rollNumber: '10-A-09', batchCode: 'Sec 10-A', row: 3, col: 1 },
  { deskNumber: 'D-10', studentName: 'Arjun Nair', rollNumber: '10-B-15', batchCode: 'Sec 10-B', row: 3, col: 2 },
  { deskNumber: 'D-11', studentName: 'Riya Sengupta', rollNumber: '10-A-28', batchCode: 'Sec 10-A', row: 3, col: 3 },
  { deskNumber: 'D-12', studentName: 'Varun Joshi', rollNumber: '10-B-04', batchCode: 'Sec 10-B', row: 3, col: 4 },
];

export const ExamSeatingAdmitCardModal: React.FC<ExamSeatingProps> = ({
  examTitle,
  batchName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'seating' | 'admit_card'>('seating');

  const handlePrint = () => {
    window.print();
    toast('Print layout ready', 'info', `Printed ${activeTab === 'seating' ? 'Seating Chart' : 'Hall Tickets'}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-border bg-surface shadow-2xl my-8 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('seating')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === 'seating'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-text-secondary hover:bg-muted',
              )}
            >
              <Grid3X3 size={14} /> Seating Arrangement Matrix
            </button>
            <button
              onClick={() => setActiveTab('admit_card')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === 'admit_card'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-text-secondary hover:bg-muted',
              )}
            >
              <Award size={14} /> Official Admit Card / Hall Ticket
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs shadow-xs"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-muted"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* VIEW 1: SEATING ARRANGEMENT MATRIX */}
        {activeTab === 'seating' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Grid3X3 className="text-primary" size={20} />
                  Examination Hall Seating Allocation Chart
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {examTitle} · Room: <strong>Examination Hall Wing-A (Capacity 40)</strong>
                </p>
              </div>
              <Badge tone="success" className="self-start sm:self-auto text-xs">
                <Sparkles size={12} className="mr-1" /> Alternating-Section Anti-Cheating Layout Active
              </Badge>
            </div>

            {/* Hall Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/20 border border-border text-xs">
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase">Venue Room</span>
                <strong className="text-foreground">Auditorium / Hall A</strong>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase">Invigilators on Duty</span>
                <strong className="text-foreground">Prof. A. Verma, Dr. K. Nair</strong>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase">Interleaved Batches</span>
                <strong className="text-primary font-semibold">Class 10-A &amp; 10-B</strong>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase">Total Desk Slots</span>
                <strong className="text-foreground">{SAMPLE_SEATS.length} Desks Allocated</strong>
              </div>
            </div>

            {/* Seating Grid (4 Columns x 3 Rows) */}
            <div className="space-y-2">
              <div className="text-center p-2 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider">
                Teacher's Podium / Examination Invigilation Desk
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                {SAMPLE_SEATS.map((seat) => (
                  <div
                    key={seat.deskNumber}
                    className={cn(
                      'p-3.5 rounded-lg border text-xs space-y-1.5 transition-all shadow-2xs',
                      seat.batchCode === 'Sec 10-A'
                        ? 'border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/20',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-primary">{seat.deskNumber}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary">
                        {seat.batchCode}
                      </span>
                    </div>
                    <div className="font-bold text-foreground text-xs truncate">{seat.studentName}</div>
                    <div className="text-[11px] text-text-tertiary font-mono">Roll: {seat.rollNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: OFFICIAL CBSE ADMIT CARD */}
        {activeTab === 'admit_card' && (
          <div className="p-6 sm:p-10 bg-white text-slate-900 font-sans print:p-0">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 text-center relative">
              <div className="flex items-center justify-between mb-2">
                <div className="text-left text-[11px] font-semibold text-slate-600 space-y-0.5">
                  <div>Centre Code: <strong className="text-slate-900">849201</strong></div>
                  <div>Affiliation: <strong className="text-slate-900">CBSE / Delhi Board</strong></div>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-tr from-indigo-700 to-cyan-600 text-white font-black text-xl grid place-items-center shadow-md">
                  {mockTenant.name.charAt(0)}
                </div>
                <div className="text-right text-[11px] font-semibold text-slate-600 space-y-0.5">
                  <div>Admit Card No: <strong className="text-slate-900 font-mono">AC-2026-0941</strong></div>
                  <div>Session: <strong className="text-slate-900">2026-2027</strong></div>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
                {mockTenant.name}
              </h2>
              <div className="inline-block mt-2 bg-slate-900 text-white font-bold text-[11px] uppercase px-4 py-0.5 rounded-full tracking-wider">
                Official Admit Card &amp; Hall Ticket · Class X Board Examination 2026
              </div>
            </div>

            {/* Candidate Details & Photo Grid */}
            <div className="grid grid-cols-[1fr_auto] gap-4 my-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs items-center">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Candidate Name</span>
                  <strong className="text-slate-900 text-sm">{mockCurrentStudent.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Roll Number</span>
                  <strong className="text-slate-900 text-sm font-mono">{mockCurrentStudent.rollNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Registration Number</span>
                  <strong className="text-slate-900 text-sm font-mono">D/26/60391/0014</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Exam Centre Venue</span>
                  <strong className="text-slate-900">Main Campus · Hall A (Desk D-01)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Mother's Name</span>
                  <strong className="text-slate-900">Mrs. Sunita Sharma</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Father's Name</span>
                  <strong className="text-slate-900">Mr. Rajesh Sharma</strong>
                </div>
              </div>

              {/* Photo & QR Badge */}
              <div className="flex flex-col items-center gap-1.5 pl-4 border-l border-slate-200">
                <img
                  src={mockCurrentStudent.avatarUrl}
                  alt={mockCurrentStudent.name}
                  className="h-20 w-16 object-cover rounded border border-slate-400 shadow-2xs"
                />
                <span className="text-[9px] font-mono text-slate-500">Verified Photo</span>
              </div>
            </div>

            {/* Subject Timetable Schedule */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                Examination Date Sheet &amp; Timings
              </h4>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Date &amp; Day</th>
                    <th className="p-2 border-r border-slate-300">Time</th>
                    <th className="p-2 border-r border-slate-300">Sub Code</th>
                    <th className="p-2 border-r border-slate-300">Subject Name</th>
                    <th className="p-2 text-center">Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-semibold border-r border-slate-200">15 Sep 2026 (Tue)</td>
                    <td className="p-2 font-mono border-r border-slate-200">09:00 AM – 12:00 PM</td>
                    <td className="p-2 font-mono border-r border-slate-200">041</td>
                    <td className="p-2 font-bold border-r border-slate-200">Mathematics (Standard)</td>
                    <td className="p-2 text-center font-mono text-slate-400">________</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold border-r border-slate-200">18 Sep 2026 (Fri)</td>
                    <td className="p-2 font-mono border-r border-slate-200">09:00 AM – 12:00 PM</td>
                    <td className="p-2 font-mono border-r border-slate-200">086</td>
                    <td className="p-2 font-bold border-r border-slate-200">Science (Physics, Chem, Bio)</td>
                    <td className="p-2 text-center font-mono text-slate-400">________</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold border-r border-slate-200">22 Sep 2026 (Tue)</td>
                    <td className="p-2 font-mono border-r border-slate-200">09:00 AM – 12:00 PM</td>
                    <td className="p-2 font-mono border-r border-slate-200">087</td>
                    <td className="p-2 font-bold border-r border-slate-200">Social Science</td>
                    <td className="p-2 text-center font-mono text-slate-400">________</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold border-r border-slate-200">26 Sep 2026 (Sat)</td>
                    <td className="p-2 font-mono border-r border-slate-200">09:00 AM – 12:00 PM</td>
                    <td className="p-2 font-mono border-r border-slate-200">184</td>
                    <td className="p-2 font-bold border-r border-slate-200">English Language &amp; Literature</td>
                    <td className="p-2 text-center font-mono text-slate-400">________</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Candidate Instructions & Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 items-end text-center text-xs">
              <div>
                <div className="font-serif italic text-slate-700 text-xs mb-1">Aarav Sharma</div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase text-[9px]">
                  Candidate Signature
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-9 w-9 border border-slate-300 rounded grid place-items-center text-slate-600 mb-1">
                  <QrCode size={22} />
                </div>
                <span className="text-[8px] text-slate-500 font-mono">Gate Entry QR Verified</span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1 text-indigo-800 font-bold mb-1">
                  <ShieldCheck size={14} />
                  <span className="font-serif italic text-xs">Dr. Meenakshi Joshi</span>
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase text-[9px]">
                  Centre Superintendent Seal
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

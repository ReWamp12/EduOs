'use client';

import React, { useState } from 'react';
import { mockBusLiveTracking } from '@/lib/mockData';
import { Card, SectionCard, StatCard, Badge, ProgressBar, PageHeader, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  Bus,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Gauge,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Wifi,
  Satellite,
  Compass,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export const ParentBusTracking: React.FC = () => {
  const bus = mockBusLiveTracking;
  const [eta, setEta] = useState(bus.etaMinutes);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('just now');

  // Journey progress derived from ETA
  const progress = Math.min(100, Math.max(12, Math.round(((bus.etaMinutes - eta + 4) / (bus.etaMinutes + 4)) * 100)));

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setEta((prev) => Math.max(1, prev - 1));
      setLastUpdated('just now');
      setRefreshing(false);
      toast('GPS Signal Synced', 'success', `AIS-140 GPS ping received · Speed: ${bus.speedKmH} km/h · ETA: ${Math.max(1, eta - 1)} mins.`);
    }, 800);
  };

  const handleCallDriver = () => {
    toast('Calling Bus Driver', 'info', `Connecting to ${bus.driverName} (${bus.driverPhone})...`);
  };

  const handleCallAttendant = () => {
    toast('Calling Female Route Attendant', 'info', `Connecting to Smt. Sunita Devi (Attendant)...`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Flagged Feature Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-info/30 bg-gradient-to-r from-info-soft/40 via-surface to-success-soft/20 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info text-white shadow-xs">
            <Bus size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-section font-semibold text-foreground">Live GPS Bus Telematics</span>
              <span className="rounded-md bg-info px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                GPS Live Flagged
              </span>
            </div>
            <p className="text-micro text-text-secondary">
              AIS-140 Certified Government-Approved Telematics with Geo-Fencing & RFID Gate Logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="success" className="gap-1">
            <Radio size={12} className="animate-pulse" /> Live Telemetry
          </Badge>
          <span className="text-micro font-mono font-medium text-text-secondary">
            Bus {bus.vehicleNumber}
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="ETA to School Campus"
          value={`${eta} min`}
          icon={<Clock size={16} />}
          tone="info"
          hint={`Updated ${lastUpdated} · Route #12`}
        />
        <StatCard
          label="Current Speed"
          value={`${bus.speedKmH} km/h`}
          icon={<Gauge size={16} />}
          tone="success"
          hint="Speed governor: Max 40 km/h"
        />
        <StatCard
          label="GPS Trip Status"
          value={bus.status}
          icon={<Navigation size={16} />}
          tone="primary"
          hint={`Vehicle: ${bus.vehicleNumber}`}
        />
      </div>

      {/* Route Progress Panel & Interactive Map Preview */}
      <SectionCard
        title="Live Route Milestone & Telematics"
        icon={<Compass size={18} />}
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-micro text-text-tertiary">
              <Satellite size={12} className="text-success" /> 8 Satellites Locked
            </span>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Visual Route Progress Track */}
          <div className="rounded-xl border border-border bg-surface-muted/60 p-5">
            <div className="flex items-center justify-between text-meta">
              <div className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <MapPin size={15} className="text-primary" /> {bus.currentStop}
              </div>
              <div className="inline-flex items-center gap-1.5 font-semibold text-success">
                {bus.nextStop} <MapPin size={15} className="text-success" />
              </div>
            </div>

            <div className="mt-3.5 flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary shadow-2xs">
                <MapPin size={16} />
              </span>
              <ProgressBar value={progress} tone="info" className="h-3" />
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success text-white shadow-2xs animate-pulse">
                <Bus size={16} />
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-micro text-text-tertiary">
              <span>Origin: Mayur Vihar Phase 1</span>
              <span className="font-semibold text-info">{progress}% of morning route completed</span>
              <span>Destination: Modern Public School Campus</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-micro text-text-tertiary">
              <Wifi size={13} className="text-success" /> AIS-140 Transceiver: Normal Latency (140ms)
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCallAttendant}
                className="btn-secondary gap-1.5"
              >
                <UserCheck size={15} /> Call Attendant
              </button>
              <button onClick={handleCallDriver} className="btn-secondary gap-1.5">
                <Phone size={15} className="text-primary" /> Call Driver ({bus.driverName.split(' ')[0]})
              </button>
              <button onClick={handleRefresh} className="btn-primary gap-1.5" disabled={refreshing}>
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : undefined} />
                {refreshing ? 'Polling GPS...' : 'Refresh GPS Signal'}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Driver + Safety Compliance */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5 rounded-2xl border border-border shadow-xs">
          <div className="eyebrow">Designated Bus Driver</div>
          <div className="mt-1.5 text-section font-semibold text-foreground">{bus.driverName}</div>
          <div className="mt-1 text-meta text-text-secondary">
            Commercial Heavy Driving License · Badge #DL-2018-88319
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-soft/30 px-2.5 py-1 text-meta text-success-foreground">
            <ShieldCheck size={15} className="text-success" /> Delhi Police Background Verification Cleared
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-border shadow-xs">
          <div className="eyebrow">Institutional Safety Compliance</div>
          <div className="mt-1.5 text-meta text-text-secondary leading-relaxed">
            Speed Governor capped at 40 km/h · Dual HD CCTV on board · First-aid kit inspected · Female attendant on route.
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-soft/30 px-2.5 py-1 text-meta text-success-foreground">
            <CheckCircle2 size={15} className="text-success" /> All 6 Pre-Trip Safety Checks Passed Today
          </div>
        </Card>
      </div>

      {/* RFID Boarding Timeline */}
      <SectionCard title="Today's Student RFID Boarding Events" icon={<CheckCircle2 size={18} />}>
        <ol className="relative flex flex-col gap-5 pl-6">
          <span className="absolute left-[9px] top-1 bottom-1 w-px bg-border" aria-hidden />
          {bus.rfidLogs.map((log, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-6 top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-surface bg-success text-white shadow-2xs">
                <CheckCircle2 size={11} />
              </span>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-surface p-3 shadow-2xs">
                <div>
                  <div className="text-meta font-semibold text-foreground">{log.event}</div>
                  <div className="text-micro text-text-tertiary">
                    <MapPin size={11} className="mr-1 inline align-[-1px] text-primary" />
                    {log.location}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {log.verified && <Badge tone="success">RFID Verified</Badge>}
                  <span className="text-meta font-mono font-semibold text-info">{log.time}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
};

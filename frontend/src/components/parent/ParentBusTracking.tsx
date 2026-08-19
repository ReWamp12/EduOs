'use client';

import React, { useState } from 'react';
import { mockBusLiveTracking } from '@/lib/mockData';
import { Card, SectionCard, StatCard, Badge, ProgressBar, PageHeader } from '@/components/ui';
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
} from 'lucide-react';

export const ParentBusTracking: React.FC = () => {
  const bus = mockBusLiveTracking;
  const [eta, setEta] = useState(bus.etaMinutes);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('moments ago');

  // Rough journey progress derived from ETA (fewer minutes left => closer to campus)
  const progress = Math.min(100, Math.max(6, Math.round(((bus.etaMinutes - eta + 3) / (bus.etaMinutes + 3)) * 100)));

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setEta((prev) => Math.max(1, prev - 1));
      setLastUpdated('just now');
      setRefreshing(false);
      toast('Location updated', 'success', `Live GPS ping received · ETA ${Math.max(1, eta - 1)} min`);
    }, 900);
  };

  const handleCallDriver = () => {
    toast('Calling driver', 'info', bus.driverName);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Live bus tracking"
        subtitle={
          <>
            {bus.routeNumber} · Vehicle <span className="font-semibold text-foreground">{bus.vehicleNumber}</span>
          </>
        }
        actions={
          <Badge tone="success">
            <Radio size={13} /> Live GPS active
          </Badge>
        }
      />

      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="ETA to campus" value={`${eta} min`} icon={<Clock size={16} />} tone="info" hint={`Updated ${lastUpdated}`} />
        <StatCard label="Current speed" value={`${bus.speedKmH} km/h`} icon={<Gauge size={16} />} tone="success" hint="Within speed governor limit" />
        <StatCard label="Trip status" value={bus.status} icon={<Navigation size={16} />} tone="primary" hint={`Route ${bus.vehicleNumber}`} />
      </div>

      {/* Route progress panel */}
      <SectionCard title="Route progress" icon={<Navigation size={18} />}>
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-border bg-surface-muted p-5">
            <div className="flex items-center justify-between text-meta">
              <div className="inline-flex items-center gap-1.5 font-medium text-text-secondary">
                <MapPin size={14} className="text-primary" /> {bus.currentStop}
              </div>
              <div className="inline-flex items-center gap-1.5 font-medium text-text-secondary">
                {bus.nextStop} <MapPin size={14} className="text-success" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <MapPin size={15} />
              </span>
              <ProgressBar value={progress} tone="info" className="h-2.5" />
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                <Bus size={15} />
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-micro text-text-tertiary">
              <span>Current stop</span>
              <span>{progress}% of leg complete</span>
              <span>Campus</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={handleRefresh} className="btn-primary" disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : undefined} />
              {refreshing ? 'Updating…' : 'Refresh location'}
            </button>
            <button onClick={handleCallDriver} className="btn-secondary">
              <Phone size={16} /> Call driver
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Driver + safety */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="eyebrow">Designated driver</div>
          <div className="mt-1.5 text-section text-foreground">{bus.driverName}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-meta text-text-secondary">
            <ShieldCheck size={14} className="text-success" /> Police background check verified
          </div>
        </Card>
        <Card className="p-5">
          <div className="eyebrow">Vehicle safety compliance</div>
          <div className="mt-1.5 text-body text-text-secondary">
            Speed governor installed · CCTV active · Female attendant on route
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-meta text-success-foreground">
            <CheckCircle2 size={14} className="text-success" /> All checks passed today
          </div>
        </Card>
      </div>

      {/* RFID boarding timeline */}
      <SectionCard title="Today's RFID boarding events" icon={<CheckCircle2 size={18} />}>
        <ol className="relative flex flex-col gap-5 pl-6">
          <span className="absolute left-[9px] top-1 bottom-1 w-px bg-border" aria-hidden />
          {bus.rfidLogs.map((log, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-6 top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-surface bg-success text-white">
                <CheckCircle2 size={11} />
              </span>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-meta font-semibold text-foreground">{log.event}</div>
                  <div className="text-micro text-text-tertiary">
                    <MapPin size={11} className="mr-1 inline align-[-1px]" />
                    {log.location}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {log.verified && <Badge tone="success">Verified</Badge>}
                  <span className="text-meta font-semibold text-info">{log.time}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
};

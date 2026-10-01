'use client';

import React, { useEffect, useState } from 'react';
import { useFamily } from '@/lib/familyContext';
import { dataService } from '@/lib/dataService';
import { DiaryEntry } from '@/lib/types';
import { PageHeader } from '@/components/ui';
import { DiaryFeed } from '@/components/common/DiaryFeed';

export const ParentDiary: React.FC = () => {
  const { activeChild, loading: familyLoading } = useFamily();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeChild?.batchId) {
      setEntries([]);
      setLoading(familyLoading);
      return;
    }
    let active = true;
    setLoading(true);
    dataService.getDiaryEntries(activeChild.batchId).then((rows) => {
      if (!active) return;
      setEntries(rows);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [activeChild?.batchId, familyLoading]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Daily Diary"
        subtitle={activeChild ? `Classwork and homework for ${activeChild.name}, ${activeChild.batchName}.` : undefined}
      />
      <DiaryFeed entries={entries} loading={loading} />
    </div>
  );
};

'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Student } from './types';
import { dataService } from './dataService';

interface FamilyValue {
  /** Every child linked to the signed-in guardian. */
  kids: Student[];
  /** The child whose data all parent screens currently show. */
  activeChild: Student | null;
  loading: boolean;
  selectChild: (id: string) => void;
}

const FamilyContext = createContext<FamilyValue | null>(null);

export const useFamily = (): FamilyValue => {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within a FamilyProvider');
  return ctx;
};

/** Loads the guardian's children once and shares the selected child across every parent screen. */
export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kids, setKids] = useState<Student[]>([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dataService.getParentChildren().then((rows) => {
      if (!active) return;
      setKids(rows || []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const selectChild = useCallback((id: string) => setActiveChildId(id), []);

  const value = useMemo<FamilyValue>(
    () => ({
      kids,
      activeChild: kids.find((k) => k.id === activeChildId) ?? kids[0] ?? null,
      loading,
      selectChild,
    }),
    [kids, activeChildId, loading, selectChild],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
};

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PayScale, GoalPlan, DailyEntry } from '@/lib/types';
import * as storage from '@/lib/storage';

export function usePayScale() {
  const [payScale, setPayScaleState] = useState<PayScale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPayScaleState(storage.getPayScale());
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setPayScale = useCallback((scale: PayScale) => {
    storage.savePayScale(scale);
    setPayScaleState(scale);
  }, []);

  return { payScale, setPayScale, loading };
}

export function useGoalPlans() {
  const [plans, setPlansState] = useState<GoalPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPlansState(storage.getGoalPlans());
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const refresh = useCallback(() => {
    setPlansState(storage.getGoalPlans());
  }, []);

  const savePlan = useCallback((plan: GoalPlan) => {
    storage.saveGoalPlan(plan);
    refresh();
  }, [refresh]);

  const deletePlan = useCallback((planId: string) => {
    storage.deletePlan(planId);
    refresh();
  }, [refresh]);

  const activePlan = plans.find(p => p.isActive) || null;

  return { plans, activePlan, savePlan, deletePlan, loading, refresh };
}

export function useDailyEntries(planId: string | null) {
  const [entries, setEntriesState] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (planId) {
        setEntriesState(storage.getEntriesForPlan(planId));
      } else {
        setEntriesState([]);
      }
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [planId]);

  const refresh = useCallback(() => {
    if (planId) {
      setEntriesState(storage.getEntriesForPlan(planId));
    }
  }, [planId]);

  const saveEntry = useCallback((entry: DailyEntry) => {
    storage.saveDailyEntry(entry);
    refresh();
  }, [refresh]);

  const deleteEntry = useCallback((entryId: string) => {
    storage.deleteDailyEntry(entryId);
    refresh();
  }, [refresh]);

  const getEntryForDate = useCallback((date: string): DailyEntry | null => {
    if (!planId) return null;
    return storage.getEntryForDate(planId, date);
  }, [planId]);

  return { entries, saveEntry, deleteEntry, getEntryForDate, loading, refresh };
}

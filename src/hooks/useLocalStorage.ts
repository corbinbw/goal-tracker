'use client';

import { useState, useEffect, useCallback } from 'react';
import { PayScale, GoalPlan, DailyEntry, DailyGoal, DailyDeal, HeadToHeadCompetition, HeadToHeadEntry, DailyActivity, DailyLead } from '@/lib/types';
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

export function useDailyCountdown(date: string, activePlanId: string | null) {
  const [goal, setGoalState] = useState<DailyGoal | null>(null);
  const [deals, setDealsState] = useState<DailyDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const syncPlanEntry = useCallback((nextDeals: DailyDeal[]) => {
    if (!activePlanId) return;
    storage.syncDailyDealsToPlanEntries(activePlanId, date, nextDeals);
  }, [activePlanId, date]);

  const refresh = useCallback(() => {
    setGoalState(storage.getDailyGoal(date));
    setDealsState(storage.getDealsForDate(date));
  }, [date]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh();
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const saveGoal = useCallback((nextGoal: DailyGoal) => {
    storage.saveDailyGoal(nextGoal);
    setGoalState(nextGoal);
  }, []);

  const addDeal = useCallback((deal: DailyDeal) => {
    storage.saveDailyDeal(deal);
    const nextDeals = storage.getDealsForDate(date);
    setDealsState(nextDeals);
    syncPlanEntry(nextDeals);
  }, [date, syncPlanEntry]);

  const deleteDeal = useCallback((dealId: string) => {
    storage.deleteDailyDeal(dealId);
    const nextDeals = storage.getDealsForDate(date);
    setDealsState(nextDeals);
    syncPlanEntry(nextDeals);
  }, [date, syncPlanEntry]);

  const updateDeal = useCallback((deal: DailyDeal) => {
    storage.saveDailyDeal(deal);
    const nextDeals = storage.getDealsForDate(date);
    setDealsState(nextDeals);
    syncPlanEntry(nextDeals);
  }, [date, syncPlanEntry]);

  const clearDeals = useCallback(() => {
    storage.clearDealsForDate(date);
    setDealsState([]);
    syncPlanEntry([]);
  }, [date, syncPlanEntry]);

  return {
    goal,
    deals,
    loading,
    saveGoal,
    addDeal,
    updateDeal,
    deleteDeal,
    clearDeals,
    refresh
  };
}

export function useAllDailyDeals() {
  const [deals, setDealsState] = useState<DailyDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setDealsState(storage.getDailyDeals());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh();
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return { deals, loading, refresh };
}

export function useHeadToHeadCompetition() {
  const [competition, setCompetitionState] = useState<HeadToHeadCompetition | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setCompetitionState(storage.getActiveHeadToHeadCompetition());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh();
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const saveCompetition = useCallback((nextCompetition: HeadToHeadCompetition) => {
    storage.saveHeadToHeadCompetition(nextCompetition);
    refresh();
  }, [refresh]);

  const addBuddyEntry = useCallback((competitionId: string, entry: HeadToHeadEntry) => {
    storage.addHeadToHeadEntry(competitionId, entry);
    refresh();
  }, [refresh]);

  const deleteBuddyEntry = useCallback((competitionId: string, entryId: string) => {
    storage.deleteHeadToHeadEntry(competitionId, entryId);
    refresh();
  }, [refresh]);

  return {
    competition,
    loading,
    saveCompetition,
    addBuddyEntry,
    deleteBuddyEntry,
    refresh
  };
}

export function useDailyActivity(date: string) {
  const [activity, setActivityState] = useState<DailyActivity | null>(null);
  const [activities, setActivitiesState] = useState<DailyActivity[]>([]);
  const [leads, setLeadsState] = useState<DailyLead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setActivityState(storage.getDailyActivity(date));
    setActivitiesState(storage.getDailyActivities());
    setLeadsState(storage.getLeadsForDate(date));
  }, [date]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh();
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const saveActivity = useCallback((nextActivity: DailyActivity) => {
    storage.saveDailyActivity(nextActivity);
    setActivityState(nextActivity);
    setActivitiesState(storage.getDailyActivities());
  }, []);

  const addLead = useCallback((lead: DailyLead) => {
    storage.saveDailyLead(lead);
    setLeadsState(storage.getLeadsForDate(date));
  }, [date]);

  const updateLead = useCallback((lead: DailyLead) => {
    storage.saveDailyLead(lead);
    setLeadsState(storage.getLeadsForDate(date));
  }, [date]);

  const deleteLead = useCallback((leadId: string) => {
    storage.deleteDailyLead(leadId);
    setLeadsState(storage.getLeadsForDate(date));
  }, [date]);

  return {
    activity,
    activities,
    leads,
    loading,
    saveActivity,
    addLead,
    updateLead,
    deleteLead,
    refresh
  };
}

import { PayScale, GoalPlan, DailyEntry, DEFAULT_PAY_SCALE } from './types';

const STORAGE_KEYS = {
  PAY_SCALE: 'goalTracker_payScale',
  GOAL_PLANS: 'goalTracker_goalPlans',
  DAILY_ENTRIES: 'goalTracker_dailyEntries',
};

// Pay Scale
export function getPayScale(): PayScale {
  if (typeof window === 'undefined') return DEFAULT_PAY_SCALE;

  const stored = localStorage.getItem(STORAGE_KEYS.PAY_SCALE);
  if (!stored) return DEFAULT_PAY_SCALE;

  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_PAY_SCALE;
  }
}

export function savePayScale(payScale: PayScale): void {
  localStorage.setItem(STORAGE_KEYS.PAY_SCALE, JSON.stringify(payScale));
}

// Goal Plans
export function getGoalPlans(): GoalPlan[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.GOAL_PLANS);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveGoalPlans(plans: GoalPlan[]): void {
  localStorage.setItem(STORAGE_KEYS.GOAL_PLANS, JSON.stringify(plans));
}

export function getActivePlan(): GoalPlan | null {
  const plans = getGoalPlans();
  return plans.find(p => p.isActive) || null;
}

export function saveGoalPlan(plan: GoalPlan): void {
  const plans = getGoalPlans();

  // If this plan is active, deactivate all others
  if (plan.isActive) {
    plans.forEach(p => p.isActive = false);
  }

  const existingIndex = plans.findIndex(p => p.id === plan.id);
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }

  saveGoalPlans(plans);
}

export function deletePlan(planId: string): void {
  const plans = getGoalPlans().filter(p => p.id !== planId);
  saveGoalPlans(plans);

  // Also delete associated entries
  const entries = getDailyEntries().filter(e => e.goalPlanId !== planId);
  saveDailyEntries(entries);
}

// Daily Entries
export function getDailyEntries(): DailyEntry[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveDailyEntries(entries: DailyEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(entries));
}

export function getEntriesForPlan(planId: string): DailyEntry[] {
  return getDailyEntries()
    .filter(e => e.goalPlanId === planId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function saveDailyEntry(entry: DailyEntry): void {
  const entries = getDailyEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  saveDailyEntries(entries);
}

export function deleteDailyEntry(entryId: string): void {
  const entries = getDailyEntries().filter(e => e.id !== entryId);
  saveDailyEntries(entries);
}

export function getEntryForDate(planId: string, date: string): DailyEntry | null {
  return getDailyEntries().find(e => e.goalPlanId === planId && e.date === date) || null;
}

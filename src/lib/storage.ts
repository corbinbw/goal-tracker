import { PayScale, GoalPlan, DailyEntry, DailyGoal, DailyDeal, HeadToHeadCompetition, HeadToHeadEntry, DailyActivity, DailyLead, DEFAULT_PAY_SCALE } from './types';

const STORAGE_KEYS = {
  PAY_SCALE: 'goalTracker_payScale',
  GOAL_PLANS: 'goalTracker_goalPlans',
  DAILY_ENTRIES: 'goalTracker_dailyEntries',
  DAILY_GOALS: 'goalTracker_dailyGoals',
  DAILY_DEALS: 'goalTracker_dailyDeals',
  HEAD_TO_HEAD: 'goalTracker_headToHead',
  DAILY_ACTIVITIES: 'goalTracker_dailyActivities',
  DAILY_LEADS: 'goalTracker_dailyLeads',
  BACKUPS: 'goalTracker_backups',
  CURRENT_USER: 'goalTracker_currentUserId',
};

export interface AppDataSnapshot {
  payScale: PayScale;
  goalPlans: GoalPlan[];
  dailyEntries: DailyEntry[];
  dailyGoals: DailyGoal[];
  dailyDeals: DailyDeal[];
  headToHead: HeadToHeadCompetition[];
  dailyActivities: DailyActivity[];
  dailyLeads: DailyLead[];
}

export interface AppDataBackup {
  id: string;
  createdAt: string;
  reason: string;
  data: AppDataSnapshot;
}

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

// Daily Countdown Goals
export function getDailyGoals(): DailyGoal[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveDailyGoals(goals: DailyGoal[]): void {
  localStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(goals));
}

export function getDailyGoal(date: string): DailyGoal {
  const existing = getDailyGoals().find(goal => goal.date === date);

  return existing || {
    date,
    revenueGoal: 0,
    closeGoal: 0
  };
}

export function saveDailyGoal(goal: DailyGoal): void {
  const goals = getDailyGoals();
  const existingIndex = goals.findIndex(item => item.date === goal.date);

  if (existingIndex >= 0) {
    goals[existingIndex] = goal;
  } else {
    goals.push(goal);
  }

  saveDailyGoals(goals);
}

// Daily Countdown Deals
export function getDailyDeals(): DailyDeal[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_DEALS);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveDailyDeals(deals: DailyDeal[]): void {
  localStorage.setItem(STORAGE_KEYS.DAILY_DEALS, JSON.stringify(deals));
}

export function getDealsForDate(date: string): DailyDeal[] {
  return getDailyDeals()
    .filter(deal => deal.date === date)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveDailyDeal(deal: DailyDeal): void {
  const deals = getDailyDeals();
  const existingIndex = deals.findIndex(item => item.id === deal.id);

  if (existingIndex >= 0) {
    deals[existingIndex] = deal;
  } else {
    deals.push(deal);
  }

  saveDailyDeals(deals);
}

export function deleteDailyDeal(dealId: string): void {
  saveDailyDeals(getDailyDeals().filter(deal => deal.id !== dealId));
}

export function clearDealsForDate(date: string): void {
  saveDailyDeals(getDailyDeals().filter(deal => deal.date !== date));
}

export function syncDailyDealsToPlanEntries(planId: string, date: string, deals: DailyDeal[]): void {
  const allEntries = getDailyEntries();
  const manualEntries = allEntries.filter(entry => {
    const oldAggregateId = `daily-${planId}-${date}`;
    return entry.id !== oldAggregateId && !(entry.goalPlanId === planId && entry.date === date && entry.syncedDealId);
  });

  const syncedEntries: DailyEntry[] = deals.map(deal => ({
    id: `today-${planId}-${deal.id}`,
    goalPlanId: planId,
    date,
    revenue: deal.revenue,
    notes: 'Synced from Today countdown',
    driverName: deal.name,
    dealTag: deal.dealTag || null,
    funded: Boolean(deal.funded),
    syncedDealId: deal.id
  }));

  saveDailyEntries([...manualEntries, ...syncedEntries]);
}

// Head to Head Competitions
export function getHeadToHeadCompetitions(): HeadToHeadCompetition[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.HEAD_TO_HEAD);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveHeadToHeadCompetitions(competitions: HeadToHeadCompetition[]): void {
  localStorage.setItem(STORAGE_KEYS.HEAD_TO_HEAD, JSON.stringify(competitions));
}

export function getActiveHeadToHeadCompetition(): HeadToHeadCompetition | null {
  return getHeadToHeadCompetitions().find(competition => competition.isActive) || null;
}

export function saveHeadToHeadCompetition(competition: HeadToHeadCompetition): void {
  const competitions = getHeadToHeadCompetitions();

  if (competition.isActive) {
    competitions.forEach(item => item.isActive = false);
  }

  const existingIndex = competitions.findIndex(item => item.id === competition.id);
  if (existingIndex >= 0) {
    competitions[existingIndex] = competition;
  } else {
    competitions.push(competition);
  }

  saveHeadToHeadCompetitions(competitions);
}

export function addHeadToHeadEntry(competitionId: string, entry: HeadToHeadEntry): void {
  const competitions = getHeadToHeadCompetitions();
  const competition = competitions.find(item => item.id === competitionId);
  if (!competition) return;

  competition.buddyEntries = [...competition.buddyEntries, entry].sort((a, b) => a.date.localeCompare(b.date));
  saveHeadToHeadCompetitions(competitions);
}

export function deleteHeadToHeadEntry(competitionId: string, entryId: string): void {
  const competitions = getHeadToHeadCompetitions();
  const competition = competitions.find(item => item.id === competitionId);
  if (!competition) return;

  competition.buddyEntries = competition.buddyEntries.filter(entry => entry.id !== entryId);
  saveHeadToHeadCompetitions(competitions);
}

// Daily Activity
export function getDailyActivities(): DailyActivity[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_ACTIVITIES);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveDailyActivities(activities: DailyActivity[]): void {
  localStorage.setItem(STORAGE_KEYS.DAILY_ACTIVITIES, JSON.stringify(activities));
}

export function getDailyActivity(date: string): DailyActivity {
  const existing = getDailyActivities().find(activity => activity.date === date);

  return {
    ...existing,
    date,
    calls: existing?.calls || 0,
    texts: existing?.texts || 0,
    contacts: existing?.contacts || 0,
    appointments: existing?.appointments || 0,
    voicemails: existing?.voicemails || 0,
    callBacks: existing?.callBacks || 0,
    crmUpdates: existing?.crmUpdates || 0,
    sales: existing?.sales || 0,
    updatedAt: existing?.updatedAt || new Date().toISOString()
  };
}

export function saveDailyActivity(activity: DailyActivity): void {
  const activities = getDailyActivities();
  const existingIndex = activities.findIndex(item => item.date === activity.date);
  const nextActivity = {
    ...activity,
    calls: activity.calls || 0,
    texts: activity.texts || 0,
    contacts: activity.contacts || 0,
    appointments: activity.appointments || 0,
    voicemails: activity.voicemails || 0,
    callBacks: activity.callBacks || 0,
    crmUpdates: activity.crmUpdates || 0,
    sales: activity.sales || 0
  };

  if (existingIndex >= 0) {
    activities[existingIndex] = nextActivity;
  } else {
    activities.push(nextActivity);
  }

  saveDailyActivities(activities);
}

export function getDailyLeads(): DailyLead[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_LEADS);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveDailyLeads(leads: DailyLead[]): void {
  localStorage.setItem(STORAGE_KEYS.DAILY_LEADS, JSON.stringify(leads));
}

export function getLeadsForDate(date: string): DailyLead[] {
  return getDailyLeads()
    .filter(lead => lead.date === date)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveDailyLead(lead: DailyLead): void {
  const leads = getDailyLeads();
  const existingIndex = leads.findIndex(item => item.id === lead.id);

  if (existingIndex >= 0) {
    leads[existingIndex] = lead;
  } else {
    leads.push(lead);
  }

  saveDailyLeads(leads);
}

export function deleteDailyLead(leadId: string): void {
  saveDailyLeads(getDailyLeads().filter(lead => lead.id !== leadId));
}

export function exportAppData(): AppDataSnapshot {
  return {
    payScale: getPayScale(),
    goalPlans: getGoalPlans(),
    dailyEntries: getDailyEntries(),
    dailyGoals: getDailyGoals(),
    dailyDeals: getDailyDeals(),
    headToHead: getHeadToHeadCompetitions(),
    dailyActivities: getDailyActivities(),
    dailyLeads: getDailyLeads()
  };
}

export function importAppData(data: Partial<AppDataSnapshot>): void {
  if (data.payScale) savePayScale(data.payScale);
  if (Array.isArray(data.goalPlans)) saveGoalPlans(data.goalPlans);
  if (Array.isArray(data.dailyEntries)) saveDailyEntries(data.dailyEntries);
  if (Array.isArray(data.dailyGoals)) saveDailyGoals(data.dailyGoals);
  if (Array.isArray(data.dailyDeals)) saveDailyDeals(data.dailyDeals);
  if (Array.isArray(data.headToHead)) saveHeadToHeadCompetitions(data.headToHead);
  if (Array.isArray(data.dailyActivities)) saveDailyActivities(data.dailyActivities);
  if (Array.isArray(data.dailyLeads)) saveDailyLeads(data.dailyLeads);
}

export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEYS.PAY_SCALE);
  localStorage.removeItem(STORAGE_KEYS.GOAL_PLANS);
  localStorage.removeItem(STORAGE_KEYS.DAILY_ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.DAILY_GOALS);
  localStorage.removeItem(STORAGE_KEYS.DAILY_DEALS);
  localStorage.removeItem(STORAGE_KEYS.HEAD_TO_HEAD);
  localStorage.removeItem(STORAGE_KEYS.DAILY_ACTIVITIES);
  localStorage.removeItem(STORAGE_KEYS.DAILY_LEADS);
}

export function getCurrentLocalUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

export function setCurrentLocalUserId(userId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
}

export function hasMeaningfulAppData(data: Partial<AppDataSnapshot> = exportAppData()): boolean {
  const hasPlans = Array.isArray(data.goalPlans) && data.goalPlans.length > 0;
  const hasEntries = Array.isArray(data.dailyEntries) && data.dailyEntries.length > 0;
  const hasDeals = Array.isArray(data.dailyDeals) && data.dailyDeals.length > 0;
  const hasCompetitions = Array.isArray(data.headToHead) && data.headToHead.length > 0;
  const hasGoals = Array.isArray(data.dailyGoals) && data.dailyGoals.some(goal => goal.revenueGoal > 0 || goal.closeGoal > 0);
  const hasActivity = Array.isArray(data.dailyActivities) && data.dailyActivities.some(activity =>
    activity.calls > 0 ||
    activity.texts > 0 ||
    (activity.contacts || 0) > 0 ||
    (activity.appointments || 0) > 0 ||
    (activity.voicemails || 0) > 0 ||
    (activity.callBacks || 0) > 0 ||
    (activity.crmUpdates || 0) > 0 ||
    (activity.sales || 0) > 0
  );
  const hasLeads = Array.isArray(data.dailyLeads) && data.dailyLeads.length > 0;

  return hasPlans || hasEntries || hasDeals || hasCompetitions || hasGoals || hasActivity || hasLeads;
}

export function getLocalBackups(): AppDataBackup[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.BACKUPS);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function createLocalBackup(reason: string): AppDataBackup {
  const backup: AppDataBackup = {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    reason,
    data: exportAppData()
  };
  const backups = [backup, ...getLocalBackups()].slice(0, 10);
  localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  return backup;
}

export function restoreLatestLocalBackup(): AppDataBackup | null {
  const latest = getLocalBackups()[0] || null;
  if (!latest) return null;

  importAppData(latest.data);
  return latest;
}

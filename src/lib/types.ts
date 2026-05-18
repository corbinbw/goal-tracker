// Type definitions for the Goal Tracker app

export interface Tier {
  name: string;
  minRevenue: number;
  maxRevenue: number | null; // null means infinity
  rate: number; // decimal, e.g., 0.045 for 4.5%
}

export interface PayScale {
  id: string;
  tierType: 'retroactive' | 'marginal';
  tiers: Tier[];
  avgDealSize: number | null;
}

export interface GoalPlan {
  id: string;
  createdAt: string;
  goalType: 'commission' | 'revenue';
  goalAmount: number;
  revenueTarget: number; // computed if commission goal
  workdaysTotal: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

export interface DailyEntry {
  id: string;
  goalPlanId: string;
  date: string; // ISO date string YYYY-MM-DD
  revenue: number;
  notes: string | null;
  driverName?: string | null;
  dealTag?: string | null;
  funded?: boolean;
  syncedDealId?: string | null;
}

export interface DailyGoal {
  date: string; // ISO date string YYYY-MM-DD
  revenueGoal: number;
  closeGoal: number;
}

export interface DailyDeal {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  revenue: number;
  name: string;
  dealTag?: string | null;
  createdAt: string;
  funded?: boolean;
}

export interface HeadToHeadEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  revenue: number;
  createdAt: string;
}

export interface HeadToHeadCompetition {
  id: string;
  buddyName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  isActive: boolean;
  buddyEntries: HeadToHeadEntry[];
}

export interface DashboardStats {
  revenueGoal: number;
  revenueSoFar: number;
  revenueRemaining: number;
  signedRevenue: number;
  fundedRevenue: number;
  signedDeals: number;
  fundedDeals: number;
  workdaysTotal: number;
  workdaysUsed: number;
  workdaysRemaining: number;
  requiredPerDay: number;
  estimatedCommission: number;
  currentTier: Tier | null;
  dealsNeeded: number | null;
  dealsPerDay: number | null;
}

// Default pay scale based on the PDF
export const DEFAULT_PAY_SCALE: PayScale = {
  id: 'default',
  tierType: 'retroactive',
  tiers: [
    { name: 'Tier 1', minRevenue: 0, maxRevenue: 49999, rate: 0.045 },
    { name: 'Tier 2', minRevenue: 50000, maxRevenue: 99999, rate: 0.055 },
    { name: 'Tier 3', minRevenue: 100000, maxRevenue: null, rate: 0.065 },
  ],
  avgDealSize: null,
};

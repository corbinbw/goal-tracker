import { Tier, PayScale, GoalPlan, DailyEntry, DashboardStats } from './types';

/**
 * Get the current tier based on revenue amount (for retroactive tiers)
 */
export function getCurrentTier(revenue: number, tiers: Tier[]): Tier {
  // Sort tiers by minRevenue descending to find the highest applicable tier
  const sortedTiers = [...tiers].sort((a, b) => b.minRevenue - a.minRevenue);

  for (const tier of sortedTiers) {
    if (revenue >= tier.minRevenue) {
      return tier;
    }
  }

  // Fallback to first tier
  return tiers[0];
}

/**
 * Calculate commission for retroactive tier system
 */
export function calculateRetroactiveCommission(revenue: number, tiers: Tier[]): number {
  const tier = getCurrentTier(revenue, tiers);
  return revenue * tier.rate;
}

/**
 * Calculate commission for marginal tier system
 */
export function calculateMarginalCommission(revenue: number, tiers: Tier[]): number {
  let totalCommission = 0;
  let remainingRevenue = revenue;

  const sortedTiers = [...tiers].sort((a, b) => a.minRevenue - b.minRevenue);

  for (const tier of sortedTiers) {
    if (remainingRevenue <= 0) break;

    const tierMax = tier.maxRevenue ?? Infinity;
    const tierRange = tierMax - tier.minRevenue + 1;
    const revenueInTier = Math.min(remainingRevenue, tierRange);

    totalCommission += revenueInTier * tier.rate;
    remainingRevenue -= revenueInTier;
  }

  return totalCommission;
}

/**
 * Calculate commission based on tier type
 */
export function calculateCommission(revenue: number, payScale: PayScale): number {
  if (payScale.tierType === 'retroactive') {
    return calculateRetroactiveCommission(revenue, payScale.tiers);
  }
  return calculateMarginalCommission(revenue, payScale.tiers);
}

/**
 * Calculate required revenue for a commission goal (retroactive tiers)
 */
export function calculateRevenueForCommissionGoal(
  commissionGoal: number,
  tiers: Tier[],
  targetTier?: Tier
): { revenue: number; tier: Tier } {
  const sortedTiers = [...tiers].sort((a, b) => a.minRevenue - b.minRevenue);

  // If target tier specified, use that
  if (targetTier) {
    const requiredRevenue = commissionGoal / targetTier.rate;
    // Make sure we at least hit the tier minimum
    const revenue = Math.max(requiredRevenue, targetTier.minRevenue);
    return { revenue, tier: targetTier };
  }

  // Find the smallest valid revenue across all tiers
  let bestResult: { revenue: number; tier: Tier } | null = null;

  for (const tier of sortedTiers) {
    const requiredAtRate = commissionGoal / tier.rate;
    const tierMax = tier.maxRevenue ?? Infinity;

    // Check if this required revenue falls within the tier's valid range
    // For tier to apply, revenue must be >= tier.minRevenue
    // And revenue must be <= tier.maxRevenue (if it exists)
    if (requiredAtRate >= tier.minRevenue && requiredAtRate <= tierMax) {
      if (!bestResult || requiredAtRate < bestResult.revenue) {
        bestResult = { revenue: requiredAtRate, tier };
      }
    }
  }

  // If no valid tier found, use the highest tier
  if (!bestResult) {
    const highestTier = sortedTiers[sortedTiers.length - 1];
    const revenue = Math.max(commissionGoal / highestTier.rate, highestTier.minRevenue);
    return { revenue, tier: highestTier };
  }

  return bestResult;
}

/**
 * Calculate dashboard statistics
 */
export function calculateDashboardStats(
  plan: GoalPlan,
  entries: DailyEntry[],
  payScale: PayScale
): DashboardStats {
  const revenueSoFar = entries.reduce((sum, entry) => sum + entry.revenue, 0);
  const revenueRemaining = Math.max(plan.revenueTarget - revenueSoFar, 0);
  const workdaysUsed = entries.length;
  const workdaysRemaining = Math.max(plan.workdaysTotal - workdaysUsed, 0);
  const requiredPerDay = workdaysRemaining > 0 ? revenueRemaining / workdaysRemaining : revenueRemaining;

  const currentTier = getCurrentTier(revenueSoFar, payScale.tiers);
  const estimatedCommission = calculateCommission(revenueSoFar, payScale);

  let dealsNeeded: number | null = null;
  let dealsPerDay: number | null = null;

  if (payScale.avgDealSize && payScale.avgDealSize > 0) {
    dealsNeeded = Math.ceil(revenueRemaining / payScale.avgDealSize);
    dealsPerDay = workdaysRemaining > 0 ? Math.ceil(dealsNeeded / workdaysRemaining) : dealsNeeded;
  }

  return {
    revenueGoal: plan.revenueTarget,
    revenueSoFar,
    revenueRemaining,
    workdaysTotal: plan.workdaysTotal,
    workdaysUsed,
    workdaysRemaining,
    requiredPerDay,
    estimatedCommission,
    currentTier,
    dealsNeeded,
    dealsPerDay,
  };
}

/**
 * Calculate what-if scenarios for hitting different tiers
 */
export function calculateTierProjections(
  currentRevenue: number,
  tiers: Tier[]
): { tier: Tier; revenueNeeded: number; additionalRevenue: number; commission: number }[] {
  return tiers.map(tier => {
    const revenueNeeded = tier.minRevenue;
    const additionalRevenue = Math.max(revenueNeeded - currentRevenue, 0);
    const commission = revenueNeeded * tier.rate;

    return { tier, revenueNeeded, additionalRevenue, commission };
  }).filter(p => p.revenueNeeded >= currentRevenue || p.additionalRevenue === 0);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get today's date in ISO format
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

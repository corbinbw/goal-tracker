'use client';

import { useState } from 'react';
import { PayScale, GoalPlan, Tier } from '@/lib/types';
import {
  calculateRevenueForCommissionGoal,
  formatCurrency,
  formatPercent,
  generateId,
  getTodayISO
} from '@/lib/calculations';

interface Props {
  payScale: PayScale;
  onCreatePlan: (plan: GoalPlan) => void;
}

export default function NewGoalForm({ payScale, onCreatePlan }: Props) {
  const [goalType, setGoalType] = useState<'commission' | 'revenue'>('commission');
  const [goalAmount, setGoalAmount] = useState<string>('');
  const [workdays, setWorkdays] = useState<string>('5');
  const [targetTier, setTargetTier] = useState<string>('auto');

  const calculatePlan = () => {
    const amount = parseFloat(goalAmount) || 0;
    const days = parseInt(workdays) || 5;

    if (goalType === 'revenue') {
      return {
        revenueTarget: amount,
        dailyTarget: amount / days,
        tier: null,
        tierNote: 'Direct revenue goal'
      };
    }

    // Commission goal
    let selectedTier: Tier | undefined;
    if (targetTier !== 'auto') {
      selectedTier = payScale.tiers.find(t => t.name === targetTier);
    }

    const { revenue, tier } = calculateRevenueForCommissionGoal(
      amount,
      payScale.tiers,
      selectedTier
    );

    return {
      revenueTarget: revenue,
      dailyTarget: revenue / days,
      tier,
      tierNote: `Calculated at ${formatPercent(tier.rate)} (${tier.name})`
    };
  };

  const preview = goalAmount ? calculatePlan() : null;

  const handleCreate = () => {
    if (!preview) return;

    const plan: GoalPlan = {
      id: generateId(),
      createdAt: getTodayISO(),
      goalType,
      goalAmount: parseFloat(goalAmount),
      revenueTarget: preview.revenueTarget,
      workdaysTotal: parseInt(workdays) || 5,
      startDate: getTodayISO(),
      endDate: null,
      isActive: true
    };

    onCreatePlan(plan);
  };

  const dealsPerDay = preview && payScale.avgDealSize
    ? Math.ceil(preview.dailyTarget / payScale.avgDealSize)
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-emerald-700">Planning</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">Create New Goal</h2>
        </div>

      <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Goal Type
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-stone-100 p-1">
          <label className={`cursor-pointer rounded-md px-3 py-2 text-center text-sm font-semibold transition-colors ${
            goalType === 'commission' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
          }`}>
            <input
              type="radio"
              value="commission"
              checked={goalType === 'commission'}
              onChange={() => setGoalType('commission')}
              className="sr-only"
            />
            <span>Commission Goal</span>
          </label>
          <label className={`cursor-pointer rounded-md px-3 py-2 text-center text-sm font-semibold transition-colors ${
            goalType === 'revenue' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
          }`}>
            <input
              type="radio"
              value="revenue"
              checked={goalType === 'revenue'}
              onChange={() => setGoalType('revenue')}
              className="sr-only"
            />
            <span>Revenue Goal</span>
          </label>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {goalType === 'commission' ? 'Commission Goal' : 'Revenue Goal'}
        </label>
        <div className="flex max-w-xs items-center rounded-md border border-stone-300 bg-white px-3 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-200">
          <span className="mr-1 text-slate-500">$</span>
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder={goalType === 'commission' ? 'e.g., 1500' : 'e.g., 33333'}
            className="min-w-0 flex-1 py-2 text-lg outline-none"
          />
        </div>
      </div>

      {goalType === 'commission' && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Target Tier (optional)
          </label>
          <select
            value={targetTier}
            onChange={(e) => setTargetTier(e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 sm:w-auto"
          >
            <option value="auto">Auto (lowest valid tier)</option>
            {payScale.tiers.map((tier) => (
              <option key={tier.name} value={tier.name}>
                Plan for {tier.name} ({formatPercent(tier.rate)})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Choose a higher tier if you plan to exceed its threshold anyway
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Workdays This Period
        </label>
        <input
          type="number"
          value={workdays}
          onChange={(e) => setWorkdays(e.target.value)}
          min="1"
          max="31"
          className="w-24 rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={!preview || parseFloat(goalAmount) <= 0}
        className="w-full rounded-md bg-slate-950 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        Create Plan & Start Tracking
      </button>
      </div>
      </section>

      <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Plan Preview</h3>
      {preview && parseFloat(goalAmount) > 0 && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4">
            <span className="text-sm font-medium text-emerald-700">Revenue Target</span>
            <div className="mt-1 text-3xl font-semibold text-emerald-950">
                {formatCurrency(preview.revenueTarget)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-stone-50 p-3">
              <span className="text-slate-500">Daily Target</span>
              <div className="mt-1 font-semibold text-slate-950">
                {formatCurrency(preview.dailyTarget)}
              </div>
            </div>
            {dealsPerDay && (
              <div className="rounded-md bg-stone-50 p-3">
                <span className="text-slate-500">Deals/Day</span>
                <div className="mt-1 font-semibold text-slate-950">
                  ~{dealsPerDay} deals
                </div>
              </div>
            )}
            {preview.tier && (
              <div className="rounded-md bg-stone-50 p-3">
                <span className="text-slate-500">Tier</span>
                <div className="mt-1 font-semibold text-slate-950">
                  {preview.tier.name} ({formatPercent(preview.tier.rate)})
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500">{preview.tierNote}</p>
        </div>
      )}
      {(!preview || parseFloat(goalAmount) <= 0) && (
        <div className="mt-4 rounded-lg bg-stone-50 p-4 text-sm text-slate-500">
          Enter a goal amount to preview the revenue target and daily pace.
        </div>
      )}
      </aside>
    </div>
  );
}

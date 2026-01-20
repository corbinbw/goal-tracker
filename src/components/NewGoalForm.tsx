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
  const [showPreview, setShowPreview] = useState(false);

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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Create New Goal</h2>

      {/* Goal Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Goal Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="commission"
              checked={goalType === 'commission'}
              onChange={() => setGoalType('commission')}
              className="mr-2"
            />
            <span>Commission Goal</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="revenue"
              checked={goalType === 'revenue'}
              onChange={() => setGoalType('revenue')}
              className="mr-2"
            />
            <span>Revenue Goal</span>
          </label>
        </div>
      </div>

      {/* Goal Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {goalType === 'commission' ? 'Commission Goal' : 'Revenue Goal'}
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">$</span>
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder={goalType === 'commission' ? 'e.g., 1500' : 'e.g., 33333'}
            className="w-40 px-3 py-2 border rounded text-lg"
          />
        </div>
      </div>

      {/* Target Tier (only for commission goal) */}
      {goalType === 'commission' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Tier (optional)
          </label>
          <select
            value={targetTier}
            onChange={(e) => setTargetTier(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="auto">Auto (lowest valid tier)</option>
            {payScale.tiers.map((tier) => (
              <option key={tier.name} value={tier.name}>
                Plan for {tier.name} ({formatPercent(tier.rate)})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose a higher tier if you plan to exceed its threshold anyway
          </p>
        </div>
      )}

      {/* Workdays */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Workdays This Period
        </label>
        <input
          type="number"
          value={workdays}
          onChange={(e) => setWorkdays(e.target.value)}
          min="1"
          max="31"
          className="w-20 px-3 py-2 border rounded"
        />
      </div>

      {/* Preview Card */}
      {preview && parseFloat(goalAmount) > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3">Plan Preview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Revenue Target:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {formatCurrency(preview.revenueTarget)}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Daily Target:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {formatCurrency(preview.dailyTarget)}
              </span>
            </div>
            {dealsPerDay && (
              <div>
                <span className="text-blue-700">Deals/Day:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  ~{dealsPerDay} deals
                </span>
              </div>
            )}
            {preview.tier && (
              <div>
                <span className="text-blue-700">Tier:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  {preview.tier.name} ({formatPercent(preview.tier.rate)})
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-blue-600 mt-2">{preview.tierNote}</p>
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!preview || parseFloat(goalAmount) <= 0}
        className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Create Plan & Start Tracking
      </button>
    </div>
  );
}

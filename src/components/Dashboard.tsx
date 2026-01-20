'use client';

import { useState } from 'react';
import { PayScale, GoalPlan, DailyEntry, DashboardStats } from '@/lib/types';
import {
  calculateDashboardStats,
  calculateTierProjections,
  formatCurrency,
  formatPercent,
  formatDate,
  generateId,
  getTodayISO
} from '@/lib/calculations';

interface Props {
  plan: GoalPlan;
  entries: DailyEntry[];
  payScale: PayScale;
  onSaveEntry: (entry: DailyEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onEndPlan: () => void;
}

export default function Dashboard({
  plan,
  entries,
  payScale,
  onSaveEntry,
  onDeleteEntry,
  onEndPlan
}: Props) {
  const [todayRevenue, setTodayRevenue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const stats = calculateDashboardStats(plan, entries, payScale);
  const projections = calculateTierProjections(stats.revenueSoFar, payScale.tiers);
  const today = getTodayISO();
  const todayEntry = entries.find(e => e.date === today);

  const handleAddEntry = () => {
    const revenue = parseFloat(todayRevenue);
    if (isNaN(revenue) || revenue < 0) return;

    const entry: DailyEntry = {
      id: todayEntry?.id || generateId(),
      goalPlanId: plan.id,
      date: today,
      revenue,
      notes: notes || null
    };

    onSaveEntry(entry);
    setTodayRevenue('');
    setNotes('');
  };

  const handleEditEntry = (entry: DailyEntry) => {
    setEditingEntry(entry.id);
    setEditValue(entry.revenue.toString());
  };

  const handleSaveEdit = (entry: DailyEntry) => {
    const revenue = parseFloat(editValue);
    if (!isNaN(revenue) && revenue >= 0) {
      onSaveEntry({ ...entry, revenue });
    }
    setEditingEntry(null);
    setEditValue('');
  };

  const goalMissed = stats.workdaysRemaining === 0 && stats.revenueRemaining > 0;
  const goalReached = stats.revenueRemaining === 0;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {goalReached && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-center">
          <span className="text-green-800 font-semibold text-lg">Goal Reached!</span>
          <p className="text-green-700 text-sm mt-1">
            You hit {formatCurrency(stats.revenueSoFar)} revenue
          </p>
        </div>
      )}
      {goalMissed && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-center">
          <span className="text-red-800 font-semibold">Period Ended</span>
          <p className="text-red-700 text-sm mt-1">
            Fell short by {formatCurrency(stats.revenueRemaining)}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Revenue Goal"
          value={formatCurrency(stats.revenueGoal)}
          subtext={plan.goalType === 'commission' ? `(${formatCurrency(plan.goalAmount)} commission)` : undefined}
        />
        <StatCard
          label="Revenue So Far"
          value={formatCurrency(stats.revenueSoFar)}
          highlight={stats.revenueSoFar > 0}
        />
        <StatCard
          label="Remaining"
          value={formatCurrency(stats.revenueRemaining)}
          variant={stats.revenueRemaining === 0 ? 'success' : 'default'}
        />
        <StatCard
          label="Days Left"
          value={`${stats.workdaysRemaining} / ${stats.workdaysTotal}`}
          variant={stats.workdaysRemaining <= 1 ? 'warning' : 'default'}
        />
        <StatCard
          label="Required/Day"
          value={formatCurrency(stats.requiredPerDay)}
          subtext="to hit goal"
          variant={stats.requiredPerDay > stats.revenueGoal / stats.workdaysTotal * 1.5 ? 'warning' : 'default'}
        />
        <StatCard
          label="Est. Commission"
          value={formatCurrency(stats.estimatedCommission)}
          subtext={stats.currentTier ? `at ${formatPercent(stats.currentTier.rate)}` : undefined}
          highlight
        />
      </div>

      {/* Deals Estimate */}
      {stats.dealsNeeded !== null && (
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <span className="text-gray-600 text-sm">
            Need ~<strong>{stats.dealsNeeded}</strong> more deals
            {stats.dealsPerDay !== null && stats.workdaysRemaining > 0 && (
              <> ({stats.dealsPerDay}/day)</>
            )}
          </span>
        </div>
      )}

      {/* Today's Entry */}
      {!goalReached && stats.workdaysRemaining > 0 && (
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="font-medium text-gray-900 mb-3">
            {todayEntry ? "Update Today's Revenue" : "Log Today's Revenue"}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center flex-1">
              <span className="text-gray-500 mr-1">$</span>
              <input
                type="number"
                value={todayRevenue}
                onChange={(e) => setTodayRevenue(e.target.value)}
                placeholder={todayEntry ? `Current: ${todayEntry.revenue}` : 'Revenue amount'}
                className="flex-1 px-3 py-2 border rounded"
              />
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleAddEntry}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {todayEntry ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <h3 className="font-medium text-gray-900 p-4 border-b bg-gray-50">
            Daily Entries
          </h3>
          <ul className="divide-y">
            {entries.slice().reverse().map((entry) => (
              <li key={entry.id} className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-gray-600 text-sm">{formatDate(entry.date)}</span>
                  {editingEntry === entry.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-28 px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(entry)}
                        className="text-blue-600 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="text-gray-500 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {formatCurrency(entry.revenue)}
                      {entry.notes && (
                        <span className="text-gray-500 text-sm ml-2">– {entry.notes}</span>
                      )}
                    </div>
                  )}
                </div>
                {editingEntry !== entry.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tier Projections */}
      {projections.length > 0 && stats.revenueSoFar > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">What If I Hit...</h3>
          <div className="space-y-2">
            {projections.map(({ tier, revenueNeeded, additionalRevenue, commission }) => (
              <div
                key={tier.name}
                className={`p-3 rounded ${
                  stats.revenueSoFar >= tier.minRevenue
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {tier.name} ({formatPercent(tier.rate)})
                  </span>
                  <span className="text-green-700 font-semibold">
                    {formatCurrency(commission)} commission
                  </span>
                </div>
                {additionalRevenue > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Need {formatCurrency(additionalRevenue)} more to reach {formatCurrency(revenueNeeded)}
                  </p>
                )}
                {stats.revenueSoFar >= tier.minRevenue && (
                  <p className="text-sm text-green-600 mt-1">Currently in this tier</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End Plan Button */}
      <div className="pt-4 border-t">
        <button
          onClick={onEndPlan}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          End This Plan / Start New
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  variant = 'default',
  highlight = false
}: {
  label: string;
  value: string;
  subtext?: string;
  variant?: 'default' | 'success' | 'warning';
  highlight?: boolean;
}) {
  const bgColor = {
    default: 'bg-white',
    success: 'bg-green-50',
    warning: 'bg-amber-50'
  }[variant];

  const textColor = {
    default: highlight ? 'text-blue-600' : 'text-gray-900',
    success: 'text-green-700',
    warning: 'text-amber-700'
  }[variant];

  return (
    <div className={`p-4 rounded-lg border ${bgColor}`}>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold mt-1 ${textColor}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

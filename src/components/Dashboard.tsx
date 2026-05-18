'use client';

import { useState } from 'react';
import { PayScale, GoalPlan, DailyEntry } from '@/lib/types';
import {
  calculateRevenueForCommissionGoal,
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
  onSavePlan: (plan: GoalPlan) => void;
  onSaveEntry: (entry: DailyEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onEndPlan: () => void;
}

export default function Dashboard({
  plan,
  entries,
  payScale,
  onSavePlan,
  onSaveEntry,
  onDeleteEntry,
  onEndPlan
}: Props) {
  const [todayRevenue, setTodayRevenue] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [dealTag, setDealTag] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(getTodayISO());
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingPlan, setEditingPlan] = useState(false);
  const [goalType, setGoalType] = useState<'commission' | 'revenue'>(plan.goalType);
  const [goalAmount, setGoalAmount] = useState(plan.goalAmount.toString());
  const [startDate, setStartDate] = useState(plan.startDate || '');
  const [endDate, setEndDate] = useState(plan.endDate || '');
  const [workdays, setWorkdays] = useState(plan.workdaysTotal.toString());

  const stats = calculateDashboardStats(plan, entries, payScale);
  const projections = calculateTierProjections(stats.revenueSoFar, payScale.tiers);
  const progressPercent = stats.revenueGoal > 0
    ? Math.min((stats.revenueSoFar / stats.revenueGoal) * 100, 100)
    : 0;
  const averagePerLoggedDay = entries.length > 0 ? stats.revenueSoFar / entries.length : 0;

  const handleAddEntry = () => {
    const revenue = parseFloat(todayRevenue);
    if (isNaN(revenue) || revenue < 0) return;

    const entry: DailyEntry = {
      id: generateId(),
      goalPlanId: plan.id,
      date: entryDate,
      revenue,
      notes: notes || null,
      driverName: driverName || null,
      dealTag: dealTag || null,
      funded: false
    };

    onSaveEntry(entry);
    setTodayRevenue('');
    setDriverName('');
    setDealTag('');
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

  const startPlanEdit = () => {
    setGoalType(plan.goalType);
    setGoalAmount(plan.goalAmount.toString());
    setStartDate(plan.startDate || '');
    setEndDate(plan.endDate || '');
    setWorkdays(plan.workdaysTotal.toString());
    setEditingPlan(true);
  };

  const handleSavePlan = () => {
    const amount = parseFloat(goalAmount);
    const days = parseInt(workdays);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(days) || days <= 0) return;

    const revenueTarget = goalType === 'revenue'
      ? amount
      : calculateRevenueForCommissionGoal(amount, payScale.tiers).revenue;

    onSavePlan({
      ...plan,
      goalType,
      goalAmount: amount,
      revenueTarget,
      workdaysTotal: days,
      startDate: startDate || null,
      endDate: endDate || null
    });
    setEditingPlan(false);
  };

  const goalMissed = stats.workdaysRemaining === 0 && stats.revenueRemaining > 0;
  const goalReached = stats.revenueRemaining === 0;

  return (
    <div className="space-y-6">
      {goalReached && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <span className="text-lg font-semibold text-emerald-900">Goal Reached</span>
          <p className="mt-1 text-sm text-emerald-700">
            You hit {formatCurrency(stats.revenueSoFar)} revenue
          </p>
        </div>
      )}
      {goalMissed && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center">
          <span className="font-semibold text-rose-900">Period Ended</span>
          <p className="mt-1 text-sm text-rose-700">
            Fell short by {formatCurrency(stats.revenueRemaining)}
          </p>
        </div>
      )}

      {(plan.startDate || plan.endDate) && (
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pay Period</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                {plan.startDate ? formatDate(plan.startDate) : 'Start'} - {plan.endDate ? formatDate(plan.endDate) : 'Open'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {plan.goalType === 'commission' ? `${formatCurrency(plan.goalAmount)} commission goal` : `${formatCurrency(plan.goalAmount)} revenue goal`}
              </p>
            </div>
            <button
              type="button"
              onClick={startPlanEdit}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
            >
              Edit Goal
            </button>
          </div>
          {editingPlan && (
            <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Goal Type</label>
                  <select
                    value={goalType}
                    onChange={(event) => setGoalType(event.target.value as 'commission' | 'revenue')}
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="revenue">Revenue Goal</option>
                    <option value="commission">Commission Goal</option>
                  </select>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {goalType === 'commission' ? 'Commission Goal' : 'Revenue Goal'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={goalAmount}
                    onChange={(event) => setGoalAmount(event.target.value)}
                    className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Counted Days</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={workdays}
                    onChange={(event) => setWorkdays(event.target.value)}
                    className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleSavePlan}
                    className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Save Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPlan(false)}
                    className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Progress</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-950">
                {formatPercent(progressPercent / 100)}
              </span>
              <span className="text-sm text-slate-500">
                of {formatCurrency(stats.revenueGoal)}
              </span>
            </div>
          </div>
          <div className="text-sm text-slate-500 sm:text-right">
            <div>{formatCurrency(stats.fundedRevenue)} funded</div>
            <div>{formatCurrency(stats.signedRevenue)} signed</div>
            <div>{formatCurrency(stats.revenueRemaining)} remaining</div>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Revenue Goal"
          value={formatCurrency(stats.revenueGoal)}
          subtext={plan.goalType === 'commission' ? `(${formatCurrency(plan.goalAmount)} commission)` : undefined}
        />
        <StatCard
          label="Funded Revenue"
          value={formatCurrency(stats.fundedRevenue)}
          highlight={stats.fundedRevenue > 0}
        />
        <StatCard
          label="Signed Revenue"
          value={formatCurrency(stats.signedRevenue)}
          highlight={stats.signedRevenue > 0}
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
          label="Average/Day"
          value={formatCurrency(averagePerLoggedDay)}
          subtext={entries.length > 0 ? 'logged days' : 'no entries yet'}
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center">
          <span className="text-sm font-medium text-amber-900">
            Need ~<strong>{stats.dealsNeeded}</strong> more deals
            {stats.dealsPerDay !== null && stats.workdaysRemaining > 0 && (
              <> ({stats.dealsPerDay}/day)</>
            )}
          </span>
        </div>
      )}

      {/* Pay Period Entry */}
      {!goalReached && stats.workdaysRemaining > 0 && (
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-950">
            Log Deal Revenue
          </h3>
          <div className="grid gap-3 lg:grid-cols-[160px_1fr_1fr_1fr_auto]">
            <input
              type="date"
              value={entryDate}
              min={plan.startDate || undefined}
              max={plan.endDate || undefined}
              onChange={(e) => setEntryDate(e.target.value)}
              className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
            <label className="flex items-center rounded-md border border-stone-300 bg-white px-3 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-200">
              <span className="mr-1 text-slate-500">$</span>
              <input
                type="number"
                value={todayRevenue}
                onChange={(e) => setTodayRevenue(e.target.value)}
                placeholder="Revenue amount"
                className="min-w-0 flex-1 py-2 outline-none"
              />
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Driver name"
              className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
            <input
              type="text"
              value={dealTag}
              onChange={(e) => setDealTag(e.target.value)}
              placeholder="Deal tag / link"
              className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
            <button
              onClick={handleAddEntry}
              className="rounded-md bg-slate-950 px-6 py-2 font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {(plan.startDate || plan.endDate) && (
        <PayPeriodLedger
          startDate={plan.startDate}
          endDate={plan.endDate}
          entries={entries}
          onToggleFunded={(entry) => onSaveEntry({ ...entry, funded: !entry.funded })}
          onSelectDate={(date) => {
            setEntryDate(date);
            setTodayRevenue('');
            setDriverName('');
            setDealTag('');
            setNotes('');
          }}
        />
      )}

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <h3 className="border-b border-stone-200 bg-stone-50 p-4 font-semibold text-slate-950">
            Daily Entries
          </h3>
          <ul className="divide-y divide-stone-200">
            {entries.slice().reverse().map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-500">{formatDate(entry.date)}</span>
                  {editingEntry === entry.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-slate-500">$</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-28 rounded border border-stone-300 px-2 py-1 text-sm outline-none focus:border-slate-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(entry)}
                        className="text-sm font-semibold text-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="text-sm font-medium text-slate-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="font-semibold text-slate-950">
                      {formatCurrency(entry.revenue)}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${entry.funded ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-slate-600'}`}>
                        {entry.funded ? 'Funded' : 'Signed'}
                      </span>
                      {(entry.driverName || entry.dealTag || entry.notes) && (
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          - {[entry.driverName, entry.dealTag, entry.notes].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {editingEntry !== entry.id && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="text-sm font-semibold text-slate-600 hover:text-slate-950"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-sm font-semibold text-rose-600 hover:text-rose-800"
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
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-950">What If I Hit...</h3>
          <div className="space-y-2">
            {projections.map(({ tier, revenueNeeded, additionalRevenue, commission }) => (
              <div
                key={tier.name}
                className={`rounded-md p-3 ${
                  stats.revenueSoFar >= tier.minRevenue
                    ? 'border border-emerald-200 bg-emerald-50'
                    : 'bg-stone-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">
                    {tier.name} ({formatPercent(tier.rate)})
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(commission)} commission
                  </span>
                </div>
                {additionalRevenue > 0 && (
                  <p className="mt-1 text-sm text-slate-600">
                    Need {formatCurrency(additionalRevenue)} more to reach {formatCurrency(revenueNeeded)}
                  </p>
                )}
                {stats.revenueSoFar >= tier.minRevenue && (
                  <p className="mt-1 text-sm font-medium text-emerald-700">Currently in this tier</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End Plan Button */}
      <div className="border-t border-stone-200 pt-4">
        <button
          onClick={onEndPlan}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          End This Plan / Start New
        </button>
      </div>
    </div>
  );
}

function PayPeriodLedger({
  startDate,
  endDate,
  entries,
  onToggleFunded,
  onSelectDate
}: {
  startDate: string | null;
  endDate: string | null;
  entries: DailyEntry[];
  onToggleFunded: (entry: DailyEntry) => void;
  onSelectDate: (date: string) => void;
}) {
  const dates = getPayPeriodDates(startDate, endDate);

  if (dates.length === 0) return null;

  return (
    <section className="pay-ledger overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="pay-ledger-header border-b border-stone-200 bg-stone-50 p-4">
        <h3 className="font-semibold text-slate-950">Pay Period Ledger</h3>
        <p className="mt-1 text-sm text-slate-500">
          Monday-Saturday dates from your pay period. Click a day to log or update it.
        </p>
      </div>
      <ul className="pay-ledger-list divide-y divide-stone-200">
        {dates.map((date) => {
          const dayEntries = entries.filter(item => item.date === date);
          const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.revenue, 0);

          return (
            <li key={date} className="pay-ledger-row grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-950">{formatDate(date)}</div>
                  <button
                    type="button"
                    onClick={() => onSelectDate(date)}
                    className="log-deal-button rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-stone-200"
                  >
                    Log deal
                  </button>
                </div>
                {dayEntries.length === 0 ? (
                  <div className="mt-1 text-sm text-slate-500">No revenue logged yet</div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="deal-line flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{formatCurrency(entry.revenue)}</span>
                        {entry.driverName && <span>{entry.driverName}</span>}
                        {entry.dealTag && <span>· {entry.dealTag}</span>}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleFunded(entry);
                          }}
                          className={`funded-toggle rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
                            entry.funded
                              ? 'is-funded bg-emerald-100 text-emerald-800'
                              : 'is-signed bg-stone-100 text-slate-600 hover:bg-stone-200'
                          }`}
                        >
                          {entry.funded ? 'Funded' : 'Signed'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={`day-total text-right text-lg font-bold ${dayEntries.length > 0 ? 'text-blue-700' : 'text-slate-300'}`}>
                {formatCurrency(dayTotal)}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function getPayPeriodDates(startDate: string | null, endDate: string | null): string[] {
  if (!startDate || !endDate) return [];

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    if (current.getDay() !== 0) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
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
    success: 'bg-emerald-50',
    warning: 'bg-amber-50'
  }[variant];

  const textColor = {
    default: highlight ? 'text-emerald-700' : 'text-slate-950',
    success: 'text-emerald-700',
    warning: 'text-amber-700'
  }[variant];

  return (
    <div className={`rounded-lg border border-stone-200 p-4 shadow-sm ${bgColor}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${textColor}`}>{value}</div>
      {subtext && <div className="mt-1 text-xs text-slate-500">{subtext}</div>}
    </div>
  );
}

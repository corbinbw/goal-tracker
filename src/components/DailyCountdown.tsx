'use client';

import { useEffect, useMemo, useState } from 'react';
import { DailyDeal, DailyGoal, GoalPlan } from '@/lib/types';
import { formatCurrency, generateId } from '@/lib/calculations';

interface Props {
  date: string;
  goal: DailyGoal;
  deals: DailyDeal[];
  activePlan: GoalPlan | null;
  onSaveGoal: (goal: DailyGoal) => void;
  onAddDeal: (deal: DailyDeal) => void;
  onUpdateDeal: (deal: DailyDeal) => void;
  onDeleteDeal: (dealId: string) => void;
  onClearDeals: () => void;
}

export default function DailyCountdown({
  date,
  goal,
  deals,
  activePlan,
  onSaveGoal,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
  onClearDeals
}: Props) {
  const [revenueGoal, setRevenueGoal] = useState('');
  const [closeGoal, setCloseGoal] = useState('');
  const [dealRevenue, setDealRevenue] = useState('');
  const [dealName, setDealName] = useState('');
  const [dealTag, setDealTag] = useState('');
  const [celebrating, setCelebrating] = useState(false);

  const totalRevenue = deals.reduce((sum, deal) => sum + deal.revenue, 0);
  const fundedRevenue = deals.filter(deal => deal.funded).reduce((sum, deal) => sum + deal.revenue, 0);
  const dealsLogged = deals.length;
  const fundedDeals = deals.filter(deal => deal.funded).length;
  const revenueRemaining = Math.max(goal.revenueGoal - totalRevenue, 0);
  const closesRemaining = Math.max(goal.closeGoal - dealsLogged, 0);
  const revenuePercent = goal.revenueGoal > 0
    ? Math.min((totalRevenue / goal.revenueGoal) * 100, 100)
    : 0;
  const closesPercent = goal.closeGoal > 0
    ? Math.min((dealsLogged / goal.closeGoal) * 100, 100)
    : 0;
  const blendedPercent = Math.round((revenuePercent + closesPercent) / 2);
  const averageDeal = dealsLogged > 0 ? totalRevenue / dealsLogged : 0;
  const revenueDone = goal.revenueGoal > 0 && revenueRemaining === 0;
  const closesDone = goal.closeGoal > 0 && closesRemaining === 0;

  const paceText = useMemo(() => {
    if (revenueDone && closesDone) return 'Daily board cleared.';
    if (revenueDone) return `Revenue hit. ${closesRemaining} close${closesRemaining === 1 ? '' : 's'} left.`;
    if (closesDone) return `Close count hit. ${formatCurrency(revenueRemaining)} left.`;
    if (dealsLogged === 0) return 'Ready for the first deal.';
    return `${formatCurrency(revenueRemaining)} and ${closesRemaining} close${closesRemaining === 1 ? '' : 's'} left.`;
  }, [closesDone, closesRemaining, dealsLogged, revenueDone, revenueRemaining]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRevenueGoal(goal.revenueGoal ? goal.revenueGoal.toString() : '');
      setCloseGoal(goal.closeGoal ? goal.closeGoal.toString() : '');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [goal.closeGoal, goal.revenueGoal]);

  useEffect(() => {
    if (!revenueDone && !closesDone) return;
    const timer = window.setTimeout(() => {
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 900);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [closesDone, revenueDone]);

  const handleSaveGoal = () => {
    onSaveGoal({
      date,
      revenueGoal: parseNumber(revenueGoal),
      closeGoal: parseNumber(closeGoal)
    });
  };

  const handleAddDeal = () => {
    const revenue = parseNumber(dealRevenue);
    if (revenue <= 0) return;

    onAddDeal({
      id: generateId(),
      date,
      revenue,
      name: dealName.trim() || `Deal ${deals.length + 1}`,
      dealTag: dealTag.trim() || null,
      funded: false,
      createdAt: new Date().toISOString()
    });
    setDealRevenue('');
    setDealName('');
    setDealTag('');
  };

  return (
    <div className="space-y-6">
      <section className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-5 text-white shadow-sm ${celebrating ? 'animate-pulse' : ''}`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.3fr_0.85fr]">
          <CountdownMetric
            label="Revenue Remaining"
            value={revenueDone ? 'Done' : formatCurrency(revenueRemaining)}
            progress={revenuePercent}
            helper={`${formatCurrency(totalRevenue)} of ${formatCurrency(goal.revenueGoal)} closed`}
            complete={revenueDone}
            accent="bg-amber-300"
          />
          <CountdownMetric
            label="Closes Remaining"
            value={closesDone ? 'Done' : closesRemaining.toString()}
            progress={closesPercent}
            helper={`${dealsLogged} of ${goal.closeGoal} closes`}
            complete={closesDone}
            accent="bg-sky-300"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pace</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">{paceText}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {activePlan ? 'Today also updates your active pay-period tracker.' : 'Create a pay-period goal to roll this into your bigger tracker.'}
          </p>
        </div>
        <div
          className="pace-ring grid h-24 w-24 shrink-0 place-items-center rounded-full text-xl font-bold"
          style={{ '--pace-degrees': `${blendedPercent * 3.6}deg` } as React.CSSProperties}
        >
          {blendedPercent}%
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-950">Today&apos;s Goal</h3>
            <p className="mt-1 text-sm text-slate-500">Saved by date, so yesterday stays yesterday.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Revenue Goal</span>
              <input
                type="number"
                min="0"
                step="any"
                value={revenueGoal}
                onChange={(event) => setRevenueGoal(event.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Close Goal</span>
              <input
                type="number"
                min="0"
                step="1"
                value={closeGoal}
                onChange={(event) => setCloseGoal(event.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleSaveGoal}
            className="mt-4 w-full rounded-md bg-blue-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Save Goal
          </button>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-950">Add Deal</h3>
            <p className="mt-1 text-sm text-slate-500">Enter any revenue amount. No forced rounding.</p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Deal Revenue</span>
            <input
              type="number"
              min="0"
              step="any"
              value={dealRevenue}
              onChange={(event) => setDealRevenue(event.target.value)}
              placeholder="4440"
              className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Deal Name</span>
            <input
              type="text"
              value={dealName}
              onChange={(event) => setDealName(event.target.value)}
              placeholder="Customer or vehicle"
              className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Deal Tag / Link</span>
            <input
              type="text"
              value={dealTag}
              onChange={(event) => setDealTag(event.target.value)}
              placeholder="https://... or deal tag"
              className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="button"
            onClick={handleAddDeal}
            className="mt-4 w-full rounded-md bg-blue-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Subtract Deal
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Closed" value={formatCurrency(totalRevenue)} />
        <StatCard label="Funded Revenue" value={formatCurrency(fundedRevenue)} />
        <StatCard label="Deals Logged" value={dealsLogged.toString()} />
        <StatCard label="Funded Deals" value={fundedDeals.toString()} />
        <StatCard label="Average Deal" value={formatCurrency(averageDeal)} />
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-950">Today&apos;s Deals</h3>
            <p className="mt-1 text-sm text-slate-500">{formatLongDate(date)}</p>
          </div>
          <button
            type="button"
            onClick={onClearDeals}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
          >
            Clear Deals
          </button>
        </div>
        {deals.length === 0 ? (
          <div className="m-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-slate-500">
            No deals logged yet. Add one and the countdown starts moving.
          </div>
        ) : (
          <ul className="divide-y divide-stone-200">
            {deals.map((deal, index) => (
              <li key={deal.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-semibold text-slate-950">{deal.name}</div>
                  <div className="text-sm text-slate-500">
                    {formatTime(deal.createdAt)} - Deal {deals.length - index}
                    {deal.dealTag && <> - {deal.dealTag}</>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-700">{formatCurrency(deal.revenue)}</div>
                  <button
                    type="button"
                    onClick={() => onUpdateDeal({ ...deal, funded: !deal.funded })}
                    className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      deal.funded
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                    }`}
                  >
                    {deal.funded ? 'Funded' : 'Signed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDeal(deal.id)}
                    className="ml-3 text-sm font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CountdownMetric({
  label,
  value,
  progress,
  helper,
  complete,
  accent
}: {
  label: string;
  value: string;
  progress: number;
  helper: string;
  complete: boolean;
  accent: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{label}</p>
      <div className={`mt-2 text-5xl font-bold leading-none tracking-normal sm:text-7xl ${complete ? 'text-amber-300' : 'text-white'}`}>
        {value}
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
        <div className={`h-full rounded-full transition-all ${accent}`} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-sm text-white/70">{helper}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function parseNumber(value: string): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

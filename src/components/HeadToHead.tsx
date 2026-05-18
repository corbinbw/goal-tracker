'use client';

import { useMemo, useState } from 'react';
import { DailyDeal, HeadToHeadCompetition, HeadToHeadEntry } from '@/lib/types';
import { formatCurrency, generateId, getTodayISO } from '@/lib/calculations';

interface Props {
  competition: HeadToHeadCompetition | null;
  deals: DailyDeal[];
  onSaveCompetition: (competition: HeadToHeadCompetition) => void;
  onAddBuddyEntry: (competitionId: string, entry: HeadToHeadEntry) => void;
  onDeleteBuddyEntry: (competitionId: string, entryId: string) => void;
}

export default function HeadToHead({
  competition,
  deals,
  onSaveCompetition,
  onAddBuddyEntry,
  onDeleteBuddyEntry
}: Props) {
  const today = getTodayISO();
  const [buddyName, setBuddyName] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [entryDate, setEntryDate] = useState(today);
  const [buddyRevenue, setBuddyRevenue] = useState('');

  const competitionDeals = useMemo(() => {
    if (!competition) return [];
    return deals.filter(deal => deal.date >= competition.startDate && deal.date <= competition.endDate);
  }, [competition, deals]);

  const myRevenue = competitionDeals.reduce((sum, deal) => sum + deal.revenue, 0);
  const buddyRevenueTotal = competition?.buddyEntries.reduce((sum, entry) => sum + entry.revenue, 0) || 0;
  const gap = Math.abs(myRevenue - buddyRevenueTotal);
  const leader = myRevenue === buddyRevenueTotal
    ? 'Tied up'
    : myRevenue > buddyRevenueTotal
      ? 'You are leading'
      : `${competition?.buddyName || 'Buddy'} is leading`;
  const myPercent = Math.min(totalPercent(myRevenue, buddyRevenueTotal, myRevenue), 100);
  const buddyPercent = Math.min(totalPercent(myRevenue, buddyRevenueTotal, buddyRevenueTotal), 100);

  const startCompetition = () => {
    const cleanName = buddyName.trim();
    if (!cleanName || !startDate || !endDate || endDate < startDate) return;

    onSaveCompetition({
      id: generateId(),
      buddyName: cleanName,
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
      isActive: true,
      buddyEntries: []
    });
    setEntryDate(today >= startDate && today <= endDate ? today : startDate);
    setBuddyName('');
  };

  const addBuddyRevenue = () => {
    if (!competition) return;
    const revenue = parseNumber(buddyRevenue);
    if (revenue <= 0) return;

    onAddBuddyEntry(competition.id, {
      id: generateId(),
      date: entryDate,
      revenue,
      createdAt: new Date().toISOString()
    });
    setBuddyRevenue('');
  };

  const endCompetition = () => {
    if (!competition) return;
    onSaveCompetition({ ...competition, isActive: false });
  };

  if (!competition) {
    return (
      <section className="head-to-head rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Head to Head</p>
          <h3 className="mt-1 font-semibold text-slate-950">Start a revenue competition</h3>
          <p className="mt-1 text-sm text-slate-500">Your side uses your logged deals. You only enter their revenue.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_auto]">
          <input
            type="text"
            value={buddyName}
            onChange={(event) => setBuddyName(event.target.value)}
            placeholder="Buddy name"
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              if (endDate < event.target.value) setEndDate(event.target.value);
            }}
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={startCompetition}
            className="rounded-md bg-slate-950 px-5 py-2 font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Start
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="head-to-head overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="head-to-head-header flex flex-col gap-3 border-b border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Head to Head</p>
          <h3 className="mt-1 font-semibold text-slate-950">You vs {competition.buddyName}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {formatShortDate(competition.startDate)} - {formatShortDate(competition.endDate)}
          </p>
        </div>
        <button
          type="button"
          onClick={endCompetition}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
        >
          End Comp
        </button>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_1fr]">
        <CompetitorScore name="You" revenue={myRevenue} percent={myPercent} />
        <CompetitorScore name={competition.buddyName} revenue={buddyRevenueTotal} percent={buddyPercent} />
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{leader}</div>
          <div className="mt-1 text-sm text-slate-500">{gap === 0 ? 'No gap right now' : `${formatCurrency(gap)} gap`}</div>
        </div>
      </div>

      <div className="border-t border-stone-200 p-4">
        <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto]">
          <input
            type="date"
            value={entryDate}
            min={competition.startDate}
            max={competition.endDate}
            onChange={(event) => setEntryDate(event.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <label className="flex items-center rounded-md border border-stone-300 bg-white px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="mr-1 text-slate-500">$</span>
            <input
              type="number"
              min="0"
              step="any"
              value={buddyRevenue}
              onChange={(event) => setBuddyRevenue(event.target.value)}
              placeholder={`${competition.buddyName}'s revenue`}
              className="min-w-0 flex-1 py-2 outline-none"
            />
          </label>
          <button
            type="button"
            onClick={addBuddyRevenue}
            className="rounded-md bg-blue-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Add Rev
          </button>
        </div>

        {competition.buddyEntries.length > 0 && (
          <ul className="mt-4 divide-y divide-stone-200 rounded-lg border border-stone-200">
            {competition.buddyEntries.slice().reverse().map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <div className="font-semibold text-slate-950">{formatCurrency(entry.revenue)}</div>
                  <div className="text-sm text-slate-500">{formatShortDate(entry.date)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteBuddyEntry(competition.id, entry.id)}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-800"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CompetitorScore({ name, revenue, percent }: { name: string; revenue: number; percent: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{name}</div>
      <div className="mt-1 text-3xl font-semibold text-slate-950">{formatCurrency(revenue)}</div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function totalPercent(myRevenue: number, buddyRevenue: number, value: number): number {
  const high = Math.max(myRevenue, buddyRevenue);
  if (high <= 0) return 0;
  return (value / high) * 100;
}

function parseNumber(value: string): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

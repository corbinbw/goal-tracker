'use client';

import { useMemo, useState } from 'react';
import { DailyActivity, DailyLead } from '@/lib/types';
import { generateId } from '@/lib/calculations';

interface Props {
  date: string;
  activity: DailyActivity;
  leads: DailyLead[];
  onSaveActivity: (activity: DailyActivity) => void;
  onAddLead: (lead: DailyLead) => void;
  onUpdateLead: (lead: DailyLead) => void;
  onDeleteLead: (leadId: string) => void;
  initialFocusMode?: boolean;
}

export default function ActivityTracker({
  date,
  activity,
  leads,
  onSaveActivity,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  initialFocusMode = false
}: Props) {
  const [leadName, setLeadName] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [focusMode, setFocusMode] = useState(initialFocusMode);

  const pitchedCount = leads.filter(lead => lead.pitched).length;
  const pitchRate = leads.length > 0 ? Math.round((pitchedCount / leads.length) * 100) : 0;

  const updateActivity = (updates: Partial<DailyActivity>) => {
    onSaveActivity({
      ...activity,
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const addLead = () => {
    const name = leadName.trim();
    if (!name) return;

    onAddLead({
      id: generateId(),
      date,
      name,
      source: leadSource.trim() || null,
      notes: leadNotes.trim() || null,
      pitched: false,
      called: false,
      texted: false,
      contacted: false,
      createdAt: new Date().toISOString()
    });
    setLeadName('');
    setLeadSource('');
    setLeadNotes('');
  };

  const sortedLeads = useMemo(() => leads.slice().sort((a, b) => Number(a.pitched) - Number(b.pitched)), [leads]);

  if (focusMode) {
    return (
      <div className="activity-focus space-y-4">
        <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Focus Mode</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Calls & Texts</h2>
            </div>
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
            >
              Full View
            </button>
          </div>
        </section>
        <section className="grid gap-3">
          <CounterCard
            label="Calls"
            value={activity.calls}
            compact
            onChange={(value) => updateActivity({ calls: value })}
          />
          <CounterCard
            label="Texts"
            value={activity.texts}
            compact
            onChange={(value) => updateActivity({ texts: value })}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Activity</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Calls, texts, and new leads</h2>
            <p className="mt-1 text-sm text-slate-500">{formatLongDate(date)}</p>
          </div>
          <div className="text-sm text-slate-500 sm:text-right">
            <div>{pitchedCount} of {leads.length} leads pitched</div>
            <div>{pitchRate}% pitch rate</div>
            <button
              type="button"
              onClick={() => setFocusMode(true)}
              className="mt-3 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Focus Calls/Text
            </button>
            <a
              href="/?focus=activity"
              target="_blank"
              rel="noreferrer"
              className="ml-2 mt-3 inline-block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
            >
              Tiny Window
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <CounterCard
          label="Calls"
          value={activity.calls}
          onChange={(value) => updateActivity({ calls: value })}
        />
        <CounterCard
          label="Texts"
          value={activity.texts}
          onChange={(value) => updateActivity({ texts: value })}
        />
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">New Leads</div>
          <div className="mt-1 text-4xl font-semibold text-slate-950">{leads.length}</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${pitchRate}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-500">{pitchedCount} pitched</p>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-950">Add New Lead</h3>
          <p className="mt-1 text-sm text-slate-500">Track who came in today and whether they got pitched.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
          <input
            type="text"
            value={leadName}
            onChange={(event) => setLeadName(event.target.value)}
            placeholder="Lead name"
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="text"
            value={leadSource}
            onChange={(event) => setLeadSource(event.target.value)}
            placeholder="Source"
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="text"
            value={leadNotes}
            onChange={(event) => setLeadNotes(event.target.value)}
            placeholder="Notes"
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={addLead}
            className="rounded-md bg-blue-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Add Lead
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 bg-stone-50 p-4">
          <h3 className="font-semibold text-slate-950">Today&apos;s Leads</h3>
          <p className="mt-1 text-sm text-slate-500">Mark a lead pitched once you presented the buyout options.</p>
        </div>
        {sortedLeads.length === 0 ? (
          <div className="m-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-slate-500">
            No new leads logged yet.
          </div>
        ) : (
          <ul className="divide-y divide-stone-200">
            {sortedLeads.map(lead => (
              <li key={lead.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-slate-950">{lead.name}</div>
                  <div className="text-sm text-slate-500">
                    {[lead.source, lead.notes].filter(Boolean).join(' · ') || 'No details'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LeadToggle
                    active={Boolean(lead.called)}
                    activeLabel="Called"
                    inactiveLabel="Call"
                    onClick={() => onUpdateLead({ ...lead, called: !lead.called })}
                  />
                  <LeadToggle
                    active={Boolean(lead.texted)}
                    activeLabel="Texted"
                    inactiveLabel="Text"
                    onClick={() => onUpdateLead({ ...lead, texted: !lead.texted })}
                  />
                  <LeadToggle
                    active={Boolean(lead.contacted)}
                    activeLabel="Contacted"
                    inactiveLabel="Contact"
                    onClick={() => onUpdateLead({ ...lead, contacted: !lead.contacted })}
                  />
                  <LeadToggle
                    active={lead.pitched}
                    activeLabel="Pitched"
                    inactiveLabel="Pitch"
                    onClick={() => onUpdateLead({ ...lead, pitched: !lead.pitched })}
                  />
                  <button
                    type="button"
                    onClick={() => onDeleteLead(lead.id)}
                    className="text-sm font-semibold text-rose-600 hover:text-rose-800"
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

function LeadToggle({
  active,
  activeLabel,
  inactiveLabel,
  onClick
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}

function CounterCard({
  label,
  value,
  onChange,
  compact = false
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-stone-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={`${compact ? 'mt-1 text-5xl' : 'mt-1 text-4xl'} font-semibold text-slate-950`}>{value}</div>
      <div className={`${compact ? 'mt-3' : 'mt-4'} grid grid-cols-3 gap-2`}>
        <button
          type="button"
          onClick={() => onChange(Math.max(value - 1, 0))}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
        >
          -1
        </button>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          +1
        </button>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(parseCounter(event.target.value))}
          className="min-w-0 rounded-md border border-stone-300 px-2 py-2 text-center text-sm font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

function parseCounter(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TeamMemberState, loadTeamStates } from '@/lib/cloudStorage';
import { formatCurrency, getTodayISO } from '@/lib/calculations';

export default function TeamDashboard() {
  const today = getTodayISO();
  const [members, setMembers] = useState<TeamMemberState[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Load the latest team data from Supabase.');

  const rows = useMemo(() => members.map(member => {
    const dailyGoal = member.data.dailyGoals.find(goal => goal.date === today);
    const todayDeals = member.data.dailyDeals.filter(deal => deal.date === today);
    const todayRevenue = todayDeals.reduce((sum, deal) => sum + deal.revenue, 0);
    const todayFunded = todayDeals.filter(deal => deal.funded).reduce((sum, deal) => sum + deal.revenue, 0);
    const activePlan = member.data.goalPlans.find(plan => plan.isActive);
    const planEntries = activePlan
      ? member.data.dailyEntries.filter(entry => entry.goalPlanId === activePlan.id)
      : [];
    const signedRevenue = planEntries.reduce((sum, entry) => sum + entry.revenue, 0);
    const fundedRevenue = planEntries.filter(entry => entry.funded).reduce((sum, entry) => sum + entry.revenue, 0);

    return {
      ...member,
      dailyGoal,
      todayRevenue,
      todayFunded,
      todayDeals: todayDeals.length,
      activePlan,
      signedRevenue,
      fundedRevenue
    };
  }), [members, today]);

  const teamTodayRevenue = rows.reduce((sum, row) => sum + row.todayRevenue, 0);
  const teamTodayFunded = rows.reduce((sum, row) => sum + row.todayFunded, 0);
  const teamSignedRevenue = rows.reduce((sum, row) => sum + row.signedRevenue, 0);
  const teamFundedRevenue = rows.reduce((sum, row) => sum + row.fundedRevenue, 0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage('Loading team data...');
    try {
      const teamStates = await loadTeamStates();
      setMembers(teamStates);
      setMessage(teamStates.length === 0 ? 'No team data found yet.' : `Loaded ${teamStates.length} team member${teamStates.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load team data.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 30000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Team View</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Daily Goals Together</h2>
            <p className="mt-1 text-sm text-slate-500">{message} Auto-refreshes every 30 seconds.</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Refresh Team'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TeamStat label="Today Signed" value={formatCurrency(teamTodayRevenue)} />
        <TeamStat label="Today Funded" value={formatCurrency(teamTodayFunded)} />
        <TeamStat label="Period Signed" value={formatCurrency(teamSignedRevenue)} />
        <TeamStat label="Period Funded" value={formatCurrency(teamFundedRevenue)} />
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 bg-stone-50 p-4">
          <h3 className="font-semibold text-slate-950">Rep Scoreboard</h3>
          <p className="mt-1 text-sm text-slate-500">Shows each rep&apos;s saved Today goal and active pay-period totals.</p>
        </div>
        {rows.length === 0 ? (
          <div className="m-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-slate-500">
            No rows yet. Click Refresh Team after team members have logged in and saved data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Rep</th>
                  <th className="px-4 py-3">Daily Goal</th>
                  <th className="px-4 py-3">Today</th>
                  <th className="px-4 py-3">Deals</th>
                  <th className="px-4 py-3">Period Funded</th>
                  <th className="px-4 py-3">Period Signed</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {rows.map(row => (
                  <tr key={row.userId}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-950">{row.name}</div>
                      <div className="text-xs text-slate-500">{row.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.dailyGoal
                        ? `${formatCurrency(row.dailyGoal.revenueGoal)} / ${row.dailyGoal.closeGoal} closes`
                        : 'Not set'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{formatCurrency(row.todayRevenue)}</td>
                    <td className="px-4 py-3 text-slate-700">{row.todayDeals}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(row.fundedRevenue)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(row.signedRevenue)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatUpdated(row.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function TeamStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function formatUpdated(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

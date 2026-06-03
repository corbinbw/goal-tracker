'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TeamMemberState, loadTeamStates } from '@/lib/cloudStorage';
import { formatCurrency, getTodayISO } from '@/lib/calculations';

export default function TeamDashboard() {
  const today = getTodayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const [members, setMembers] = useState<TeamMemberState[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Load the latest team data from Supabase.');

  const rows = useMemo(() => members.map(member => {
    const dailyGoal = member.data.dailyGoals.find(goal => goal.date === selectedDate);
    const selectedDateActivity = member.data.dailyActivities.find(activity => activity.date === selectedDate);
    const selectedDateLeads = member.data.dailyLeads.filter(lead => lead.date === selectedDate);
    const selectedDateDeals = member.data.dailyDeals.filter(deal => deal.date === selectedDate);
    const selectedDateRevenue = selectedDateDeals.reduce((sum, deal) => sum + deal.revenue, 0);
    const selectedDateFunded = selectedDateDeals.filter(deal => deal.funded).reduce((sum, deal) => sum + deal.revenue, 0);
    const activePlan = member.data.goalPlans.find(plan => plan.isActive);
    const planEntries = activePlan
      ? member.data.dailyEntries.filter(entry => entry.goalPlanId === activePlan.id)
      : [];
    const signedRevenue = planEntries.reduce((sum, entry) => sum + entry.revenue, 0);
    const fundedRevenue = planEntries.filter(entry => entry.funded).reduce((sum, entry) => sum + entry.revenue, 0);

    return {
      ...member,
      dailyGoal,
      selectedDateActivity,
      selectedDateLeads: selectedDateLeads.length,
      selectedDatePitched: selectedDateLeads.filter(lead => lead.pitched).length,
      selectedDateCalled: selectedDateLeads.filter(lead => lead.called).length,
      selectedDateTexted: selectedDateLeads.filter(lead => lead.texted).length,
      selectedDateContacted: selectedDateLeads.filter(lead => lead.contacted).length,
      selectedDateRevenue,
      selectedDateFunded,
      selectedDateDeals: selectedDateDeals.length,
      activePlan,
      signedRevenue,
      fundedRevenue,
      dataCounts: {
        goals: member.data.dailyGoals.length,
        deals: member.data.dailyDeals.length,
        entries: member.data.dailyEntries.length,
        plans: member.data.goalPlans.length,
        activities: member.data.dailyActivities.length,
        leads: member.data.dailyLeads.length
      },
      syncState: !member.hasProfile
        ? 'Needs login'
        : !member.hasCloudState
          ? 'Needs save'
          : 'Synced'
    };
  }), [members, selectedDate]);

  const teamSelectedDateRevenue = rows.reduce((sum, row) => sum + row.selectedDateRevenue, 0);
  const teamSelectedDateFunded = rows.reduce((sum, row) => sum + row.selectedDateFunded, 0);
  const teamSelectedDateCalls = rows.reduce((sum, row) => sum + (row.selectedDateActivity?.calls || 0), 0);
  const teamSelectedDateTexts = rows.reduce((sum, row) => sum + (row.selectedDateActivity?.texts || 0), 0);
  const teamSelectedDateLeads = rows.reduce((sum, row) => sum + row.selectedDateLeads, 0);
  const teamSelectedDateContacted = rows.reduce((sum, row) => sum + row.selectedDateContacted, 0);
  const teamSignedRevenue = rows.reduce((sum, row) => sum + row.signedRevenue, 0);
  const teamFundedRevenue = rows.reduce((sum, row) => sum + row.fundedRevenue, 0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage('Loading team data...');
    try {
      const teamStates = await loadTeamStates();
      setMembers(teamStates);
      setMessage(teamStates.length === 0 ? 'No team members found. Check team_members in Supabase.' : `Loaded ${teamStates.length} team member${teamStates.length === 1 ? '' : 's'}.`);
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Team View</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Daily Goals Together</h2>
            <p className="mt-1 text-sm text-slate-500">{message} Auto-refreshes every 30 seconds.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Refresh Team'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TeamStat label="Selected Day Signed" value={formatCurrency(teamSelectedDateRevenue)} />
        <TeamStat label="Selected Day Funded" value={formatCurrency(teamSelectedDateFunded)} />
        <TeamStat label="Calls / Texts" value={`${teamSelectedDateCalls} / ${teamSelectedDateTexts}`} />
        <TeamStat label="Leads Contacted" value={`${teamSelectedDateContacted} / ${teamSelectedDateLeads}`} />
        <TeamStat label="Period Signed" value={formatCurrency(teamSignedRevenue)} />
        <TeamStat label="Period Funded" value={formatCurrency(teamFundedRevenue)} />
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 bg-stone-50 p-4">
          <h3 className="font-semibold text-slate-950">Rep Scoreboard</h3>
          <p className="mt-1 text-sm text-slate-500">Shows each rep&apos;s saved goal for the selected date and active pay-period totals.</p>
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
                  <th className="px-4 py-3">Selected Day</th>
                  <th className="px-4 py-3">Deals</th>
                  <th className="px-4 py-3">Calls / Texts</th>
                  <th className="px-4 py-3">Leads</th>
                  <th className="px-4 py-3">Period Funded</th>
                  <th className="px-4 py-3">Period Signed</th>
                  <th className="px-4 py-3">Synced Data</th>
                  <th className="px-4 py-3">Status</th>
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
                    <td className="px-4 py-3 font-semibold text-blue-700">{formatCurrency(row.selectedDateRevenue)}</td>
                    <td className="px-4 py-3 text-slate-700">{row.selectedDateDeals}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.selectedDateActivity?.calls || 0} / {row.selectedDateActivity?.texts || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.selectedDateLeads} ({row.selectedDateContacted} contacted / {row.selectedDatePitched} pitched)
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(row.fundedRevenue)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(row.signedRevenue)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.dataCounts.goals} goals / {row.dataCounts.deals} deals / {row.dataCounts.entries} entries / {row.dataCounts.leads} leads
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.syncState}</td>
                    <td className="px-4 py-3 text-slate-500">{row.updatedAt ? formatUpdated(row.updatedAt) : '-'}</td>
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

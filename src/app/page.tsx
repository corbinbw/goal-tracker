'use client';

import { useState, useEffect } from 'react';
import { usePayScale, useGoalPlans, useDailyEntries, useDailyCountdown, useAllDailyDeals, useHeadToHeadCompetition } from '@/hooks/useLocalStorage';
import PayScaleEditor from '@/components/PayScaleEditor';
import NewGoalForm from '@/components/NewGoalForm';
import Dashboard from '@/components/Dashboard';
import DailyCountdown from '@/components/DailyCountdown';
import HeadToHead from '@/components/HeadToHead';
import { DEFAULT_PAY_SCALE, GoalPlan, DailyDeal } from '@/lib/types';
import { getTodayISO } from '@/lib/calculations';

type Tab = 'today' | 'tracker' | 'new-goal' | 'settings';

export default function Home() {
  const { payScale, setPayScale, loading: payScaleLoading } = usePayScale();
  const { activePlan, savePlan, loading: plansLoading } = useGoalPlans();
  const { entries, saveEntry, deleteEntry, refresh: refreshEntries } = useDailyEntries(activePlan?.id || null);
  const { deals: allDailyDeals, loading: allDealsLoading, refresh: refreshAllDailyDeals } = useAllDailyDeals();
  const {
    competition,
    loading: competitionLoading,
    saveCompetition,
    addBuddyEntry,
    deleteBuddyEntry
  } = useHeadToHeadCompetition();
  const today = getTodayISO();
  const {
    goal: dailyGoal,
    deals: dailyDeals,
    loading: dailyLoading,
    saveGoal: saveDailyGoal,
    addDeal,
    updateDeal,
    deleteDeal,
    clearDeals
  } = useDailyCountdown(today, activePlan?.id || null);

  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem('goalTracker_theme');
      if (savedTheme === 'dark') setTheme('dark');
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted || payScaleLoading || plansLoading || dailyLoading || allDealsLoading || competitionLoading || !dailyGoal) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm">
          Loading...
        </div>
      </div>
    );
  }

  const currentPayScale = payScale || DEFAULT_PAY_SCALE;

  const handleCreatePlan = (plan: GoalPlan) => {
    savePlan(plan);
    setActiveTab('tracker');
  };

  const handleEndPlan = () => {
    if (activePlan) {
      savePlan({ ...activePlan, isActive: false });
      setActiveTab('new-goal');
    }
  };

  const handleAddDeal = (deal: DailyDeal) => {
    addDeal(deal);
    refreshEntries();
    refreshAllDailyDeals();
  };

  const handleDeleteDeal = (dealId: string) => {
    deleteDeal(dealId);
    refreshEntries();
    refreshAllDailyDeals();
  };

  const handleUpdateDeal = (deal: DailyDeal) => {
    updateDeal(deal);
    refreshEntries();
    refreshAllDailyDeals();
  };

  const handleClearDeals = () => {
    clearDeals();
    refreshEntries();
    refreshAllDailyDeals();
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    window.localStorage.setItem('goalTracker_theme', nextTheme);
  };

  return (
    <div className={`app-shell min-h-screen ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <header className="app-header sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex min-h-16 items-center justify-between gap-4 py-3">
            <div>
              <p className="app-kicker text-xs font-semibold uppercase tracking-[0.18em]">
                Commission Pace
              </p>
              <h1 className="app-title text-xl font-semibold">Goal Tracker</h1>
            </div>
            {activePlan && (
              <span className="app-badge rounded-full px-3 py-1 text-sm font-medium">
                {activePlan.goalType === 'commission' ? 'Commission' : 'Revenue'} Goal
              </span>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle rounded-full px-3 py-1 text-sm font-semibold transition-colors"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-3">
            <TabButton
              active={activeTab === 'today'}
              onClick={() => setActiveTab('today')}
            >
              Today
            </TabButton>
            <TabButton
              active={activeTab === 'tracker'}
              onClick={() => setActiveTab('tracker')}
            >
              Pay Period
            </TabButton>
            <TabButton
              active={activeTab === 'new-goal'}
              onClick={() => setActiveTab('new-goal')}
            >
              {activePlan ? 'New Goal' : 'Create Goal'}
            </TabButton>
            <TabButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </TabButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-12 sm:px-6">
        {activeTab === 'today' && (
          <div className="space-y-6">
            <DailyCountdown
              date={today}
              goal={dailyGoal}
              deals={dailyDeals}
              activePlan={activePlan}
              onSaveGoal={saveDailyGoal}
              onAddDeal={handleAddDeal}
              onUpdateDeal={handleUpdateDeal}
              onDeleteDeal={handleDeleteDeal}
              onClearDeals={handleClearDeals}
            />
            <HeadToHead
              competition={competition}
              deals={allDailyDeals}
              onSaveCompetition={saveCompetition}
              onAddBuddyEntry={addBuddyEntry}
              onDeleteBuddyEntry={deleteBuddyEntry}
            />
          </div>
        )}

        {activeTab === 'tracker' && activePlan && (
          <Dashboard
            plan={activePlan}
            entries={entries}
            payScale={currentPayScale}
            onSaveEntry={saveEntry}
            onDeleteEntry={deleteEntry}
            onEndPlan={handleEndPlan}
          />
        )}

        {activeTab === 'tracker' && !activePlan && (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">
              Pay Period
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Create a pay-period goal to unlock this view.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              The Today page works on its own. Once you create a pay-period goal, deals you add today will roll into the larger tracker automatically.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('new-goal')}
              className="mt-5 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Create Pay-Period Goal
            </button>
          </div>
        )}

        {activeTab === 'new-goal' && (
          <NewGoalForm
            payScale={currentPayScale}
            onCreatePlan={handleCreatePlan}
          />
        )}

        {activeTab === 'settings' && (
          <PayScaleEditor
            payScale={currentPayScale}
            onSave={setPayScale}
          />
        )}
      </main>

      <footer className="app-footer py-4 text-center text-xs font-medium">
        Commission Pace Tracker
      </footer>
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
  disabled = false
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`app-tab rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'active' : ''
      } ${disabled ? 'disabled' : ''}`}
    >
      {children}
    </button>
  );
}

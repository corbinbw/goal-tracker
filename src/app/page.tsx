'use client';

import { useState, useEffect } from 'react';
import { usePayScale, useGoalPlans, useDailyEntries } from '@/hooks/useLocalStorage';
import PayScaleEditor from '@/components/PayScaleEditor';
import NewGoalForm from '@/components/NewGoalForm';
import Dashboard from '@/components/Dashboard';
import { DEFAULT_PAY_SCALE, GoalPlan } from '@/lib/types';

type Tab = 'tracker' | 'new-goal' | 'settings';

export default function Home() {
  const { payScale, setPayScale, loading: payScaleLoading } = usePayScale();
  const { activePlan, savePlan, loading: plansLoading } = useGoalPlans();
  const { entries, saveEntry, deleteEntry } = useDailyEntries(activePlan?.id || null);

  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted && !plansLoading && !activePlan && activeTab === 'tracker') {
      const timer = window.setTimeout(() => setActiveTab('new-goal'), 0);
      return () => window.clearTimeout(timer);
    }
  }, [mounted, plansLoading, activePlan, activeTab]);

  if (!mounted || payScaleLoading || plansLoading) {
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

  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex min-h-16 items-center justify-between gap-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Commission Pace
              </p>
              <h1 className="text-xl font-semibold text-slate-950">Goal Tracker</h1>
            </div>
            {activePlan && (
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm font-medium text-slate-600">
                {activePlan.goalType === 'commission' ? 'Commission' : 'Revenue'} Goal
              </span>
            )}
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-3">
            <TabButton
              active={activeTab === 'tracker'}
              onClick={() => setActiveTab('tracker')}
              disabled={!activePlan}
            >
              Tracker
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

      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs font-medium text-stone-400">
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
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-slate-950 text-white shadow-sm'
          : disabled
          ? 'cursor-not-allowed bg-stone-100 text-stone-300'
          : 'bg-white text-slate-600 ring-1 ring-stone-200 hover:bg-stone-100 hover:text-slate-950'
      }`}
    >
      {children}
    </button>
  );
}

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
  const { activePlan, savePlan, deletePlan, loading: plansLoading } = useGoalPlans();
  const { entries, saveEntry, deleteEntry, refresh: refreshEntries } = useDailyEntries(activePlan?.id || null);

  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Auto-switch to new-goal if no active plan
    if (mounted && !plansLoading && !activePlan && activeTab === 'tracker') {
      setActiveTab('new-goal');
    }
  }, [mounted, plansLoading, activePlan, activeTab]);

  if (!mounted || payScaleLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-bold text-gray-900">Goal Tracker</h1>
            {activePlan && (
              <span className="text-sm text-gray-500">
                {activePlan.goalType === 'commission' ? 'Commission' : 'Revenue'} Goal
              </span>
            )}
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 -mb-px">
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

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
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

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 text-center text-xs text-gray-400">
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
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : disabled
          ? 'border-transparent text-gray-300 cursor-not-allowed'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

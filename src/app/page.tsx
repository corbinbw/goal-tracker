'use client';

import { useState, useEffect, useRef } from 'react';
import { usePayScale, useGoalPlans, useDailyEntries, useDailyCountdown, useAllDailyDeals, useHeadToHeadCompetition } from '@/hooks/useLocalStorage';
import PayScaleEditor from '@/components/PayScaleEditor';
import NewGoalForm from '@/components/NewGoalForm';
import Dashboard from '@/components/Dashboard';
import DailyCountdown from '@/components/DailyCountdown';
import HeadToHead from '@/components/HeadToHead';
import TeamDashboard from '@/components/TeamDashboard';
import AuthPanel, { getDisplayName } from '@/components/AuthPanel';
import { DEFAULT_PAY_SCALE, GoalPlan, DailyDeal, DailyEntry } from '@/lib/types';
import { getTodayISO } from '@/lib/calculations';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { applyCloudState, loadCloudState, saveCloudState } from '@/lib/cloudStorage';
import { User } from '@supabase/supabase-js';
import {
  clearAppData,
  createLocalBackup,
  getCurrentLocalUserId,
  hasMeaningfulAppData,
  restoreLatestLocalBackup,
  setCurrentLocalUserId
} from '@/lib/storage';

type Tab = 'today' | 'tracker' | 'team' | 'new-goal' | 'settings';

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
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState('Local changes are saved on this device.');
  const loadedCloudUserId = useRef<string | null>(null);
  const autosaveTimer = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem('goalTracker_theme');
      if (savedTheme === 'dark') setTheme('dark');
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user || loadedCloudUserId.current === user.id) return;

    const sessionKey = `goalTracker_cloudLoaded_${user.id}`;
    if (window.sessionStorage.getItem(sessionKey) === 'true' && getCurrentLocalUserId() === user.id) {
      loadedCloudUserId.current = user.id;
      return;
    }

    loadedCloudUserId.current = user.id;
    loadCloudState(user)
      .then((cloudState) => {
        const previousLocalUserId = getCurrentLocalUserId();
        const switchingUsers = Boolean(previousLocalUserId && previousLocalUserId !== user.id);
        const localHasData = hasMeaningfulAppData();

        if (switchingUsers && localHasData) {
          createLocalBackup(`Before switching from ${previousLocalUserId} to ${user.id}`);
          clearAppData();
        }

        if (!cloudState) {
          setSyncStatus('No cloud save found for this account yet. Set goals or use Save Cloud when ready.');
          setCurrentLocalUserId(user.id);
          if (switchingUsers) {
            window.sessionStorage.setItem(sessionKey, 'true');
            window.location.reload();
          }
          return;
        }

        if (!switchingUsers && !hasMeaningfulAppData(cloudState) && localHasData) {
          setSyncStatus('Cloud save is empty. Local data was kept until you choose Save Cloud.');
          setCurrentLocalUserId(user.id);
          return;
        }

        if (!switchingUsers) {
          createLocalBackup('Before automatic cloud load');
        }
        applyCloudState(cloudState);
        setCurrentLocalUserId(user.id);
        window.sessionStorage.setItem(sessionKey, 'true');
        window.location.reload();
      })
      .catch(() => {
        setSyncStatus('Signed in, but cloud data could not load.');
      });
  }, [user]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const loadUser = async () => {
      const { data } = await client.auth.getUser();
      setUser(data.user);
      if (data.user) setSyncStatus('Signed in. Local changes can sync to cloud.');
    };

    loadUser();
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setSyncStatus(session?.user ? 'Signed in. Local changes can sync to cloud.' : 'Signed out. Saving locally only.');
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const saveWhenHidden = () => {
      if (document.visibilityState !== 'hidden') return;
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      saveCloudState(user).catch(() => undefined);
    };

    document.addEventListener('visibilitychange', saveWhenHidden);
    return () => document.removeEventListener('visibilitychange', saveWhenHidden);
  }, [user]);

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
  const displayName = user ? getDisplayName(user) : null;

  const handleCreatePlan = (plan: GoalPlan) => {
    savePlan(plan);
    setActiveTab('tracker');
    queueCloudSave();
  };

  const handleEndPlan = () => {
    if (activePlan) {
      savePlan({ ...activePlan, isActive: false });
      setActiveTab('new-goal');
      queueCloudSave();
    }
  };

  const handleAddDeal = (deal: DailyDeal) => {
    addDeal(deal);
    refreshEntries();
    refreshAllDailyDeals();
    queueCloudSave();
  };

  const handleDeleteDeal = (dealId: string) => {
    deleteDeal(dealId);
    refreshEntries();
    refreshAllDailyDeals();
    queueCloudSave();
  };

  const handleUpdateDeal = (deal: DailyDeal) => {
    updateDeal(deal);
    refreshEntries();
    refreshAllDailyDeals();
    queueCloudSave();
  };

  const handleClearDeals = () => {
    clearDeals();
    refreshEntries();
    refreshAllDailyDeals();
    queueCloudSave();
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    window.localStorage.setItem('goalTracker_theme', nextTheme);
  };

  const syncCloudSave = async () => {
    if (!user) return;
    try {
      await saveCloudState(user);
      setSyncStatus(`Saved to cloud at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`);
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : 'Could not save to cloud.');
    }
  };

  const syncCloudLoad = async () => {
    if (!user) return;
    try {
      const cloudState = await loadCloudState(user);
      if (!cloudState) {
        setSyncStatus('No cloud save found yet. Save Cloud will create one.');
        return;
      }
      if (!hasMeaningfulAppData(cloudState) && hasMeaningfulAppData()) {
        setSyncStatus('Cloud save is empty, so local data was kept.');
        return;
      }
      createLocalBackup('Before manual cloud load');
      applyCloudState(cloudState);
      window.location.reload();
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : 'Could not load cloud data.');
    }
  };

  const queueCloudSave = () => {
    if (!user) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSyncStatus('Saving changes...');

    autosaveTimer.current = window.setTimeout(() => {
      saveCloudState(user)
        .then(() => {
          setSyncStatus(`Auto-saved at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`);
        })
        .catch(() => setSyncStatus('Cloud auto-save failed. Use Save Cloud to retry.'));
    }, 800);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const createBackup = () => {
    createLocalBackup('Manual backup');
    setSyncStatus('Local backup created.');
  };

  const restoreBackup = () => {
    const backup = restoreLatestLocalBackup();
    if (!backup) {
      setSyncStatus('No local backup found in this browser.');
      return;
    }
    setSyncStatus(`Restored backup from ${new Date(backup.createdAt).toLocaleString()}.`);
    window.setTimeout(() => window.location.reload(), 250);
  };

  const restoreKnownMayPayPeriod = async () => {
    if (!user || user.email?.toLowerCase() !== 'corbinbrandonwilliams@gmail.com') return;

    createLocalBackup('Before restoring May 10-23 data');
    const recoveredPlan = getRecoveredMayPayPeriodPlan();
    const recoveredEntries = getRecoveredMayPayPeriodEntries(recoveredPlan.id);

    savePlan(recoveredPlan);
    recoveredEntries.forEach(entry => saveEntry(entry));
    refreshEntries();
    setActiveTab('tracker');

    try {
      await saveCloudState(user);
      setSyncStatus('Recovered May 10-23 data and saved it to cloud.');
    } catch {
      setSyncStatus('Recovered May 10-23 data locally. Use Save Cloud to retry cloud sync.');
    }

    window.setTimeout(() => window.location.reload(), 250);
  };

  if (isSupabaseConfigured && !user) {
    return (
      <div className={`app-shell min-h-screen ${theme === 'dark' ? 'theme-dark' : ''}`}>
        <header className="app-header">
          <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div>
              <p className="app-kicker text-xs font-semibold uppercase tracking-[0.18em]">
                Commission Pace
              </p>
              <h1 className="app-title text-xl font-semibold">Goal Tracker</h1>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle rounded-full px-3 py-1 text-sm font-semibold transition-colors"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>
        <main className="mx-auto grid min-h-[calc(100vh-96px)] max-w-2xl place-items-center px-4 py-10 sm:px-6">
          <AuthPanel
            user={user}
            syncStatus={syncStatus}
            onLoadCloud={syncCloudLoad}
            onSaveCloud={syncCloudSave}
            onCreateBackup={createBackup}
            onRestoreBackup={restoreBackup}
          />
        </main>
      </div>
    );
  }

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
            <div className="flex flex-wrap items-center justify-end gap-2">
              {displayName && (
                <span className="app-badge rounded-full px-3 py-1 text-sm font-medium">
                  Welcome, {displayName}
                </span>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle rounded-full px-3 py-1 text-sm font-semibold transition-colors"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              {user && (
                <button
                  type="button"
                  onClick={signOut}
                  className="theme-toggle rounded-full px-3 py-1 text-sm font-semibold transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
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
              active={activeTab === 'team'}
              onClick={() => setActiveTab('team')}
            >
              Team
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
            onSaveGoal={(goal) => {
              saveDailyGoal(goal);
              queueCloudSave();
            }}
            onAddDeal={handleAddDeal}
            onUpdateDeal={handleUpdateDeal}
            onDeleteDeal={handleDeleteDeal}
              onClearDeals={handleClearDeals}
            />
            <HeadToHead
              competition={competition}
              deals={allDailyDeals}
              onSaveCompetition={(nextCompetition) => {
                saveCompetition(nextCompetition);
                queueCloudSave();
              }}
              onAddBuddyEntry={(competitionId, entry) => {
                addBuddyEntry(competitionId, entry);
                queueCloudSave();
              }}
              onDeleteBuddyEntry={(competitionId, entryId) => {
                deleteBuddyEntry(competitionId, entryId);
                queueCloudSave();
              }}
            />
          </div>
        )}

        {activeTab === 'tracker' && activePlan && (
          <Dashboard
            plan={activePlan}
            entries={entries}
            payScale={currentPayScale}
            onSavePlan={(plan) => {
              savePlan(plan);
              queueCloudSave();
            }}
            onSaveEntry={(entry) => {
              saveEntry(entry);
              queueCloudSave();
            }}
            onDeleteEntry={(entryId) => {
              deleteEntry(entryId);
              queueCloudSave();
            }}
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

        {activeTab === 'team' && (
          <TeamDashboard />
        )}

        {activeTab === 'new-goal' && (
          <NewGoalForm
            payScale={currentPayScale}
            onCreatePlan={handleCreatePlan}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {user && (
              <AuthPanel
                user={user}
                syncStatus={syncStatus}
                onLoadCloud={syncCloudLoad}
                onSaveCloud={syncCloudSave}
                onCreateBackup={createBackup}
                onRestoreBackup={restoreBackup}
              />
            )}
            {user?.email?.toLowerCase() === 'corbinbrandonwilliams@gmail.com' && (
              <section className="auth-panel rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  Data Recovery
                </p>
                <h2 className="mt-1 font-semibold text-slate-950">Restore May 10-23 Pay Period</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Recreates the deals you listed, then saves them to your cloud account.
                </p>
                <button
                  type="button"
                  onClick={restoreKnownMayPayPeriod}
                  className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Restore May Data
                </button>
              </section>
            )}
            <PayScaleEditor
              payScale={currentPayScale}
              onSave={(nextPayScale) => {
                setPayScale(nextPayScale);
                queueCloudSave();
              }}
            />
          </div>
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

function getRecoveredMayPayPeriodPlan(): GoalPlan {
  return {
    id: 'recovered-pay-period-2026-05-10-2026-05-23',
    createdAt: '2026-05-18T00:00:00.000Z',
    goalType: 'revenue',
    goalAmount: 50000,
    revenueTarget: 50000,
    workdaysTotal: 12,
    startDate: '2026-05-10',
    endDate: '2026-05-23',
    isActive: true
  };
}

function getRecoveredMayPayPeriodEntries(goalPlanId: string): DailyEntry[] {
  return [
    {
      id: 'recovered-2026-05-11-andrew-buckley',
      goalPlanId,
      date: '2026-05-11',
      revenue: 2507.88,
      notes: 'Recovered from notes',
      driverName: 'Andrew Buckley',
      dealTag: 'https://dd.leaseend.com/deals/726769',
      funded: true
    },
    {
      id: 'recovered-2026-05-12-alejandro-gomez',
      goalPlanId,
      date: '2026-05-12',
      revenue: 3742.87,
      notes: 'Recovered from notes',
      driverName: 'Alejandro Gomez',
      dealTag: 'https://dd.leaseend.com/deals/736030',
      funded: true
    },
    {
      id: 'recovered-2026-05-13-john-mcgill',
      goalPlanId,
      date: '2026-05-13',
      revenue: 5132.25,
      notes: 'Recovered from notes',
      driverName: 'JOHN MCGILL',
      dealTag: 'https://dd.leaseend.com/deals/737220',
      funded: true
    },
    {
      id: 'recovered-2026-05-13-josette-brand',
      goalPlanId,
      date: '2026-05-13',
      revenue: 4048.78,
      notes: 'Recovered from notes',
      driverName: 'Josette Brand',
      dealTag: 'https://dd.leaseend.com/deals/716797',
      funded: true
    },
    {
      id: 'recovered-2026-05-14-brianna-wilkins',
      goalPlanId,
      date: '2026-05-14',
      revenue: 201,
      notes: 'Recovered from notes',
      driverName: 'BRIANNA WILKINS',
      dealTag: 'https://dd.leaseend.com/deals/737686',
      funded: true
    },
    {
      id: 'recovered-2026-05-14-jeremy-laubon',
      goalPlanId,
      date: '2026-05-14',
      revenue: 2353.91,
      notes: 'Recovered from notes',
      driverName: 'Jeremy Laubon',
      dealTag: 'https://dd.leaseend.com/deals/737173',
      funded: true
    },
    {
      id: 'recovered-2026-05-15-martin-melish',
      goalPlanId,
      date: '2026-05-15',
      revenue: 1980.13,
      notes: 'Recovered from notes',
      driverName: 'MARTIN MELISH',
      dealTag: 'https://dd.leaseend.com/deals/735845',
      funded: false
    }
  ];
}

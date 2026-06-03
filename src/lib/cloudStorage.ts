'use client';

import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { AppDataSnapshot, exportAppData, importAppData } from './storage';

interface CloudStateRow {
  user_id: string;
  data: AppDataSnapshot;
  updated_at: string;
}

interface ProfileRow {
  user_id: string;
  email: string;
  full_name: string | null;
  updated_at: string;
}

interface TeamStateRow {
  user_id: string;
  data: AppDataSnapshot;
  updated_at: string;
}

interface TeamMemberRow {
  email: string;
  role: 'manager' | 'member';
  created_at: string;
}

export interface TeamMemberState {
  userId: string;
  email: string;
  name: string;
  data: AppDataSnapshot;
  updatedAt: string;
  hasCloudState: boolean;
  hasProfile: boolean;
}

function getUserName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
  return user.email?.split('@')[0] || 'Unknown';
}

export async function saveUserProfile(user: User): Promise<void> {
  if (!supabase || !user.email) return;

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      email: user.email.toLowerCase(),
      full_name: getUserName(user),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

export async function loadCloudState(user: User): Promise<AppDataSnapshot | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle<Pick<CloudStateRow, 'data'>>();

  if (error) throw error;
  return data?.data ? normalizeAppData(data.data) : null;
}

export async function saveCloudState(user: User): Promise<void> {
  if (!supabase) return;

  await saveUserProfile(user);
  const snapshot = exportAppData();
  const { error } = await supabase
    .from('app_state')
    .upsert({
      user_id: user.id,
      data: snapshot,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

export function applyCloudState(data: AppDataSnapshot): void {
  importAppData(normalizeAppData(data));
}

export async function loadTeamStates(): Promise<TeamMemberState[]> {
  if (!supabase) return [];

  const [statesResult, profilesResult, teamMembersResult] = await Promise.all([
    supabase
      .from('app_state')
      .select('user_id,data,updated_at')
      .order('updated_at', { ascending: false })
      .returns<TeamStateRow[]>(),
    supabase
      .from('profiles')
      .select('user_id,email,full_name,updated_at')
      .returns<ProfileRow[]>(),
    supabase
      .from('team_members')
      .select('email,role,created_at')
      .returns<TeamMemberRow[]>()
  ]);

  if (statesResult.error) throw statesResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (teamMembersResult.error) throw teamMembersResult.error;

  const profilesByEmail = new Map(profilesResult.data.map(profile => [profile.email.toLowerCase(), profile]));
  const statesByUserId = new Map(statesResult.data.map(state => [state.user_id, state]));
  const members = teamMembersResult.data
    .filter(member => member.role === 'member')
    .sort((a, b) => a.email.localeCompare(b.email));

  return members.map(member => {
    const profile = profilesByEmail.get(member.email.toLowerCase());
    const state = profile ? statesByUserId.get(profile.user_id) : undefined;
    return {
      userId: profile?.user_id || member.email,
      email: profile?.email || member.email,
      name: profile?.full_name || member.email.split('@')[0],
      data: state?.data ? normalizeAppData(state.data) : getEmptyAppData(),
      updatedAt: state?.updated_at || profile?.updated_at || '',
      hasCloudState: Boolean(state),
      hasProfile: Boolean(profile)
    };
  });
}

function normalizeAppData(data: Partial<AppDataSnapshot>): AppDataSnapshot {
  return {
    payScale: data.payScale || getEmptyAppData().payScale,
    goalPlans: Array.isArray(data.goalPlans) ? data.goalPlans : [],
    dailyEntries: Array.isArray(data.dailyEntries) ? data.dailyEntries : [],
    dailyGoals: Array.isArray(data.dailyGoals) ? data.dailyGoals : [],
    dailyDeals: Array.isArray(data.dailyDeals) ? data.dailyDeals : [],
    headToHead: Array.isArray(data.headToHead) ? data.headToHead : [],
    dailyActivities: Array.isArray(data.dailyActivities) ? data.dailyActivities : [],
    dailyLeads: Array.isArray(data.dailyLeads) ? data.dailyLeads : []
  };
}

function getEmptyAppData(): AppDataSnapshot {
  return {
    payScale: {
      id: 'default',
      tierType: 'retroactive',
      tiers: [],
      avgDealSize: null
    },
    goalPlans: [],
    dailyEntries: [],
    dailyGoals: [],
    dailyDeals: [],
    headToHead: [],
    dailyActivities: [],
    dailyLeads: []
  };
}

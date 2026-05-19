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

export interface TeamMemberState {
  userId: string;
  email: string;
  name: string;
  data: AppDataSnapshot;
  updatedAt: string;
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
  return data?.data || null;
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
  importAppData(data);
}

export async function loadTeamStates(): Promise<TeamMemberState[]> {
  if (!supabase) return [];

  const [statesResult, profilesResult] = await Promise.all([
    supabase
      .from('app_state')
      .select('user_id,data,updated_at')
      .order('updated_at', { ascending: false })
      .returns<TeamStateRow[]>(),
    supabase
      .from('profiles')
      .select('user_id,email,full_name,updated_at')
      .returns<ProfileRow[]>()
  ]);

  if (statesResult.error) throw statesResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const profilesById = new Map(profilesResult.data.map(profile => [profile.user_id, profile]));

  return statesResult.data.map(row => {
    const profile = profilesById.get(row.user_id);
    return {
      userId: row.user_id,
      email: profile?.email || 'Unknown email',
      name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown rep',
      data: row.data,
      updatedAt: row.updated_at
    };
  });
}

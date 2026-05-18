'use client';

import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { AppDataSnapshot, exportAppData, importAppData } from './storage';

interface CloudStateRow {
  user_id: string;
  data: AppDataSnapshot;
  updated_at: string;
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

'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface Props {
  user: User | null;
  syncStatus: string;
  onLoadCloud: () => void;
  onSaveCloud: () => void;
}

export default function AuthPanel({ user, syncStatus, onLoadCloud, onSaveCloud }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!supabase || !email || !password) return;

    setSubmitting(true);
    setMessage('');

    const authCall = mode === 'signin'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await authCall;
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(mode === 'signin' ? 'Signed in.' : 'Account created. Check your email if confirmation is turned on.');
      setPassword('');
    }

    setSubmitting(false);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (!isSupabaseConfigured) {
    return (
      <section className="auth-panel rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-amber-900">Supabase is not connected yet.</p>
        <p className="mt-1 text-sm text-amber-800">
          Add your Supabase URL and anon key to environment variables, then redeploy.
        </p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="auth-panel flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Cloud Sync</p>
          <h2 className="mt-1 font-semibold text-slate-950">{user.email}</h2>
          <p className="mt-1 text-sm text-slate-500">{syncStatus}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLoadCloud}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
          >
            Load Cloud
          </button>
          <button
            type="button"
            onClick={onSaveCloud}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Save Cloud
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-100"
          >
            Sign Out
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-panel rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Account</p>
        <h2 className="mt-1 font-semibold text-slate-950">Sign in to sync across devices</h2>
        <p className="mt-1 text-sm text-slate-500">Use the same login on your phone and computer.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-md bg-blue-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="font-semibold text-blue-700 hover:text-blue-800"
        >
          {mode === 'signin' ? 'Create account instead' : 'Sign in instead'}
        </button>
        {message && <span className="text-slate-500">{message}</span>}
      </div>
    </section>
  );
}

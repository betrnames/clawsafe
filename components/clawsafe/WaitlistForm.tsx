'use client';

import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { createAnonClient } from '@/lib/supabase';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createAnonClient();
      const { error: dbError } = await supabase
        .from('waitlist')
        .insert({ email: email.trim().toLowerCase() });

      if (dbError) {
        if (dbError.code === '23505') {
          setSuccess(true);
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-green-400 text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        You&apos;re on the list! We&apos;ll email you at launch.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="flex-1 bg-slate-900/70 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-600/70 transition-colors"
      />
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Joining…' : 'Join Waitlist'}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </form>
  );
}

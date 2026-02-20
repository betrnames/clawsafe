'use client';

import { useState } from 'react';
import { Shield, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { ScanResult, PaymentRequired } from '@/lib/types';

type ApiResponse = ScanResult | PaymentRequired | { error: string };

export function ScanForm() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [paymentRequired, setPaymentRequired] = useState<PaymentRequired | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);
    setPaymentRequired(null);
    setError(null);

    const isUrl = input.startsWith('http');
    const body = isUrl ? { githubUrl: input.trim() } : { skillName: input.trim() };

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as ApiResponse;

      if (res.status === 402 && 'error' in data && data.error === 'payment_required') {
        setPaymentRequired(data as PaymentRequired);
      } else if ('error' in data) {
        setError((data as { error: string }).error);
      } else {
        setResult(data as ScanResult);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = result
    ? result.score >= 75
      ? 'text-green-400'
      : result.score >= 45
      ? 'text-yellow-400'
      : 'text-red-400'
    : '';

  const scoreBg = result
    ? result.score >= 75
      ? 'border-green-700/50 bg-green-950/30'
      : result.score >= 45
      ? 'border-yellow-700/50 bg-yellow-950/30'
      : 'border-red-700/50 bg-red-950/30'
    : '';

  return (
    <div className="relative z-10 max-w-2xl mx-auto">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-sky-400" />
          <span className="text-sm font-semibold text-white">Scan a Skill</span>
        </div>

        <form onSubmit={handleScan} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://github.com/user/repo/blob/main/skill.ts or skill-name"
            className="flex-1 bg-slate-900/70 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-600/70 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {loading ? 'Scanning…' : 'Scan'}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {paymentRequired && (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/30 border border-amber-700/50">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-amber-300">Free Tier Exhausted</span>
            </div>
            <p className="text-xs text-amber-200/70 mb-3">{paymentRequired.message}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 rounded-lg p-2">
                <span className="text-slate-500 block">Amount</span>
                <span className="text-white font-mono">{paymentRequired.payment.amount} {paymentRequired.payment.currency}</span>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2">
                <span className="text-slate-500 block">Network</span>
                <span className="text-white font-mono">{paymentRequired.payment.network}</span>
              </div>
              <div className="col-span-2 bg-slate-900/60 rounded-lg p-2">
                <span className="text-slate-500 block mb-1">Pay To</span>
                <span className="text-white font-mono text-xs break-all">{paymentRequired.payment.payTo}</span>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-4 p-4 rounded-xl border ${scoreBg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.safe
                  ? <CheckCircle className="w-5 h-5 text-green-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />}
                <span className="text-sm font-semibold text-white">{result.skillName}</span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${scoreColor}`}>{result.score}</span>
                <span className="text-slate-500 text-sm">/100</span>
                <div className={`text-xs font-semibold mt-0.5 ${scoreColor}`}>{result.recommendation}</div>
              </div>
            </div>

            {result.flags.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Flags</div>
                {result.flags.map((flag) => (
                  <FlagRow key={flag.id} flag={flag} />
                ))}
              </div>
            )}

            {result.flags.length === 0 && (
              <p className="text-xs text-green-400/70">No threats detected in static analysis.</p>
            )}

            {result.freeRemaining !== undefined && (
              <p className="text-xs text-slate-600 mt-3">
                Free tier: {result.freeRemaining} check{result.freeRemaining !== 1 ? 's' : ''} remaining today
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FlagRow({ flag }: { flag: { severity: string; description: string; category: string } }) {
  const colors: Record<string, string> = {
    critical: 'text-red-400 bg-red-950/40',
    high: 'text-orange-400 bg-orange-950/40',
    medium: 'text-yellow-400 bg-yellow-950/40',
    low: 'text-blue-400 bg-blue-950/40',
  };

  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${colors[flag.severity] ?? colors.low}`}>
        {flag.severity}
      </span>
      <span className="text-slate-300">{flag.description}</span>
    </div>
  );
}

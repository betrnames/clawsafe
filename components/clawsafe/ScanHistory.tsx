'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { createAnonClient } from '@/lib/supabase';
import type { Scan } from '@/lib/types';

export function ScanHistory() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from('scans')
        .select('id, skill_name, source_url, score, safe, recommendation, created_at, flags')
        .order('created_at', { ascending: false })
        .limit(10);

      setScans((data as Scan[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        No scans yet. Be the first to verify a skill.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scans.map((scan) => (
        <ScanRow key={scan.id} scan={scan} />
      ))}
    </div>
  );
}

function ScanRow({ scan }: { scan: Scan }) {
  const scoreColor =
    scan.score >= 75 ? 'text-green-400' : scan.score >= 45 ? 'text-yellow-400' : 'text-red-400';

  const icon = scan.safe ? (
    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
  ) : scan.score >= 45 ? (
    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
  ) : (
    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
  );

  const timeAgo = formatTimeAgo(scan.created_at);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 transition-all duration-200">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{scan.skill_name}</span>
          {scan.source_url && (
            <a
              href={scan.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-slate-500">{timeAgo}</span>
          {Array.isArray(scan.flags) && scan.flags.length > 0 && (
            <span className="text-xs text-slate-600">
              {scan.flags.length} flag{scan.flags.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-lg font-bold ${scoreColor}`}>{scan.score}</span>
        <div className="text-xs text-slate-500 mt-0.5">{scan.recommendation}</div>
      </div>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

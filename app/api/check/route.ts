import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withX402 } from 'x402-next';
import type { Resource } from 'x402/types';
import { createServiceClient } from '@/lib/supabase';
import { fetchGitHubCode, extractSkillNameFromUrl } from '@/lib/github';
import { staticCodeAnalysis } from '@/lib/claude-analysis';
import { scanUrl } from '@/lib/virustotal';
import type { ScanResult, ScanFlag } from '@/lib/types';

const FREE_TIER_LIMIT = parseInt(process.env.FREE_TIER_LIMIT ?? '3', 10);
const PAYMENT_ADDRESS = (process.env.X402_PAYMENT_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

const requestSchema = z.object({
  skillName: z.string().min(1).max(200).optional(),
  githubUrl: z.string().url().optional(),
}).refine((d) => d.skillName || d.githubUrl, {
  message: 'Provide either a skill name or a GitHub URL.',
});

function getRequesterIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function computeFinalScore(vtScore: number, flags: ScanFlag[]): number {
  const criticalCount = flags.filter((f) => f.severity === 'critical').length;
  const highCount = flags.filter((f) => f.severity === 'high').length;
  const vtPenalty = Math.min(vtScore * 2, 40);
  const flagPenalty = Math.min(criticalCount * 20 + highCount * 10, 40);
  return Math.max(0, Math.min(100, Math.round(100 - vtPenalty - flagPenalty)));
}

function deriveRecommendation(score: number): ScanResult['recommendation'] {
  if (score >= 75) return 'Safe';
  if (score >= 45) return 'Caution';
  return 'Unsafe';
}

async function checkFreeTier(
  ip: string,
  db: ReturnType<typeof createServiceClient>
): Promise<{ allowed: boolean; freeUsed: number }> {
  const today = new Date().toISOString().split('T')[0];

  const { data: usage } = await db
    .from('usage_tracking')
    .select('scan_count, last_reset')
    .eq('ip_address', ip)
    .maybeSingle();

  if (!usage) {
    await db.from('usage_tracking').insert({ ip_address: ip, scan_count: 1, last_reset: today });
    return { allowed: true, freeUsed: 1 };
  }

  const needsReset = usage.last_reset !== today;
  const currentCount: number = needsReset ? 0 : (usage.scan_count as number);

  if (currentCount >= FREE_TIER_LIMIT) {
    return { allowed: false, freeUsed: currentCount };
  }

  const newCount = currentCount + 1;
  await db.from('usage_tracking').update({ scan_count: newCount, last_reset: today }).eq('ip_address', ip);
  return { allowed: true, freeUsed: newCount };
}

async function performScan(req: NextRequest): Promise<NextResponse> {
  const db = createServiceClient();
  const ip = getRequesterIp(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { skillName, githubUrl } = parsed.data;
  let code = '';
  let resolvedName = skillName ?? extractSkillNameFromUrl(githubUrl!);
  let vtResult = { malicious: 0, suspicious: 0, harmless: 72, undetected: 0, total: 72, score: 0 };

  if (githubUrl) {
    try {
      code = await fetchGitHubCode(githubUrl);
      if (!skillName) resolvedName = extractSkillNameFromUrl(githubUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch GitHub code.';
      return NextResponse.json({ error: message }, { status: 422 });
    }
    try {
      vtResult = await scanUrl(githubUrl);
    } catch {
    }
  } else {
    code = `// Skill: ${resolvedName}\n// Source code not available for name-only scan.`;
  }

  const flags = staticCodeAnalysis(code);
  const finalScore = computeFinalScore(vtResult.score, flags);
  const recommendation = deriveRecommendation(finalScore);
  const safe = finalScore >= 75;

  const { data: saved } = await db
    .from('scans')
    .insert({
      skill_name: resolvedName,
      source_url: githubUrl ?? null,
      score: finalScore,
      safe,
      flags,
      recommendation,
      virustotal_result: vtResult,
      claude_analysis: null,
      requester_ip: ip,
    })
    .select('id')
    .maybeSingle();

  const response: ScanResult = {
    score: finalScore,
    safe,
    flags,
    recommendation,
    scanId: saved?.id,
    skillName: resolvedName,
    sourceUrl: githubUrl,
  };

  return NextResponse.json(response);
}

const COINBASE_FACILITATOR = {
  url: 'https://api.cdp.coinbase.com/platform/v2/x402' as Resource,
};

// Paid path: x402 middleware handles payment verification before the handler runs
const paidScan = withX402(
  performScan,
  PAYMENT_ADDRESS,
  {
    price: '$0.008',
    network: 'base',
    config: { description: 'ClawSafe skill security scan — 0.008 USDC on Base' },
  },
  COINBASE_FACILITATOR
);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const db = createServiceClient();
  const ip = getRequesterIp(req);

  // x402-compliant clients send X-PAYMENT header; route them to the paid path
  const hasPaymentHeader =
    req.headers.has('x-payment') ||
    req.headers.has('payment-signature') ||
    req.headers.has('x-402-payment');

  if (hasPaymentHeader) {
    return paidScan(req) as Promise<NextResponse>;
  }

  // Free tier path: enforce daily limit
  const gate = await checkFreeTier(ip, db);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: 'payment_required',
        message: `Free tier exhausted (${FREE_TIER_LIMIT} checks/day). Send X-PAYMENT header with 0.008 USDC on Base.`,
        payment: {
          amount: '0.008',
          currency: 'USDC',
          network: 'base',
          payTo: PAYMENT_ADDRESS,
        },
        freeUsed: gate.freeUsed,
        freeRemaining: 0,
        freeLimit: FREE_TIER_LIMIT,
      },
      { status: 402 }
    );
  }

  const result = await performScan(req);
  if (result.status !== 200) return result;

  const data = await result.json() as ScanResult;
  return NextResponse.json({
    ...data,
    freeUsed: gate.freeUsed,
    freeRemaining: FREE_TIER_LIMIT - gate.freeUsed,
    freeLimit: FREE_TIER_LIMIT,
  });
}

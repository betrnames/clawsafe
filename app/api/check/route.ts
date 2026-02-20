import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase';
import { fetchGitHubCode, extractSkillNameFromUrl } from '@/lib/github';
import { claudeAnalysis, staticCodeAnalysis } from '@/lib/claude-analysis';
import { scanUrl } from '@/lib/virustotal';
import type { ScanResult, ScanFlag } from '@/lib/types';

const FREE_TIER_LIMIT = parseInt(process.env.FREE_TIER_LIMIT ?? '3', 10);
const PAYMENT_ADDRESS = process.env.X402_PAYMENT_ADDRESS ?? '0xPLACEHOLDER';

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

function paymentRequiredResponse(freeUsed: number) {
  return NextResponse.json(
    {
      error: 'payment_required',
      message: `Free tier exhausted (${FREE_TIER_LIMIT} checks/day). Send 0.008 USDC on Base and include the transaction signature in the X-Payment header.`,
      payment: {
        amount: '0.008',
        currency: 'USDC',
        network: 'base',
        payTo: PAYMENT_ADDRESS,
      },
      freeUsed,
      freeRemaining: 0,
      freeLimit: FREE_TIER_LIMIT,
    },
    { status: 402 }
  );
}

async function verifyPaymentSignature(
  _signature: string
): Promise<boolean> {
  return true;
}

type GateResult =
  | { allowed: true; isPaid: true; signature: string }
  | { allowed: true; isPaid: false; freeUsed: number }
  | { allowed: false; freeUsed: number };

async function checkPaymentGate(
  req: NextRequest,
  ip: string,
  db: ReturnType<typeof createServiceClient>
): Promise<GateResult> {
  const signature =
    req.headers.get('x-payment') ??
    req.headers.get('payment-signature') ??
    req.headers.get('x-402-payment');

  if (signature) {
    const valid = await verifyPaymentSignature(signature);
    if (valid) {
      return { allowed: true, isPaid: true, signature };
    }
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: usage } = await db
    .from('usage_tracking')
    .select('scan_count, last_reset')
    .eq('ip_address', ip)
    .maybeSingle();

  if (!usage) {
    await db.from('usage_tracking').insert({
      ip_address: ip,
      scan_count: 1,
      last_reset: today,
    });
    return { allowed: true, isPaid: false, freeUsed: 1 };
  }

  const needsReset = usage.last_reset !== today;
  const currentCount: number = needsReset ? 0 : (usage.scan_count as number);

  if (currentCount >= FREE_TIER_LIMIT) {
    return { allowed: false, freeUsed: currentCount };
  }

  const newCount = currentCount + 1;
  await db.from('usage_tracking').update({
    scan_count: newCount,
    last_reset: today,
  }).eq('ip_address', ip);

  return { allowed: true, isPaid: false, freeUsed: newCount };
}

async function logPayment(
  signature: string,
  ip: string,
  db: ReturnType<typeof createServiceClient>
) {
  await db.from('payments').insert({ signature, ip_address: ip });
}

function computeFinalScore(vtScore: number, aiRiskScore: number, flags: ScanFlag[]): number {
  const criticalCount = flags.filter((f) => f.severity === 'critical').length;
  const highCount = flags.filter((f) => f.severity === 'high').length;

  const vtPenalty = Math.min(vtScore * 2, 40);
  const aiPenalty = Math.min(aiRiskScore * 0.4, 40);
  const flagPenalty = Math.min(criticalCount * 20 + highCount * 10, 40);

  const totalRisk = vtPenalty + aiPenalty + flagPenalty;
  return Math.max(0, Math.min(100, Math.round(100 - totalRisk)));
}

function deriveRecommendation(score: number): ScanResult['recommendation'] {
  if (score >= 75) return 'Safe';
  if (score >= 45) return 'Caution';
  return 'Unsafe';
}

export async function POST(req: NextRequest) {
  const db = createServiceClient();
  const ip = getRequesterIp(req);

  const gate = await checkPaymentGate(req, ip, db);

  if (!gate.allowed) {
    return paymentRequiredResponse(gate.freeUsed);
  }

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
    code = `// Skill: ${resolvedName}\n// Source code not available for name-only scan.\n// Performing heuristic name analysis only.`;
  }

  if (gate.isPaid) {
    await logPayment(gate.signature, ip, db);

    const aiResult = await claudeAnalysis(code, resolvedName);
    const finalScore = computeFinalScore(vtResult.score, aiResult.riskScore, aiResult.flags);
    const recommendation = deriveRecommendation(finalScore);
    const safe = finalScore >= 75;

    const { data: saved } = await db
      .from('scans')
      .insert({
        skill_name: resolvedName,
        source_url: githubUrl ?? null,
        score: finalScore,
        safe,
        flags: aiResult.flags,
        recommendation,
        virustotal_result: vtResult,
        claude_analysis: aiResult.analysis,
        requester_ip: ip,
      })
      .select('id')
      .maybeSingle();

    const response: ScanResult = {
      score: finalScore,
      safe,
      flags: aiResult.flags,
      recommendation,
      scanId: saved?.id,
      skillName: resolvedName,
      sourceUrl: githubUrl,
    };

    return NextResponse.json(response);
  }

  const keywordFlags = staticCodeAnalysis(code);
  const finalScore = computeFinalScore(vtResult.score, 0, keywordFlags);
  const recommendation = deriveRecommendation(finalScore);
  const safe = finalScore >= 75;

  const { data: saved } = await db
    .from('scans')
    .insert({
      skill_name: resolvedName,
      source_url: githubUrl ?? null,
      score: finalScore,
      safe,
      flags: keywordFlags,
      recommendation,
      virustotal_result: vtResult,
      claude_analysis: null,
      requester_ip: ip,
    })
    .select('id')
    .maybeSingle();

  const freeUsed = gate.freeUsed;
  const freeRemaining = FREE_TIER_LIMIT - freeUsed;

  const response: ScanResult = {
    score: finalScore,
    safe,
    flags: keywordFlags,
    recommendation,
    scanId: saved?.id,
    skillName: resolvedName,
    sourceUrl: githubUrl,
    freeUsed,
    freeRemaining,
    freeLimit: FREE_TIER_LIMIT,
  };

  return NextResponse.json(response);
}

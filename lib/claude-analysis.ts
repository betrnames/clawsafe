import Anthropic from '@anthropic-ai/sdk';
import type { ScanFlag } from './types';

interface AnalysisResult {
  flags: ScanFlag[];
  riskScore: number;
  analysis: string;
}

const STATIC_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  severity: ScanFlag['severity'];
  description: string;
}> = [
  { pattern: /child_process|exec\s*\(|spawn\s*\(|execSync|spawnSync/g, category: 'shell-execution', severity: 'critical', description: 'Shell command execution detected' },
  { pattern: /private.?key|seed.?phrase|mnemonic|wallet\.drain|transferFrom|sendTransaction/gi, category: 'wallet-drain', severity: 'critical', description: 'Potential wallet drain or key theft' },
  { pattern: /eval\s*\(|new\s+Function\s*\(/g, category: 'code-injection', severity: 'high', description: 'Dynamic code execution via eval or Function constructor' },
  { pattern: /fetch\s*\(|axios\.|XMLHttpRequest|WebSocket/g, category: 'suspicious-network', severity: 'low', description: 'Network request to external endpoint' },
  { pattern: /process\.env\b/g, category: 'env-access', severity: 'medium', description: 'Reads environment variables' },
  { pattern: /fs\.(read|write|unlink|rm|rename|mkdir)|require\s*\(\s*['"]fs['"]\s*\)/g, category: 'filesystem-access', severity: 'medium', description: 'File system access detected' },
  { pattern: /localStorage|sessionStorage|document\.cookie/g, category: 'storage-access', severity: 'medium', description: 'Browser storage or cookie access' },
  { pattern: /btoa\s*\(|atob\s*\(|Buffer\.from.*base64|fromCharCode/g, category: 'obfuscation', severity: 'medium', description: 'Encoding/obfuscation techniques detected' },
  { pattern: /exfil|data\s*=.*\bfetch\b|post.*secret|upload.*token/gi, category: 'data-exfiltration', severity: 'high', description: 'Possible data exfiltration pattern' },
];

export function staticCodeAnalysis(code: string): ScanFlag[] {
  const flags: ScanFlag[] = [];
  const seen = new Set<string>();

  for (const rule of STATIC_PATTERNS) {
    const matches = code.match(rule.pattern);
    if (matches && !seen.has(rule.category)) {
      seen.add(rule.category);
      flags.push({
        id: rule.category,
        category: rule.category,
        severity: rule.severity,
        description: rule.description,
      });
    }
  }

  return flags;
}

export async function claudeAnalysis(code: string, skillName: string): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    const flags = staticCodeAnalysis(code);
    const riskScore = flags.reduce((acc, f) => {
      const weights = { critical: 30, high: 20, medium: 10, low: 5 };
      return acc + (weights[f.severity] ?? 5);
    }, 0);
    return { flags, riskScore, analysis: 'Static analysis only (AI key not configured).' };
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are a security auditor reviewing code for a skill named "${skillName}".

Analyze the following source code for security threats. Look for:
1. Wallet drain / unauthorized transactions
2. Private key or seed phrase extraction
3. Shell injection (child_process, exec, spawn)
4. Data exfiltration (sending data to external servers)
5. Code injection (eval, Function constructor)
6. File system abuse
7. Obfuscation techniques
8. Environment variable harvesting
9. Suspicious network calls
10. Storage/cookie access

Return ONLY valid JSON matching this schema:
{
  "riskScore": <0-100 integer>,
  "flags": [
    {
      "id": "<unique-slug>",
      "category": "<category-slug>",
      "severity": "critical" | "high" | "medium" | "low",
      "description": "<one sentence>",
      "line": <optional line number>
    }
  ],
  "analysis": "<2-3 sentence overall summary>"
}

SOURCE CODE:
\`\`\`
${code.slice(0, 30_000)}
\`\`\``;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
    return parsed;
  } catch {
    const flags = staticCodeAnalysis(code);
    const riskScore = flags.reduce((acc, f) => {
      const weights = { critical: 30, high: 20, medium: 10, low: 5 };
      return acc + (weights[f.severity] ?? 5);
    }, 0);
    return { flags, riskScore, analysis: 'AI analysis failed; static analysis results used.' };
  }
}

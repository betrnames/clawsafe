import type { ScanFlag } from './types';

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

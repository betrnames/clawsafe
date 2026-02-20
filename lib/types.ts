export interface ScanFlag {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
}

export interface ScanResult {
  score: number;
  safe: boolean;
  flags: ScanFlag[];
  recommendation: 'Safe' | 'Caution' | 'Unsafe';
  scanId?: string;
  skillName: string;
  sourceUrl?: string;
  createdAt?: string;
  freeUsed?: number;
  freeRemaining?: number;
  freeLimit?: number;
}

export interface CheckRequest {
  skillName?: string;
  githubUrl?: string;
}

export interface Scan {
  id: string;
  skill_name: string;
  source_url: string | null;
  score: number;
  safe: boolean;
  flags: ScanFlag[];
  recommendation: string;
  virustotal_result: Record<string, unknown> | null;
  claude_analysis: string | null;
  requester_ip: string | null;
  created_at: string;
}

export interface PaymentRequired {
  error: 'payment_required';
  message: string;
  payment: {
    amount: string;
    currency: string;
    network: string;
    payTo: string;
  };
  freeUsed: number;
  freeRemaining: number;
  freeLimit: number;
}

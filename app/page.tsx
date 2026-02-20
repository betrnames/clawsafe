import Image from 'next/image';
import { Shield, Zap, Eye, CreditCard, CheckCircle, Github, ExternalLink } from 'lucide-react';
import { ScanForm } from '@/components/clawsafe/ScanForm';
import { ScanHistory } from '@/components/clawsafe/ScanHistory';
import { WaitlistForm } from '@/components/clawsafe/WaitlistForm';
import { ScanHeartbeat } from '@/components/clawsafe/ScanHeartbeat';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050c1a' }}>
      <div className="grid-bg min-h-screen">

        <header className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-50" style={{ backgroundColor: 'rgba(5, 12, 26, 0.85)' }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/clawsafe.png" alt="ClawSafe Logo" width={36} height={36} />
              <span className="font-bold text-white text-lg tracking-tight">ClawSafe</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
              <a href="#waitlist" className="hover:text-white transition-colors">Join Waitlist</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </nav>
          </div>
        </header>

        <main>
          <section className="relative pt-20 pb-6 px-6 overflow-hidden">
            <ScanHeartbeat />
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-950/60 border border-sky-800/50 text-sky-400 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  VirusTotal + AI-powered scanning
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 tracking-tight">
                ClawSafe{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                  &ndash; Verify Claw Skills
                </span>
                <br />
                Before Install
              </h1>

              <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                Scan any ClawHub or OpenClaw skill for wallet drain patterns, data exfiltration,
                shell injection, and dozens of other threats &mdash; before you give it access to your system.
              </p>

              <section id="waitlist" className="mb-8">
                <div className="max-w-xl mx-auto">
                  <div className="bg-slate-800/50 border border-sky-800/40 rounded-2xl px-6 py-5 shadow-2xl shadow-sky-950/30 text-center">
                    <h2 className="text-base font-bold text-white mb-1">Get Early Access</h2>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">
                      ClawSafe is launching soon. Join the waitlist and be the first to verify skills,
                      protect your setup, and access the free tier from day one.
                    </p>
                    <WaitlistForm />
                    <p className="text-xs text-slate-600 mt-3">No spam. One email when we launch.</p>
                  </div>
                </div>
              </section>

            </div>
          </section>

          <section id="how-it-works" className="py-20 px-6 border-t border-slate-800/50">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-white mb-3">How It Works</h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto">
                  Three-layer analysis gives you confidence before running any third-party skill.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StepCard
                  step="01"
                  icon={<Github className="w-5 h-5" />}
                  title="Submit Skill"
                  description="Paste a GitHub URL or enter a skill name from ClawHub or OpenClaw registry."
                  color="sky"
                />
                <StepCard
                  step="02"
                  icon={<Eye className="w-5 h-5" />}
                  title="Deep Scan"
                  description="We fetch the source code, run VirusTotal URL scanning, and apply AI pattern detection for 10+ threat categories."
                  color="cyan"
                />
                <StepCard
                  step="03"
                  icon={<Shield className="w-5 h-5" />}
                  title="Get Verdict"
                  description="Receive a 0-100 safety score, categorized flag list, and a clear Safe / Caution / Unsafe recommendation."
                  color="green"
                />
              </div>
            </div>
          </section>

          <section className="py-20 px-6 border-t border-slate-800/50">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-white mb-3">What We Detect</h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto">
                  Static analysis + AI covers the most critical attack surfaces used in malicious skills.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {threats.map((threat) => (
                  <ThreatBadge key={threat.name} {...threat} />
                ))}
              </div>
            </div>
          </section>

          <section id="pricing" className="py-20 px-6 border-t border-slate-800/50">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-white mb-3">Simple Pricing</h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto">
                  Free for light use. Beyond that, pay-per-check via x402 (0.008 USDC on Base per call).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <PricingCard
                  title="Free Tier"
                  price="Free"
                  period="3 checks / day"
                  features={[
                    'Static code analysis',
                    'VirusTotal URL scan',
                    'AI red-flag detection',
                    'Safety score & report',
                    'Public scan history',
                  ]}
                  cta="Join Waitlist"
                  highlight={false}
                />
                <PricingCard
                  title="Paid Tier"
                  price="Pay-per-check"
                  period="0.008 USDC per check via x402 on Base"
                  features={[
                    'Everything in Free',
                    'Unlimited checks',
                    'Automatic agent payments',
                    'Priority analysis queue',
                    'Full scan history retention',
                  ]}
                  cta="Join Waitlist"
                  highlight={true}
                  badge="x402"
                />
              </div>

              <div className="mt-8 p-5 rounded-xl bg-slate-800/40 border border-slate-700/40 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">How x402 Payments Work</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      When your free tier is used up, the API returns an{' '}
                      <code className="text-amber-300 bg-slate-900/60 px-1 rounded">HTTP 402</code> response with
                      payment details (0.008 USDC on Base).{' '}
                      Each check requires its own fresh payment — no bundles, no tokens covering multiple checks.{' '}
                      Your agent pays per call and retries automatically. No manual wallet approvals needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 px-6 border-t border-slate-800/50">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-white mb-3">Scan a Skill</h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto">
                  Paste a GitHub URL or skill name to run a full three-layer security analysis.
                </p>
              </div>
              <div className="max-w-2xl mx-auto mb-14">
                <ScanForm />
              </div>
              <div className="border-t border-slate-800/50 pt-10">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white">Recent Community Scans</h3>
                  <p className="text-slate-400 text-sm mt-1">Latest skills verified by the community</p>
                </div>
                <ScanHistory />
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-800/60 py-10 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-2.5">
                <Image src="/clawsafe.png" alt="ClawSafe Logo" width={28} height={28} />
                <span className="font-bold text-white">ClawSafe</span>
                <span className="text-slate-600 text-sm">Skill Safety Verifier</span>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-3 text-sm text-slate-500">
                <a href="https://clawhub.io" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                  ClawHub <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
                <a href="https://openclaw.dev" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                  OpenClaw <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
                <a href="https://www.virustotal.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                  VirusTotal <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
                <a href="mailto:email@clawsafe.app" className="hover:text-slate-300 transition-colors">
                  Contact
                </a>
                <a href="https://x.com/clawsafe" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-label="X (Twitter)">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                  </svg>
                </a>
              </div>
              <p className="text-slate-600 text-xs text-center">
                2024 ClawSafe. No warranty &mdash; always audit critical skills manually.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
  color,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'sky' | 'cyan' | 'green';
}) {
  const colors = {
    sky: 'text-sky-400 bg-sky-950/60 border-sky-800/50',
    cyan: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50',
    green: 'text-green-400 bg-green-950/60 border-green-800/50',
  };

  return (
    <div className="relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/70 transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-mono text-slate-600 font-bold">{step}</span>
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

const threats = [
  { name: 'Wallet Drain', severity: 'critical', description: 'Unauthorized fund transfers' },
  { name: 'Key Extraction', severity: 'critical', description: 'Seed phrase / private key theft' },
  { name: 'Shell Execution', severity: 'critical', description: 'child_process or exec usage' },
  { name: 'Data Exfiltration', severity: 'high', description: 'Sending data to external servers' },
  { name: 'Code Injection', severity: 'high', description: 'eval() and dynamic code execution' },
  { name: 'File System Access', severity: 'medium', description: 'Reads/writes outside scope' },
  { name: 'Storage Access', severity: 'medium', description: 'Cookies, localStorage exposure' },
  { name: 'Obfuscation', severity: 'medium', description: 'Hidden payloads via encoding' },
  { name: 'Environment Access', severity: 'medium', description: 'Reads process.env secrets' },
  { name: 'Suspicious Network', severity: 'low', description: 'Raw XHR/WebSocket usage' },
];

function ThreatBadge({
  name,
  severity,
  description,
}: {
  name: string;
  severity: string;
  description: string;
}) {
  const colors: Record<string, string> = {
    critical: 'text-red-400 bg-red-950/30 border-red-900/50',
    high: 'text-orange-400 bg-orange-950/30 border-orange-900/50',
    medium: 'text-yellow-400 bg-yellow-950/30 border-yellow-900/50',
    low: 'text-blue-400 bg-blue-950/30 border-blue-900/50',
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${colors[severity] ?? colors.low}`}>
      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
      <div>
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs opacity-60 mt-0.5">{description}</div>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  features,
  cta,
  highlight,
  badge,
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight: boolean;
  badge?: string;
}) {
  return (
    <div className={`relative p-6 rounded-2xl border ${
      highlight
        ? 'bg-sky-950/30 border-sky-700/50'
        : 'bg-slate-800/40 border-slate-700/50'
    }`}>
      {badge && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white">
            {badge}
          </span>
        </div>
      )}
      <div className="mb-5">
        <h3 className={`font-semibold text-sm uppercase tracking-wider mb-2 ${highlight ? 'text-sky-400' : 'text-slate-400'}`}>
          {title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className={`font-bold text-white ${price.length > 10 ? 'text-xl' : 'text-3xl'}`}>{price}</span>
        </div>
        <span className="text-xs text-slate-500 mt-1 block">{period}</span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${highlight ? 'text-sky-400' : 'text-green-500'}`} />
            {f}
          </li>
        ))}
      </ul>
      <a
        href="#waitlist"
        className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          highlight
            ? 'bg-sky-600 hover:bg-sky-500 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
      >
        {cta}
      </a>
    </div>
  );
}

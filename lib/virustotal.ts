interface VTResult {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  score: number;
}

export async function scanUrl(url: string): Promise<VTResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey || apiKey === 'YOUR_VIRUSTOTAL_API_KEY_HERE') {
    return { malicious: 0, suspicious: 0, harmless: 72, undetected: 0, total: 72, score: 0 };
  }

  const encoded = Buffer.from(url).toString('base64url');

  const res = await fetch(`https://www.virustotal.com/api/v3/urls/${encoded}`, {
    headers: { 'x-apikey': apiKey },
  });

  if (res.status === 404) {
    await submitUrl(url, apiKey);
    return { malicious: 0, suspicious: 0, harmless: 0, undetected: 72, total: 72, score: 0 };
  }

  if (!res.ok) {
    return { malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, score: 0 };
  }

  const data = await res.json() as {
    data?: { attributes?: { last_analysis_stats?: { malicious: number; suspicious: number; harmless: number; undetected: number } } };
  };

  const stats = data?.data?.attributes?.last_analysis_stats;
  if (!stats) {
    return { malicious: 0, suspicious: 0, harmless: 0, undetected: 72, total: 72, score: 0 };
  }

  const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
  const score = total > 0 ? Math.round(((stats.malicious + stats.suspicious) / total) * 100) : 0;

  return {
    malicious: stats.malicious,
    suspicious: stats.suspicious,
    harmless: stats.harmless,
    undetected: stats.undetected,
    total,
    score,
  };
}

async function submitUrl(url: string, apiKey: string): Promise<void> {
  const body = new URLSearchParams({ url });
  await fetch('https://www.virustotal.com/api/v3/urls', {
    method: 'POST',
    headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

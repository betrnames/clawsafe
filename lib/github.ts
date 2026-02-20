export function extractSkillNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 1].replace(/\.(ts|js|py|json)$/, '') || parts[1];
    }
    return parts[0] ?? 'unknown-skill';
  } catch {
    return 'unknown-skill';
  }
}

function toRawUrl(url: string): string {
  const u = new URL(url);

  if (u.hostname === 'raw.githubusercontent.com') {
    return url;
  }

  if (u.hostname === 'github.com') {
    const path = u.pathname.replace('/blob/', '/');
    return `https://raw.githubusercontent.com${path}`;
  }

  return url;
}

export async function fetchGitHubCode(url: string): Promise<string> {
  const rawUrl = toRawUrl(url);

  const res = await fetch(rawUrl, {
    headers: { Accept: 'text/plain' },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch source code (HTTP ${res.status}). Check the URL is public.`);
  }

  const text = await res.text();

  if (text.length > 500_000) {
    return text.slice(0, 500_000);
  }

  return text;
}

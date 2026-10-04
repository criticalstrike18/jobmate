import { describeError, fetchJson, stripHtml } from './http.js';
import { nowIso, type Job } from './types.js';

interface RemoteOkJob {
  id?: string | number;
  slug?: string;
  epoch?: number;
  date?: string;
  company?: string;
  company_logo?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  apply_url?: string;
  original?: string;
  logo?: string;
  url?: string;
  verified?: boolean;
}

type RemoteOkResponse = Array<RemoteOkJob & { legal?: string; last_updated?: number }>;

/**
 * RemoteOK's API terms require linking back (with follow, no nofollow) to the
 * RemoteOK listing URL and mentioning Remote OK as the source. Every job
 * surfaced from this adapter MUST be rendered with
 * `attribution: 'Remote OK'` and an unproxied link to `url`.
 */
export const REMOTEOK_ATTRIBUTION = 'Remote OK' as const;

// RemoteOK expects a browser-like client; the default jobmate UA has not been
// proven against it, so identify the probe honestly while staying compatible.
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; jobmate/0.1; +https://github.com/criticalstrike18/jobmate)',
};

/**
 * No pagination and no server-side search: the endpoint always returns the
 * same ~100 newest remote jobs (index 0 is API metadata, not a job), so
 * keyword narrowing happens in Stage 1, not here.
 */
export async function fetchRemoteOk(): Promise<Job[]> {
  const data = await fetchJson<RemoteOkResponse>('https://remoteok.com/api', { headers: HEADERS });
  const seenAt = nowIso();

  return (data ?? [])
    .filter((raw) => raw.position && (raw.url || raw.apply_url))
    .map((raw) => {
      const tags = [...(raw.tags ?? [])];
      if (raw.verified === true) tags.push('remoteok-verified');

      return {
        id: `remoteok:${raw.id ?? raw.slug ?? raw.url}`,
        source: 'remoteok',
        sourceUrl: raw.url ?? raw.apply_url ?? '',
        title: raw.position!.trim(),
        company: raw.company?.trim() || 'Unknown',
        location: raw.location || undefined,
        remote: true,
        description: raw.description ? stripHtml(raw.description) : undefined,
        tags,
        salary: {
          min: raw.salary_min ?? undefined,
          max: raw.salary_max ?? undefined,
        },
        postedAt: raw.date,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
        trustTier: 'aggregator' as const,
      };
    });
}

export function remoteOkWarning(err: unknown): string {
  return `remoteok: ${describeError(err)}`;
}

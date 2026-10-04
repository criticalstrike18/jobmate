import { describeError, fetchJson, stripHtml } from './http.js';
import { nowIso, type Job } from './types.js';

interface JobicyJob {
  id?: number;
  url?: string;
  jobSlug?: string;
  jobTitle?: string;
  companyName?: string;
  companyLogo?: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobLevel?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
}

interface JobicyResponse {
  jobs?: JobicyJob[];
  jobCount?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

/**
 * Jobicy's terms require clear credit with a direct link to the source, and
 * application buttons must redirect to the original Jobicy URL. Every job
 * surfaced from this adapter MUST be rendered with
 * `attribution: 'Jobicy'` and an unproxied link to `url`.
 */
export const JOBICY_ATTRIBUTION = 'Jobicy' as const;

/**
 * Single pass, up to 200 jobs. The API supports cursor pagination
 * (`nextCursor`/`hasMore`), but one full page covers the board's recency
 * window and keeps collection cheap; paginate only if coverage demands it.
 */
export async function fetchJobicy(count = 200): Promise<Job[]> {
  const params = new URLSearchParams({ count: String(Math.min(Math.max(count, 1), 200)) });
  const data = await fetchJson<JobicyResponse>(`https://jobicy.com/api/v2/remote-jobs?${params}`);
  const seenAt = nowIso();

  return (data.jobs ?? [])
    .filter((raw) => raw.url && raw.jobTitle)
    .map((raw) => ({
      id: `jobicy:${raw.id ?? raw.jobSlug ?? raw.url}`,
      source: 'jobicy',
      sourceUrl: raw.url!,
      title: raw.jobTitle!.trim(),
      company: raw.companyName?.trim() || 'Unknown',
      location: raw.jobGeo || undefined,
      remote: true,
      employmentType: (raw.jobType ?? []).join(', ') || undefined,
      description: raw.jobDescription ? stripHtml(raw.jobDescription) : undefined,
      tags: [...(raw.jobIndustry ?? []), ...(raw.jobLevel ? [raw.jobLevel] : [])],
      postedAt: raw.pubDate,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      trustTier: 'aggregator' as const,
    }));
}

export function jobicyWarning(err: unknown): string {
  return `jobicy: ${describeError(err)}`;
}

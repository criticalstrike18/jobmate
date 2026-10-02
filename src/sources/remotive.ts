import { describeError, fetchJson, stripHtml } from './http.js';
import { parseSalary } from './salary.js';
import { nowIso, type Job } from './types.js';

interface RemotiveJob {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
}

interface RemotiveResponse {
  jobs?: RemotiveJob[];
}

/**
 * Remotive's terms require that their jobs link back to the Remotive URL and
 * credit Remotive as the source; redistributing them to third-party job boards
 * is prohibited. Every job surfaced from this adapter MUST be rendered with
 * `attribution: 'Remotive'` and an unproxied link to `url`.
 */
export const REMOTIVE_ATTRIBUTION = 'Remotive' as const;

export async function fetchRemotive(query?: string): Promise<Job[]> {
  const params = new URLSearchParams({ limit: '100' });
  if (query) params.set('search', query);

  const data = await fetchJson<RemotiveResponse>(`https://remotive.com/api/remote-jobs?${params}`);
  const seenAt = nowIso();

  return (data.jobs ?? [])
    .filter((raw) => raw.url && raw.title)
    .map((raw) => ({
      id: `remotive:${raw.id ?? raw.url}`,
      source: 'remotive',
      sourceUrl: raw.url!,
      title: raw.title!.trim(),
      company: raw.company_name?.trim() ?? 'Unknown',
      location: raw.candidate_required_location,
      remote: true,
      employmentType: raw.job_type,
      description: raw.description ? stripHtml(raw.description) : undefined,
      tags: [raw.category, ...(raw.tags ?? [])].filter((t): t is string => Boolean(t)),
      salary: parseSalary(raw.salary),
      postedAt: raw.publication_date,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      trustTier: 'rss' as const,
    }));
}

export function remotiveWarning(err: unknown): string {
  return `remotive: ${describeError(err)}`;
}
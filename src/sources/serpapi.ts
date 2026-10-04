import { describeError, fetchJson, stripHtml } from './http.js';
import { parseSalary } from './salary.js';
import { nowIso, type Job } from './types.js';

interface SerpApplyOption {
  title?: string;
  link?: string;
}

interface SerpJob {
  title?: string;
  job_title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  extensions?: string[];
  apply_options?: SerpApplyOption[];
  source_link?: string;
  via?: string;
  job_highlights?: Array<{ title?: string; items?: string[] }>;
  job_id?: string;
}

interface SerpResponse {
  jobs_results?: SerpJob[];
  serpapi_pagination?: { next?: string; next_page_token?: string };
  error?: string;
}

/**
 * SerpApi's google_jobs engine. Keyed and metered (250 req/mo on the free
 * tier), so pagination is bounded and every call is deliberate -- unlike the
 * keyless feeds, this adapter must never be called in a blind loop.
 *
 * Field names below were verified against a live response: the array is
 * `jobs_results` (not `job_results`), `extensions` is an array of mixed-prose
 * strings ("19 hours ago", "$38-62 an hour", "Full-time"), and apply links
 * live in `apply_options[]` as {title, link}.
 *
 * The key travels in `SERPAPI_KEY` only. It is never written to disk, logs,
 * or the repo.
 */
export const SERPAPI_ATTRIBUTION = 'Google Jobs via SerpApi' as const;

export interface SerpApiOptions {
  query?: string;
  location?: string;
  maxPages?: number;
}

function parseExtensions(ext: string[]): { posted?: string; pay?: string; type?: string } {
  return {
    posted: ext.find((e) => /ago|just posted|hour|day|week|month/i.test(e)),
    pay: ext.find((e) => /hour|year|month|\$|€|£/i.test(e)),
    type: ext.find((e) => /full-?time|part-?time|contract|temporary|intern/i.test(e)),
  };
}

export async function fetchSerpApiJobs(opts: SerpApiOptions = {}): Promise<Job[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error('SERPAPI_KEY is not set');

  const query = opts.query ?? 'software engineer';
  const location = opts.location ?? '';
  const maxPages = opts.maxPages ?? 3;
  const seenAt = nowIso();
  const jobs: Job[] = [];
  // Google's start-offset pages overlap at the boundaries, so the same posting
  // can appear on two consecutive pages. Collapse by id within the run.
  // (The job_id itself is a base64 query-state blob, not a stable identifier,
  // so it only dedupes within one query, not across runs or queries.)
  const seen = new Set<string>();

  let start = 0;
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      api_key: key,
      engine: 'google_jobs',
      q: query,
      start: String(start),
    });
    if (location) params.set('location', location);

    const data = await fetchJson<SerpResponse>(`https://serpapi.com/search.json?${params}`);
    if (data.error) throw new Error(`serpapi: ${data.error}`);

    const results = data.jobs_results ?? [];
    if (results.length === 0) break;

    for (const raw of results) {
      const { posted, pay, type } = parseExtensions(raw.extensions ?? []);
      const applyUrl = raw.apply_options?.[0]?.link ?? raw.source_link;
      if (!raw.title || !applyUrl) continue;

      const id = `serpapi:${raw.job_id ?? `${raw.title}-${raw.company_name}`}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const highlights = (raw.job_highlights ?? []).flatMap((h) => h.items ?? []);

      jobs.push({
        id,
        source: `serpapi:${query}`,
        sourceUrl: applyUrl,
        title: (raw.title ?? raw.job_title ?? '').trim(),
        company: raw.company_name?.trim() || 'Unknown',
        location: raw.location,
        remote: /remote|work from home/i.test(raw.location ?? ''),
        employmentType: type,
        description: raw.description ? stripHtml(raw.description) : undefined,
        tags: highlights,
        salary: parseSalary(pay),
        postedAt: posted,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
        trustTier: 'serp',
      });
    }

    if (!data.serpapi_pagination?.next) break;
    start += results.length;
  }

  return jobs;
}

export function serpApiWarning(err: unknown): string {
  return `serpapi: ${describeError(err)}`;
}

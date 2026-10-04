import { describeError, fetchJson, stripHtml } from './http.js';
import { nowIso, type Job } from './types.js';

interface JSearchApplyOption {
  publisher?: string;
  apply_link?: string;
  is_direct?: boolean;
}

interface JSearchJob {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  employer_website?: string;
  employer_logo?: string;
  job_publisher?: string;
  job_employment_type?: string;
  job_employment_types?: string[];
  job_apply_link?: string;
  job_apply_is_direct?: boolean;
  apply_options?: JSearchApplyOption[];
  job_description?: string;
  job_is_remote?: boolean;
  job_location?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_posted_at?: string;
  job_posted_at_datetime_utc?: string;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_currency?: string | null;
  job_salary_period?: string | null;
  job_benefits?: string[];
  job_onet_soc?: string | null;
}

interface JSearchResponse {
  status?: string;
  data?: { jobs?: JSearchJob[] };
}

/**
 * JSearch (Google-for-Jobs aggregator). Keyed and metered — one request credit
 * per page of ~10 results — so page count is bounded.
 *
 * Two deployment paths return byte-identical data (verified live): RapidAPI
 * and OpenWebNinja. The host and auth style are configurable so a key for
 * either door works; RapidAPI is the default because its quota dashboard is
 * the clearer of the two.
 *
 * Keys travel in `JSEARCH_API_KEY` (and optionally `JSEARCH_BASE_URL`) only.
 * Never written to disk, logs, or the repo.
 *
 * Verified gaps worth knowing: `job_onet_soc` returned 0/10 on every
 * deployment, so no structured occupation code is available despite the docs.
 * `job_apply_is_direct` was 0/10 with LinkedIn/Indeed as publishers — these
 * links point at aggregators, not employers, which is exactly the tier the
 * trust layer must treat as highest-risk.
 */
export const JSEARCH_ATTRIBUTION = 'JSearch' as const;

export interface JSearchOptions {
  query?: string;
  country?: string;
  numPages?: number;
}

export async function fetchJSearchJobs(opts: JSearchOptions = {}): Promise<Job[]> {
  const key = process.env.JSEARCH_API_KEY;
  if (!key) throw new Error('JSEARCH_API_KEY is not set');

  const base = (process.env.JSEARCH_BASE_URL ?? 'https://jsearch.p.rapidapi.com').replace(/\/$/, '');
  const headers: Record<string, string> = base.includes('rapidapi.com')
    ? { 'x-rapidapi-key': key, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' }
    : { 'x-api-key': key };

  const query = opts.query ?? 'software engineer';
  const country = opts.country ?? 'us';
  const numPages = Math.min(Math.max(opts.numPages ?? 2, 1), 5);
  const seenAt = nowIso();

  const params = new URLSearchParams({ query, country, num_pages: String(numPages) });
  const data = await fetchJson<JSearchResponse>(`${base}/search-v2?${params}`, { headers });
  if (data.status && data.status !== 'OK') throw new Error(`jsearch: status ${data.status}`);

  return (data.data?.jobs ?? [])
    .filter((raw) => raw.job_title && (raw.job_apply_link || raw.apply_options?.[0]?.apply_link))
    .map((raw) => {
      const location = raw.job_location ?? [raw.job_city, raw.job_state, raw.job_country].filter(Boolean).join(', ');
      return {
        id: `jsearch:${raw.job_id ?? `${raw.job_title}-${raw.employer_name}`}`,
        source: `jsearch:${query}`,
        sourceUrl: raw.job_apply_link ?? raw.apply_options?.[0]?.apply_link ?? '',
        title: raw.job_title!.trim(),
        company: raw.employer_name?.trim() || 'Unknown',
        companyDomain: (() => {
          try {
            return raw.employer_website ? new URL(raw.employer_website).hostname.replace(/^www\./, '') : undefined;
          } catch {
            return undefined;
          }
        })(),
        location: location || undefined,
        remote: raw.job_is_remote === true,
        employmentType: (raw.job_employment_types ?? (raw.job_employment_type ? [raw.job_employment_type] : [])).join(', ') || undefined,
        description: raw.job_description ? stripHtml(raw.job_description) : undefined,
        tags: raw.job_benefits ?? [],
        salary: {
          min: raw.job_min_salary ?? undefined,
          max: raw.job_max_salary ?? undefined,
          currency: raw.job_salary_currency ?? undefined,
        },
        postedAt: raw.job_posted_at_datetime_utc ?? raw.job_posted_at,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
        trustTier: 'serp' as const,
      };
    });
}

export function jsearchWarning(err: unknown): string {
  return `jsearch: ${describeError(err)}`;
}

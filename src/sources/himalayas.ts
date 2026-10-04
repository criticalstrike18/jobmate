import { describeError, fetchJson, stripHtml } from './http.js';
import { nowIso, type Job } from './types.js';

interface HimalayasJob {
  title?: string;
  companyName?: string;
  companySlug?: string;
  companyLogo?: string;
  employmentType?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryPeriod?: string | null;
  seniority?: string[];
  currency?: string | null;
  locationRestrictions?: string[];
  timezoneRestrictions?: number[];
  categories?: string[];
  parentCategories?: string[];
  description?: string;
  /** Epoch seconds. */
  pubDate?: number | null;
  /** Epoch seconds. */
  expiryDate?: number | null;
  applicationLink?: string;
  guid?: string;
}

interface HimalayasResponse {
  jobs?: HimalayasJob[];
  nextCursor?: string | null;
  totalCount?: number;
}

/**
 * Himalayas' terms require linking to the original listing and naming the
 * board as the source. Every job surfaced from this adapter MUST be rendered
 * with `attribution: 'Himalayas'` and an unproxied link to `applicationLink`.
 */
export const HIMALAYAS_ATTRIBUTION = 'Himalayas' as const;

const BROWSE_URL = 'https://himalayas.app/jobs/api';

/**
 * Himalayas also exposes /jobs/api/search with keyword, country, company,
 * seniority, employment-type and timezone filters. The query builder should use
 * that endpoint for targeted pulls; this adapter uses the browse feed so the
 * default collection stays a cheap full pass.
 */
const DEFAULT_MAX_PAGES = 5;

function toIsoEpochSeconds(epochSeconds: number | null | undefined): string | undefined {
  if (epochSeconds === null || epochSeconds === undefined) return undefined;
  const ms = epochSeconds * 1000;
  if (!Number.isFinite(ms)) return undefined;
  return new Date(ms).toISOString();
}

function normalize(raw: HimalayasJob, seenAt: string): Job | undefined {
  if (!raw.title || !raw.applicationLink) return undefined;

  // The browse feed can include listings past their expiry; never surface those.
  if (raw.expiryDate !== null && raw.expiryDate !== undefined) {
    if (raw.expiryDate * 1000 < Date.now()) return undefined;
  }

  const tags = [...(raw.parentCategories ?? []), ...(raw.categories ?? []), ...(raw.seniority ?? [])];

  return {
    id: `himalayas:${raw.guid ?? raw.applicationLink}`,
    source: 'himalayas',
    sourceUrl: raw.applicationLink,
    title: raw.title.trim(),
    company: raw.companyName?.trim() ?? 'Unknown',
    location: (raw.locationRestrictions ?? []).join(', ') || undefined,
    remote: true,
    employmentType: raw.employmentType,
    description: raw.description ? stripHtml(raw.description) : undefined,
    tags,
    salary: {
      min: raw.minSalary ?? undefined,
      max: raw.maxSalary ?? undefined,
      currency: raw.currency ?? undefined,
    },
    postedAt: toIsoEpochSeconds(raw.pubDate),
    firstSeenAt: seenAt,
    lastSeenAt: seenAt,
    trustTier: 'aggregator',
  };
}

export async function fetchHimalayas(maxPages = DEFAULT_MAX_PAGES): Promise<Job[]> {
  const seenAt = nowIso();
  const jobs: Job[] = [];
  let cursor: string | null | undefined;

  for (let page = 0; page < maxPages; page++) {
    const url = cursor ? `${BROWSE_URL}?cursor=${encodeURIComponent(cursor)}` : BROWSE_URL;
    const data = await fetchJson<HimalayasResponse>(url);

    for (const raw of data.jobs ?? []) {
      const job = normalize(raw, seenAt);
      if (job) jobs.push(job);
    }

    cursor = data.nextCursor;
    if (!cursor || (data.jobs ?? []).length === 0) break;
  }

  return jobs;
}

export function himalayasWarning(err: unknown): string {
  return `himalayas: ${describeError(err)}`;
}

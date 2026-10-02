import { describeError, fetchJson, stripHtml } from './http.js';
import { nowIso, type Job } from './types.js';

interface ArbeitnowJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: string;
}

interface ArbeitnowResponse {
  data?: ArbeitnowJob[];
}

const ENDPOINTS = {
  arbeitnow: 'https://www.arbeitnow.com/api/job-board-api',
  arbeitnowUk: 'https://www.arbeitnow.co.uk/api/job-board-api',
} as const;

export type ArbeitnowKey = keyof typeof ENDPOINTS;

function normalize(raw: ArbeitnowJob, feed: ArbeitnowKey, seenAt: string): Job | undefined {
  if (!raw.url || !raw.title) return undefined;

  let domain: string | undefined;
  try {
    domain = new URL(raw.url).hostname.replace(/^www\./, '');
  } catch {
    domain = undefined;
  }

  return {
    id: `arbeitnow:${feed}:${raw.slug ?? raw.url}`,
    source: `arbeitnow:${feed}`,
    sourceUrl: raw.url,
    title: raw.title.trim(),
    company: raw.company_name?.trim() ?? domain ?? 'Unknown',
    companyDomain: domain,
    location: raw.location,
    remote: raw.remote === true,
    employmentType: raw.job_types?.join(', '),
    description: raw.description ? stripHtml(raw.description) : undefined,
    tags: raw.tags ?? [],
    postedAt: raw.created_at,
    firstSeenAt: seenAt,
    lastSeenAt: seenAt,
    trustTier: 'aggregator',
  };
}

export async function fetchArbeitnow(feed: ArbeitnowKey): Promise<Job[]> {
  const data = await fetchJson<ArbeitnowResponse>(ENDPOINTS[feed]);
  const seenAt = nowIso();

  return (data.data ?? [])
    .map((raw) => normalize(raw, feed, seenAt))
    .filter((job): job is Job => job !== undefined);
}

export function arbeitnowWarning(feed: ArbeitnowKey, err: unknown): string {
  return `arbeitnow (${feed}): ${describeError(err)}`;
}
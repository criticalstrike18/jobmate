export type SourceId = string;

export type TrustTier = 'ats-official' | 'aggregator' | 'rss' | 'serp' | 'community';

export interface Job {
  id: string;
  source: SourceId;
  sourceUrl: string;
  title: string;
  company: string;
  companyDomain?: string;
  location?: string;
  remote: boolean;
  employmentType?: string;
  description?: string;
  tags: string[];
  salary?: { min?: number; max?: number; currency?: string; raw?: string };
  postedAt?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  closedAt?: string;
  trustTier: TrustTier;
}

export interface FetchResult {
  jobs: Job[];
  warnings: string[];
}

export interface SourceAdapter {
  readonly id: SourceId;
  readonly trustTier: TrustTier;
  fetch(since?: Date): Promise<FetchResult>;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function emptyResult(): FetchResult {
  return { jobs: [], warnings: [] };
}
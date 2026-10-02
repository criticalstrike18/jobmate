import { boardDomain, type ResolvedBoard } from './config.js';
import { describeError, fetchJson, stripHtml } from './http.js';
import { nowIso, type Job } from './types.js';

interface AshbyCompensation {
  compensationTierSummary?: string;
  compensationCurrencyCode?: string;
  minValue?: number;
  maxValue?: number;
}

interface AshbyPosting {
  id: string;
  title: string;
  location?: string;
  isListed?: boolean;
  isRemote?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  jobUrl?: string;
  applyUrl?: string;
  employmentType?: string;
  department?: string;
  team?: string;
  tags?: string[];
  descriptionHtml?: string;
  descriptionPlain?: string;
  compensation?: AshbyCompensation | null;
}

interface AshbyResponse {
  jobs?: AshbyPosting[];
}

function salaryFrom(raw: AshbyPosting) {
  const comp = raw.compensation;
  if (!comp) return undefined;
  if (comp.minValue === undefined && comp.maxValue === undefined && !comp.compensationTierSummary) {
    return undefined;
  }

  return {
    min: comp.minValue,
    max: comp.maxValue,
    currency: comp.compensationCurrencyCode,
    raw: comp.compensationTierSummary,
  };
}

export async function fetchAshby(board: ResolvedBoard): Promise<Job[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${board.token}?includeCompensation=true`;
  const data = await fetchJson<AshbyResponse>(url);
  const seenAt = nowIso();

  return (data.jobs ?? [])
    .filter((raw) => raw.isListed !== false)
    .map((raw) => ({
      id: `${board.id}:${raw.id}`,
      source: board.id,
      sourceUrl: raw.jobUrl ?? raw.applyUrl ?? '',
      title: raw.title.trim(),
      company: board.label,
      companyDomain: boardDomain(board),
      location: raw.location,
      remote: raw.isRemote === true,
      employmentType: raw.employmentType,
      description: raw.descriptionPlain ?? (raw.descriptionHtml ? stripHtml(raw.descriptionHtml) : undefined),
      tags: [raw.department, raw.team, ...(raw.tags ?? [])].filter(
        (t): t is string => Boolean(t),
      ),
      salary: salaryFrom(raw),
      postedAt: raw.publishedAt ?? raw.updatedAt,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      trustTier: 'ats-official' as const,
    }));
}

export function ashbyWarning(board: ResolvedBoard, err: unknown): string {
  return `ashby ${board.token}: ${describeError(err)}`;
}
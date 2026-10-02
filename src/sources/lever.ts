import { boardDomain, type ResolvedBoard } from './config.js';
import { describeError, fetchJson, stripHtml } from './http.js';
import { parseSalary } from './salary.js';
import { nowIso, type Job } from './types.js';

interface LeverList {
  text?: string;
  content?: string;
}

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
  updatedAt?: number;
  descriptionPlain?: string;
  lists?: LeverList[];
  additionalPlain?: string;
  categories?: {
    team?: string;
    department?: string;
    location?: string;
    commitment?: string;
    allLocations?: string[];
  };
}

function isRemote(posting: LeverPosting): boolean {
  const locations = [
    posting.categories?.location ?? '',
    ...(posting.categories?.allLocations ?? []),
  ].map((l) => l.toLowerCase());

  return locations.some((l) => l.includes('remote') || l.includes('anywhere'));
}

function description(posting: LeverPosting): string {
  const parts = [
    posting.descriptionPlain ?? '',
    ...(posting.lists ?? [])
      .map((list) => {
        const header = list.text?.trim();
        const body = list.content ? stripHtml(list.content) : '';
        return header ? `## ${header}\n${body}` : body;
      })
      .filter(Boolean),
    posting.additionalPlain ?? '',
  ].filter(Boolean);

  return parts.join('\n\n').trim();
}

function toIso(ms: number | undefined): string | undefined {
  if (!ms || ms <= 0) return undefined;
  return new Date(ms).toISOString();
}

export async function fetchLever(board: ResolvedBoard): Promise<Job[]> {
  // Lever's public postings API documents a 1 req/s crawl delay; the caller
  // paces boards, this adapter issues exactly one request per board.
  const url = `https://api.lever.co/v0/postings/${board.token}?mode=json`;
  const data = await fetchJson<LeverPosting[]>(url);
  const seenAt = nowIso();

  return (data ?? []).map((raw) => ({
    id: `${board.id}:${raw.id}`,
    source: board.id,
    sourceUrl: raw.hostedUrl ?? raw.applyUrl ?? '',
    title: raw.text.trim(),
    company: board.label,
    companyDomain: boardDomain(board),
    location: raw.categories?.location,
    remote: isRemote(raw),
    employmentType: raw.categories?.commitment,
    description: description(raw) || undefined,
    tags: [raw.categories?.team, raw.categories?.department].filter(
      (t): t is string => Boolean(t),
    ),
    postedAt: toIso(raw.createdAt),
    firstSeenAt: seenAt,
    lastSeenAt: seenAt,
    trustTier: 'ats-official' as const,
  }));
}

export function leverWarning(board: ResolvedBoard, err: unknown): string {
  return `lever ${board.token}: ${describeError(err)}`;
}
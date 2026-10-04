import { describeError, fetchJson, stripHtml } from './http.js';
import { nowIso, type Job } from './types.js';

interface HnSearchHit {
  objectID: string;
  title: string;
  author: string;
  created_at: string;
  created_at_i: number;
  num_comments: number;
}

interface HnSearchResponse {
  hits: HnSearchHit[];
}

interface HnItem {
  id: number;
  type?: string;
  by?: string;
  time?: number;
  text?: string;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
}

/**
 * Hacker News monthly "Who is hiring" threads are company-posted tech roles:
 * no aggregator, no key, ~200-900 posts per month. Each top-level comment is
 * one posting; replies are discussion and are never collected.
 *
 * Trust note: posts are self-reported by whoever claims to hire. Treat as
 * community data, not employer-verified like ATS boards.
 */
export const HN_ATTRIBUTION = 'Hacker News' as const;

const MONTHLY_TITLE = /\(\w+ \d{4}\)/;
const COMMENT_CONCURRENCY = 10;

/** Newest monthly hiring thread, via the keyless Algolia date index. */
export async function findLatestHiringThread(): Promise<{ id: string; title: string }> {
  const since = Math.floor(Date.now() / 1000) - 60 * 86_400;
  const data = await fetchJson<HnSearchResponse>(
    `https://hn.algolia.com/api/v1/search_by_date?query=Who%20is%20hiring&tags=story&hitsPerPage=50&numericFilters=created_at_i>${since}`,
  );

  const monthly = data.hits
    .filter((h) => h.author === 'whoishiring' && MONTHLY_TITLE.test(h.title))
    .sort((a, b) => b.created_at_i - a.created_at_i);

  const thread = monthly[0];
  if (!thread) throw new Error('no monthly hiring thread found in the last 60 days');
  return { id: thread.objectID, title: thread.title };
}

async function fetchItem(id: number | string): Promise<HnItem> {
  return fetchJson<HnItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /https?:\/\/[^\s<>"')]+/g;

function firstUrl(text: string): string | undefined {
  return text.match(URL_RE)?.[0];
}

/**
 * Posting convention is `Company | Roles | Type | Location`, but half the
 * thread ignores it. Company is the first segment; the rest of the first line
 * is the working title. Everything else comes from the full text.
 */
function parseComment(raw: HnItem): Omit<Job, 'id' | 'source' | 'sourceUrl' | 'firstSeenAt' | 'lastSeenAt' | 'trustTier'> | undefined {
  if (!raw.text || raw.deleted || raw.dead) return undefined;

  const plain = stripHtml(raw.text);
  if (plain.trim().length < 40) return undefined;

  const firstLine = plain.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? '';
  const segments = firstLine.split('|').map((s) => s.trim()).filter(Boolean);
  const company = segments[0] || raw.by || 'Unknown';
  const title = segments.slice(1).join(' | ') || firstLine.slice(0, 120) || 'Hacker News posting';

  const postedAt = raw.time ? new Date(raw.time * 1000).toISOString() : undefined;

  return {
    title,
    company,
    location: segments.length >= 4 ? segments[segments.length - 1] : undefined,
    remote: /remote/i.test(plain),
    employmentType: /full-?time/i.test(plain)
      ? 'Full-time'
      : /part-?time/i.test(plain)
        ? 'Part-time'
        : /contract/i.test(plain)
          ? 'Contract'
          : undefined,
    description: plain,
    // Contact emails stay in the description text; tags are reserved for
    // skills and categories so downstream normalization is not polluted.
    tags: [],
    postedAt,
  };
}

export interface HnOptions {
  maxComments?: number;
  threadId?: string;
}

export async function fetchHnJobs(opts: HnOptions = {}): Promise<Job[]> {
  const thread = opts.threadId
    ? { id: opts.threadId, title: '' }
    : await findLatestHiringThread();

  const root = await fetchItem(thread.id);
  const kids = (root.kids ?? []).slice(0, opts.maxComments ?? 600);
  const seenAt = nowIso();
  const jobs: Job[] = [];

  for (let i = 0; i < kids.length; i += COMMENT_CONCURRENCY) {
    const batch = await Promise.all(
      kids.slice(i, i + COMMENT_CONCURRENCY).map((id) => fetchItem(id).catch(() => undefined)),
    );

    for (const raw of batch) {
      if (!raw) continue;
      const parsed = parseComment(raw);
      if (!parsed) continue;

      const permalink = `https://news.ycombinator.com/item?id=${raw.id}`;
      jobs.push({
        ...parsed,
        id: `hn:${raw.id}`,
        source: 'hn-hiring',
        sourceUrl: firstUrl(raw.text ?? '') ?? permalink,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
        trustTier: 'community',
      });
    }
  }

  return jobs;
}

export function hnWarning(err: unknown): string {
  return `hn-hiring: ${describeError(err)}`;
}

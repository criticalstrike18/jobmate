import { fetchAshby } from './ashby.js';
import { resolveBoards, type ResolvedBoard, type SourceConfig } from './config.js';
import { describeError } from './http.js';
import { fetchGreenhouse } from './greenhouse.js';
import { fetchLever } from './lever.js';
import { emptyResult, type FetchResult, type Job, type TrustTier } from './types.js';

export * from './types.js';
export { resolveBoards } from './config.js';
export { REMOTIVE_ATTRIBUTION, fetchRemotive } from './remotive.js';
export { fetchArbeitnow } from './arbeitnow.js';
export { HIMALAYAS_ATTRIBUTION, fetchHimalayas } from './himalayas.js';
export { REMOTEOK_ATTRIBUTION, fetchRemoteOk } from './remoteok.js';
export { JOBICY_ATTRIBUTION, fetchJobicy } from './jobicy.js';
export { HN_ATTRIBUTION, fetchHnJobs, findLatestHiringThread } from './hn.js';
export { SERPAPI_ATTRIBUTION, fetchSerpApiJobs } from './serpapi.js';
export { JSEARCH_ATTRIBUTION, fetchJSearchJobs } from './jsearch.js';
export { parseSalary } from './salary.js';

const BOARD_CONCURRENCY = 6;
const LEVER_MIN_INTERVAL_MS = 1_100;

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]!, index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Lever documents a 1 req/s crawl delay for its public postings API. Pacing is
 * serialised per-ATS rather than globally so a slow Greenhouse board does not
 * delay Lever requests.
 */
function makeLeverGate() {
  let chain: Promise<void> = Promise.resolve();
  let last = 0;

  return <T>(fn: () => Promise<T>): Promise<T> => {
    const run = chain.then(async () => {
      const wait = LEVER_MIN_INTERVAL_MS - (Date.now() - last);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      try {
        return await fn();
      } finally {
        last = Date.now();
      }
    });
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

type LeverGate = <T>(fn: () => Promise<T>) => Promise<T>;

async function fetchBoard(board: ResolvedBoard, leverFetch: LeverGate): Promise<Job[]> {
  switch (board.ats) {
    case 'greenhouse':
      return fetchGreenhouse(board);
    case 'lever':
      return leverFetch(() => fetchLever(board));
    case 'ashby':
      return fetchAshby(board);
  }
}

export interface CollectOptions {
  concurrency?: number;
  includeFeeds?: boolean;
}

export async function collectJobs(
  config: SourceConfig,
  opts: CollectOptions = {},
): Promise<FetchResult> {
  const boards = resolveBoards(config);
  const warnings: string[] = [];
  const leverGate = makeLeverGate();

  const boardResults = await mapLimit(boards, opts.concurrency ?? BOARD_CONCURRENCY, async (board) => {
    try {
      return await fetchBoard(board, leverGate);
    } catch (err) {
      warnings.push(`${board.ats} ${board.token}: ${describeError(err)}`);
      return [];
    }
  });

  const jobs: Job[] = boardResults.flat();

  if (opts.includeFeeds !== false) {
    const { fetchRemotive, remotiveWarning } = await import('./remotive.js');
    const { fetchArbeitnow, arbeitnowWarning } = await import('./arbeitnow.js');
    const { fetchHimalayas, himalayasWarning } = await import('./himalayas.js');
    const { fetchRemoteOk, remoteOkWarning } = await import('./remoteok.js');
    const { fetchJobicy, jobicyWarning } = await import('./jobicy.js');
    const { fetchHnJobs, hnWarning } = await import('./hn.js');

    const feedTasks: Array<Promise<Job[]>> = [];

    if (config.feeds.arbeitnow.enabled) {
      feedTasks.push(
        fetchArbeitnow('arbeitnow').catch((e) => {
          warnings.push(arbeitnowWarning('arbeitnow', e));
          return [];
        }),
      );
    }
    if (config.feeds.arbeitnowUk.enabled) {
      feedTasks.push(
        fetchArbeitnow('arbeitnowUk').catch((e) => {
          warnings.push(arbeitnowWarning('arbeitnowUk', e));
          return [];
        }),
      );
    }
    if (config.feeds.remotive.enabled) {
      feedTasks.push(
        fetchRemotive().catch((e) => {
          warnings.push(remotiveWarning(e));
          return [];
        }),
      );
    }
    if (config.feeds.himalayas.enabled) {
      feedTasks.push(
        fetchHimalayas().catch((e) => {
          warnings.push(himalayasWarning(e));
          return [];
        }),
      );
    }
    if (config.feeds.remoteok.enabled) {
      feedTasks.push(
        fetchRemoteOk().catch((e) => {
          warnings.push(remoteOkWarning(e));
          return [];
        }),
      );
    }
    if (config.feeds.jobicy.enabled) {
      feedTasks.push(
        fetchJobicy().catch((e) => {
          warnings.push(jobicyWarning(e));
          return [];
        }),
      );
    }
    if (config.feeds.hn.enabled) {
      feedTasks.push(
        fetchHnJobs().catch((e) => {
          warnings.push(hnWarning(e));
          return [];
        }),
      );
    }

    jobs.push(...(await Promise.all(feedTasks)).flat());
  }

  // Keyed, metered sources run last and only when explicitly enabled. A missing
  // key is a warning, not an error: the free tiers are personal, and collection
  // must work without them.
  if (opts.includeFeeds !== false) {
    const { fetchSerpApiJobs, serpApiWarning } = await import('./serpapi.js');
    const { fetchJSearchJobs, jsearchWarning } = await import('./jsearch.js');

    if (config.serp.serpapi.enabled) {
      try {
        jobs.push(...(await fetchSerpApiJobs()));
      } catch (e) {
        warnings.push(serpApiWarning(e));
      }
    }
    if (config.serp.jsearch.enabled) {
      try {
        jobs.push(...(await fetchJSearchJobs()));
      } catch (e) {
        warnings.push(jsearchWarning(e));
      }
    }
  }

  return { jobs, warnings };
}

export function summarizeByTier(jobs: Job[]): Record<TrustTier | 'unknown', number> {
  const out: Record<string, number> = {};
  for (const job of jobs) {
    const key = job.trustTier ?? 'unknown';
    out[key] = (out[key] ?? 0) + 1;
  }
  return out as Record<TrustTier | 'unknown', number>;
}

export { emptyResult };
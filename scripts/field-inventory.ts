/**
 * Field inventory across every working source.
 *
 * Reports the RAW keys each API returns plus coverage, rather than the subset
 * our mappers consume. The gap between the two is where recoverable data hides --
 * e.g. Greenhouse exposes first_published only on the per-job detail endpoint,
 * which the board endpoint never returns.
 *
 * Read-only. Keys come from the environment.
  */

export {};

const results: Record<string, Record<string, number>> = {};
const samples: Record<string, unknown> = {};

function ingest(source: string, samplesIn: unknown[]): void {
  const coverage: Record<string, number> = {};
  for (const row of samplesIn) {
    if (!row || typeof row !== 'object') continue;
    for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
      const present =
        v !== null && v !== undefined &&
        v !== '' &&
        !(Array.isArray(v) && v.length === 0) &&
        !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0);
      if (present) coverage[k] = (coverage[k] ?? 0) + 1;
    }
  }
  results[source] = coverage;
  samples[source] = samplesIn[0] ?? null;
}

async function grab<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { 'user-agent': 'jobmate/0.1 (field inventory)', accept: 'application/json', ...headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

const token = process.env.SERPAPI_KEY;
const jkey = process.env.JSEARCH_RAPIDAPI_KEY;

// ---- Greenhouse ------------------------------------------------------------
try {
  const d = await grab<{ jobs: Array<Record<string, unknown>> }>(
    'https://boards-api.greenhouse.io/v1/boards/gitlab/jobs?content=true',
  );
  ingest('greenhouse', d.jobs.slice(0, 25));
} catch (e) {
  console.log(`greenhouse: ${(e as Error).message}`);
}

// ---- Greenhouse detail endpoint (the first_published question) -------------
try {
  const board = await grab<{ jobs: Array<{ id: number }> }>(
    'https://boards-api.greenhouse.io/v1/boards/gitlab/jobs',
  );
  const first = board.jobs[0];
  if (first) {
    const d = await grab<Record<string, unknown>>(
      `https://boards-api.greenhouse.io/v1/boards/gitlab/jobs/${first.id}`,
    );
    ingest('greenhouse:detail', [d]);
  }
} catch (e) {
  console.log(`greenhouse:detail: ${(e as Error).message}`);
}

// ---- Lever -----------------------------------------------------------------
try {
  const d = await grab<Array<Record<string, unknown>>>(
    'https://api.lever.co/v0/postings/spotify?mode=json',
  );
  ingest('lever', d.slice(0, 25));
} catch (e) {
  console.log(`lever: ${(e as Error).message}`);
}

// ---- Ashby -----------------------------------------------------------------
try {
  const d = await grab<{ jobs: Array<Record<string, unknown>> }>(
    'https://api.ashbyhq.com/posting-api/job-board/openai?includeCompensation=true',
  );
  ingest('ashby', d.jobs.slice(0, 25));
} catch (e) {
  console.log(`ashby: ${(e as Error).message}`);
}

// ---- Arbeitnow -------------------------------------------------------------
try {
  const d = await grab<{ data: Array<Record<string, unknown>> }>(
    'https://www.arbeitnow.com/api/job-board-api',
  );
  ingest('arbeitnow', d.data.slice(0, 25));
} catch (e) {
  console.log(`arbeitnow: ${(e as Error).message}`);
}

// ---- Remotive --------------------------------------------------------------
try {
  const d = await grab<{ jobs: Array<Record<string, unknown>> }>(
    'https://remotive.com/api/remote-jobs?limit=100',
  );
  ingest('remotive', d.jobs);
} catch (e) {
  console.log(`remotive: ${(e as Error).message}`);
}

// ---- SerpApi google_jobs ---------------------------------------------------
if (token) {
  try {
    const d = await grab<{ jobs_results: Array<Record<string, unknown>> }>(
      `https://serpapi.com/search.json?api_key=${token}&engine=google_jobs&q=software+engineer&num=20`,
    );
    ingest('serpapi', d.jobs_results);
  } catch (e) {
    console.log(`serpapi: ${(e as Error).message}`);
  }
} else console.log('serpapi: SERPAPI_KEY unset');

// ---- JSearch (RapidAPI) ----------------------------------------------------
if (jkey) {
  try {
    const d = await grab<{ data: { jobs: Array<Record<string, unknown>> } }>(
      'https://jsearch.p.rapidapi.com/search-v2?query=software+engineer&country=us&num_pages=1',
      { 'x-rapidapi-key': jkey, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' },
    );
    ingest('jsearch', d.data.jobs);
  } catch (e) {
    console.log(`jsearch: ${(e as Error).message}`);
  }
} else console.log('jsearch: JSEARCH_RAPIDAPI_KEY unset');

// ---- report ----------------------------------------------------------------
for (const [source, coverage] of Object.entries(results)) {
  const sampleSize = Array.isArray(samples[source]) ? samples[source].length : 1;
  const entries = Object.entries(coverage).sort((a, b) => b[1] - a[1]);
  console.log(`\n${source}  (${entries.length} distinct fields, sample n=${sampleSize})`);
  for (const [k, n] of entries) {
    const pct = Math.round((n / sampleSize) * 100);
    console.log(`  ${k.padEnd(28)} ${String(n).padStart(4)}  ${String(pct).padStart(3)}%`);
  }
}
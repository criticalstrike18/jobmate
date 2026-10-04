/**
 * Probes the approved-but-unbuilt SERP-tier sources against live APIs and
 * reports which of the five required fields each one actually returns.
 *
 * The point is to replace "approved from documentation" with measured evidence:
 *   required -> title, company, description, applyUrl, postedAt
 *
 * Keys are read from the environment and never written to disk.
  */

export {};

const REQUIRED = ['title', 'company', 'description', 'applyUrl', 'postedAt'] as const;
const VALUED = ['salary', 'employmentType', 'skills', 'seniority', 'companyDomain'] as const;

interface FieldReport {
  present: number;
  total: number;
  coverage: Record<string, number>;
}

function report(samples: Record<string, unknown>[]): FieldReport {
  const coverage: Record<string, number> = {};
  for (const field of [...REQUIRED, ...VALUED]) {
    coverage[field] = samples.filter((s) => {
      const v = s[field];
      if (v === undefined || v === null) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v as object).length > 0;
      return true;
    }).length;
  }
  const present = REQUIRED.filter((f) => coverage[f]! > 0).length;
  return { present, total: REQUIRED.length, coverage };
}

function print(name: string, status: string, count: number, r?: FieldReport, note?: string): void {
  console.log(`\n${name}  ${status}`);
  if (note) console.log(`  ${note}`);
  if (count === 0) {
    console.log(`  no jobs returned`);
    return;
  }
  console.log(`  jobs returned: ${count}`);
  if (!r) return;
  const gate = r.present === r.total ? 'PASS' : 'FAIL';
  console.log(`  required fields: ${r.present}/${r.total}  [${gate}]`);
  for (const f of REQUIRED) {
    const pct = ((r.coverage[f]! / count) * 100).toFixed(0);
    console.log(`    ${f.padEnd(14)} ${String(r.coverage[f]).padStart(4)}/${count}  ${pct.padStart(3)}%  ${r.coverage[f]! > 0 ? '' : '<-- MISSING'}`);
  }
  for (const f of VALUED) {
    const pct = ((r.coverage[f]! / count) * 100).toFixed(0);
    console.log(`    ${f.padEnd(14)} ${String(r.coverage[f]).padStart(4)}/${count}  ${pct.padStart(3)}%  (valued)`);
  }
}

// ---- SerpApi: Google Jobs ------------------------------------------------
const serpKey = process.env.SERPAPI_KEY;
if (!serpKey) {
  console.log('SerpApi: SERPAPI_KEY not set, skipping');
} else {
  const url = `https://serpapi.com/search.json?api_key=${serpKey}&engine=google_jobs&q=software+engineer&location=Austin,+TX&num=20`;
  try {
    const res = await fetch(url);
    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      print('SerpApi (google_jobs)', `HTTP ${res.status}`, 0, undefined, String(body.error ?? ''));
    } else if (body.error) {
      print('SerpApi (google_jobs)', 'API error', 0, undefined, String(body.error));
    } else {
      // SerpApi field names verified against a live response:
      //   "jobs_results" (not job_results), "company_name", "description",
      //   "extensions" is an ARRAY of plain strings (mixed semantics, e.g.
      //   "19 hours ago", "38-62 an hour", "Full-time"), and apply links live in
      //   "apply_options" as {title, link} pointing at the syndicating boards.
      const rawJobs = (body.jobs_results as Array<Record<string, unknown>>) ?? [];
      const jobs = rawJobs.map((j) => {
        const ext = (j.extensions as string[] | undefined) ?? [];
        const applyOptions = (j.apply_options as Array<{ title: string; link: string }> | undefined) ?? [];
        const relative = ext.find((e) => /ago|just posted|hour|day|week|month/i.test(e));
        const pay = ext.find((e) => /hour|year|month|\$|€|£/i.test(e));
        return {
          title: j.title ?? j.job_title,
          company: j.company_name,
          description: j.description,
          // Prefer the direct employer link over an aggregator when both exist.
          applyUrl: applyOptions[0]?.link ?? j.source_link,
          postedAt: relative,
          salary: pay,
          employmentType: ext.find((e) => /full-?time|part-?time|contract|temporary|intern/i.test(e)),
          skills: j.job_highlights,
          seniority: j.job_title,
          companyDomain: undefined,
          _via: j.via,
          _applyCount: applyOptions.length,
        };
      });
      const filters = (body.filters as Array<Record<string, unknown>>) ?? [];
      print(
        'SerpApi (google_jobs)',
        'OK',
        jobs.length,
        report(jobs),
        `next_page_token: ${String((body.serpapi_pagination as Record<string, unknown>)?.next_page_token ?? 'none').slice(0, 12)}...`,
      );
      console.log(`  filters available: ${filters.map((f) => String(f.field ?? f.type ?? '?')).join(', ')}`);
      if (jobs[0]) {
        console.log(`\n  sample: ${String(jobs[0].title)} @ ${String(jobs[0].company)}`);
        console.log(`  apply:  ${String(jobs[0].applyUrl)}`);
      }
    }
  } catch (err) {
    print('SerpApi (google_jobs)', 'THREW', 0, undefined, String(err));
  }
}

// ---- JSearch providers ----------------------------------------------------
// Three deployment paths for the same upstream product. Field shape is identical
// across them; only the host and auth style differ.
interface JSearchProvider {
  name: string;
  url: string;
  headers: (key: string) => Record<string, string>;
  extract: (body: Record<string, unknown>) => unknown;
}

const jsearchProviders: Array<[JSearchProvider | null, string | undefined]> = [
  [
    {
      name: 'JSearch (RapidAPI)',
      url: 'https://jsearch.p.rapidapi.com/search-v2?query=software%20engineer&country=us&num_pages=1',
      headers: (key) => ({ 'x-rapidapi-key': key, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' }),
      extract: (body) => (body.data as Record<string, unknown> | undefined)?.jobs,
    },
    process.env.JSEARCH_RAPIDAPI_KEY,
  ],
  [
    {
      name: 'JSearch (OpenWebNinja)',
      url: 'https://api.openwebninja.com/jsearch/search-v2?query=software%20engineer&country=us&num_pages=1',
      headers: (key) => ({ 'x-api-key': key }),
      extract: (body) => (body.data as Record<string, unknown> | undefined)?.jobs,
    },
    process.env.JSEARCH_OWN_KEY,
  ],
  [
    {
      // Docs advertise /v1/search, but that path 404s on the API host (routing
      // layer, before auth) while / returns 200 Healthy. Kept here so the
      // failure stays visible until a working base URL is known.
      name: 'JSearch (ApyFlux)',
      url: 'https://api.apyflux.com/v1/search?query=software%20engineer&num_pages=1',
      headers: (key) => ({ 'x-api-key': key }),
      extract: (body) => body.jobs ?? body.data,
    },
    process.env.JSEARCH_APYFLUX_KEY,
  ],
];

for (const [provider, key] of jsearchProviders) {
  if (!provider || !key) {
    if (provider) console.log(`\n${provider.name}  key not set, skipping`);
    continue;
  }
  try {
    const res = await fetch(provider.url, { headers: provider.headers(key) });
    const text = await res.text();

    if (!res.ok) {
      print(provider.name, `HTTP ${res.status}`, 0, undefined, text.slice(0, 200));
      continue;
    }

    const body = JSON.parse(text) as Record<string, unknown>;
    if (body.status && body.status !== 'OK') {
      print(provider.name, `status ${String(body.status)}`, 0, undefined, text.slice(0, 200));
      continue;
    }

    const raw = (provider.extract(body) as Array<Record<string, unknown>>) ?? [];
    const payload = body.data as Record<string, unknown> | undefined;

    const jobs = raw.map((j) => ({
      title: j.job_title,
      company: j.employer_name,
      description: j.job_description,
      applyUrl:
        j.job_apply_link ??
        (j.apply_options as Array<{ apply_link?: string }> | undefined)?.[0]?.apply_link,
      postedAt: j.job_posted_at ?? j.date_posted,
      salary:
        j.job_salary_min !== undefined || j.job_salary_max !== undefined
          ? { min: j.job_salary_min, max: j.job_salary_max, currency: j.job_salary_currency }
          : undefined,
      employmentType: j.job_employment_types ?? j.job_employment_type,
      skills: j.job_highlights,
      seniority: j.job_onet_soc,
      companyDomain: j.employer_website,
      _publisher: j.job_publisher,
      _direct: j.job_apply_is_direct,
    }));

    print(
      provider.name,
      'OK',
      jobs.length,
      report(jobs),
      `credits: ${JSON.stringify(payload?.credits ?? body.credits ?? 'n/a')}`,
    );

    const onets = raw.filter((j) => j.job_onet_soc).length;
    const direct = jobs.filter((j) => j._direct === true).length;
    console.log(`    job_onet_soc present: ${onets}/${jobs.length}  <- structured occupation code`);
    console.log(`    direct apply links:   ${direct}/${jobs.length}`);
    const publishers = new Set(raw.map((j) => String(j.job_publisher ?? 'n/a')));
    console.log(`    publishers (${publishers.size}): ${[...publishers].slice(0, 5).join(', ')}`);

    if (jobs[0]) {
      console.log(`\n  sample: ${String(jobs[0].title)} @ ${String(jobs[0].company)}`);
      console.log(`  apply:  ${String(jobs[0].applyUrl)}`);
      console.log(`  desc:   ${String(jobs[0].description).slice(0, 110)}...`);
    }
  } catch (err) {
    print(provider.name, 'THREW', 0, undefined, err instanceof Error ? err.message : String(err));
  }
}
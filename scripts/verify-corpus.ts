export {};
const { loadSourceConfig } = await import('../src/sources/config-loader.js');
const { collectJobs } = await import('../src/sources/index.js');

const UA = { 'user-agent': 'jobmate/0.1 (open-source job research)' };

async function polite<T>(fn: () => Promise<T>, ms: number, tries = 4): Promise<T | undefined> {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === tries - 1) return undefined;
      await new Promise((r) => setTimeout(r, ms * 2 ** i));
    }
  }
  return undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function wdSearch(name: string) {
  const u = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=5`;
  return polite(async () => {
    const r = await fetch(u, { headers: UA });
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as { search: Array<{ id: string; label: string; description?: string }> };
  }, 400);
}

async function wdFacts(id: string) {
  const u = `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`;
  return polite(async () => {
    const r = await fetch(u, { headers: UA });
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { entities: Record<string, { claims: Record<string, unknown[]> }> };
    const e = j.entities[id];
    if (!e) return undefined;
    const vals = (p: string): unknown[] =>
      (e.claims[p] ?? []).map((c) => (c as { mainsnak?: { datavalue?: { value?: unknown } } }).mainsnak?.datavalue?.value);
    const year = (p: string): number | undefined => {
      const v = vals(p)[0] as { time?: string } | undefined;
      if (!v?.time) return undefined;
      const y = Number(v.time.slice(1, 5));
      return Number.isFinite(y) ? y : undefined;
    };
    const first = (p: string) => {
      const v = vals(p)[0] as { id?: string; time?: string } | string | undefined;
      if (typeof v === 'string') return v;
      return v?.id ?? v?.time ?? undefined;
    };
    return {
      founded: year('P571'),
      instance: first('P31'),
      country: first('P17'),
      industry: first('P452'),
      employees: first('P1128'),
    };
  }, 400);
}

async function wikiSearch(name: string) {
  const u = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&srlimit=3`;
  return polite(async () => {
    const r = await fetch(u, { headers: UA });
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as { query?: { search?: Array<{ title: string; snippet?: string }> } };
  }, 400);
}

const { jobs } = await collectJobs(await loadSourceConfig());
const companies = [...new Set(jobs.map((j) => j.company))];
console.log(`unique companies: ${companies.length}\n`);

const rows: Array<Record<string, unknown>> = [];

for (const [i, name] of companies.entries()) {
  const wd = await wdSearch(name);
  const top = wd?.search?.[0];
  // Only trust an entity that self-describes as an organisation.
  const orgish = top?.description ?? '';
  const isOrg = /compan|technolog|software|startup|inc\b|corporation|corp\b|\bAI\b|platform|lab|app\b|service|business|developer|hosting|fintech|insur|consult|agency|studio|game|health|media|marketplace|security|cloud|bank|retail/i.test(orgish);

  const facts = top && isOrg ? await wdFacts(top.id) : undefined;
  const wiki = await wikiSearch(name);

  rows.push({
    name,
    wdId: isOrg ? top!.id : '',
    wdDesc: isOrg ? orgish : `rejected: ${orgish || 'no description'}`,
    founded: facts?.founded ?? '',
    country: facts?.country ?? '',
    instance: facts?.instance ?? '',
    industry: facts?.industry ?? '',
    employees: facts?.employees ?? '',
    wikiTitle: wiki?.query?.search?.[0]?.title ?? '',
  });

  if ((i + 1) % 40 === 0) console.log(`  ${i + 1}/${companies.length}`);
  await sleep(220);
}

const hasWd = rows.filter((r) => r.wdId);
const hasWiki = rows.filter((r) => r.wikiTitle);
const hasFounded = rows.filter((r) => r.founded !== '');
const neither = rows.filter((r) => !r.wdId && !r.wikiTitle);

console.log(`\n=== RESULTS over ${rows.length} companies ===`);
console.log(`Wikidata org entity:      ${hasWd.length}`);
console.log(`Wikipedia article:        ${hasWiki.length}`);
console.log(`has founding year:        ${hasFounded.length}`);
console.log(`NEITHER source:           ${neither.length}`);

console.log(`\n--- founded year distribution (top 15) ---`);
const yrs = rows.filter((r) => r.founded).map((r) => Number(r.founded));
const buckets: Record<string, number> = {};
for (const y of yrs) {
  const d = y < 2000 ? 'pre-2000' : y < 2010 ? '2000-2009' : y < 2015 ? '2010-2014' : y < 2020 ? '2015-2019' : y < 2026 ? '2020-2025' : '2026+';
  buckets[d] = (buckets[d] ?? 0) + 1;
}
for (const [k, v] of Object.entries(buckets).sort()) console.log(`  ${k.padEnd(12)} ${v}`);

console.log(`\n--- companies NEITHER source covers (first 30) ---`);
neither.slice(0, 30).forEach((r) => console.log(`  ${r.name}`));

console.log(`\n--- sample resolved rows ---`);
hasWd.slice(0, 15).forEach((r) => console.log(`  ${String(r.name).padEnd(18)} ${r.wdId} founded=${r.founded || '-'} inst=${r.instance || '-'} | wiki: ${r.wikiTitle || '-'}`));

console.log(`\n--- rejected-as-nonorg samples ---`);
rows.filter((r) => String(r.wdDesc).startsWith('rejected')).slice(0, 10).forEach((r) => console.log(`  ${String(r.name).padEnd(18)} ${r.wdDesc}`));
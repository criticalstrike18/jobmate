export {};
const { loadSourceConfig } = await import('../src/sources/config-loader.js');
const { collectJobs } = await import('../src/sources/index.js');
const { stripHtml } = await import('../src/sources/http.js');
import type { Job } from '../src/sources/types.js';

const config = await loadSourceConfig();
config.serp.serpapi.enabled = true;
config.serp.jsearch.enabled = true;
const { jobs, warnings } = await collectJobs(config);
console.log(`corpus: ${jobs.length} jobs`);
if (warnings.length) console.log(`warnings: ${warnings.length}`);

// ---- 1. description quality ------------------------------------------------
const descLen = (j: Job) => (j.description ?? '').length;
const thin = jobs.filter((j) => descLen(j) < 200);
const rich = jobs.filter((j) => descLen(j) >= 1000);
const withTags = jobs.filter((j) => j.tags.length > 0);
console.log(`\n[1] description / skills signal`);
console.log(`  has description:        ${jobs.length - jobs.filter((j) => !j.description).length}/${jobs.length}`);
console.log(`  thin (<200 chars):      ${thin.length}`);
console.log(`  rich (>=1000 chars):    ${rich.length}`);
console.log(`  structured tags/skills: ${withTags.length}`);

// ---- 2. years of experience -------------------------------------------------
// Embedded in prose on every source; nobody ships it structured. Measure what
// a deterministic regex recovers so we know the LLM's share.
const YOE_RES = [
  /(\d+)\s*\+\s*(years?|yrs?)\b/i,
  /(\d+)\s*-\s*(\d+)\s*(years?|yrs?)/i,
  /(\d+)\s*(years?|yrs?)\s*(of\s+)?(experience|exp\b)/i,
  /experience\s*(of\s+|:)?\s*(\d+)\s*\+?\s*(years?|yrs?)?/i,
  /minimum\s*(of\s+)?(\d+)\s*(years?|yrs?)/i,
];
function extractYoE(text: string): number | undefined {
  for (const re of YOE_RES) {
    const m = text.match(re);
    if (!m) continue;
    const nums = m.slice(1).map(Number).filter((n) => Number.isFinite(n) && n <= 30);
    if (nums.length > 0) return Math.min(...nums);
  }
  return undefined;
}
const withYoE = jobs.filter((j) => extractYoE(j.description ?? '') !== undefined);
console.log(`\n[2] years-of-experience requirement`);
console.log(`  regex-detectable in description: ${withYoE.length}/${jobs.length} (${((withYoE.length / jobs.length) * 100).toFixed(1)}%)`);
const yoeVals = withYoE.map((j) => extractYoE(j.description ?? '') as number).sort((a, b) => a - b);
if (yoeVals.length) {
  console.log(`  detected range: ${yoeVals[0]}-${yoeVals[yoeVals.length - 1]} yrs (median ${yoeVals[Math.floor(yoeVals.length / 2)]})`);
}

// ---- 3+4. location, country, remote eligibility -------------------------------
const COUNTRIES = ['united states', 'usa', 'u.s.', 'canada', 'united kingdom', 'uk', 'germany', 'france', 'netherlands', 'spain', 'portugal', 'italy', 'ireland', 'poland', 'india', 'australia', 'singapore', 'japan', 'brazil', 'mexico', 'israel', 'switzerland', 'sweden', 'austria', 'belgium', 'norway', 'denmark', 'finland', 'czech', 'romania', 'ukraine', 'philippines', 'argentina', 'colombia', 'chile', 'south africa', 'new zealand', 'emirates', 'saudi'];
const REGIONS = ['emea', 'apac', 'latam', 'americas', 'europe', 'eu ', 'apac', 'na ', 'us ', 'u.s', 'uk ', 'worldwide', 'anywhere', 'global', 'remote'];
function locationSignal(loc: string | undefined): { has: boolean; country: boolean; region: boolean; open: boolean } {
  if (!loc || !loc.trim()) return { has: false, country: false, region: false, open: false };
  const l = ` ${loc.toLowerCase()} `;
  return {
    has: true,
    country: COUNTRIES.some((c) => l.includes(c)),
    region: REGIONS.some((r) => l.includes(r)),
    open: /worldwide|anywhere|global/i.test(loc),
  };
}

const withLoc = jobs.filter((j) => locationSignal(j.location).has);
const withCountry = jobs.filter((j) => locationSignal(j.location).country);
const remote = jobs.filter((j) => j.remote);
const remoteRestricted = remote.filter((j) => {
  const s = locationSignal(j.location);
  return s.has && !s.open;
});
const remoteOpen = remote.filter((j) => {
  const s = locationSignal(j.location);
  return !s.has || s.open;
});
const onsite = jobs.filter((j) => !j.remote);

console.log(`\n[3] location / country requirement`);
console.log(`  any location signal:      ${withLoc.length}/${jobs.length} (${((withLoc.length / jobs.length) * 100).toFixed(1)}%)`);
console.log(`  country identifiable:     ${withCountry.length}/${jobs.length} (${((withCountry.length / jobs.length) * 100).toFixed(1)}%)`);
console.log(`\n[4] remote eligibility`);
console.log(`  remote flag set:          ${remote.length}/${jobs.length} (${((remote.length / jobs.length) * 100).toFixed(1)}%)`);
console.log(`  remote + geo-restricted:  ${remoteRestricted.length} (e.g. "Remote, US" — user's country decides)`);
console.log(`  remote + open/unknown:    ${remoteOpen.length} (worldwide/anywhere, or no location given)`);
console.log(`  onsite (location binds):  ${onsite.length}`);

// ---- per-source breakdown ----------------------------------------------------
const bySource = new Map<string, Job[]>();
for (const j of jobs) {
  const k = j.source.split(':')[0]!;
  if (!bySource.has(k)) bySource.set(k, []);
  bySource.get(k)!.push(j);
}
console.log(`\nper-source (n, desc%, tags%, yoe%, loc%, remote%)`);
for (const [src, list] of [...bySource].sort((a, b) => b[1].length - a[1].length)) {
  const pct = (n: number) => ((n / list.length) * 100).toFixed(0).padStart(3);
  const d = list.filter((j) => (j.description ?? '').length >= 200).length;
  const t = list.filter((j) => j.tags.length > 0).length;
  const y = list.filter((j) => extractYoE(j.description ?? '') !== undefined).length;
  const l = list.filter((j) => locationSignal(j.location).has).length;
  const r = list.filter((j) => j.remote).length;
  console.log(`  ${src.padEnd(12)} n=${String(list.length).padStart(5)}  desc ${pct(d)}%  tags ${pct(t)}%  yoe ${pct(y)}%  loc ${pct(l)}%  remote ${pct(r)}%`);
}

// spot-check: what does a restricted-remote location string look like?
console.log(`\nrestricted-remote samples:`);
for (const j of remoteRestricted.slice(0, 8)) console.log(`  [${j.source.split(':')[0]}] ${j.title.slice(0, 50)} — ${j.location}`);
console.log(`\nno-location samples (eligibility unknown):`);
for (const j of jobs.filter((j) => !locationSignal(j.location).has).slice(0, 5)) console.log(`  [${j.source.split(':')[0]}] ${j.title.slice(0, 50)} — remote=${j.remote}`);

void stripHtml;

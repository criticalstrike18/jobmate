/**
 * Measures Stage 1 against the real corpus rather than a hand-written title
 * list. The synthetic check in stage1-check.ts proves the logic; this proves
 * the tuning, because the survivor rate is the number that decides whether
 * Stage 2 fits a free LLM tier.
 */
import { loadSourceConfig } from '../src/sources/config-loader.js';
import { collectJobs } from '../src/sources/index.js';
import { stage1, DEFAULT_STAGE1 } from '../src/match/stage1.js';
import { toDbJob } from '../src/sources/normalize.js';
import { isTargetFamily } from '../src/match/stage1.js';
import type { Job, Profile } from '../src/db/types.js';

const profile: Profile = {
  id: 'probe',
  label: 'probe',
  seniority: 'senior',
  roleFamilies: ['software-engineering', 'infrastructure-devops'],
  skills: ['typescript', 'postgres', 'go', 'kubernetes', 'aws'],
  isCurrent: true,
  createdAt: new Date().toISOString(),
  parseMode: 'hybrid',
};

const config = await loadSourceConfig();
const { jobs } = await collectJobs(config, { includeFeeds: false });

const classified: Job[] = jobs.map((j) => toDbJob(j, { companyId: 'probe' }));

const byFamily = new Map<string, number>();
for (const j of classified) byFamily.set(j.roleFamily, (byFamily.get(j.roleFamily) ?? 0) + 1);

console.log(`\ncorpus: ${classified.length} jobs from ATS boards only`);
console.log('\nfamily distribution:');
for (const [family, count] of [...byFamily].sort((a, b) => b[1] - a[1])) {
  const pct = ((count / classified.length) * 100).toFixed(1);
  console.log(`  ${family.padEnd(26)} ${String(count).padStart(5)}  ${pct.padStart(5)}%`);
}

const nonTarget = classified.filter((j) => !isTargetFamily(j.roleFamily));
console.log(`\nnon-target families: ${nonTarget.length} (${((nonTarget.length / classified.length) * 100).toFixed(1)}%)`);

// Budget guard: Groq's free tier is 1,000 requests/day. Assume runs land
// ~daily and leave headroom for retries, so target 800 Stage 2 calls/month.
const MONTHLY_BUDGET = 800;
const RUNS_PER_MONTH = 30;
const NEW_JOBS_PER_RUN = 137; // measured in the smoke test

console.log('\nthreshold sweep:');
console.log(`  threshold   survivors    %     Stage2/mo   verdict`);
let chosen: number | null = null;
for (const threshold of [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7]) {
  const results = classified.map((j) => stage1(profile, j, { ...DEFAULT_STAGE1, passThreshold: threshold }));
  const survivors = results.filter((r) => r.passed).length;
  const pct = (survivors / classified.length) * 100;
  const perRun = (survivors / classified.length) * NEW_JOBS_PER_RUN;
  const monthly = Math.round(perRun * RUNS_PER_MONTH);
  const verdict = monthly <= MONTHLY_BUDGET ? 'fits free tier' : 'exceeds';
  console.log(
    `  ${String(threshold).padEnd(10)} ${String(survivors).padStart(5)}   ${pct.toFixed(1).padStart(5)}%   ${String(monthly).padStart(7)}   ${verdict}`,
  );
  // Lowest threshold that fits -- maximises recall. A job dropped in Stage 1 is
  // invisible to the user, whereas a marginal job reaching Stage 2 merely costs
  // a little budget and gets ranked lower anyway.
  if (chosen === null && monthly <= MONTHLY_BUDGET) chosen = threshold;
}

console.log(`\n  Groq free tier is 1,000 req/day; budgeted ${MONTHLY_BUDGET} Stage 2 calls/month.`);
const finalThreshold = chosen ?? 0.7;
console.log(`  Lowest threshold that fits: ${finalThreshold}`);

const survivors = classified.filter((j) => stage1(profile, j, { ...DEFAULT_STAGE1, passThreshold: finalThreshold }).passed);
console.log(`\ntop survivors at threshold ${finalThreshold}:`);
for (const j of survivors.slice(0, 12)) {
  console.log(`  ${j.roleFamily.padEnd(26)} ${j.title}`);
}
const familiesKept = new Set(survivors.map((j) => j.roleFamily));
console.log(`\n  families surviving: ${[...familiesKept].join(', ')}`);
console.log(`  target-family jobs kept: ${survivors.filter((j) => j.isTargetFamily).length}/${classified.filter((j) => j.isTargetFamily).length}`);
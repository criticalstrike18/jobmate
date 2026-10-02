import { loadSourceConfig } from '../src/sources/config-loader.js';
import { collectJobs, summarizeByTier } from '../src/sources/index.js';

const start = Date.now();

const config = await loadSourceConfig();
const { jobs, warnings } = await collectJobs(config);
const elapsed = Date.now() - start;

const unique = new Set(jobs.map((j) => j.id));

console.log(`\ncollected ${jobs.length} jobs (${unique.size} unique) in ${elapsed}ms`);
console.log(`by trust tier:`, summarizeByTier(jobs));

const withSalary = jobs.filter((j) => j.salary);
const withDescription = jobs.filter((j) => j.description && j.description.length > 200);
const remote = jobs.filter((j) => j.remote);

console.log(`with salary:     ${withSalary.length}`);
console.log(`with description: ${withDescription.length}`);
console.log(`remote:          ${remote.length}`);

console.log(`\nsample:`);
for (const job of jobs.slice(0, 5)) {
  console.log(`  [${job.trustTier}] ${job.title} — ${job.company} (${job.location ?? 'n/a'})`);
  console.log(`         ${job.sourceUrl}`);
}

console.log(`\nsalary samples:`);
for (const job of withSalary.slice(0, 5)) {
  console.log(`  ${job.title}: ${job.salary?.raw ?? `${job.salary?.min}-${job.salary?.max} ${job.salary?.currency}`}`);
}

if (warnings.length > 0) {
  console.log(`\nwarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
}
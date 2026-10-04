export {};
const { loadSourceConfig } = await import('../src/sources/config-loader.js');
const { collectJobs, summarizeByTier } = await import('../src/sources/index.js');

const config = await loadSourceConfig();
config.serp.serpapi.enabled = true;
config.serp.jsearch.enabled = true;

const { jobs, warnings } = await collectJobs(config);
const unique = new Set(jobs.map((j) => j.id));
console.log('total', jobs.length, 'unique', unique.size, 'dupes', jobs.length - unique.size);
console.log(summarizeByTier(jobs));
if (warnings.length > 0) console.log('warnings:', warnings);

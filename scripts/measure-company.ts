export {};
const { loadSourceConfig } = await import('../src/sources/config-loader.js');
const { collectJobs } = await import('../src/sources/index.js');

const config = await loadSourceConfig();
const { jobs } = await collectJobs(config);

const unknown = jobs.filter((j) => !j.company || j.company === 'Unknown');
console.log(`company name present: ${jobs.length - unknown.length}/${jobs.length}`);
if (unknown.length) {
  const by: Record<string, number> = {};
  for (const j of unknown) by[j.source.split(':')[0]!] = (by[j.source.split(':')[0]!] ?? 0) + 1;
  console.log('  Unknown by source:', JSON.stringify(by));
}

// What do the companyDomain values actually look like?
const domains = new Map<string, { n: number; ex: string }>();
for (const j of jobs) {
  if (!j.companyDomain) continue;
  const e = domains.get(j.companyDomain) ?? { n: 0, ex: j.company };
  e.n++;
  domains.set(j.companyDomain, e);
}
const withDomain = [...domains.values()].reduce((a, e) => a + e.n, 0);
console.log(`\ncompanyDomain present: ${withDomain}/${jobs.length} (${((withDomain / jobs.length) * 100).toFixed(1)}%)`);
console.log('distinct domains:', domains.size);
console.log('\ntop domains:');
for (const [d, e] of [...domains].sort((a, b) => b[1].n - a[1].n).slice(0, 15)) {
  console.log(`  ${d.padEnd(40)} ${String(e.n).padStart(5)}  eg ${e.ex.slice(0, 30)}`);
}

// Per-source: is the domain the employer's, or the board/aggregator's?
console.log('\nper-source domain character:');
const bySource = new Map<string, { total: number; with: number; vals: Set<string> }>();
for (const j of jobs) {
  const k = j.source.split(':')[0]!;
  if (!bySource.has(k)) bySource.set(k, { total: 0, with: 0, vals: new Set() });
  const b = bySource.get(k)!;
  b.total++;
  if (j.companyDomain) {
    b.with++;
    if (b.vals.size < 4) b.vals.add(j.companyDomain);
  }
}
for (const [src, e] of [...bySource].sort((a, b2) => b2[1].total - a[1].total)) {
  console.log(`  ${src.padEnd(12)} ${e.with}/${e.total}  ${[...e.vals].join(', ')}`);
}

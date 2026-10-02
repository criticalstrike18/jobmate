import { formatProbe } from '../src/report.js';
import { probeBoard, type ResolvedBoard } from '../src/sources/probe.js';

// Candidate tokens for discovery. Nothing here is trusted until probed --
// the committed config/sources.yaml contains only tokens verified below.
const CANDIDATES: Array<[ResolvedBoard['ats'], string]> = [
  ['greenhouse', 'gitlab'],
  ['greenhouse', 'airbnb'],
  ['greenhouse', 'datadog'],
  ['greenhouse', 'stripe'],
  ['greenhouse', 'cloudflare'],
  ['greenhouse', 'figma'],
  ['greenhouse', 'robinhood'],
  ['greenhouse', 'discord'],
  ['greenhouse', 'dropbox'],
  ['greenhouse', 'doordash'],
  ['greenhouse', 'instacart'],
  ['greenhouse', 'reddit'],
  ['lever', 'netflix'],
  ['lever', 'spotify'],
  ['lever', 'plaid'],
  ['lever', 'brex'],
  ['lever', 'affirm'],
  ['lever', 'coinbase'],
  ['lever', 'quora'],
  ['ashby', 'ramp'],
  ['ashby', 'notion'],
  ['ashby', 'openai'],
  ['ashby', 'linear'],
  ['ashby', 'anthropic'],
];

const CONCURRENCY = 6;

async function main(): Promise<void> {
  const boards: ResolvedBoard[] = CANDIDATES.map(([ats, token]) => ({
    id: `${ats}:${token}`,
    ats,
    token,
    label: `${ats}/${token}`,
  }));

  console.log(`\nprobing ${boards.length} candidate ATS boards\n`);

  const results = [];
  for (let i = 0; i < boards.length; i += CONCURRENCY) {
    const batch = boards.slice(i, i + CONCURRENCY);
    results.push(...(await Promise.all(batch.map(probeBoard))));
  }

  console.log(formatProbe(results));

  const live = results
    .filter((r) => r.ok && r.count > 0)
    .map((r) => `    - ats: ${r.board.ats}\n      token: ${r.board.token}`);

  console.log(`\n  verified tokens:\n${live.join('\n')}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
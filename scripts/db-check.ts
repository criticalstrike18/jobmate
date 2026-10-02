/**
 * Round-trips every store operation against a throwaway in-memory database,
 * including the syndication-dedup path (one job, two source observations).
 */
import { createSqliteStore } from '../src/db/store.js';
import type { Job } from '../src/db/types.js';

const store = createSqliteStore(':memory:');

let failures = 0;
function check(label: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label} ${detail}`);
  }
}

const now = new Date().toISOString();
const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

// providers
store.upsertProvider({
  id: 'oll-local',
  kind: 'ollama',
  label: 'Local Ollama',
  baseUrl: 'http://localhost:11434',
  model: 'qwen3-vl:8b',
  isDefault: true,
  capabilities: JSON.stringify({ nativePdf: false, maxImages: null }),
});
check('provider inserted', store.listProviders().length === 1);

store.upsertProvider({
  id: 'gem-bring',
  kind: 'gemini',
  label: 'Gemini BYOK',
  model: 'gemini-3.8-flash',
  isDefault: true,
  capabilities: JSON.stringify({ nativePdf: true }),
});
const providers = store.listProviders();
check('default flag moved to newest provider', providers[0]!.id === 'gem-bring');
check('only one default provider', providers.filter((p) => p.isDefault).length === 1);

// profiles
const profileId = store.insertProfile({
  label: 'Primary',
  fullName: 'Test User',
  seniority: 'senior',
  roleFamilies: ['software-engineering', 'data-ml'],
  skills: ['typescript', 'postgres', 'python'],
  parseMode: 'hybrid',
  isCurrent: true,
});
check('profile current is retrievable', store.getCurrentProfile()?.id === profileId);
check('profile round-trips arrays', store.getCurrentProfile()?.skills.includes('postgres') === true);

// companies
const stripe = store.upsertCompany({
  name: 'Stripe',
  domain: 'stripe.com',
  trustTier: 'ats-official',
  atsPlatform: 'greenhouse',
  atsToken: 'stripe',
});
const again = store.upsertCompany({ name: 'Stripe', domain: 'stripe.com', trustTier: 'ats-official' });
check('company dedupes on domain', stripe === again);
store.patchCompanyReputation(stripe, {
  domainRegisteredAt: '2007-05-01',
  domainAgeDays: 7000,
  reputationScore: 0.98,
  evidenceDelta: 3,
});
const company = store.getCompanyByDomain('stripe.com');
check('reputation patch applied', company?.reputationScore === 0.98);
check('evidence counter applied', company?.reputationEvidenceCount === 3);

// jobs
const base: Omit<Job, 'id'> = {
  companyId: stripe,
  title: 'Senior Backend Engineer',
  titleNormalized: 'senior backend engineer',
  locationRaw: 'Remote, US',
  remote: true,
  seniority: 'senior',
  roleFamily: 'software-engineering',
  isTargetFamily: true,
  classificationMethod: 'inferred',
  description: 'Build payment infrastructure.',
  skills: ['go', 'postgres'],
  salaryMin: 180000,
  salaryMax: 260000,
  salaryCurrency: 'USD',
  applyUrl: 'https://boards.greenhouse.io/stripe/jobs/1',
  postedAt: now,
  firstSeenAt: now,
  lastSeenAt: now,
  isActive: true,
};

const created = store.upsertJob({ ...base, id: 'job-1' });
check('new job reports isNew', created.isNew);
const updated = store.upsertJob({ ...base, id: 'job-1', title: 'Staff Backend Engineer' });
check('existing job reports not new', !updated.isNew);
check('job count stays 1', store.countNewJobsSince(weekAgo) === 1);

// syndication dedup: same job observed via two sources, one jobs row
store.recordJobSource({
  jobId: 'job-1',
  sourceId: 'greenhouse:stripe',
  sourceJobId: '1',
  sourceUrl: 'https://boards.greenhouse.io/stripe/jobs/1',
  strategy: 'api',
  robotsChecked: true,
  attributionRequired: false,
  seenFirstAt: now,
  seenLastAt: now,
});
store.recordJobSource({
  jobId: 'job-1',
  sourceId: 'remotive',
  sourceJobId: 'stripe-1',
  sourceUrl: 'https://remotive.com/jobs/1',
  strategy: 'api',
  attributionRequired: true,
  attributionName: 'Remotive',
  seenFirstAt: now,
  seenLastAt: now,
});
check('two sources map to one job', store.getJobSourceIdentity('remotive', 'stripe-1')?.jobId === 'job-1');
check('job count unchanged after second source', store.countNewJobsSince(weekAgo) === 1);

// matches
store.upsertMatch({
  profileId,
  jobId: 'job-1',
  stage1Passed: true,
  stage1Score: 0.82,
  stage1Reasons: '["family match","remote ok"]',
  stage2Score: 91,
  stage2Verdict: 'strong',
  trustScore: 8,
  trustBand: 'safe',
  combinedScore: 92.4,
  llmCalls: 1,
  tokensIn: 2400,
  tokensOut: 180,
});
store.upsertMatch({
  profileId,
  jobId: 'job-1',
  stage1Passed: true,
  stage1Score: 0.84,
  stage2Score: 94,
  combinedScore: 95,
  llmCalls: 1,
});
const matches = store.listMatches(profileId, { stage1Passed: true });
check('match upsert is idempotent', matches.length === 1);
check('latest match wins', matches[0]!.stage2Score === 94);

// trust signals + expiry
store.insertTrustSignals([
  {
    jobId: 'job-1',
    companyId: stripe,
    signalCode: 'ats-official',
    severity: 'info',
    weight: 0,
    checkedAt: now,
  },
  {
    jobId: 'job-1',
    signalCode: 'short-description',
    severity: 'warn',
    weight: 2,
    checkedAt: now,
    expiresAt: weekAgo,
  },
]);
check('expired signal purged', store.purgeExpiredSignals(now) === 1);

// runs
const runId = store.startRun({ profileId, sourcesOk: 16, sourcesFailed: 2, jobsSeen: 4181 });
store.finishRun(runId, {
  sourcesOk: 16,
  sourcesFailed: 2,
  jobsSeen: 4181,
  jobsNew: 137,
  stage1Evaluated: 4181,
  stage2Evaluated: 137,
  llmCalls: 137,
  warnings: JSON.stringify(['remotive: timeout']),
});
check('run accounting recorded', true);

store.close();
console.log(failures === 0 ? '\n  all checks passed' : `\n  ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
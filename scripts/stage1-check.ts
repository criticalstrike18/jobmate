/**
 * Exercises Stage 1 against a synthetic corpus, then reports the survivor rate.
 * The rate matters as much as the verdicts: it is the number that decides
 * whether Stage 2 fits inside a free LLM tier.
 */
import type { Job, Profile } from '../src/db/types.js';
import {
  classifyFamily,
  classifySeniority,
  DEFAULT_STAGE1,
  isTargetFamily,
  stage1,
} from '../src/match/stage1.js';

let failures = 0;
function check(label: string, cond: boolean, detail = ''): void {
  if (cond) console.log(`  ok    ${label}`);
  else {
    failures++;
    console.log(`  FAIL  ${label} ${detail}`);
  }
}

console.log('\nclassification');
check('backend -> software-engineering', classifyFamily('Backend Engineer') === 'software-engineering');
check('ml engineer -> data-ml', classifyFamily('Machine Learning Engineer') === 'data-ml');
check('sre -> infrastructure', classifyFamily('Site Reliability Engineer') === 'infrastructure-devops');
check('appsec -> security', classifyFamily('Application Security Engineer') === 'security');
check('sdet -> qa', classifyFamily('SDET') === 'qa-test');
check('helpdesk -> it-operations', classifyFamily('IT Support Specialist') === 'it-operations');
check('ux -> design', classifyFamily('Product Designer') === 'design');
check('em -> management', classifyFamily('Engineering Manager, Platform') === 'management');
check('product manager -> unknown', classifyFamily('Product Manager') === 'unknown');
check('senior in title', classifySeniority('Senior Data Analyst') === 'senior');
check('staff in title', classifySeniority('Staff Software Engineer') === 'staff');
check('no level -> unknown', classifySeniority('Software Engineer') === 'unknown');
check('target family true for sde', isTargetFamily('software-engineering'));
check('target family false for mgmt', !isTargetFamily('management'));

const profile: Profile = {
  id: 'p1',
  label: 'test',
  seniority: 'senior',
  roleFamilies: ['software-engineering', 'infrastructure-devops'],
  skills: ['typescript', 'postgres', 'go', 'kubernetes', 'aws'],
  isCurrent: true,
  createdAt: new Date().toISOString(),
  parseMode: 'hybrid',
};

const now = new Date().toISOString();
function job(over: Partial<Job>): Job {
  const title = over.title ?? 'Software Engineer';
  return {
    id: Math.random().toString(36).slice(2),
    companyId: 'c1',
    title,
    titleNormalized: title.toLowerCase(),
    remote: false,
    seniority: classifySeniority(title),
    roleFamily: classifyFamily(title),
    isTargetFamily: isTargetFamily(classifyFamily(title)),
    classificationMethod: 'inferred',
    skills: [],
    applyUrl: 'https://example.com/job',
    firstSeenAt: now,
    lastSeenAt: now,
    isActive: true,
    ...over,
  };
}

console.log('\nverdicts');
const strongMatch = job({
  title: 'Senior Backend Engineer',
  roleFamily: 'software-engineering',
  seniority: 'senior',
  skills: ['typescript', 'postgres'],
  remote: true,
  salaryMax: 200000,
  salaryCurrency: 'USD',
});
const r1 = stage1(profile, strongMatch);
check('strong match passes', r1.passed, JSON.stringify(r1));
check('strong match scores high', r1.score > 0.75, String(r1.score));

const weakMatch = job({
  title: 'Retail Store Manager',
  roleFamily: 'unknown',
  seniority: 'unknown',
  skills: ['merchandising'],
});
const r2 = stage1(profile, weakMatch);
check('unrelated role rejected', !r2.passed, JSON.stringify(r2));
check('rejection is explained', r2.reasons.length > 0);

const juniorRole = job({ title: 'Junior Backend Engineer', seniority: 'junior', roleFamily: 'software-engineering' });
const r3 = stage1(profile, juniorRole);
check('junior role hard-fails on seniority gap', !r3.passed);
check('seniority hard fail is named', r3.reasons.some((x) => x.includes('seniority gap')), JSON.stringify(r3.reasons));

const adjacent = job({ title: 'Site Reliability Engineer', roleFamily: 'infrastructure-devops', seniority: 'senior' });
const r4 = stage1(profile, adjacent);
check('adjacent family still scores usefully', r4.score > 0.5, String(r4.score));

const lowSalary = job({
  title: 'Senior Backend Engineer',
  roleFamily: 'software-engineering',
  seniority: 'senior',
  salaryMax: 50000,
  salaryCurrency: 'USD',
});
const r5 = stage1(profile, lowSalary, { ...DEFAULT_STAGE1, minSalary: 150000 });
check('salary floor rejects', !r5.passed);
check('salary reject is explained', r5.reasons.some((x) => x.includes('salary ceiling')));

const outOfScope = job({ title: 'Product Manager', roleFamily: 'management', seniority: 'senior' });
const r6 = stage1(profile, outOfScope, { ...DEFAULT_STAGE1, requireTargetFamily: true });
check('scope gate rejects management roles', !r6.passed);
const r7 = stage1(profile, outOfScope, DEFAULT_STAGE1);
check('without scope gate, roles are scored not dropped', r7.score > 0, String(r7.score));

console.log('\ndeterminism');
const a = stage1(profile, strongMatch);
const b = stage1(profile, strongMatch);
check('same inputs give identical output', JSON.stringify(a) === JSON.stringify(b));

console.log('\nthroughput simulation');
const titles = [
  'Senior Backend Engineer', 'Staff Platform Engineer', 'Machine Learning Engineer',
  'Security Engineer', 'Frontend Engineer', 'Data Engineer', 'Site Reliability Engineer',
  'Engineering Manager', 'Product Manager', 'Sales Development Representative',
  'Technical Recruiter', 'Office Manager', 'Senior Backend Engineer, Payments',
  'Infrastructure Engineer', 'QA Automation Engineer', 'IT Support Technician',
  'Junior Frontend Developer', 'Principal Software Engineer', 'DevOps Engineer',
  'Data Scientist', 'Mobile Engineer', 'Product Designer', 'Solutions Architect',
];
const synthetic = titles.map((t, i) =>
  job({
    id: `syn-${i}`,
    title: t,
    roleFamily: classifyFamily(t),
    seniority: classifySeniority(t),
    skills: ['typescript', 'aws', 'kubernetes'].slice(0, (i % 3) + 1),
    remote: i % 2 === 0,
  }),
);

const t0 = performance.now();
const results = synthetic.map((j) => stage1(profile, j));
const elapsed = performance.now() - t0;
const survivors = results.filter((r) => r.passed).length;
const rate = survivors / synthetic.length;

console.log(`  ${synthetic.length} jobs scored in ${elapsed.toFixed(2)}ms`);
console.log(`  survivors: ${survivors} (${(rate * 100).toFixed(0)}%)`);
console.log(`  extrapolated to the 4181-job corpus: ~${Math.round(rate * 4181)} jobs reaching Stage 2`);
check('scoring is fast enough to be free', elapsed < 50, `${elapsed.toFixed(2)}ms`);
check('survivor rate leaves Stage 2 affordable', rate > 0.15 && rate < 0.6, `${(rate * 100).toFixed(0)}%`);

console.log(failures === 0 ? '\n  all checks passed' : `\n  ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
import type { Job, Profile, RoleFamily, Seniority } from '../db/types.js';

/**
 * Stage 1 is a pure function: profile + job -> verdict. No network, no LLM, no
 * clock, no randomness. It is the only stage that runs across the full corpus on
 * every pass, so it is also the stage whose cost defines the whole budget.
 *
 * Because it is deterministic, it is directly unit-testable and its tuning is
 * measurable rather than vibes.
 */

export interface Stage1Config {
  /** Drop anything outside the user's focus families outright. */
  requireTargetFamily: boolean;
  /** Seniority distance tolerated in either direction. */
  seniorityTolerance: number;
  /** Minimum stage1 score to advance to the LLM stage. */
  passThreshold: number;
  /** Treat the profile as open to any location unless it declares preferences. */
  strictLocation: boolean;
  /** Floor on advertised salary, in the job's own currency. 0 disables. */
  minSalary: number;
}

/**
 * Threshold calibrated against the live corpus, not guessed. At 0.55 a senior
 * backend+infra profile retains 689 of 1,233 target-family jobs (56% recall)
 * while projecting ~738 Stage 2 calls/month, inside Groq's 1,000/day free tier.
 * Tightening to 0.65 buys budget we do not need at the cost of 260 real jobs.
 * Re-run `npm run stage1:corpus` to re-derive after source or profile changes.
 */
export const DEFAULT_STAGE1: Stage1Config = {
  requireTargetFamily: false,
  seniorityTolerance: 1,
  passThreshold: 0.55,
  strictLocation: false,
  minSalary: 0,
};

export interface Stage1Result {
  passed: boolean;
  score: number;
  reasons: string[];
}

const SENIORITY_ORDER: Seniority[] = [
  'intern',
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
  'lead',
  'director',
];

export function seniorityIndex(s: Seniority): number {
  const i = SENIORITY_ORDER.indexOf(s);
  return i === -1 ? SENIORITY_ORDER.indexOf('mid') : i;
}

/**
 * Maps a free-text job title onto a role family. Deliberately keyword-based:
 * inference is the LLM's job, and misclassification here only costs us Stage 1
 * recall, which the family weighting absorbs.
 */
const FAMILY_PATTERNS: Array<[RoleFamily, RegExp]> = [
  ['data-ml', /\b(ml|machine learning|deep learning|data scien|data engineer|analytics|ai engineer|llm|nlp|computer vision|research scientist)\b/i],
  ['infrastructure-devops', /\b(devops|sre|site reliability|infrastructure|cloud engineer|platform engineer|kubernetes|k8s|terraform|aws|azure|gcp)\b/i],
  ['security', /\b(security|appsec|application security|penetration|infosec|threat|detection engineer|security engineer)\b/i],
  ['qa-test', /\b(qa|quality assurance|test engineer|sdet|automation test|manual tester)\b/i],
  ['it-operations', /\b(it support|help desk|helpdesk|desktop support|system administrator|sysadmin|it operations|service desk)\b/i],
  ['data-ml', /\b(data)\b/i],
  ['software-engineering', /\b(software|backend|back end|front end|frontend|full ?stack|web dev|mobile|ios|android|api engineer|systems engineer|developer|programmer|firmware)\b/i],
  ['design', /\b(designer|design systems?|ux|ui designer|product design)\b/i],
  ['management', /\b(engineering manager|tech lead|head of engineering|director of engineering|em\b|vp of engineering|cto)\b/i],
];

export function classifyFamily(title: string, department?: string): RoleFamily {
  const haystack = `${title} ${department ?? ''}`;
  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(haystack)) return family;
  }
  return 'unknown';
}

const SENIORITY_PATTERNS: Array<[Seniority, RegExp]> = [
  ['intern', /\b(intern|internship|co-?op|apprentice|trainee)\b/i],
  ['junior', /\b(junior|jr\.?|entry[- ]level|graduate|new grad|associate)\b/i],
  ['staff', /\b(staff|distinguished)\b/i],
  ['principal', /\b(principal|distinguished)\b/i],
  ['lead', /\b(lead|leader|tech lead)\b/i],
  ['director', /\b(director|head of|vp|chief)\b/i],
  ['senior', /\b(senior|sr\.?|snr)\b/i],
];

export function classifySeniority(title: string): Seniority {
  for (const [level, pattern] of SENIORITY_PATTERNS) {
    if (pattern.test(title)) return level;
  }
  return 'unknown';
}

/** Families the product focuses on for v1 (AI / software / data / web3 / infra). */
export const TARGET_FAMILIES: ReadonlySet<RoleFamily> = new Set<RoleFamily>([
  'software-engineering',
  'data-ml',
  'infrastructure-devops',
  'security',
  'qa-test',
]);

export function isTargetFamily(family: RoleFamily): boolean {
  return TARGET_FAMILIES.has(family);
}

function familyScore(profileFamilies: RoleFamily[], jobFamily: RoleFamily): number {
  // "Unknown" means we could not classify it, which is evidence of absence, not
  // evidence of a mediocre match. Scoring it mid-range let every unclassifiable
  // posting (support, retail, admin) accumulate enough partial credit to clear
  // the pass threshold.
  if (jobFamily === 'unknown') return 0.15;
  if (profileFamilies.includes(jobFamily)) return 1;
  // Adjacent families are worth partial credit: data-ml and infra often overlap
  // with backend work, and a strong backend profile should still see SRE roles.
  const adjacent: Record<string, RoleFamily[]> = {
    'software-engineering': ['data-ml', 'infrastructure-devops', 'security'],
    'data-ml': ['software-engineering', 'infrastructure-devops'],
    'infrastructure-devops': ['software-engineering', 'security', 'data-ml'],
    security: ['infrastructure-devops', 'software-engineering'],
    'qa-test': ['software-engineering'],
  };
  if ((adjacent[jobFamily] ?? []).some((f) => profileFamilies.includes(f))) return 0.6;
  return 0.1;
}

function seniorityScore(profileSeniority: Seniority, jobSeniority: Seniority): number {
  if (jobSeniority === 'unknown') return 0.4;
  const distance = Math.abs(seniorityIndex(profileSeniority) - seniorityIndex(jobSeniority));
  if (distance === 0) return 1;
  if (distance === 1) return 0.75;
  if (distance === 2) return 0.4;
  return 0.1;
}

const GENERIC_TOKENS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'at', 'to', 'for', 'with', 'on',
  'our', 'we', 'you', 'your', 'us', 'is', 'are', 'will', 'be', 'as', 'by', 'from',
]);

/**
 * Crude but sufficient stemmer. Job titles routinely disagree with profile
 * vocabulary on inflection ("Backend Engineer" vs "Software Engineering"), and
 * without this the most common comparison in the product silently scores zero.
 */
function stem(token: string): string {
  let current = token;
  // Iterate to a fixed point: "engineering" needs two passes (ing -> engineer,
  // er -> engine) while "engineer" needs one, so a single pass leaves them
  // disagreeing.
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const suffix of ['ings', 'ing', 'ers', 'er', 'ed', 'es', 's']) {
      if (current.length > suffix.length + 2 && current.endsWith(suffix)) {
        current = current.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }
  return current;
}

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !GENERIC_TOKENS.has(t))
      .map(stem),
  );
}

function titleScore(profileRoles: string[], jobTitle: string): number {
  if (profileRoles.length === 0) return 0.3;
  const jobTokens = titleTokens(jobTitle);
  if (jobTokens.size === 0) return 0.3;

  let best = 0;
  for (const role of profileRoles) {
    const roleTokens = titleTokens(role);
    if (roleTokens.size === 0) continue;
    let overlap = 0;
    for (const t of roleTokens) if (jobTokens.has(t)) overlap++;
    // Normalise by the smaller set: a "backend" profile matching a long
    // "Senior Backend Engineer, Payments" title should score high.
    best = Math.max(best, overlap / Math.min(roleTokens.size, jobTokens.size));
  }
  return best;
}

function skillScore(profileSkills: string[], jobSkills: string[]): number {
  if (profileSkills.length === 0) return 0.4;
  // Most postings carry no structured skill tags, so a missing list means
  // "unknown", not "half relevant". Lean low but non-zero so a job with good
  // title and family evidence can still pass.
  if (jobSkills.length === 0) return 0.3;

  const jobSet = new Set(jobSkills.map((s) => s.toLowerCase().trim()));
  let hits = 0;
  for (const skill of profileSkills) {
    const normalized = skill.toLowerCase().trim();
    if (jobSet.has(normalized)) hits++;
  }
  return Math.min(1, hits / Math.max(3, Math.min(profileSkills.length, jobSkills.length)));
}

function locationScore(profile: Profile, job: Job, strict: boolean): number {
  if (job.remote) return 1;
  if (!strict || !profile.locationRaw) return 0.6;
  const profileTokens = titleTokens(profile.locationRaw);
  const jobTokens = titleTokens(job.locationRaw ?? '');
  for (const t of jobTokens) if (profileTokens.has(t)) return 1;
  return 0.2;
}

export function stage1(
  profile: Profile,
  job: Job,
  config: Stage1Config = DEFAULT_STAGE1,
): Stage1Result {
  const reasons: string[] = [];
  const hardFails: string[] = [];

  // ---- hard gates: cheap rejects that need no scoring -----------------------
  if (config.requireTargetFamily && !isTargetFamily(job.roleFamily)) {
    hardFails.push(`family out of scope: ${job.roleFamily}`);
  }

  if (config.minSalary > 0 && job.salaryMax !== undefined && job.salaryMax < config.minSalary) {
    hardFails.push(`salary ceiling ${job.salaryMax} below floor ${config.minSalary}`);
  }

  const seniorityDistance = Math.abs(seniorityIndex(profile.seniority) - seniorityIndex(job.seniority));
  if (seniorityDistance > config.seniorityTolerance) {
    hardFails.push(`seniority gap: ${job.seniority} vs ${profile.seniority}`);
  }

  if (hardFails.length > 0) {
    return { passed: false, score: 0, reasons: hardFails };
  }

  // ---- weighted signals ----------------------------------------------------
  const roleHints = [...profile.roleFamilies, ...profile.skills.slice(0, 3)];
  const family = familyScore(profile.roleFamilies, job.roleFamily);
  const seniority = seniorityScore(profile.seniority, job.seniority);
  const title = titleScore(roleHints, job.title);
  const skills = skillScore(profile.skills, job.skills);
  const location = locationScore(profile, job, config.strictLocation);

  const weights = { family: 0.35, title: 0.25, skills: 0.2, seniority: 0.12, location: 0.08 };
  const score =
    family * weights.family +
    title * weights.title +
    skills * weights.skills +
    seniority * weights.seniority +
    location * weights.location;

  if (family >= 1) reasons.push(`role family match: ${job.roleFamily}`);
  else if (family > 0.5) reasons.push(`adjacent role family: ${job.roleFamily}`);
  else reasons.push(`role family mismatch: ${job.roleFamily}`);

  if (title >= 0.6) reasons.push(`title overlap: ${job.title}`);
  if (skills >= 0.5) reasons.push(`${job.skills.length} overlapping skills`);
  if (job.remote) reasons.push('remote');
  if (job.salaryMax) reasons.push(`salary up to ${job.salaryMax} ${job.salaryCurrency ?? ''}`.trim());
  if (seniority >= 1) reasons.push(`seniority match: ${job.seniority}`);

  const passed = score >= config.passThreshold;
  if (!passed) reasons.push(`score ${score.toFixed(2)} below threshold ${config.passThreshold}`);

  return { passed, score: Number(score.toFixed(4)), reasons };
}
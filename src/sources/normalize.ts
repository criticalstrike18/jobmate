import type { Job as DbJob, RoleFamily, Seniority } from '../db/types.js';
import type { Job as SourceJob } from './types.js';
import { classifyFamily, classifySeniority, isTargetFamily } from '../match/stage1.js';

/**
 * Reconciles the wire shape produced by adapters with the shape the store
 * persists. Adapters deal in `tags` because that is what the ATS APIs return;
 * the store deals in `skills` because that is what matching consumes.
 *
 * Keeping this as an explicit translation means a new adapter cannot leak
 * upstream field naming into the database layer.
 */

const SENIORITY_BY_TAG: Record<string, Seniority> = {
  intern: 'intern',
  internship: 'intern',
  junior: 'junior',
  entry: 'junior',
  mid: 'mid',
  senior: 'senior',
  staff: 'staff',
  principal: 'principal',
  lead: 'lead',
  director: 'director',
  manager: 'lead',
};

const STOP_TAGS = new Set([
  'full-time', 'full time', 'part-time', 'contract', 'temporary', 'internship',
  'remote', 'hybrid', 'onsite', 'engineering', 'sales', 'marketing',
]);

export function normalizeTagsToSkills(tags: string[]): string[] {
  const out = new Set<string>();
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (!t || STOP_TAGS.has(t)) continue;
    if (t.length < 2 || t.length > 40) continue;
    out.add(t);
  }
  return [...out];
}

/**
 * Adapters supply a company *name* but not an id. Callers own company identity
 * so they can dedupe by domain before persisting; until then the raw name is
 * the key. See src/sources/ingest.ts for the domain-based upsert path.
 */
export function toDbJob(
  src: SourceJob,
  opts: { companyId: string; language?: string },
): DbJob {
  const family: RoleFamily = classifyFamily(src.title, src.tags[0]);
  const seniorityFromTags = src.tags
    .map((t) => SENIORITY_BY_TAG[t.trim().toLowerCase()])
    .find((s): s is Seniority => Boolean(s));

  const seniority = seniorityFromTags ?? classifySeniority(src.title);
  const now = new Date().toISOString();

  return {
    id: src.id,
    companyId: opts.companyId,
    title: src.title,
    titleNormalized: src.title.toLowerCase().trim(),
    locationRaw: src.location,
    remote: src.remote,
    employmentType: src.employmentType,
    seniority,
    roleFamily: family,
    isTargetFamily: isTargetFamily(family),
    classificationMethod: 'inferred',
    description: src.description,
    skills: normalizeTagsToSkills(src.tags),
    salaryMin: src.salary?.min,
    salaryMax: src.salary?.max,
    salaryCurrency: src.salary?.currency,
    salaryRaw: src.salary?.raw,
    applyUrl: src.sourceUrl,
    postedAt: src.postedAt,
    firstSeenAt: src.firstSeenAt,
    lastSeenAt: src.lastSeenAt,
    closedAt: src.closedAt,
    isActive: !src.closedAt,
  };
}
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { MIGRATIONS } from './migrations.js';
import type {
  Company,
  Job,
  JobSource,
  Match,
  Profile,
  ProviderConfig,
  RunMeta,
  TrustSignal,
} from './types.js';

export interface UpsertResult {
  id: string;
  isNew: boolean;
}

export interface MatchQuery {
  stage1Passed?: boolean;
  limit?: number;
  offset?: number;
  minCombined?: number;
}

/**
 * Storage contract. The local (node:sqlite) and hosted (D1) implementations must
 * both satisfy this, so nothing above the store layer may reference SQLite
 * specifics -- transaction syntax, JSON functions, or PRAGMA.
 */
export interface JobStore {
  migrate(): void;
  close(): void;

  insertProfile(p: Omit<Profile, 'id' | 'createdAt'> & { id?: string }): string;
  getCurrentProfile(): Profile | undefined;
  listProfiles(): Profile[];

  upsertCompany(c: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string;
  getCompanyByDomain(domain: string): Company | undefined;
  patchCompanyReputation(
    id: string,
    patch: { domainRegisteredAt?: string; domainAgeDays?: number; reputationScore?: number; evidenceDelta?: number },
  ): void;

  upsertJob(j: Omit<Job, 'id'> & { id?: string }): UpsertResult;
  recordJobSource(s: JobSource): void;
  getJobSourceIdentity(sourceId: string, sourceJobId: string): { jobId: string } | undefined;

  upsertMatch(m: Omit<Match, 'computedAt'>): void;
  listMatches(profileId: string, q?: MatchQuery): Match[];
  countNewJobsSince(since: string): number;

  insertTrustSignals(signals: TrustSignal[]): void;
  purgeExpiredSignals(now: string): number;

  startRun(r: Partial<Omit<RunMeta, 'id' | 'startedAt' | 'finishedAt'>>): string;
  finishRun(id: string, patch: Partial<Omit<RunMeta, 'id' | 'startedAt'>>): void;

  upsertProvider(p: Omit<ProviderConfig, 'createdAt'>): void;
  listProviders(): ProviderConfig[];
}

const json = (v: unknown): string => JSON.stringify(v ?? null);
const arr = <T>(raw: string | null | undefined): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};
const bool = (v: unknown): boolean => v === 1 || v === true;
const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : (v ?? undefined));

class SqliteJobStore implements JobStore {
  private readonly db: DatabaseSync;

  constructor(location: string) {
    if (location !== ':memory:') mkdirSync(dirname(location), { recursive: true });
    this.db = new DatabaseSync(location);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');
  }

  migrate(): void {
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
    );
    const applied = new Set(
      (this.db.prepare('SELECT id FROM schema_migrations').all() as Array<{ id: string }>).map(
        (r) => r.id,
      ),
    );

    for (const m of MIGRATIONS) {
      if (applied.has(m.id)) continue;
      this.db.exec('BEGIN');
      try {
        this.db.exec(m.up);
        this.db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(
          m.id,
          new Date().toISOString(),
        );
        this.db.exec('COMMIT');
      } catch (err) {
        this.db.exec('ROLLBACK');
        throw new Error(`migration ${m.id} failed: ${(err as Error).message}`, { cause: err });
      }
    }
  }

  close(): void {
    this.db.close();
  }

  // ---- profiles -----------------------------------------------------------

  insertProfile(p: Omit<Profile, 'id' | 'createdAt'> & { id?: string }): string {
    const id = p.id ?? randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO profiles (id, label, full_name, email, phone, location_raw, summary,
           total_years, seniority, role_families, skills, raw_text, file_hash, parse_mode,
           provider_id, model, confidence, is_current, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        p.label,
        opt(p.fullName) ?? null,
        opt(p.email) ?? null,
        opt(p.phone) ?? null,
        opt(p.locationRaw) ?? null,
        opt(p.summary) ?? null,
        opt(p.totalYearsExperience) ?? null,
        p.seniority,
        json(p.roleFamilies),
        json(p.skills),
        opt(p.rawText) ?? null,
        opt(p.fileHash) ?? null,
        p.parseMode,
        opt(p.providerId) ?? null,
        opt(p.model) ?? null,
        opt(p.confidence) ?? null,
        p.isCurrent ? 1 : 0,
        now,
      );
    return id;
  }

  getCurrentProfile(): Profile | undefined {
    const row = this.db
      .prepare('SELECT * FROM profiles WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1')
      .get() as Record<string, unknown> | undefined;
    return row ? mapProfile(row) : undefined;
  }

  listProfiles(): Profile[] {
    const rows = this.db
      .prepare('SELECT * FROM profiles ORDER BY created_at DESC')
      .all() as Array<Record<string, unknown>>;
    return rows.map(mapProfile);
  }

  // ---- companies ----------------------------------------------------------

  upsertCompany(c: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    const now = new Date().toISOString();
    const existing = c.domain
      ? (this.db
          .prepare('SELECT id FROM companies WHERE domain = ?')
          .get(c.domain) as { id: string } | undefined)
      : undefined;

    const id = c.id ?? existing?.id ?? randomUUID();

    if (existing) {
      this.db
        .prepare(
          `UPDATE companies SET name = ?, careers_url = COALESCE(?, careers_url),
             ats_platform = COALESCE(?, ats_platform), ats_token = COALESCE(?, ats_token),
             trust_tier = ?, updated_at = ? WHERE id = ?`,
        )
        .run(c.name, opt(c.careersUrl) ?? null, opt(c.atsPlatform) ?? null, opt(c.atsToken) ?? null, c.trustTier, now, id);
      return id;
    }

    this.db
      .prepare(
        `INSERT INTO companies (id, name, domain, careers_url, ats_platform, ats_token, trust_tier, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        c.name,
        opt(c.domain) ?? null,
        opt(c.careersUrl) ?? null,
        opt(c.atsPlatform) ?? null,
        opt(c.atsToken) ?? null,
        c.trustTier,
        now,
        now,
      );
    return id;
  }

  getCompanyByDomain(domain: string): Company | undefined {
    const row = this.db
      .prepare('SELECT * FROM companies WHERE domain = ?')
      .get(domain) as Record<string, unknown> | undefined;
    return row ? mapCompany(row) : undefined;
  }

  patchCompanyReputation(
    id: string,
    patch: {
      domainRegisteredAt?: string;
      domainAgeDays?: number;
      reputationScore?: number;
      evidenceDelta?: number;
    },
  ): void {
    this.db
      .prepare(
        `UPDATE companies SET
           domain_registered_at = COALESCE(?, domain_registered_at),
           domain_age_days      = COALESCE(?, domain_age_days),
           reputation_score     = COALESCE(?, reputation_score),
           reputation_evidence_count = reputation_evidence_count + ?,
           updated_at           = ?
         WHERE id = ?`,
      )
      .run(
        opt(patch.domainRegisteredAt) ?? null,
        opt(patch.domainAgeDays) ?? null,
        opt(patch.reputationScore) ?? null,
        patch.evidenceDelta ?? 0,
        new Date().toISOString(),
        id,
      );
  }

  // ---- jobs ---------------------------------------------------------------

  upsertJob(j: Omit<Job, 'id'> & { id?: string }): UpsertResult {
    const existing = this.db.prepare('SELECT id FROM jobs WHERE id = ?').get(j.id ?? '') as
      | { id: string }
      | undefined;
    const id = j.id ?? randomUUID();
    const isNew = !existing;

    if (existing) {
      this.db
        .prepare(
          `UPDATE jobs SET title = ?, title_normalized = ?, location_raw = ?, remote = ?,
             country = ?, region = ?, employment_type = ?, seniority = ?, role_family = ?,
             role_family_confidence = ?, is_target_family = ?, classification_method = ?,
             description = ?, skills = ?, salary_min = ?, salary_max = ?, salary_currency = ?,
             salary_raw = ?, apply_url = ?, posted_at = ?, last_seen_at = ?, closed_at = NULL,
             is_active = 1
           WHERE id = ?`,
        )
        .run(
          j.title,
          j.titleNormalized,
          opt(j.locationRaw) ?? null,
          j.remote ? 1 : 0,
          opt(j.country) ?? null,
          opt(j.region) ?? null,
          opt(j.employmentType) ?? null,
          j.seniority,
          j.roleFamily,
          opt(j.roleFamilyConfidence) ?? null,
          j.isTargetFamily ? 1 : 0,
          j.classificationMethod,
          opt(j.description) ?? null,
          json(j.skills),
          opt(j.salaryMin) ?? null,
          opt(j.salaryMax) ?? null,
          opt(j.salaryCurrency) ?? null,
          opt(j.salaryRaw) ?? null,
          j.applyUrl,
          opt(j.postedAt) ?? null,
          j.lastSeenAt,
          id,
        );
    } else {
      this.db
        .prepare(
          `INSERT INTO jobs (id, company_id, title, title_normalized, location_raw, remote,
             country, region, employment_type, seniority, role_family, role_family_confidence,
             is_target_family, classification_method, description, skills, salary_min, salary_max,
             salary_currency, salary_raw, apply_url, posted_at, first_seen_at, last_seen_at, is_active)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          id,
          j.companyId,
          j.title,
          j.titleNormalized,
          opt(j.locationRaw) ?? null,
          j.remote ? 1 : 0,
          opt(j.country) ?? null,
          opt(j.region) ?? null,
          opt(j.employmentType) ?? null,
          j.seniority,
          j.roleFamily,
          opt(j.roleFamilyConfidence) ?? null,
          j.isTargetFamily ? 1 : 0,
          j.classificationMethod,
          opt(j.description) ?? null,
          json(j.skills),
          opt(j.salaryMin) ?? null,
          opt(j.salaryMax) ?? null,
          opt(j.salaryCurrency) ?? null,
          opt(j.salaryRaw) ?? null,
          j.applyUrl,
          opt(j.postedAt) ?? null,
          j.firstSeenAt,
          j.lastSeenAt,
          j.isActive ? 1 : 0,
        );
    }

    return { id, isNew };
  }

  recordJobSource(s: JobSource): void {
    this.db
      .prepare(
        `INSERT INTO job_sources (job_id, source_id, source_job_id, source_url, raw_title,
           raw_company, strategy, robots_checked, attribution_required, attribution_name,
           seen_first_at, seen_last_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT (source_id, source_job_id) DO UPDATE SET
           job_id = excluded.job_id,
           seen_last_at = excluded.seen_last_at`,
      )
      .run(
        s.jobId,
        s.sourceId,
        s.sourceJobId,
        s.sourceUrl,
        opt(s.rawTitle) ?? null,
        opt(s.rawCompany) ?? null,
        s.strategy,
        s.robotsChecked === undefined ? null : s.robotsChecked ? 1 : 0,
        s.attributionRequired ? 1 : 0,
        opt(s.attributionName) ?? null,
        s.seenFirstAt,
        s.seenLastAt,
      );
  }

  getJobSourceIdentity(sourceId: string, sourceJobId: string): { jobId: string } | undefined {
    return this.db
      .prepare('SELECT job_id AS jobId FROM job_sources WHERE source_id = ? AND source_job_id = ?')
      .get(sourceId, sourceJobId) as { jobId: string } | undefined;
  }

  // ---- matches ------------------------------------------------------------

  upsertMatch(m: Omit<Match, 'computedAt'>): void {
    this.db
      .prepare(
        `INSERT INTO matches (profile_id, job_id, stage1_passed, stage1_score, stage1_reasons,
           stage2_score, stage2_verdict, stage2_summary, stage2_strengths, stage2_gaps, stage2_model,
           trust_score, trust_band, trust_reasons, combined_score, llm_calls, tokens_in, tokens_out,
           computed_at, invalidated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT (profile_id, job_id) DO UPDATE SET
           stage1_passed = excluded.stage1_passed,
           stage1_score = excluded.stage1_score,
           stage1_reasons = excluded.stage1_reasons,
           stage2_score = excluded.stage2_score,
           stage2_verdict = excluded.stage2_verdict,
           stage2_summary = excluded.stage2_summary,
           stage2_strengths = excluded.stage2_strengths,
           stage2_gaps = excluded.stage2_gaps,
           stage2_model = excluded.stage2_model,
           trust_score = excluded.trust_score,
           trust_band = excluded.trust_band,
           trust_reasons = excluded.trust_reasons,
           combined_score = excluded.combined_score,
           llm_calls = excluded.llm_calls,
           tokens_in = excluded.tokens_in,
           tokens_out = excluded.tokens_out,
           computed_at = excluded.computed_at,
           invalidated_at = NULL`,
      )
      .run(
        m.profileId,
        m.jobId,
        m.stage1Passed === undefined ? null : m.stage1Passed ? 1 : 0,
        opt(m.stage1Score) ?? null,
        opt(m.stage1Reasons) ?? null,
        opt(m.stage2Score) ?? null,
        opt(m.stage2Verdict) ?? null,
        opt(m.stage2Summary) ?? null,
        opt(m.stage2Strengths) ?? null,
        opt(m.stage2Gaps) ?? null,
        opt(m.stage2Model) ?? null,
        opt(m.trustScore) ?? null,
        opt(m.trustBand) ?? null,
        opt(m.trustReasons) ?? null,
        opt(m.combinedScore) ?? null,
        m.llmCalls,
        opt(m.tokensIn) ?? null,
        opt(m.tokensOut) ?? null,
        new Date().toISOString(),
        null,
      );
  }

  listMatches(profileId: string, q: MatchQuery = {}): Match[] {
    const where = ['profile_id = ?', 'invalidated_at IS NULL'];
    const params: Array<string | number> = [profileId];

    if (q.stage1Passed !== undefined) {
      where.push('stage1_passed = ?');
      params.push(q.stage1Passed ? 1 : 0);
    }
    if (q.minCombined !== undefined) {
      where.push('combined_score >= ?');
      params.push(q.minCombined);
    }

    let sql = `SELECT * FROM matches WHERE ${where.join(' AND ')} ORDER BY combined_score DESC NULLS LAST`;
    if (q.limit !== undefined) sql += ' LIMIT ?';
    if (q.offset !== undefined) sql += ' OFFSET ?';
    if (q.limit !== undefined) params.push(q.limit);
    if (q.offset !== undefined) params.push(q.offset);

    return (this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>).map(mapMatch);
  }

  countNewJobsSince(since: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM jobs WHERE first_seen_at >= ?')
      .get(since) as { n: number };
    return row.n;
  }

  // ---- trust --------------------------------------------------------------

  insertTrustSignals(signals: TrustSignal[]): void {
    const stmt = this.db.prepare(
      `INSERT INTO trust_signals (job_id, company_id, signal_code, severity, weight,
         observed_value, evidence_url, checked_at, expires_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    );
    for (const s of signals) {
      stmt.run(
        opt(s.jobId) ?? null,
        opt(s.companyId) ?? null,
        s.signalCode,
        s.severity,
        s.weight,
        opt(s.observedValue) ?? null,
        opt(s.evidenceUrl) ?? null,
        s.checkedAt,
        opt(s.expiresAt) ?? null,
      );
    }
  }

  purgeExpiredSignals(now: string): number {
    const before = (this.db.prepare('SELECT COUNT(*) AS n FROM trust_signals').get() as { n: number }).n;
    this.db.prepare('DELETE FROM trust_signals WHERE expires_at IS NOT NULL AND expires_at < ?').run(now);
    const after = (this.db.prepare('SELECT COUNT(*) AS n FROM trust_signals').get() as { n: number }).n;
    return before - after;
  }

  // ---- runs ---------------------------------------------------------------

  startRun(r: Partial<Omit<RunMeta, 'id' | 'startedAt' | 'finishedAt'>>): string {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO run_meta (id, profile_id, started_at, sources_ok, sources_failed, jobs_seen)
         VALUES (?,?,?,?,?,?)`,
      )
      .run(
        id,
        opt(r.profileId) ?? null,
        new Date().toISOString(),
        r.sourcesOk ?? 0,
        r.sourcesFailed ?? 0,
        r.jobsSeen ?? 0,
      );
    return id;
  }

  finishRun(id: string, patch: Partial<Omit<RunMeta, 'id' | 'startedAt'>>): void {
    this.db
      .prepare(
        `UPDATE run_meta SET finished_at = ?, sources_ok = ?, sources_failed = ?,
           jobs_seen = ?, jobs_new = ?, jobs_closed = ?, stage1_evaluated = ?,
           stage2_evaluated = ?, llm_calls = ?, tokens_in = ?, tokens_out = ?,
           estimated_cost_usd = ?, warnings = ?
         WHERE id = ?`,
      )
      .run(
        new Date().toISOString(),
        patch.sourcesOk ?? 0,
        patch.sourcesFailed ?? 0,
        patch.jobsSeen ?? 0,
        patch.jobsNew ?? 0,
        patch.jobsClosed ?? 0,
        patch.stage1Evaluated ?? 0,
        patch.stage2Evaluated ?? 0,
        patch.llmCalls ?? 0,
        opt(patch.tokensIn) ?? null,
        opt(patch.tokensOut) ?? null,
        opt(patch.estimatedCostUsd) ?? null,
        opt(patch.warnings) ?? null,
        id,
      );
  }

  // ---- providers ----------------------------------------------------------

  upsertProvider(p: Omit<ProviderConfig, 'createdAt'>): void {
    if (p.isDefault) {
      this.db.prepare('UPDATE provider_config SET is_default = 0 WHERE is_default = 1').run();
    }
    this.db
      .prepare(
        `INSERT INTO provider_config (id, kind, label, base_url, model, api_key, is_default, capabilities, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON CONFLICT (id) DO UPDATE SET
           kind = excluded.kind, label = excluded.label, base_url = excluded.base_url,
           model = excluded.model, api_key = excluded.api_key, is_default = excluded.is_default,
           capabilities = excluded.capabilities`,
      )
      .run(
        p.id,
        p.kind,
        p.label,
        opt(p.baseUrl) ?? null,
        p.model,
        opt(p.apiKey) ?? null,
        p.isDefault ? 1 : 0,
        opt(p.capabilities) ?? null,
        new Date().toISOString(),
      );
  }

  listProviders(): ProviderConfig[] {
    return (
      this.db.prepare('SELECT * FROM provider_config ORDER BY is_default DESC, label').all() as Array<
        Record<string, unknown>
      >
    ).map((r) => ({
      id: r.id as string,
      kind: r.kind as ProviderConfig['kind'],
      label: r.label as string,
      baseUrl: opt(r.base_url as string),
      model: r.model as string,
      apiKey: opt(r.api_key as string),
      isDefault: bool(r.is_default),
      capabilities: opt(r.capabilities as string),
      createdAt: r.created_at as string,
    }));
  }
}

// ---- row mappers ---------------------------------------------------------

function mapProfile(r: Record<string, unknown>): Profile {
  return {
    id: r.id as string,
    label: r.label as string,
    fullName: opt(r.full_name as string),
    email: opt(r.email as string),
    phone: opt(r.phone as string),
    locationRaw: opt(r.location_raw as string),
    summary: opt(r.summary as string),
    totalYearsExperience: opt(r.total_years as number),
    seniority: r.seniority as Profile['seniority'],
    roleFamilies: arr<Profile['roleFamilies'][number]>(r.role_families as string),
    skills: arr<string>(r.skills as string),
    rawText: opt(r.raw_text as string),
    fileHash: opt(r.file_hash as string),
    parseMode: r.parse_mode as Profile['parseMode'],
    providerId: opt(r.provider_id as string),
    model: opt(r.model as string),
    confidence: opt(r.confidence as number),
    isCurrent: bool(r.is_current),
    createdAt: r.created_at as string,
    archivedAt: opt(r.archived_at as string),
  };
}

function mapCompany(r: Record<string, unknown>): Company {
  return {
    id: r.id as string,
    name: r.name as string,
    domain: opt(r.domain as string),
    careersUrl: opt(r.careers_url as string),
    atsPlatform: opt(r.ats_platform as string),
    atsToken: opt(r.ats_token as string),
    domainRegisteredAt: opt(r.domain_registered_at as string),
    domainAgeDays: opt(r.domain_age_days as number),
    rdapCheckedAt: opt(r.rdap_checked_at as string),
    reputationScore: opt(r.reputation_score as number),
    reputationEvidenceCount: (r.reputation_evidence_count as number) ?? 0,
    trustTier: r.trust_tier as Company['trustTier'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapMatch(r: Record<string, unknown>): Match {
  return {
    profileId: r.profile_id as string,
    jobId: r.job_id as string,
    stage1Passed: r.stage1_passed === null ? undefined : bool(r.stage1_passed),
    stage1Score: opt(r.stage1_score as number),
    stage1Reasons: opt(r.stage1_reasons as string),
    stage2Score: opt(r.stage2_score as number),
    stage2Verdict: opt(r.stage2_verdict as string),
    stage2Summary: opt(r.stage2_summary as string),
    stage2Strengths: opt(r.stage2_strengths as string),
    stage2Gaps: opt(r.stage2_gaps as string),
    stage2Model: opt(r.stage2_model as string),
    trustScore: opt(r.trust_score as number),
    trustBand: opt(r.trust_band as Match['trustBand']),
    trustReasons: opt(r.trust_reasons as string),
    combinedScore: opt(r.combined_score as number),
    llmCalls: (r.llm_calls as number) ?? 0,
    tokensIn: opt(r.tokens_in as number),
    tokensOut: opt(r.tokens_out as number),
    computedAt: r.computed_at as string,
    invalidatedAt: opt(r.invalidated_at as string),
  };
}

export function createSqliteStore(location = 'data/jobmate.db'): JobStore {
  const store = new SqliteJobStore(location);
  store.migrate();
  return store;
}
/**
 * Schema is versioned through `schema_migrations`. Each entry runs once, in
 * order, inside a transaction. Never edit an applied migration -- add a new one.
 *
 * Portability note: this DDL targets SQLite (both node:sqlite locally and
 * Cloudflare D1 hosted). The two differ in a few places -- notably D1 has no
 * local filesystem and enforces a 500MB-per-database ceiling on the free plan --
 * so the store abstraction, not the SQL, is what keeps deployments swappable.
 */
export interface Migration {
  id: string;
  up: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: '001_core',
    up: /* sql */ `
      CREATE TABLE profiles (
        id                   TEXT PRIMARY KEY,
        label                TEXT NOT NULL,
        full_name            TEXT,
        email                TEXT,
        phone                TEXT,
        location_raw         TEXT,
        summary              TEXT,
        total_years          REAL,
        seniority            TEXT NOT NULL DEFAULT 'unknown',
        role_families        TEXT NOT NULL DEFAULT '[]',
        skills               TEXT NOT NULL DEFAULT '[]',
        raw_text             TEXT,
        file_hash            TEXT,
        parse_mode           TEXT NOT NULL DEFAULT 'hybrid',
        provider_id          TEXT REFERENCES provider_config(id) ON DELETE SET NULL,
        model                TEXT,
        confidence           REAL,
        is_current           INTEGER NOT NULL DEFAULT 1,
        created_at           TEXT NOT NULL,
        archived_at          TEXT
      );
      CREATE INDEX idx_profiles_current ON profiles(is_current, created_at DESC);
      CREATE INDEX idx_profiles_hash ON profiles(file_hash);

      CREATE TABLE companies (
        id                       TEXT PRIMARY KEY,
        name                     TEXT NOT NULL,
        domain                   TEXT,
        careers_url              TEXT,
        ats_platform             TEXT,
        ats_token                TEXT,
        domain_registered_at     TEXT,
        domain_age_days          INTEGER,
        rdap_checked_at          TEXT,
        reputation_score         REAL,
        reputation_evidence_count INTEGER NOT NULL DEFAULT 0,
        trust_tier               TEXT NOT NULL DEFAULT 'aggregator',
        created_at               TEXT NOT NULL,
        updated_at               TEXT NOT NULL
      );
      CREATE UNIQUE INDEX idx_companies_domain ON companies(domain) WHERE domain IS NOT NULL;

      CREATE TABLE jobs (
        id                        TEXT PRIMARY KEY,
        company_id                TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        title                     TEXT NOT NULL,
        title_normalized          TEXT NOT NULL,
        location_raw              TEXT,
        remote                    INTEGER NOT NULL DEFAULT 0,
        country                   TEXT,
        region                    TEXT,
        employment_type           TEXT,
        seniority                 TEXT NOT NULL DEFAULT 'unknown',
        role_family               TEXT NOT NULL DEFAULT 'unknown',
        role_family_confidence    REAL,
        is_target_family          INTEGER NOT NULL DEFAULT 0,
        classification_method     TEXT,
        description               TEXT,
        skills                    TEXT NOT NULL DEFAULT '[]',
        salary_min                REAL,
        salary_max                REAL,
        salary_currency           TEXT,
        salary_raw                TEXT,
        apply_url                 TEXT NOT NULL,
        posted_at                 TEXT,
        first_seen_at             TEXT NOT NULL,
        last_seen_at              TEXT NOT NULL,
        closed_at                 TEXT,
        is_active                 INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX idx_jobs_company ON jobs(company_id);
      CREATE INDEX idx_jobs_active_seen ON jobs(is_active, first_seen_at DESC);
      CREATE INDEX idx_jobs_family ON jobs(role_family, is_target_family);
      CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);

      -- One real job, many observations. This is how syndication duplicates are
      -- resolved: Greenhouse and an aggregator each get a row here, both point
      -- at the same jobs.id.
      CREATE TABLE job_sources (
        job_id                TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        source_id             TEXT NOT NULL,
        source_job_id         TEXT NOT NULL,
        source_url            TEXT NOT NULL,
        raw_title             TEXT,
        raw_company           TEXT,
        strategy              TEXT NOT NULL DEFAULT 'api',
        robots_checked        INTEGER,
        attribution_required  INTEGER NOT NULL DEFAULT 0,
        attribution_name      TEXT,
        seen_first_at         TEXT NOT NULL,
        seen_last_at          TEXT NOT NULL,
        PRIMARY KEY (source_id, source_job_id)
      );
      CREATE INDEX idx_job_sources_job ON job_sources(job_id);

      CREATE TABLE matches (
        profile_id       TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        job_id           TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        stage1_passed    INTEGER,
        stage1_score     REAL,
        stage1_reasons   TEXT,
        stage2_score     REAL,
        stage2_verdict   TEXT,
        stage2_summary   TEXT,
        stage2_strengths TEXT,
        stage2_gaps      TEXT,
        stage2_model     TEXT,
        trust_score      REAL,
        trust_band       TEXT,
        trust_reasons    TEXT,
        combined_score   REAL,
        llm_calls        INTEGER NOT NULL DEFAULT 0,
        tokens_in        INTEGER,
        tokens_out       INTEGER,
        computed_at      TEXT NOT NULL,
        invalidated_at   TEXT,
        PRIMARY KEY (profile_id, job_id)
      );
      CREATE INDEX idx_matches_rank ON matches(profile_id, combined_score DESC);
      CREATE INDEX idx_matches_stage1 ON matches(profile_id, stage1_passed);

      CREATE TABLE trust_signals (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id          TEXT REFERENCES jobs(id) ON DELETE CASCADE,
        company_id      TEXT REFERENCES companies(id) ON DELETE CASCADE,
        signal_code     TEXT NOT NULL,
        severity        TEXT NOT NULL,
        weight          REAL NOT NULL DEFAULT 1,
        observed_value  TEXT,
        evidence_url    TEXT,
        checked_at      TEXT NOT NULL,
        expires_at      TEXT
      );
      CREATE INDEX idx_signals_job ON trust_signals(job_id);
      CREATE INDEX idx_signals_company ON trust_signals(company_id);
      CREATE INDEX idx_signals_expiry ON trust_signals(expires_at);

      CREATE TABLE run_meta (
        id                TEXT PRIMARY KEY,
        profile_id        TEXT REFERENCES profiles(id) ON DELETE SET NULL,
        started_at        TEXT NOT NULL,
        finished_at       TEXT,
        sources_ok        INTEGER NOT NULL DEFAULT 0,
        sources_failed    INTEGER NOT NULL DEFAULT 0,
        jobs_seen         INTEGER NOT NULL DEFAULT 0,
        jobs_new          INTEGER NOT NULL DEFAULT 0,
        jobs_closed       INTEGER NOT NULL DEFAULT 0,
        stage1_evaluated  INTEGER NOT NULL DEFAULT 0,
        stage2_evaluated  INTEGER NOT NULL DEFAULT 0,
        llm_calls         INTEGER NOT NULL DEFAULT 0,
        tokens_in         INTEGER,
        tokens_out        INTEGER,
        estimated_cost_usd REAL,
        warnings          TEXT
      );
      CREATE INDEX idx_runs_started ON run_meta(started_at DESC);

      CREATE TABLE provider_config (
        id            TEXT PRIMARY KEY,
        kind          TEXT NOT NULL,
        label         TEXT NOT NULL,
        base_url      TEXT,
        model         TEXT NOT NULL,
        api_key       TEXT,
        is_default    INTEGER NOT NULL DEFAULT 0,
        capabilities  TEXT,
        created_at    TEXT NOT NULL
      );
      CREATE UNIQUE INDEX idx_provider_default ON provider_config(is_default) WHERE is_default = 1;
    `,
  },
  {
    id: '002_job_search_index',
    up: /* sql */ `
      -- Normalized-title index used by Stage 1 prefiltering. Deliberately plain
      -- SQL rather than FTS5: FTS5 availability differs across the node:sqlite
      -- build and D1, and Stage 1 must stay portable and dependency-free.
      CREATE INDEX idx_jobs_title_norm ON jobs(title_normalized);
      CREATE INDEX idx_jobs_salary ON jobs(salary_max DESC) WHERE salary_max IS NOT NULL;
    `,
  },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]!.id;
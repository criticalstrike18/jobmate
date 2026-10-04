# Idea and Findings

Compiles every experiment run, result measured, correction made, and the current status of JobMate. Numbers below are measured on live data, not estimated.

## 1. The idea

Job finder driven by the user's resume. Upload resume → structured profile → search jobs by resume keywords → verify each job matches skills → backtrack to the provider to check genuineness → filter fake jobs. IT jobs only for v1 (AI, software, data, web3, infra focus), English postings only, expand later.

Final outcomes wanted:
1. Is the company genuine, and is the job post really posted by that company?
2. If a startup: is it real and funded (social proof, address, name searchable)?
3. Salary: listed pay if present, else a company-specific approximation; plus the general market rate for the role.

## 2. Sources — finalized and tested

### Working (13): all probed live, adapters built

| Source | Jobs/run | Gate | Notes |
|---|---|---|---|
| Greenhouse ×11 boards | ~2,600 | 5/5 PASS | Official keyless API. `first_published` IS on board endpoint (see correction §5) |
| Ashby ×4 boards | ~1,150 | 5/5 PASS | Structured compensation 25/25 |
| Lever ×1 board | ~80 | 5/5 PASS | 1 req/s crawl gate. `workplaceType` field was missed, then fixed (§4) |
| Arbeitnow | ~326 | 5/5 PASS | Keyless, CORS-enabled, `remote` + `visa_sponsorship` flags |
| Remotive | ~16 | 5/5 PASS | Board itself is that small (verified `job-count: 16`, not our bug) |
| Himalayas | ~100 | 5/5 PASS | Cursor pagination, expiry filter, seniority + parentCategories |
| RemoteOK | ~99 | 5/5 PASS | No pagination/search by design; `remoteok-verified` tag kept |
| Jobicy | ~200 | 5/5 PASS | Up to 200/req, salary + level + geo fields |
| HN "Who is hiring" | ~146 | 5/5 PASS | Auto-detected monthly thread, top-level comments only, `community` tier |
| SerpApi `google_jobs` | ~20 | 5/5 PASS | Keyed. Salary 40%, `postedAt` 100% but relative prose. Pagination overlaps → deduped in adapter |
| JSearch (RapidAPI) | ~10 | 5/5 PASS | Keyed. `companyDomain` 80–90%, real timestamps. `job_onet_soc` is 0/10 despite docs |

Full run: **~4,746 unique jobs, 100% with descriptions.** SERP stays disabled in committed config until keys are supplied; missing keys warn, never fail.

### Dead / cut

- JSearch via ApyFlux: 404 on every path (`/v1/search`, `/jsearch/search-v2`, `/openapi.json`) while `/` returns Healthy → key not provisioned for that endpoint, unusable.
- YC Work at a Startup: empty body to plain fetch (bot protection). Needs rendering.
- Breezy: list has no descriptions, posting pages WAF-blocked.
- Workable / Recruitee / Teamtailor: SMB/retail skew, fails IT-only bar.
- We Work Remotely: RSS only, no structured salary/company.
- Bundesagentur (DE): German-only, out per English-only decision.
- USAJOBS: ToS prohibits redistribution.
- India NCS: gig/scam flood, no API.
- LinkedIn / Indeed / Glassdoor / Naukri: ToS prohibits, no public API.
- Google Jobs: no RSS, no API. Third-party "Google Jobs APIs" are SERP scrapers.

### Attribution obligations (encoded as constants, UI must honor)

Remotive, RemoteOK (followed link + mention), Jobicy (direct link + credit), Himalayas (link + name).

## 3. Match-parameter coverage (measured on 4,744 live jobs)

- Description: 100% present, 98.4% rich (≥1,000 chars), 96.2% structured tags (HN: 0% tags).
- Years of experience: **61.9% regex-detectable** (median 6 yrs); rest needs LLM or is unstated.
- Location: 98.4% have a signal; ~40%+ country-identifiable deterministically (city names need gazetteer/LLM).
- Remote: 42.5% flagged remote, but **97% of those are geo-restricted** ("Remote, US") — remote ≠ eligible. User's country filter is the highest-value Stage 1 gate after role family.
- Company name: 100%, zero Unknown. Company domain: 88% populated but **all 8 distinct values are board hosts** (boards.greenhouse.io etc.) — useless for trust checks (see §6).

## 4. Bugs found by measuring

1. **Ashby salary**: 826 salaries sat in `raw` with null min/max though the parser handles the exact strings. Real coverage 20.6%, not 3.2% (and not the 1,035 "with salary" first reported — that counted text-only objects).
2. **Lever remote 0% → 45%**: adapter ignored top-level `workplaceType`; Spotify lists "London" + `workplaceType: remote`. Fixed.
3. **Stage 1 stemmer didn't converge**: `engineering`→`engineer`→`engine` needs two passes. Fixed by iterating to fixed point.
4. **Stage 1 scored absence as mediocre**: unknown family 0.5, unknown seniority 0.6 let "Office Manager at Stripe" pass. Lowered; threshold calibrated to **0.55** on live corpus (689/1,233 target jobs, ~738 Stage 2 calls/mo, fits Groq free tier).
5. **Source vs DB `Job` shapes diverged** (`tags` vs `skills`): added `src/sources/normalize.ts` as the translation layer.
6. **SerpApi pagination overlaps**: deduped by id in adapter; `job_id`s are query-state blobs, useless across queries.

## 5. Corrections to earlier claims

- "Groq has no free vision" — **wrong**. `qwen/qwen3.8-27b` is a documented free vision model (max 3 images/req, 2048 tokens/image).
- "Greenhouse `first_published` is detail-endpoint only" — **wrong**. Present 25/25 on the board endpoint. Freshness problem solved.
- "RDAP age is the fraud signal" — **wrong**. `cursor.com` (1995) is Anysphere's real domain; companies buy old parked domains. Age is weak evidence only.
- "8 guessed board tokens 404" — companies migrate off ATS platforms; config must be re-probed, not assumed.
- Threshold picker first maximized precision (0.70, kept 296/1,233 jobs) — **backwards**; recall wins until budget forces the cut.

## 6. Company verification — tested, ranked

- ATS provenance is structural: a job on a company's own Greenhouse/Lever/Ashby board was posted by that company. Covers 81%, zero cost.
- Board token → employer domain verified 16/16 (dropbox 429, notion/openai 403 are WAF, not wrong domains). But slugs ≠ domains in general (`poolside`, `harvey` don't resolve) — verify per company, don't guess.
- Wikidata org entity: 68/621 (11%). Wikipedia article: 248/621 (40%). Founding year: 49. **385/621 (62%) have neither** — mostly European SMBs. Encyclopedia lookup cannot verify small/new companies. Wikipedia search also returns confidently wrong entities ("Ramp" → surname, "Baseten" → person) without `P31` validation.
- Founding-year data: only **1 company** from 2020–2025 — encyclopedias structurally miss new funded startups.
- RDAP via Verisign direct / rdap.org with user-agent: works, free. `rdap.org` 403s without UA.
- SerpApi web search for social proof: works (Wikipedia + Crunchbase + LinkedIn surface correctly; garbage names return junk = detectable absence).

## 7. Salary research — tested

- Listed: 20.6% after Ashby fix. Self-derived in-corpus bands: **failed** — too sparse, hourly/annual mixed.
- Levels.fyi: 404. h1bdata: 500. No free structured salary API exists.
- SerpApi snippets for `"<company> <role> salary"`: works ($187,803 avg, ranges, submission counts).
- LLM estimate: appropriate for the ~79% gap (genuine knowledge, not inference) — must be labeled `estimate`, never mixed with listed pay.
- Display three tiers, never blurred: listed / company-reported / estimate.

## 8. Startup legitimacy signals — tested

| Signal | Result | Cost |
|---|---|---|
| Own data (roles/company, ATS board, velocity) | Already collected | free |
| YC company page | Server-rendered: batch + founded + website + team + job postings. YC-backed = funded by definition | free, 1 fetch |
| HN Show HN (`tags=show_hn`) | Precise launches with points/dates (Baseten ×2). Generic story search is noisy | free |
| GitHub org via search API | Resolves logins (`modal-labs`, `basetenlabs`); `created_at` + repos + followers. 10 req/min unauth, cache forever | free |
| MX records | All resolve (universal Google Workspace = weak positive; absence = red flag) | free |
| Wikipedia/Wikidata | Positive-only, keep | free |
| Search snippets (Crunchbase/funding) | Shortlists only, never bulk | metered keys |
| crt.sh | 502, unreliable — dropped | — |
| Pure-LLM identity | Fabricates on ambiguous names (`notion.so` vs `notion.com`) — not recommended | — |
| Tranco rank | Untested idea, not a recommendation | — |

Verdict bands: funded-verified → active → thin → unverified. Annotate, don't hide.

## 9. Resume parsing decision

- Ollama default (local, unlimited, private, matches OSS premise). `qwen3-vl:8b` recommended (6.1 GB, 256K ctx); `qwen3-vl:4b` for low RAM.
- **Ollama has no PDF input** (images only; PDF attach is an open feature request) — so we rasterize internally; user always uploads PDF.
- Gemini 3.8 Flash free tier ruled out as default: ToS says Google trains on inputs, human review possible, "do not submit personal information." Kept as BYOK opt-in with onboarding disclosure.
- Groq ruled out for resume parsing per user decision (kept for Stage 2 text scoring consideration).
- Cloudflare Workers AI second fallback (same account as frontend, 10k neurons/day, Meta license `agree` step).
- Stage 2 defaults local; Groq opt-in only (profile is PII-derived).

## 10. Hosting decision

- Cloudflare Workers CAN host the backend on Paid ($5/mo floor — free 10ms CPU can't normalize 4k jobs), but PDF rasterization doesn't fit and Ollama is impossible there.
- **Parse in the browser, send only the structured Profile (~2–5 KB) to the backend.** Solves CPU, memory, cost, and privacy at once. Ollama stays default via `OLLAMA_ORIGINS` scoped to our domain (never `*`).
- Render Free **cannot**: no cron, no workers, ephemeral FS kills SQLite.
- OCI AMD micro (1/8 OCPU, 1 GB, 200 GB disk, $0) is viable with cron, but idle-reclamation threatens batch workloads; 1 GB works only because rasterization moved client-side.
- Cloudflare Browser Run: 10 browser-min/day free, same account — rendering escape hatch.

## 11. Search API decision

- SerpApi: keep key (250/mo) for Google Jobs structured data.
- Alternatives researched, not adopted: Tavily (1,000 credits/mo, no card), Exa (~$10/mo), Serper (2,500 one-time), Brave (card required since Feb 2026).
- No search API needed for verification: Wikidata + Wikipedia + RDAP + MX + HTTPS is the whole keyless stack.

## 12. Current status

- Built: 5 ATS/aggregator adapters + Himalayas + RemoteOK + Jobicy + HN + SerpApi + JSearch adapters; schema + migrations + node:sqlite store; Stage 1 filter (pure, threshold 0.55); probe scripts; `normalize.ts`; `config/sources.yaml` (16 verified boards).
- Verified live: ~4,746 jobs/run, threshold sweep, match-param coverage, company-identity corpus (621 companies), salary parser, RDAP, YC/HN/GitHub/MX mechanics.
- Not built: M3 PDF ingest, M4 parse providers, M6 Stage 2 scoring, M7 trust scoring, M8 API, M9 frontend, M10 auth.
- Schema + storage done via `JobStore` interface (node:sqlite local, D1 later) — nothing above it touches SQLite specifics.
- Non-goals recorded: LinkedIn/Indeed/Glassdoor/Naukri scraping, X ingestion, Workable/Recruitee/Teamtailor, Breezy, Germany, USAJOBS, iCIMS/Workday (no clean endpoints — JSON-LD careers adapter proposed instead).

## 13. Open decisions

1. Aggregator jobs with no matching ATS board: show with "unverified" badge (recommended) or hide with toggle?
2. Estimated salary: show by default marked as estimate, or opt-in per job?
3. SERP budget split: salary research vs trust verification? (Recommendation: salary; trust stays on free RDAP.)
4. Stage 2 default local, Groq opt-in (recommended) — confirm.
5. Tier-2 cross-reference run (~900 aggregator jobs vs keyless ATS, ~10 min) to measure how many promote to verified.

## 14. API keys in chat — rotate all four

SerpApi, JSearch RapidAPI, JSearch OpenWebNinja, JSearch ApyFlux (dead). All pasted in plaintext in this transcript. Treat as compromised. Keys live in env vars only; nothing is committed to the repo.

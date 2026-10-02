# JobMate — Architecture

## Constraints this design works around

| Constraint | Consequence |
|---|---|
| Render free: no workers/cron, ephemeral FS | Pipeline runner is abstracted; v1 runs in-process. No host assumption baked in. |
| Resume = dense PII | Providers with "free prompts train our models" clauses are excluded for resume parsing. |
| No API lists all ATS boards | Company board tokens live in a curated `config/sources.yaml`. |
| Most resumes have a text layer | Vision-only is v1 default (uniform behavior, layout understanding). Text-first hybrid is a config flag, not a rewrite. |
| Free tiers change without notice | Every provider behind an interface; BYOK override supported. |

## Modules

```
src/
  config/      sources.yaml loader, env/BYOK resolution
  sources/     one adapter per provider -> normalized Job
  parse/       resume -> Profile (vision, pluggable provider)
  match/       Stage 1 hard filter, Stage 2 LLM scoring
  trust/       Stage 3 risk scoring (heuristic-first)
  db/          node:sqlite, local file
  server/      local HTTP API
web/           frontend (Cloudflare Pages target)
```

## Pipeline

```
resume -> Profile (skills, roles, years, seniority)
   -> query builder
   -> ATS sources + aggregators
   -> Stage 1  cheap hard filter (requirements, location, seniority)
   -> Stage 2  LLM match score + why/why-not, only for survivors
   -> Stage 3  trust score (heuristic-first, LLM only on ambiguous band)
   -> ranked explainable list
```

## Cost control

ATS-sourced jobs come from the company's own board and are effectively
pre-verified. Scam density concentrates in aggregator/resume-scraper listings,
so Stage 3 is heuristic-first and invokes the LLM only in the ambiguous band.

## Non-goals

- Scraping LinkedIn / Indeed / Glassdoor (ToS + legal exposure)
- X/Twitter ingestion (no official read API, ToS prohibits automated collection)
- Background workers on free-tier hosts (v1 runs in-process)
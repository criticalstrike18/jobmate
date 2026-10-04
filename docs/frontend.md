# JobMate — Frontend Flow & User Experience Specification

## 1. Vision & Architecture Fit

This document specifies the end-to-end frontend user journey, data boundaries, and AI router architecture for JobMate v1.

JobMate connects:
1. **User Identity & Portfolio**: Google/GitHub OAuth, GitHub repo integration for automated project context.
2. **BYOK (Bring Your Own Key) Multi-Model AI Router**: 
   - **Vision Engine**: Gemini API key (or custom multimodal endpoint) for client-side / isolated resume PDF extraction.
   - **Text & Reasoning Engine**: Groq, Gemini, or any OpenAI-compatible endpoint (OpenAI, Ollama, DeepSeek, Together, vLLM) for Stage 2 semantic fit scoring, rationale generation, and tailored resume customization.
3. **Verified Job Feed**: Stage 1 deterministic pass + Stage 2 LLM scores + Stage 3 trust and provenance badges.
4. **Tailored Application Deliverables**: Job redirect link + targeted project framing + downloadable tailored PDF resume.

---

## 2. End-to-End User Flow

```
[ Landing Page ]
       │
       ▼
[ Auth: Google or GitHub OAuth ]
       │
       ▼
[ Onboarding / Key Setup: AI Router Configuration ]
  ├─ Vision Key: Gemini API Key (or custom multimodal URL + Key)
  └─ Text/Reasoning Key: Groq / Gemini / OpenAI-compatible endpoint
       │
       ▼
[ App Shell / Dashboard ]
  ├── [ Left Sidebar ]
  │     ├── Feed / Matches (Active job search & discovery)
  │     ├── Profile & Portfolio (Resume, skills, linked GitHub projects)
  │     └── Settings (AI Router keys, search preferences, blacklist)
  │
  ├── [ View 1: Profile & Project Hub ]
  │     ├── Base Resume Upload (PDF) ──► Vision Parser (Gemini) ──► Profile JSON
  │     ├── GitHub Connection (OAuth token) ──► Repo Picker
  │     └── Project Cards (Auto-extracted READMEs, commits, tech stack, custom notes)
  │
  └── [ View 2: Verified Job Feed & Matching ]
        ├── Stage 1 Pre-filtered jobs (Location, seniority, salary floor)
        ├── Stage 2 Semantic Fit breakdown ("Why you fit", "Skill gaps")
        ├── Stage 3 Trust Badges (ATS Verified, YC Backed, GitHub Signal, Unverified Aggregator)
        └── Actions per Job Card:
              ├── "Apply" ──► Direct external redirect link to official job posting
              └── "Generate Tailored Resume" ──► Triggers Text LLM:
                    • Pulls relevant GitHub project descriptions
                    • Emphasizes matching tech stack
                    • Generates preview
                    └── "Download PDF" button (renders clean print-ready PDF)
```

---

## 3. Screen-by-Screen Breakdown

### Screen 1: Authentication & Onboarding
- **Providers**: Google OAuth 2.0 & GitHub OAuth 2.0.
- **Data captured**: Minimal user profile (email, user ID).
- **GitHub Scope**: `read:user`, `repo` (optional permission requested if user wants to import private repos; public repos require zero or minimal public scope).

### Screen 2: AI Router & Key Management (BYOK)
JobMate operates as a client-coordinated or zero-retention AI router. Keys are stored encrypted in the browser's `localStorage`/`IndexedDB` (or ephemeral session state).

- **Slot A: Vision Model (Mandatory for Resume Ingestion)**
  - Default: **Google Gemini** (`gemini-1.5-flash` / `gemini-2.0-flash` / `gemini-2.5` series).
  - Alternative: Custom OpenAI-compatible Vision Endpoint (e.g. Local Ollama `qwen2.5-vl` / `qwen3-vl`, vLLM).
  - Validation: Quick ping probe verifying key validity and model availability before proceeding.
- **Slot B: Text & Reasoning Model (Stage 2 Matching + Resume Tailoring)**
  - Options:
    - *Reuse Vision Key* (Gemini Flash).
    - *Groq* (for sub-second, high-throughput Llama 3.3 / Qwen inferences).
    - *Custom OpenAI Compatible* (Base URL + API Key + Model Name: works with OpenAI, DeepSeek, Together AI, Ollama local server).
- **Router Configuration Controls**:
  - Test Connection button with visual latency report (e.g., `Gemini: 240ms OK`, `Groq: 85ms OK`).
  - Fallback sequence if primary text model hits rate limits (429).

### Screen 3: Profile & Portfolio Management (The Anchor)
This view establishes the user's ground-truth capability graph.

1. **Master Resume Parser**:
   - Drag-and-drop PDF dropzone.
   - Processed via Gemini Vision: extracts canonical skills, work history, education, and current seniority level.
   - Editable fields: User can review and adjust any misinterpreted fields.
2. **GitHub Project Sync**:
   - One-click GitHub repo selector.
   - Fetches repository metadata: primary language, repository topics, star count, and `README.md` contents.
   - For private repos: uses authenticated user token; never leaks code, only extracts architectural summaries and project intent.
   - **Project Knowledge Base**: Automatically derives project summaries:
     - What problem does it solve?
     - Architecture & tech stack used.
     - Key engineering decisions and outcomes.
   - User override: Can add manual bullet points or tags.

### Screen 4: Job Feed & Match Evaluation
- **Filter Bar**: Target role family, remote/country filter, minimum compensation threshold.
- **Job Card Highlights**:
  - **Trust Status**: ATS Direct (Greenhouse, Lever, Ashby), YC Backed, Startup Social Proof, or Unverified Aggregator.
  - **Match Score & Explanation**:
    - Match score percentage (Stage 2 calibrated).
    - Bulleted rationale: *Why it fits your profile* vs. *Gaps to be aware of*.
  - **Compensation Tag**: Marked clearly as `Listed`, `Company-Reported`, or `Estimated`.
- **Card Action Buttons**:
  - `Apply Now`: Direct tracked redirect to official posting URL.
  - `Tailor Resume`: Slides open the Resume Tailor Drawer.

### Screen 5: Tailored Resume & PDF Export
- **Mechanism**:
  - Sends target Job Description + User Base Profile + Linked GitHub Projects to the configured Text LLM.
  - LLM dynamically selects the **1–3 most relevant projects** and writes tailored accomplishment bullets addressing the job's core challenges without hallucinating skills not present in the master profile.
- **Live Preview Drawer**:
  - Side-by-side or modal preview showing:
    - Original vs. Tailored project descriptions.
    - Targeted summary statement.
  - Formatted in clean, standard, ATS-compliant single-column layout (no tables, no columns, high parseability).
- **Download Action**:
  - `Download PDF`: Client-side rendering (e.g., via `@react-pdf/renderer` or HTML-to-print CSS canvas) ensuring instantaneous, vector-sharp PDF generation.

---

## 4. Architectural & Security Principles

1. **Zero Key Retention on Central Server**:
   - User API keys (Gemini, Groq, OpenAI) and GitHub PATs reside strictly in the client app.
   - Requests to AI providers are made either directly from the browser (CORS permitting) or through a stateless reverse-proxy that forwards `Authorization: Bearer <user_key>` without logging.
2. **Anti-Hallucination Guardrails**:
   - The tailored resume generator prompt operates under strict zero-shot constraints:
     - *Only reference projects, tools, and timelines present in the user's linked GitHub and master profile.*
     - *Tailor emphasis, terminology, and problem framing—never invent unverified tools or metrics.*
3. **Graceful Degradation**:
   - If user provides only a Gemini key: both Vision and Text use Gemini.
   - If user doesn't link GitHub: user can paste manual project bullets.
   - If LLM rate limit is hit: falls back to raw master resume export with a clear UI notice.

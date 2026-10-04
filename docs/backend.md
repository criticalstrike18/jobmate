# JobMate — Backend Architecture & Service Specification

## 1. Executive Summary & Architecture Overview

The JobMate backend is a lightweight, high-throughput TypeScript/Node.js service backed by SQLite (WAL mode) and native Go binaries for AST repository ingestion. 

It fulfills five core responsibilities:
1. **Firebase Authentication & Identity Verification**: Zero-maintenance OAuth offloading for Google, GitHub, and GitLab.
2. **Stateless BYOK AI Router**: Zero-retention proxy forwarding multimodal PDF parsing and text generation requests to user-provided keys (Gemini, Groq, OpenAI).
3. **Repository AST Ingestion Engine**: Native Go pipeline extracting architectural signatures and manifests from linked GitHub/GitLab repositories.
4. **Verified Job Collection & Deterministic Matching**: Multi-source crawlers (direct ATS + aggregators) and Stage 1 deterministic filtering.
5. **Tailored Resume Generator**: Dynamic resume adaptation synthesizing job requirements with candidate codebase proofs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Browser (Next.js)                        │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │                           │                            │
        │ Firebase ID Token         │ User BYOK Keys             │ Provider OAuth Token
        ▼                           ▼                            ▼
┌──────────────────┐       ┌──────────────────┐        ┌──────────────────┐
│   Auth Gateway   │       │ Stateless Router │        │ Git Sync Service │
│ (Firebase Admin) │       │ (Gemini/Groq/OAI)│        │ (GitHub/GitLab)  │
└─────────┬────────┘       └────────┬─────────┘        └─────────┬────────┘
          │                         │                            │
          ▼                         ▼                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          JobMate Backend Core                          │
│                                                                        │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │   Stage 1 Matcher     │                  │  Go Ingest Pipeline   │  │
│  │ (Deterministic, 0-tok)│                  │ (AST Signatures/Tree) │  │
│  └──────────┬────────────┘                  └───────────┬───────────┘  │
│             │                                           │              │
│             ▼                                           ▼              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              SQLite Database (WAL Mode, Better-SQLite3)           │  │
│  │    Jobs │ Companies │ Profiles │ RepoDigests │ Matches           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication: Firebase Auth & OAuth Provider Linking

### 2.1 Why Firebase Auth Eliminates OAuth Overhead
Building custom OAuth 2.0 flows for multiple providers requires managing state parameters, secret exchanges, PKCE challenges, refresh token rotations, and callback endpoints.

Firebase Authentication handles the entire handshake:
* **Google Sign-In**: Native 1-click authentication.
* **GitHub Sign-In & Linking**: Native provider with configurable repository scopes (`repo`, `read:user`).
* **GitLab Sign-In & Linking**: Generic OAuth provider (`OAuthProvider('gitlab.com')` or OIDC) supported directly in Firebase Auth.
* **Account Linking**: Allows a user who logged in via Google to link their GitHub or GitLab accounts to the same `uid`.

### 2.2 Token Flow: Authentication vs. Repository Access
Two distinct tokens exist in this architecture:

| Token | Issued By | Scope & Purpose | Where It Is Handled |
| :--- | :--- | :--- | :--- |
| **Firebase ID Token (JWT)** | Firebase Auth | User authentication & session identity on the JobMate backend (`Bearer <id_token>`). Verified via `firebase-admin` or public keys. | Sent in `Authorization` header on every API call. |
| **Git Provider Access Token** | GitHub / GitLab | API access to fetch candidate repositories, tree structures, and private code manifests. | Returned on client in `UserCredential.credential.accessToken` during Firebase sign-in. Sent to the backend's repo sync endpoint. |

### 2.3 Frontend Firebase Provider Linking Pattern
```typescript
// Client-side authentication example
import { getAuth, signInWithPopup, GithubAuthProvider, OAuthProvider } from 'firebase/auth';

const auth = getAuth();

// 1. Authenticate with GitHub
const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('repo'); // Optional: for private repos

const result = await signInWithPopup(auth, githubProvider);
const credential = GithubAuthProvider.credentialFromResult(result);
const gitHubAccessToken = credential?.accessToken; // Forwarded to JobMate backend to pull repos

// 2. Authenticate or Link GitLab
const gitlabProvider = new OAuthProvider('gitlab.com');
gitlabProvider.addScope('read_api');
gitlabProvider.addScope('read_repository');

const gitlabResult = await signInWithPopup(auth, gitlabProvider);
const gitlabCredential = OAuthProvider.credentialFromResult(gitlabResult);
const gitLabAccessToken = gitlabCredential?.accessToken;
```

### 2.4 Backend Firebase ID Token Verification Middleware
```typescript
// src/server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
  }
}
```

---

## 3. Resume PDF Processing Pipeline (Multimodal Vision)

### 3.1 Flow & Rationale
Traditional text-based PDF extractors (`pdf-parse`, `pdfjs`) frequently corrupt multi-column layouts, lose section hierarchies, and garble dates. We utilize Gemini Multimodal Vision (or custom vision endpoints) with candidate-supplied keys for high-fidelity extraction.

```
User PDF Upload (Client Dropzone)
               │
               ▼
   Multipart/Buffer to Backend
   `POST /api/resume/parse`
   Header: `x-gemini-key: <KEY>`
               │
               ▼
   Stateless Gemini 2.0 / 1.5 Flash Vision Call
   (Zero server retention of raw PDF)
               │
               ▼
   Structured JSON Extraction Schema:
   - Full Name, Email, Phone, Location
   - Canonical Skills List
   - Work Experience (Company, Role, Dates, Accomplishments)
   - Education & Certifications
   - Current Seniority & Target Role Families
               │
               ▼
   Stored in SQLite `profiles` table
```

### 3.2 Parsing Endpoint Contract
* **Route**: `POST /api/resume/parse`
* **Headers**:
  * `Authorization: Bearer <firebase_id_token>`
  * `x-gemini-key: <user_gemini_api_key>`
* **Body**: `multipart/form-data` with `file: <resume.pdf>`
* **Response**:
```json
{
  "profileId": "prof_01h8x...",
  "fullName": "Jane Doe",
  "seniority": "senior",
  "roleFamilies": ["software-engineering"],
  "skills": ["Rust", "Kotlin", "DirectShow", "WebSockets", "RTSP"],
  "workHistory": [
    {
      "company": "Acme Systems",
      "role": "Senior Systems Engineer",
      "period": "2023 - Present",
      "bullets": ["Engineered low-latency video pipelines..."]
    }
  ],
  "confidence": 0.96
}
```

---

## 4. GitHub & GitLab Repository Ingestion Service

### 4.1 Automated Codebase Ingestion
When a user connects a repository:
1. The backend uses the provider access token (GitHub PAT or GitLab Token) to clone or fetch the repository contents.
2. The native Go Ingestion binary (`scripts/ingester/main.go`) executes against the directory:
   - Filters out non-code assets (images, binaries, build outputs, `.git`, `node_modules`).
   - Extracts directory structure and dependency manifests (`Cargo.toml`, `build.gradle.kts`, `package.json`, `go.mod`).
   - Parses AST signatures (function signatures, structs, traits, interfaces, classes) across Rust, Go, Kotlin, TypeScript, Python, and C++.
3. Compresses the raw codebase (e.g. 15,000 LOC) into a high-density, ~5,000-token digest.
4. Stores the digest in SQLite (`repo_digests`) linked to the user's profile.

### 4.2 Sync Endpoint Contract
* **Route**: `POST /api/portfolio/sync-repo`
* **Headers**: `Authorization: Bearer <firebase_id_token>`
* **Payload**:
```json
{
  "provider": "github", // or "gitlab"
  "accessToken": "ghp_xxxxxxxxxxxx",
  "repoUrl": "https://github.com/candidate/Android-cam",
  "isPrivate": false
}
```
* **Response**:
```json
{
  "repoId": "repo_9921",
  "name": "Android-cam",
  "filesScanned": 54,
  "linesOfCode": 11649,
  "digestTokens": 5407,
  "keyTechnologies": ["Rust", "Kotlin", "Win32", "Camera2", "RTSP", "Direct3D11"],
  "status": "ready"
}
```

---

## 5. Tailored Resume Generation Endpoint

### 5.1 The Anti-Hallucination Tailoring Algorithm
The tailoring engine synthesizes three distinct inputs without ever inventing credentials:
1. **Target Job Requirements**: Scraped requirements, required tech stack, and responsibilities.
2. **Candidate Master Profile**: Real career history, education, and dates from the base resume.
3. **Repository AST Digests**: Concrete codebase proofs, actual structs, functions, and architecture decisions from linked repositories.

### 5.2 Tailor Endpoint Contract
* **Route**: `POST /api/resume/tailor`
* **Headers**:
  * `Authorization: Bearer <firebase_id_token>`
  * `x-text-provider`: `groq` | `gemini` | `openai`
  * `x-text-key`: `<user_api_key>`
  * `x-text-base-url`: `<custom_url>` (Optional, for Ollama/vLLM/OpenAI-compatible)
* **Payload**:
```json
{
  "jobId": "job_greenhouse_91283",
  "profileId": "prof_01h8x",
  "selectedRepoIds": ["repo_9921"]
}
```
* **Response**:
```json
{
  "jobId": "job_greenhouse_91283",
  "tailoredSummary": "Staff Systems Engineer with deep expertise in low-latency video streaming, Rust systems programming, and cross-platform hardware acceleration...",
  "tailoredProjects": [
    {
      "name": "AWA (Android Wireless Adapter)",
      "headline": "High-Performance Cross-Platform Virtual Camera Pipeline",
      "techStack": ["Rust", "Kotlin", "Windows Media Foundation", "Direct3D11", "RTSP/RTP"],
      "bullets": [
        "Architected a cross-platform, low-latency 4K video pipeline bridging Android Camera2 internals with a high-performance Rust desktop client, achieving sub-second glass-to-glass latency.",
        "Engineered a hardware-accelerated decoding engine utilizing Windows Media Foundation and Direct3D11, implementing zero-copy memory transfers and NV12 color space conversion to eliminate CPU bottlenecks.",
        "Developed a custom RTP depacketizer in Rust to handle complex H.264/H.265 NALU reassembly with robust sequence wraparound logic and socket buffer optimizations."
      ]
    }
  ],
  "interviewDefenseNotes": [
    "Bitstream conversion from Annex-B to AVCC format in src/stream/mf.rs",
    "Lossless NALU depacketization and STAP-A fragmentation handling in src/stream/rtsp_client.rs"
  ],
  "generatedAt": "2026-10-04T01:45:00Z"
}
```

---

## 6. Complete REST API Surface

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/sync-user` | Firebase JWT | Registers or updates user in SQLite based on Firebase identity |
| `POST` | `/api/ai/test-key` | Optional | Probes user's Gemini/Groq/OpenAI key with a 1-token ping to return latency |
| `POST` | `/api/resume/parse` | Firebase JWT + BYOK Vision Key | Parses uploaded resume PDF into canonical Profile JSON |
| `GET` | `/api/profile` | Firebase JWT | Retrieves the current user's profile and linked projects |
| `POST` | `/api/portfolio/sync-repo` | Firebase JWT + Git PAT | Clones/fetches repo, runs Go ingester, and saves AST digest |
| `GET` | `/api/jobs/feed` | Optional / Firebase JWT | Returns Stage 1 verified jobs matching user filters (salary, remote, role) |
| `POST` | `/api/jobs/:id/score` | Firebase JWT + BYOK Text Key | Runs Stage 2 LLM semantic fit analysis with match score & rationale |
| `POST` | `/api/resume/tailor` | Firebase JWT + BYOK Text Key | Generates targeted resume project bullets and executive summary |

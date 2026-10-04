export type Seniority =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal'
  | 'lead'
  | 'director'
  | 'unknown';

export type RoleFamily =
  | 'software-engineering'
  | 'data-ml'
  | 'infrastructure-devops'
  | 'security'
  | 'qa-test'
  | 'it-operations'
  | 'design'
  | 'management'
  | 'non-it'
  | 'unknown';

export type TrustTier = 'ats-official' | 'aggregator' | 'rss' | 'serp' | 'community' | 'careers-page';

export type ClassificationMethod = 'taxonomy' | 'inferred' | 'manual' | null;

export type FetchStrategy = 'api' | 'rss' | 'html-jsonld' | 'rendered';

export type ParseMode = 'vision' | 'hybrid' | 'text';

export type ProviderKind = 'ollama' | 'gemini' | 'openai-compatible' | 'groq' | 'cloudflare-ai';

export interface Profile {
  id: string;
  label: string;
  fullName?: string;
  email?: string;
  phone?: string;
  locationRaw?: string;
  summary?: string;
  totalYearsExperience?: number;
  seniority: Seniority;
  roleFamilies: RoleFamily[];
  skills: string[];
  rawText?: string;
  fileHash?: string;
  parseMode: ParseMode;
  providerId?: string;
  model?: string;
  confidence?: number;
  isCurrent: boolean;
  createdAt: string;
  archivedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  careersUrl?: string;
  atsPlatform?: string;
  atsToken?: string;
  domainRegisteredAt?: string;
  domainAgeDays?: number;
  rdapCheckedAt?: string;
  reputationScore?: number;
  reputationEvidenceCount?: number;
  trustTier: TrustTier;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  titleNormalized: string;
  locationRaw?: string;
  remote: boolean;
  country?: string;
  region?: string;
  employmentType?: string;
  seniority: Seniority;
  roleFamily: RoleFamily;
  roleFamilyConfidence?: number;
  isTargetFamily: boolean;
  classificationMethod: ClassificationMethod;
  description?: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryRaw?: string;
  applyUrl: string;
  postedAt?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  closedAt?: string;
  isActive: boolean;
}

export interface JobSource {
  jobId: string;
  sourceId: string;
  sourceJobId: string;
  sourceUrl: string;
  rawTitle?: string;
  rawCompany?: string;
  strategy: FetchStrategy;
  robotsChecked?: boolean;
  attributionRequired: boolean;
  attributionName?: string;
  seenFirstAt: string;
  seenLastAt: string;
}

export interface Match {
  profileId: string;
  jobId: string;
  stage1Passed?: boolean;
  stage1Score?: number;
  stage1Reasons?: string;
  stage2Score?: number;
  stage2Verdict?: string;
  stage2Summary?: string;
  stage2Strengths?: string;
  stage2Gaps?: string;
  stage2Model?: string;
  trustScore?: number;
  trustBand?: 'safe' | 'caution' | 'danger';
  trustReasons?: string;
  combinedScore?: number;
  llmCalls: number;
  tokensIn?: number;
  tokensOut?: number;
  computedAt: string;
  invalidatedAt?: string;
}

export interface TrustSignal {
  jobId?: string;
  companyId?: string;
  signalCode: string;
  severity: 'info' | 'warn' | 'critical';
  weight: number;
  observedValue?: string;
  evidenceUrl?: string;
  checkedAt: string;
  expiresAt?: string;
}

export interface RunMeta {
  id: string;
  profileId?: string;
  startedAt: string;
  finishedAt?: string;
  sourcesOk: number;
  sourcesFailed: number;
  jobsSeen: number;
  jobsNew: number;
  jobsClosed: number;
  stage1Evaluated: number;
  stage2Evaluated: number;
  llmCalls: number;
  tokensIn?: number;
  tokensOut?: number;
  estimatedCostUsd?: number;
  warnings?: string;
}

export interface ProviderConfig {
  id: string;
  kind: ProviderKind;
  label: string;
  baseUrl?: string;
  model: string;
  apiKey?: string;
  isDefault: boolean;
  capabilities?: string;
  createdAt: string;
}
import { boardDomain, boardHost, type ResolvedBoard } from './config.js';
import { describeError, fetchJson, stripHtml } from './http.js';
import { parseSalary } from './salary.js';
import { emptyResult, nowIso, type Job } from './types.js';

interface GreenhouseJob {
  id: number;
  internal_job_id?: number;
  title: string;
  updated_at?: string;
  absolute_url: string;
  location?: { name?: string };
  content?: string;
  departments?: Array<{ name?: string }>;
  metadata?: Array<{ name?: string; value?: unknown }> | null;
}

interface GreenhouseResponse {
  jobs?: GreenhouseJob[];
  meta?: { total?: number };
}

function metadataSalary(job: GreenhouseJob): string | undefined {
  for (const field of job.metadata ?? []) {
    const name = field.name?.toLowerCase() ?? '';
    if (name.includes('salary') || name.includes('compensation') || name.includes('pay')) {
      if (typeof field.value === 'string' && field.value.trim()) return field.value;
    }
  }
  return undefined;
}

function isRemote(job: GreenhouseJob): boolean {
  const location = job.location?.name?.toLowerCase() ?? '';
  return location.includes('remote') || location.includes('anywhere');
}

export async function fetchGreenhouse(board: ResolvedBoard): Promise<Job[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs?content=true`;
  const data = await fetchJson<GreenhouseResponse>(url);
  const seenAt = nowIso();
  const jobs: Job[] = [];

  for (const raw of data.jobs ?? []) {
    const location = raw.location?.name?.trim();

    jobs.push({
      id: `${board.id}:${raw.id}`,
      source: board.id,
      sourceUrl: raw.absolute_url,
      title: raw.title.trim(),
      company: board.label,
      companyDomain: boardDomain(board),
      location,
      remote: isRemote(raw),
      description: raw.content ? stripHtml(raw.content) : undefined,
      tags: (raw.departments ?? []).flatMap((d) => (d.name ? [d.name] : [])),
      salary: parseSalary(metadataSalary(raw)),
      postedAt: raw.updated_at,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      trustTier: 'ats-official',
    });
  }

  return jobs;
}

export function greenhouseWarning(board: ResolvedBoard, err: unknown): string {
  return `greenhouse ${board.token} (${boardHost(board)}): ${describeError(err)}`;
}

export { emptyResult };
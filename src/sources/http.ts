export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_RETRIES = 2;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function fetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
  const retries = opts.retries ?? DEFAULT_RETRIES;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'user-agent': 'jobmate/0.1 (+https://github.com/criticalstrike18/jobmate)',
          accept: 'application/json',
          ...opts.headers,
        },
      });

      if (!res.ok) {
        throw new HttpError(res.status, url, `HTTP ${res.status} ${res.statusText}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err;

      const retryable =
        !(err instanceof HttpError) ||
        err.status === 429 ||
        err.status >= 500;

      if (!retryable || attempt === retries) break;

      const backoff = 500 * 2 ** attempt;
      await new Promise((r) => setTimeout(r, backoff));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

export function describeError(err: unknown): string {
  if (err instanceof HttpError) return `${err.status} ${new URL(err.url).host}`;
  if (err instanceof Error) return err.name === 'AbortError' ? 'timeout' : err.message;
  return String(err);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
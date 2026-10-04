export {};

const UA = { 'user-agent': 'jobmate/0.1 (+https://github.com/criticalstrike18/jobmate)', accept: 'application/json' };

async function show(name: string, url: string, init?: RequestInit): Promise<void> {
  try {
    const res = await fetch(url, { headers: { ...UA, ...(init?.headers ?? {}) } });
    const text = await res.text();
    console.log(`\n=== ${name} ===`);
    console.log(`status ${res.status} len ${text.length}`);
    if (!res.ok) {
      console.log(text.slice(0, 400));
      return;
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      console.log(`non-JSON, first 300: ${text.slice(0, 300)}`);
      return;
    }
    if (Array.isArray(body)) {
      console.log(`array len ${body.length}`);
      const first = body[0] as Record<string, unknown> | undefined;
      const second = body[1] as Record<string, unknown> | undefined;
      console.log(`first keys: ${first && typeof first === 'object' ? Object.keys(first).join(', ') : typeof first}`);
      console.log(`second keys: ${second && typeof second === 'object' ? Object.keys(second).join(', ') : typeof second}`);
      console.log(`first sample: ${JSON.stringify(second ?? first).slice(0, 1500)}`);
    } else if (body && typeof body === 'object') {
      const rec = body as Record<string, unknown>;
      console.log(`object keys: ${Object.keys(rec).join(', ')}`);
      for (const [k, v] of Object.entries(rec)) {
        if (Array.isArray(v)) {
          console.log(`  ${k}: array len ${v.length}; first keys: ${v[0] && typeof v[0] === 'object' ? Object.keys(v[0] as object).join(', ') : typeof v[0]}`);
          if (v[0] && typeof v[0] === 'object') console.log(`  ${k}[0]: ${JSON.stringify(v[0]).slice(0, 1500)}`);
        } else if (v && typeof v === 'object') {
          console.log(`  ${k}: object keys ${Object.keys(v as object).join(', ')}`);
        } else {
          console.log(`  ${k}: ${JSON.stringify(v)?.slice(0, 200)}`);
        }
      }
    } else {
      console.log(`scalar: ${String(body).slice(0, 300)}`);
    }
  } catch (err) {
    console.log(`\n=== ${name} === THREW ${(err as Error).message}`);
  }
}

await show('himalayas-browse', 'https://himalayas.app/jobs/api');
await show('remoteok', 'https://remoteok.com/api', { headers: { 'user-agent': 'Mozilla/5.0 (jobmate probe)' } });

function coverage(rows: unknown[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    for (const [k, v] of Object.entries(r as Record<string, unknown>)) {
      const present =
        v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
      if (present) c[k] = (c[k] ?? 0) + 1;
    }
  }
  return c;
}

{
  const h = (await fetch('https://himalayas.app/jobs/api?limit=50', { headers: UA }).then((r) => r.json())) as {
    jobs: Array<Record<string, unknown>>;
    totalCount: number;
  };
  console.log(`\n=== himalayas coverage n=${h.jobs.length} totalCount=${h.totalCount} ===`);
  for (const [k, n] of Object.entries(coverage(h.jobs)).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(22)} ${String(n).padStart(4)}/${h.jobs.length}`);
  }
  const s = h.jobs.find((j) => j.minSalary != null) ?? h.jobs[0]!;
  console.log(`salary sample: ${JSON.stringify({ t: s.title, min: s.minSalary, max: s.maxSalary, cur: s.currency, period: s.salaryPeriod })}`);
  console.log(`pub sample: ${JSON.stringify({ pub: s.pubDate, exp: s.expiryDate, app: s.applicationLink, guid: s.guid })}`);
}

{
  const r = (await fetch('https://remoteok.com/api', {
    headers: { 'user-agent': 'Mozilla/5.0 (jobmate probe)' },
  }).then((r) => r.json())) as Array<Record<string, unknown>>;
  console.log(`\n=== remoteok coverage n=${r.length - 1} ===`);
  console.log(`legal: ${JSON.stringify(r[0]).slice(0, 400)}`);
  for (const [k, n] of Object.entries(coverage(r.slice(1))).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(16)} ${String(n).padStart(4)}/${r.length - 1}`);
  }
}

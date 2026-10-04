export {};

const UA = { 'user-agent': 'jobmate/0.1 (source survey)', accept: 'application/json' };

async function probe(name: string, url: string, init?: RequestInit): Promise<void> {
  try {
    const res = await fetch(url, { headers: { ...UA, ...(init?.headers ?? {}) } });
    const text = await res.text();
    console.log(`\n=== ${name} ===`);
    console.log(`status ${res.status} len ${text.length} ct=${res.headers.get('content-type')}`);
    if (!res.ok) {
      console.log(text.slice(0, 300));
      return;
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      console.log(`non-JSON. first 400:\n${text.slice(0, 400)}`);
      return;
    }
    if (Array.isArray(body)) {
      console.log(`array len ${body.length}`);
      const job = body.find((x) => x && typeof x === 'object' && (x as Record<string, unknown>).title)
        ?? body[0];
      console.log(`keys: ${job && typeof job === 'object' ? Object.keys(job as object).join(', ') : typeof job}`);
      console.log(`sample: ${JSON.stringify(job).slice(0, 900)}`);
    } else if (body && typeof body === 'object') {
      const rec = body as Record<string, unknown>;
      console.log(`object keys: ${Object.keys(rec).join(', ')}`);
      for (const [k, v] of Object.entries(rec)) {
        if (Array.isArray(v)) {
          console.log(`  ${k}: array len ${v.length}; first keys: ${v[0] && typeof v[0] === 'object' ? Object.keys(v[0] as object).join(', ') : typeof v[0]}`);
          if (v[0] && typeof v[0] === 'object') console.log(`  ${k}[0]: ${JSON.stringify(v[0]).slice(0, 900)}`);
        } else if (v && typeof v === 'object') {
          console.log(`  ${k}: object keys ${Object.keys(v as object).slice(0, 10).join(', ')}`);
        } else {
          console.log(`  ${k}: ${JSON.stringify(v)?.slice(0, 160)}`);
        }
      }
    }
  } catch (err) {
    console.log(`\n=== ${name} === THREW ${(err as Error).message}`);
  }
}

// 1. Jobicy — approved long ago, never probed
await probe('jobicy', 'https://jobicy.com/api/v2/remote-jobs?count=10');

// 2. HN: find the latest "Who is hiring" thread via Algolia (no key)
await probe(
  'hn-thread-search',
  'https://hn.algolia.com/api/v1/search?query=Ask%20HN%3A%20Who%20is%20hiring%3F&tags=story&numericFilters=created_at_i>1780000000',
);

// 3. YC jobs board
await probe('yc-jobs', 'https://www.ycombinator.com/jobs');

// 4b. YC companies directory: is the listing server-rendered?
try {
  const t = await fetch('https://www.ycombinator.com/companies', {
    headers: { 'user-agent': 'Mozilla/5.0 (jobmate probe)' },
  }).then((r) => r.text());
  const links = t.match(/\/companies\/[a-z0-9-]+/g) ?? [];
  const unique = [...new Set(links)].filter((l) => l !== '/companies/');
  console.log('\n=== yc-directory ===');
  console.log(`unique /companies/ links: ${unique.length}`);
  console.log(unique.slice(0, 12).join('\n'));
  const jobLinks = (t.match(/\/jobs[^"'\s]*/g) ?? []).slice(0, 5);
  console.log('job-ish links:', jobLinks.join(' | ') || 'none');
} catch (err) {
  console.log(`\n=== yc-directory === THREW ${(err as Error).message}`);
}

// 4. latest monthly HN thread (posted by whoishiring on the 1st, sorted newest)
try {
  const s = (await fetch(
    'https://hn.algolia.com/api/v1/search?query=Who%20is%20hiring&tags=story&hitsPerPage=50',
  ).then((r) => r.json())) as {
    hits: Array<{ objectID: string; title: string; author: string; created_at: string; num_comments: number }>;
  };
  const monthly = s.hits
    .filter((h) => h.author === 'whoishiring' && /\(\w+ \d{4}\)/.test(h.title))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 3);
  console.log('\n=== hn-latest-monthly ===');
  for (const h of monthly) {
    console.log(`  ${h.objectID} | ${h.title} | ${h.created_at.slice(0, 10)} | ${h.num_comments} comments`);
  }
} catch (err) {
  console.log(`\n=== hn-latest-monthly === THREW ${(err as Error).message}`);
}

// 5. Work at a Startup page structure (Next.js payload vs JSON-LD)
try {
  const t = await fetch('https://www.workatastartup.com/jobs', {
    headers: { 'user-agent': 'Mozilla/5.0 (jobmate probe)' },
  }).then((r) => r.text());
  console.log('\n=== yc-page ===');
  console.log(`len ${t.length}`);
  const nextData = t.match(/__NEXT_DATA__[^>]*>(.*?)<\/script>/s);
  console.log('has __NEXT_DATA__:', !!nextData, nextData ? `len ${nextData[1]!.length}` : '');
  const ld = [...t.matchAll(/ld\+json[^>]*>(.*?)<\/script>/gs)];
  console.log('json-ld blocks:', ld.length);
  if (ld[0]?.[1]) console.log('ld[0]:', ld[0][1].slice(0, 250));
  const apiHints = [...t.matchAll(/"(https?:[^"]*api[^"]*)"/g)].slice(0, 5);
  console.log('api-ish urls:', apiHints.map((m) => m[1]).join(' | ') || 'none');
} catch (err) {
  console.log(`\n=== yc-page === THREW ${(err as Error).message}`);
}

export {};
const UA = { 'user-agent': 'jobmate/0.1 (open-source job research)' };

// 1. crt.sh — check what it actually returns
try {
  const r = await fetch('https://crt.sh/?q=%25.stripe.com&output=json', { headers: UA });
  const t = await r.text();
  console.log('crt.sh stripe:', r.status, 'len', t.length, '|', t.slice(0, 150));
} catch (e) {
  console.log('crt.sh ERR', String(e).slice(0, 60));
}

// 2. YC page content — funding/jobs signal?
for (const slug of ['stripe', 'modal']) {
  try {
    const t = await fetch(`https://www.ycombinator.com/companies/${slug}`, { headers: UA }).then((r) => r.text());
    const keys = ['batch', 'Batch', 'jobs', 'Jobs', 'hiring', 'funding', 'team size', 'Team', 'founded', 'website', 'Website'];
    const found = keys.filter((k) => t.includes(k));
    console.log(`yc/${slug}: len=${t.length} markers=[${found.join(',')}]`);
    const m = t.match(/\/companies\/[^"'\s]*jobs[^"'\s]*/);
    console.log(`yc/${slug}: job-link=${m?.[0] ?? 'none'}`);
  } catch {
    console.log(`yc/${slug}: ERR`);
  }
}

// 3. GitHub org search (proper resolution, not login guessing)
for (const q of ['modal labs', 'baseten']) {
  try {
    const r = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(q)}+type:org&per_page=3`, { headers: UA });
    const j = (await r.json()) as { total_count: number; items?: Array<{ login: string; followers_url?: string }> };
    console.log(`gh-search "${q}": total=${j.total_count} top=${(j.items ?? []).map((i) => i.login).join(',')}`);
  } catch {
    console.log(`gh-search "${q}": ERR`);
  }
}

// 4. HN relevance: Show HN launches by company?
try {
  const r = await fetch('https://hn.algolia.com/api/v1/search?query=Baseten&tags=show_hn&hitsPerPage=3', { headers: UA });
  const j = (await r.json()) as { hits: Array<{ title: string; points: number; created_at: string }> };
  console.log('hn show_hn Baseten:', j.hits.map((h) => `"${h.title.slice(0, 44)}"(${h.points}p,${h.created_at.slice(0, 10)})`).join(' ; '));
} catch {
  console.log('hn show_hn: ERR');
}

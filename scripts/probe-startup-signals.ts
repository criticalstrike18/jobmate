export {};
// Probe free "real startup" signals on a big → small spectrum.
// Every source below is keyless. We test MECHANICS (does it return
// usable data), not coverage — coverage is a corpus-wide job afterward.
const UA = { 'user-agent': 'jobmate/0.1 (open-source job research)' };
import { resolveMx } from 'node:dns/promises';

const COS = [
  { name: 'Stripe', domain: 'stripe.com', gh: 'stripe' },
  { name: 'Linear', domain: 'linear.app', gh: 'linear' },
  { name: 'Modal', domain: 'modal.com', gh: 'modal' },
  { name: 'Baseten', domain: 'baseten.com', gh: 'baseten' },
  { name: 'Cognition', domain: 'cognition.ai', gh: 'cognition-ai' },
  { name: 'Poolside', domain: 'poolside.ai', gh: 'poolside' },
];

async function jget(url: string) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) return { status: r.status };
  return r.json();
}

for (const c of COS) {
  console.log(`\n=== ${c.name} (${c.domain}) ===`);

  // 1. GitHub org: exists? age? activity?
  const gh = (await jget(`https://api.github.com/orgs/${c.gh}`)) as Record<string, unknown>;
  if (gh.status) console.log(`  github: HTTP ${gh.status}`);
  else
    console.log(
      `  github: @${gh.login} created=${String(gh.created_at).slice(0, 10)} repos=${gh.public_repos} followers=${gh.followers} blog=${gh.blog || '-'}`,
    );

  // 2. HN Algolia mentions (all time, top 3 by points)
  const hn = (await jget(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(c.name)}&tags=story&hitsPerPage=3`,
  )) as { hits?: Array<{ title: string; points: number; num_comments: number; created_at: string }> };
  const hits = hn.hits ?? [];
  console.log(`  hn stories: ${hits.length}${hits.length ? ' | top: ' + hits.map((h) => `"${h.title.slice(0, 42)}"(${h.points}p,${h.num_comments}c)`).join(' ; ') : ''}`);

  // 3. crt.sh first certificate = domain in active use since
  try {
    const crt = (await jget(`https://crt.sh/?q=%25.${c.domain}&output=json`)) as Array<{ not_before: string }>;
    if (Array.isArray(crt) && crt.length) {
      const first = crt.map((x) => x.not_before).sort()[0]!;
      console.log(`  crt.sh: ${crt.length} certs, first ${first.slice(0, 10)}`);
    } else console.log('  crt.sh: none');
  } catch {
    console.log('  crt.sh: ERR');
  }

  // 4. MX records = real email infra
  try {
    const mx = await resolveMx(c.domain);
    console.log(`  mx: ${mx.length} record(s) -> ${mx.slice(0, 2).map((m) => m.exchange).join(', ')}`);
  } catch {
    console.log('  mx: NONE');
  }

  // 5. YC company page server-rendered?
  try {
    const slug = c.name.toLowerCase();
    const r = await fetch(`https://www.ycombinator.com/companies/${slug}`, { headers: UA });
    const t = await r.text();
    const hasJobs = /job|hiring|career/i.test(t) && t.length > 50000;
    console.log(`  yc-page: HTTP ${r.status} len=${t.length} looks-real=${hasJobs}`);
  } catch {
    console.log('  yc-page: ERR');
  }
}

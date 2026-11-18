// Gate: fails the build on any problem. Never weaken a check to get a release out.
// From scripts/validate.mjs in the site repositories made by sites@AgentiCCells.dinis
// (2026-11-16); factory@ added the hub.json fields, the description check and the
// placeholder check (a seeded site must hold no __SITE_*__ placeholder).
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const problems = [];
const fail = m => problems.push(m);
const hype = /\b(revolutionary|cutting[- ]edge|seamless(?:ly)?|world[- ]class|game[- ]changing)\b/i;
const isTemplate = existsSync('.factory-template');
// conductor.algarve-holiday-homes@ (2026-11-18): the brief says no brand names of booking platforms.
const platforms = /\b(air ?bnb|booking\.com|vrbo|homeaway|expedia|tripadvisor|hotels\.com|holidu|agoda|trivago)\b/i;
const embedHosts = new Set();
if (existsSync('src/data/cameras.json')) {
  try { for (const c of JSON.parse(readFileSync('src/data/cameras.json', 'utf8')).cameras || []) if (c.embed === true && c.embed_url) embedHosts.add(new URL(c.embed_url).host); }
  catch (e) { problems.push(`src/data/cameras.json is not valid (${e.message})`); }
}
if (!existsSync('_site')) { console.error('FAILED: _site/ is not built: run node scripts/build.mjs'); process.exit(1); }
const files = walk('_site');
for (const f of [...files, 'hub.json', 'README.md']) {
  if (!existsSync(f) || !/\.(html|js|css|json|md)$/.test(f)) continue;
  const s = readFileSync(f, 'utf8');
  s.split('\n').forEach((line, i) => {
    if (line.includes('—')) fail(`${f}:${i + 1}: em dash`);
    const bp = line.match(platforms); if (bp && f !== 'README.md' && f !== 'hub.json') fail(`${f}:${i + 1}: booking-platform brand name "${bp[0]}" (the brief: no brand names of booking platforms)`);
    if (/\.js$/.test(f) && /sendBeacon|method\s*:\s*['"](?:POST|PUT|PATCH)['"]|\.open\(\s*['"](?:POST|PUT|PATCH)/i.test(line)) fail(`${f}:${i + 1}: code that sends data (the site keeps and sends nothing)`);
    const m = line.match(hype); if (m) fail(`${f}:${i + 1}: hype word "${m[0]}"`);
    if (!isTemplate && /__SITE_[A-Z]+__/.test(line)) fail(`${f}:${i + 1}: template placeholder left in a seeded site`);
  });
  if (f.endsWith('.html')) {
    if (!/<title>[^<]+<\/title>/.test(s)) fail(`${f}: no <title>`);
    if (!/<meta name="description" content="[^"]+"/.test(s)) fail(`${f}: no description`);
    if (!/<html lang="/.test(s)) fail(`${f}: no lang on <html>`);
    // conductor.algarve-holiday-homes@ (2026-11-18): the brief's rules on every page, and a link preview.
    if (!/made-up example/i.test(s)) fail(`${f}: "made-up example" is missing`);
    if (/<!--(HEAD|HEADER|FOOTER)-->/.test(s)) fail(`${f}: layout placeholder left unreplaced`);
    const og = s.match(/<meta property="og:image" content="https:\/\/[^/"]+(\/[^"]+\.(?:png|jpg))"/);
    if (!og) fail(`${f}: no link preview image (og:image, .png or .jpg)`);
    else if (!existsSync(join('_site', og[1]))) fail(`${f}: link preview image ${og[1]} is missing`);
    else if (statSync(join('_site', og[1])).size > 300 * 1024) fail(`${f}: link preview image ${og[1]} is over 300 KB`);
    if (/\bofficial (IPMA|warning)|IPMA's (site|website)\b/i.test(s.replace(/not (IPMA's|official)/gi, ''))) fail(`${f}: reads as if the site were IPMA's or official`);
    // Forms keep nothing and send nothing: no form may name an action or post.
    for (const m of s.matchAll(/<form\b[^>]*>/gi)) if (/\baction\s*=|method\s*=\s*["']?post/i.test(m[0])) fail(`${f}: a form with an action or method="post" (forms must send nothing)`);
    // Embeds only through a camera operator's own public player listed with embed: true in data/cameras.json.
    for (const m of s.matchAll(/<iframe\b[^>]*\bsrc="([^"]+)"/gi)) { let h = ''; try { h = new URL(m[1], 'https://x.invalid').host; } catch {} if (h !== 'x.invalid' && !embedHosts.has(h)) fail(`${f}: iframe from ${h || m[1]} is not an embed: true camera in data/cameras.json`); }
    for (const m of s.matchAll(/<script[^>]+src="([^"]+)"/g)) if (/^(https?:)?\/\//.test(m[1])) fail(`${f}: third-party script ${m[1]}`);
    for (const m of s.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) if (/^(https?:)?\/\//.test(m[1])) fail(`${f}: third-party stylesheet ${m[1]}`);
    for (const m of s.matchAll(/(?:href|src)="([^"#?]+)/g)) {
      const u = m[1]; if (/^(https?:|mailto:|data:|\/\/)/.test(u)) continue;
      const target = u.startsWith('/') ? join('_site', u) : join(dirname(f), u);
      if (!existsSync(target) && !existsSync(join(target, 'index.html'))) fail(`${f}: broken link ${u}`);
    }
  }
}
if (!existsSync('_site/version.json')) fail('no version.json');
if (!existsSync('_site/index.html')) fail('no index.html');
try {
  const h = JSON.parse(readFileSync('hub.json', 'utf8'));
  for (const k of ['name', 'what_it_does', 'owner', 'repository', 'live_address', 'version_from']) if (typeof h[k] !== 'string' || !h[k].trim()) fail(`hub.json: ${k} must be a non-empty string`);
  if (h.version_from !== `${h.live_address}/version.json`) fail(`hub.json: version_from must be ${h.live_address}/version.json (the hub copies it verbatim)`);
  if (h.owner !== 'AgentiCCells') fail('hub.json: owner must be AgentiCCells');
  if (!h.licence || h.licence.code !== 'Apache-2.0' || h.licence.text !== 'CC BY 4.0') fail('hub.json: licence must be code Apache-2.0, text CC BY 4.0');
} catch (e) { fail(`hub.json is missing or not JSON (${e.message})`); }
if (problems.length) { console.error(problems.join('\n')); console.error(`FAILED: ${problems.length} problem(s)`); process.exit(1); }
console.log(`OK${isTemplate ? ' (template)' : ''}`);

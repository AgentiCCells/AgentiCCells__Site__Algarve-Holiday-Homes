// designs.mjs: the chooser /d/ for the five designs of the Cinco Chaminés site (a made-up example),
// team/rounds/2/design/PROPOSAL.md section 4. Run by scripts/build.mjs after src/ is copied and
// before layout.mjs. Fills <!--DESIGN-CARDS--> in _site/d/index.html with six cards: the main
// design first, then Revista, Azulejo, Linho, Costa and Postal. Each card shows a screenshot of
// the design's top 900 px at 1366 px wide (src/d/previews/<slug>.jpg, made by
// `node scripts/shots.mjs --previews <base-url>` once the designs are built); when a screenshot
// is missing, the card shows the design's palette as swatches with the token names instead.
// A design whose page is not built yet says so and is not linked.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 2.
// Code Apache-2.0; text CC BY 4.0.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { esc } from './lib.mjs';

export const DESIGNS = [
  { slug: 'main', href: '/', name: 'The main site', line: 'The site as it is: a photo of the coast behind the plan-your-stay card, the five homes, and the homes where they do not belong.', type: 'The system sans-serif of your device (Segoe UI, Roboto or San Francisco)',
    palette: { '--bg': '#FBF7F0', '--ink': '#1F2328', '--accent': '#A13D1A', '--sea': '#0E5A72', '--band-bg': '#FBE7A1' } },
  { slug: 'revista', name: 'Revista', line: 'A calm travel-magazine issue: masthead, dateline with today\'s weather, a cover story and one feature per home.', type: 'Palatino and Charter',
    palette: { '--paper': '#FAF8F3', '--ink': '#1C1B19', '--accent': '#8E3A1E', '--column': '#F0ECE3', '--band': '#EFE3C2' } },
  { slug: 'azulejo', name: 'Azulejo', line: 'Blue and white Portuguese tiles: tile-framed pictures, the live figures in square tiles, cobalt on white.', type: 'Optima and Gill Sans',
    palette: { '--bg': '#F6F8FC', '--ink': '#14306E', '--cobalt': '#1F4FA3', '--band': '#DCE6F7', '--ochre': '#7A4A00' } },
  { slug: 'linho', name: 'Linho', line: 'A quiet boutique-hotel page: one large picture per screen, linen and black, thin capitals, few words.', type: 'Didot and Helvetica Neue',
    palette: { '--linen': '#F4F1EB', '--ink': '#141414', '--ink-2': '#5E5A53', '--sand': '#7B5B34', '--band': '#E7E0D3' } },
  { slug: 'costa', name: 'Costa', line: 'The coast first: a drawn map of the Algarve from Sagres to Tavira, each home pinned with its own forecast beside it.', type: 'A rounded sans for headings, the system sans for text, monospace figures',
    palette: { '--land': '#F5EBD6', '--sea': '#CFE8EE', '--ink': '#10252D', '--pin': '#A63D17', '--deep': '#0B4F63' } },
  { slug: 'postal', name: 'Postal', line: 'Warm Mediterranean postcards: each home a postcard with a stamp and a round postmark that carries today\'s forecast.', type: 'Rockwell (a slab serif) and Charter',
    palette: { '--bg': '#F3E9D8', '--ink': '#2A1F17', '--terracotta': '#A3361F', '--sea': '#1D5E73', '--mustard': '#E3B341' } },
];
// Screenshot size: 1366 x 900 css px, saved 800 px wide.
export const PREVIEW_W = 800, PREVIEW_H = 527;

const page = '_site/d/index.html';
if (existsSync(page) && readFileSync(page, 'utf8').includes('<!--DESIGN-CARDS-->')) {
  const cards = DESIGNS.map(d => {
    const href = d.href || `/d/${d.slug}/`;
    const built = d.slug === 'main' || existsSync(`_site/d/${d.slug}/index.html`);
    const shot = existsSync(`src/d/previews/${d.slug}.jpg`);
    const pic = shot
      ? `<img src="/d/previews/${d.slug}.jpg" width="${PREVIEW_W}" height="${PREVIEW_H}" loading="lazy" decoding="async" alt="Screenshot of ${d.slug === 'main' ? 'the main design' : `the ${esc(d.name)} design`} of this made-up example site.">`
      : `<ul class="swatches" aria-label="The ${esc(d.name)} palette (no screenshot yet)">${Object.entries(d.palette).map(([k, v]) => `<li><span style="background:${v}"></span><code>${esc(k)}</code> <code>${v}</code></li>`).join('')}</ul>`;
    return `<li><article class="dcard">
<div class="dpic">${built ? `<a href="${href}" tabindex="-1" aria-hidden="true">${pic}</a>` : pic}</div>
<div class="db">
<h2>${built ? `<a href="${href}">${esc(d.name)}</a>` : esc(d.name)}</h2>
<p>${esc(d.line)}</p>
<p class="small">Type: ${esc(d.type)}.</p>
${built ? `<p><a class="btn small" href="${href}">Open the design<span class="sr-only">: ${esc(d.name)}</span></a></p>` : '<p class="status empty">Not built yet.</p>'}
</div>
</article></li>`;
  }).join('\n');
  writeFileSync(page, readFileSync(page, 'utf8').replace('<!--DESIGN-CARDS-->', () => `<ul class="dcards">\n${cards}\n</ul>`));
  console.log(`designs: /d/ chooser with ${DESIGNS.length} cards`);
}

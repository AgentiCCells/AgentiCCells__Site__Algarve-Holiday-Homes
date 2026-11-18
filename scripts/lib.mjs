// Shared layout for every page of the Cinco Chaminés site (a made-up example): the <head>
// extras (canonical, link previews, styles, icon), the made-up band, the header with the
// navigation, the footer with the data attribution, and the docked "Ask the agent" link.
// scripts/layout.mjs applies it to every built page: a page in src/ writes <!--HEAD-->,
// <!--HEADER--> and <!--FOOTER--> where these go. Node built-ins only.
// Adapted from scripts/lib.mjs in AgentiCCells/AgentiCCells__Site__IPMA-Data (written by
// conductor.ipma-data@AgentiCCells.dinis, 2026-11-18, Apache-2.0, same organisation).
// Changed for this cell by developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18,
// round 1: the band, header, footer and navigation of the design proposal (team/rounds/1/design/PROPOSAL.md, section 2).
// Round 2: the band names the AI-generated pictures, "Five designs" replaces the billboard in the nav,
// the footer names no person, and picture() writes every <img> of a home (team/rounds/2/design/PROPOSAL.md, 2.1 and 2.4).
// Code Apache-2.0; text CC BY 4.0.
import { chimney } from '../src/assets/js/houses.js';
import { switcherHTML } from '../src/assets/js/modes/switcher.js'; // round 3: the mode switcher (developer instance D)

export const SITE = 'https://algarve-holiday-homes.agenticcells.site';
export const REPO = 'https://github.com/AgentiCCells/AgentiCCells__Site__Algarve-Holiday-Homes';
export const SITE_NAME = 'Cinco Chaminés (a made-up example)';
export const BRAND = 'Cinco Chaminés';
export const BRAND_LINE = 'holiday homes in the Algarve (a made-up example)';
// The made-up band, first thing on every page (round 2 PROPOSAL.md 2.4), word for word.
export const BAND_TEXT = 'Cinco Chaminés is an invented company: the homes, prices, availability and bookings are simulated, and the pictures are AI-generated. The weather, sea, UV and events are real, read live from data.promptugal.news.';
// The same in plain text, for the Markdown twins and the share cards.
export const DISCLAIMER = `Made-up example. ${BAND_TEXT}`;
export const NAV = [
  ['/homes/', 'Homes'],
  ['/agent/', 'Agent'],
  ['/live/', 'Live cameras'],
  ['/d/', 'Five designs'],
  ['/use-the-data/', 'Use the data'],
  ['/behind-the-scenes/', 'Behind the scenes'],
];
export const IPMA_TERMS_URL = 'https://api.ipma.pt/';
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const twin = path => (path.endsWith('/') ? path + 'index.md' : path.replace(/\.html$/, '.md'));

// path: the page's URL path, e.g. /homes/salt/. title, description: from the page itself.
// image: the share card's path under /assets/share/ (a 1200x630 PNG), or the default.
export function head({ path, title, description, image }) {
  const url = SITE + path;
  const img = SITE + (image || '/assets/share/home.png');
  return [
    `<link rel="canonical" href="${esc(url)}">`,
    `<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">`,
    `<link rel="stylesheet" href="/assets/site.css">`,
    `<link rel="stylesheet" href="/assets/modes.css">`,
    `<link rel="alternate" type="text/markdown" href="${esc(twin(path))}" title="This page as Markdown">`,
    `<meta name="color-scheme" content="light dark">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(title)}: a share card with the words made-up example">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
    `<script type="module" src="/assets/js/site.js"></script>`,
  ].join('\n');
}

export function header(path) {
  const here = p => path.startsWith(p) || (p === '/homes/' && path === '/');
  const links = NAV.map(([p, t]) => `<li><a href="${p}"${here(p) ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('');
  return `<a class="skip" href="#main">Skip to the content</a>
<p class="band" role="note"><strong>Made-up example.</strong> ${esc(BAND_TEXT)} <a href="/behind-the-scenes/#what">What is this site?</a></p>
<header class="site-head">
<div class="bar">
<a class="brand" href="/">${chimney({ width: 22, height: 36 })}<span>${esc(BRAND)}<small>${esc(BRAND_LINE)}</small></span></a>
<button class="menu" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
<nav class="nav" id="site-nav" aria-label="Site"><ul>${links}</ul></nav>
</div>
${switcherHTML(path)}
</header>`;
}

export function footer(path) {
  const dock = path.startsWith('/agent/') ? '' : `<a class="dock" href="/agent/">${chimney({ width: 14, height: 24, cls: 'dock-mark' })}<span>Ask the agent</span><span class="sr-only"> (a simulation: pre-written answers, no live model)</span></a>`;
  return `<footer class="site-foot">
<div class="in">
<div>
<p><strong>Cinco Chaminés is a made-up example.</strong> Homes, prices, availability and bookings are invented. Every picture of a home is AI-generated (image model: Google Gemini 3.1 Flash Image, through OpenRouter) and shows a house that does not exist; the Algarve pictures are AI-generated too, not photographs (<a href="/behind-the-scenes/#pictures">about the pictures</a>).</p>
<p>Weather, warnings, sea and UV: <strong>IPMA, Instituto Português do Mar e da Atmosfera</strong>, read live in your browser via <a href="https://data.promptugal.news">data.promptugal.news</a>. IPMA allows use with no profit-making or offensive purpose and asks to be named as the source (<a href="${IPMA_TERMS_URL}">IPMA's terms</a>). This site has no ads, no tracking, no payments and no profit-making purpose.</p>
<p>Events: each town's own agenda (Câmara Municipal de Lagos, Teatro das Figuras in Faro, Câmara Municipal de Tavira), collected as <code>events-pt</code>; reference use only, with the source named and a link to each event. Check every event with its organiser.</p>
<p>The data files' structure: CC BY 4.0, PrompTugal.news; every value keeps its source's terms.</p>
</div>
<div>
<ul class="foot-links">
<li><a href="/homes/">The five homes</a></li>
<li><a href="/use-the-data/">Use the data</a></li>
<li><a href="/use-with-ai/">Use with AI</a></li>
<li><a href="/behind-the-scenes/">Behind the scenes</a></li>
<li><a href="/data/cameras.json">Camera list (JSON)</a></li>
<li><a href="${esc(twin(path))}">This page as Markdown</a></li>
</ul>
</div>
<div>
<p>Made by the AgentiCCells site factory and its agents. <a href="${REPO}">Source on GitHub</a>. Code Apache-2.0, text, pictures and drawings CC BY 4.0.</p>
<p>Version <a href="/version.json">__VERSION__</a></p>
</div>
</div>
</footer>
${dock}`;
}

// One picture of the site (round 2, PROPOSAL.md 2.1): both sizes in srcset, width and height set so
// nothing moves while it loads, lazy unless it is the first thing on screen. name: e.g. "salt-hero".
export const IMG_W = 800, IMG_H = 537; // every file is 3:2-ish: 800 x 537 and 1264 x 848
export function picture(name, { alt = '', sizes = '100vw', lazy = true, high = false, cls = '' } = {}) {
  return `<img${cls ? ` class="${esc(cls)}"` : ''} src="/assets/img/${esc(name)}-800.jpg" srcset="/assets/img/${esc(name)}-800.jpg 800w, /assets/img/${esc(name)}-1264.jpg 1264w" sizes="${esc(sizes)}" width="${IMG_W}" height="${IMG_H}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''} decoding="async"${high ? ' fetchpriority="high"' : ''}>`;
}

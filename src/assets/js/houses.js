// houses.js: the drawings of the five invented homes of Cinco Chaminés (a made-up example)
// and the Algarve chimney that is the site's mark. Inline SVG strings, viewBox 0 0 240 160,
// fills from the CSS tokens so dark mode needs no second drawing. Shapes copied from the
// designer's mock-up (team/rounds/1/design/mockup.html, PROPOSAL.md section 3). Each house has
// exactly one chimney, drawn as a nested <svg> so a drawing needs nothing else on the page.
// Used in the browser and at build time by scripts/layout.mjs. Drawings CC BY 4.0; code Apache-2.0.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18, round 1.

export const CHIMNEY_PARTS = `<rect x="8" y="20" width="8" height="20" fill="var(--wall)" stroke="var(--ink)" stroke-width="1.5"/>
<rect x="4" y="10" width="16" height="10" fill="var(--wall)" stroke="var(--ink)" stroke-width="1.5"/>
<path d="M7 15l2-2.5 2 2.5-2 2.5zM11 15l2-2.5 2 2.5-2 2.5zM15 15l2-2.5 2 2.5-2 2.5z" fill="var(--ink)"/>
<path d="M3 10L12 2l9 8z" fill="var(--roof)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
<circle cx="12" cy="1.5" r="1.3" fill="var(--ink)"/>`;
const chimneyAt = (x, y, w = 24, h = 40) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 24 40" overflow="visible">${CHIMNEY_PARTS}</svg>`;
// The chimney alone, e.g. the brand mark: chimney({ width: 22, height: 36 }).
export function chimney({ width = 22, height = 36, cls = 'chimney', label = '' } = {}) {
  const a = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="${cls}" width="${width}" height="${height}" viewBox="0 0 24 40" ${a} overflow="visible">${CHIMNEY_PARTS}</svg>`;
}

export const LABELS = {
  salt: 'Drawing of the Salt House: a low white house with a roof terrace above salt pans',
  lagoon: 'Drawing of the Lagoon House: a first-floor flat in a small block by the lagoon, with a boat',
  hill: 'Drawing of the Hill House: a tiled country house with a pool and a carob tree on a hill',
  harbour: 'Drawing of the Harbour House: a narrow town house with a walled courtyard, masts behind',
  cape: 'Drawing of the Cape House: a long low house on a cliff top, with wind lines',
};

const BODY = {
  salt: `<rect x="0" y="140" width="240" height="20" fill="var(--water)" opacity=".5"/>
<path d="M10 148h50M70 148h60M140 148h60M20 155h80M120 155h90" stroke="var(--wall)" stroke-width="3"/>
<rect x="40" y="80" width="140" height="60" fill="var(--wall)" stroke="var(--ink)" stroke-width="2"/>
<rect x="40" y="72" width="140" height="8" fill="none" stroke="var(--ink)" stroke-width="2"/>
<path d="M50 72v8M60 72v8M70 72v8M80 72v8M90 72v8M100 72v8M110 72v8M120 72v8" stroke="var(--ink)"/>
<rect x="58" y="95" width="18" height="22" fill="var(--sea)"/><rect x="92" y="105" width="20" height="35" fill="var(--sea)"/><rect x="130" y="95" width="18" height="22" fill="var(--sea)"/>
${chimneyAt(152, 32)}`,
  lagoon: `<rect x="0" y="140" width="240" height="20" fill="var(--water)"/>
<path d="M10 150q10-6 20 0t20 0M150 152q10-6 20 0t20 0" stroke="var(--sea)" stroke-width="2" fill="none"/>
<path d="M170 140h50l-8 10h-34z" fill="var(--roof)" stroke="var(--ink)" stroke-width="2"/><path d="M195 140v-26l14 22" stroke="var(--ink)" stroke-width="2" fill="none"/>
<rect x="50" y="40" width="110" height="100" fill="var(--wall)" stroke="var(--ink)" stroke-width="2"/>
<rect x="50" y="72" width="110" height="34" fill="var(--band-bg)" opacity=".6"/>
<rect x="62" y="48" width="16" height="16" fill="var(--sea)"/><rect x="97" y="48" width="16" height="16" fill="var(--sea)"/><rect x="132" y="48" width="16" height="16" fill="var(--sea)"/>
<rect x="62" y="78" width="16" height="22" fill="var(--sea)"/><rect x="97" y="78" width="16" height="22" fill="var(--sea)"/><rect x="132" y="78" width="16" height="22" fill="var(--sea)"/>
<path d="M56 100h98M60 100v-8M70 100v-8M80 100v-8M90 100v-8M100 100v-8M110 100v-8M120 100v-8M130 100v-8M140 100v-8M150 100v-8M56 92h98" stroke="var(--ink)" stroke-width="1.5"/>
<rect x="96" y="114" width="18" height="26" fill="var(--sea)"/>
${chimneyAt(128, 0)}`,
  hill: `<path d="M0 120q60-40 120-20t120-10v70H0z" fill="var(--green)" opacity=".35"/>
<rect x="30" y="85" width="115" height="55" fill="var(--wall)" stroke="var(--ink)" stroke-width="2"/>
<path d="M22 85L88 58l65 27z" fill="var(--roof)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
<rect x="45" y="100" width="18" height="20" fill="var(--sea)"/><rect x="80" y="105" width="18" height="35" fill="var(--sea)"/><rect x="112" y="100" width="18" height="20" fill="var(--sea)"/>
<rect x="158" y="130" width="62" height="10" fill="var(--water)" stroke="var(--ink)" stroke-width="2"/>
<rect x="198" y="96" width="5" height="34" fill="var(--ink)"/>
<circle cx="190" cy="88" r="14" fill="var(--green)"/><circle cx="208" cy="82" r="15" fill="var(--green)"/><circle cx="214" cy="98" r="11" fill="var(--green)"/>
${chimneyAt(104, 34)}`,
  harbour: `<path d="M200 140V30M215 140V45M200 30l-25 60h25" stroke="var(--ink-2)" stroke-width="1.5" fill="none"/>
<rect x="80" y="50" width="90" height="90" fill="var(--wall)" stroke="var(--ink)" stroke-width="2"/>
<rect x="76" y="44" width="98" height="8" fill="var(--sea)" stroke="var(--ink)" stroke-width="2"/>
<rect x="94" y="62" width="18" height="26" fill="var(--sea)"/><rect x="138" y="62" width="18" height="26" fill="var(--sea)"/>
<path d="M90 88h26M134 88h26" stroke="var(--ink)" stroke-width="2"/>
<rect x="116" y="104" width="20" height="36" fill="var(--sea)"/>
<rect x="30" y="102" width="50" height="38" fill="var(--wall)" stroke="var(--ink)" stroke-width="2"/>
<path d="M45 140v-20a10 10 0 0 1 20 0v20" fill="var(--roof)" stroke="var(--ink)" stroke-width="2"/>
<circle cx="36" cy="96" r="6" fill="var(--green)"/>
${chimneyAt(146, 4)}`,
  cape: `<path d="M190 140l20 20h30v-20z" fill="var(--water)"/><path d="M0 140h190l20 20H0z" fill="var(--ink-2)" opacity=".35"/>
<path d="M6 70q20-8 40 0M14 84q24-8 46 0M4 98q18-6 34 0" stroke="var(--sea)" stroke-width="2" fill="none" stroke-linecap="round"/>
<rect x="40" y="100" width="140" height="40" fill="var(--wall)" stroke="var(--ink)" stroke-width="3"/>
<path d="M36 100l144-8v8z" fill="var(--roof)" stroke="var(--ink)" stroke-width="2"/>
<rect x="58" y="112" width="12" height="12" fill="var(--sea)"/><rect x="94" y="112" width="16" height="28" fill="var(--sea)"/><rect x="134" y="112" width="12" height="12" fill="var(--sea)"/>
<path d="M196 140q-2-14 8-22M204 140q4-12 14-16" stroke="var(--green)" stroke-width="3" fill="none"/>
${chimneyAt(58, 56)}`,
};
export const HOUSE_IDS = Object.keys(BODY);

// houseSvg('salt', { cls: 'drawing' }) -> the drawing as an SVG string, or '' for an unknown id.
// opts.decorative: true hides it from assistive technology (when the name is next to it anyway).
export function houseSvg(id, { cls = 'drawing', decorative = false } = {}) {
  if (!BODY[id]) return '';
  const a = decorative ? 'aria-hidden="true" focusable="false"' : `role="img" aria-label="${LABELS[id]}"`;
  return `<svg class="${cls}" viewBox="0 0 240 160" ${a}>${BODY[id]}</svg>`;
}

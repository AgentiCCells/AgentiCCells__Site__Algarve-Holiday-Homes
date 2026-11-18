// sim/figure.js: the little figures of the Cinco Chaminés simulation (a made-up example), as
// plain SVG strings: figure(look, { pose, mood, scale, prop, hat, outfit, flip, kind, label }).
//
// A plain-SVG reimplementation (flat fills, thick outlines, no Rough.js) of the character drawn
// by the storyboard kit of storyboards.sgit.ai (StoryboardKit.drawCharacter, release v0.1.0,
// https://api.storyboards.sgit.ai/v0/v0.1/v0.1.0/storyboard.js, Apache-2.0), following its
// `look` schema and proportions as described in team/rounds/2/research/SYNTHETIC-USERS.md
// section 3, and the lab's ink-pack idea of flat fills for small, animated figures. No code was
// copied from the kit; the same `look` data can still be drawn by the real kit. Figure design
// after the storyboard kit of storyboards.sgit.ai, Apache-2.0.
// Our extensions (the kit ignores them): props (suitcase, surfboard, laptop, binoculars, broom,
// mop, ledger, keys, phone, receipt, ticket, balloon, calculator, dog, wheelchair), a sun hat,
// holiday clothes, and the poses walk and hold.
// Pure function, no DOM, no network. Code Apache-2.0.
// Written by developer.algarve-holiday-homes@AgentiCCells.dinis (instance C), 2026-11-18, round 3.

import { esc } from './util.js';

export const INK = '#23262b';
export const POSES = Object.freeze(['stand', 'point', 'wave', 'arms-up', 'shrug', 'think', 'sit', 'walk', 'hold']);
export const MOODS = Object.freeze(['neutral', 'happy', 'excited', 'calm', 'worried', 'sad', 'surprised', 'thinking', 'confused', 'determined']);
export const PROPS = Object.freeze(['none', 'suitcase', 'surfboard', 'laptop', 'binoculars', 'broom', 'mop', 'ledger', 'keys', 'phone', 'receipt', 'ticket', 'balloon', 'calculator', 'dog', 'wheelchair']);
const HAIR = ['short', 'long', 'curly', 'bun', 'beanie', 'bald'];

// Only plain colours get into the SVG: #rgb, #rrggbb(aa) or a CSS colour name.
export function safeColour(c, fallback) { return typeof c === 'string' && /^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i.test(c.trim()) ? c.trim() : fallback; }
const n = v => Math.round(v * 10) / 10;

const ARMS = {
  stand: { near: [[8, 70], [10, 140]], far: [[8, 70], [10, 140]] },
  point: { near: [[60, 0], [130, -5]], far: [[8, 70], [10, 140]] },
  wave: { near: [[45, -40], [60, -120]], far: [[8, 70], [10, 140]] },
  'arms-up': { near: [[35, -50], [45, -130]], far: [[35, -50], [45, -130]] },
  shrug: { near: [[45, 40], [70, -10]], far: [[45, 40], [70, -10]] },
  think: { near: [[25, 80], null], far: [[8, 70], [10, 140]] },
  sit: { near: [[15, 60], [40, 110]], far: [[15, 60], [40, 110]] },
  walk: { near: [[-15, 70], [-28, 135]], far: [[15, 70], [30, 135]] },
  hold: { near: [[22, 72], [48, 118]], far: [[22, 72], [40, 118]] },
};
const HOLD_PROPS = ['laptop', 'ledger', 'calculator', 'phone', 'receipt', 'ticket', 'keys'];

function face(cx, cy, r, dir, mood) {
  const ex = 0.36 * r, ey = cy - 0.05 * r, sh = 6 * dir, big = mood === 'surprised' || mood === 'excited';
  const out = [];
  if (mood === 'calm') for (const s of [-1, 1]) out.push(`<path d="M${n(cx + s * ex + sh - 6)} ${n(ey)} q6 4 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`);
  else for (const s of [-1, 1]) out.push(`<circle cx="${n(cx + s * ex + sh + (mood === 'thinking' ? 3 * dir : 0))}" cy="${n(ey + (mood === 'thinking' ? -3 : 0))}" r="${big ? 5 : 4}" fill="${INK}"/>`);
  // brows: inner and outer end heights by mood
  const brow = { worried: [-6, 2], sad: [-5, 3], determined: [5, -4], confused: [-4, 4], surprised: [-6, -6], excited: [-5, -5], thinking: [-8, -2] }[mood] || [0, 0];
  for (const s of [-1, 1]) {
    const x0 = cx + s * ex + sh, yb = ey - 0.28 * r;
    const lift = mood === 'thinking' && s === dir ? -6 : 0, conf = mood === 'confused' && s === 1 ? -8 : 0;
    out.push(`<path d="M${n(x0 - s * 10)} ${n(yb + brow[0] * 0.5 + lift + conf)} L${n(x0 + s * 10)} ${n(yb + brow[1] * 0.5 + lift + conf)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`);
  }
  const mx = cx + sh, my = cy + 0.38 * r;
  const mouths = {
    happy: `<path d="M${n(mx - 16)} ${n(my - 4)} Q${n(mx)} ${n(my + 14)} ${n(mx + 16)} ${n(my - 4)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    excited: `<path d="M${n(mx - 17)} ${n(my - 5)} Q${n(mx)} ${n(my + 22)} ${n(mx + 17)} ${n(my - 5)} Z" fill="${INK}"/>`,
    calm: `<path d="M${n(mx - 10)} ${n(my - 2)} Q${n(mx)} ${n(my + 6)} ${n(mx + 10)} ${n(my - 2)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    worried: `<path d="M${n(mx - 14)} ${n(my + 3)} q7 -6 14 0 t14 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    sad: `<path d="M${n(mx - 15)} ${n(my + 7)} Q${n(mx)} ${n(my - 8)} ${n(mx + 15)} ${n(my + 7)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    surprised: `<ellipse cx="${n(mx)}" cy="${n(my + 2)}" rx="8" ry="11" fill="${INK}"/>`,
    thinking: `<path d="M${n(mx - 8)} ${n(my + 2)} L${n(mx + 12 * dir)} ${n(my - 3)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    confused: `<path d="M${n(mx - 14)} ${n(my)} l7 -4 l7 4 l7 -4 l7 4" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    determined: `<path d="M${n(mx - 14)} ${n(my + 1)} L${n(mx + 14)} ${n(my + 1)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  };
  out.push(mouths[mood] || `<path d="M${n(mx - 12)} ${n(my + 1)} L${n(mx + 12)} ${n(my + 1)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`);
  return out.join('');
}

function hairBack(look, cx, cy, r) {
  if (look.hair !== 'long') return '';
  return `<path d="M${n(cx - r * 1.05)} ${n(cy)} Q${n(cx - r * 1.15)} ${n(cy + r * 1.6)} ${n(cx - r * 0.5)} ${n(cy + r * 1.6)} L${n(cx + r * 0.5)} ${n(cy + r * 1.6)} Q${n(cx + r * 1.15)} ${n(cy + r * 1.6)} ${n(cx + r * 1.05)} ${n(cy)} A${r * 1.05} ${r * 1.05} 0 0 0 ${n(cx - r * 1.05)} ${n(cy)} Z" fill="${look.hairColour}" stroke="${INK}" stroke-width="2.4"/>`;
}
function hairFront(look, cx, cy, r) {
  const cap = `<path d="M${n(cx - r)} ${n(cy - 4)} A${r} ${r} 0 0 1 ${n(cx + r)} ${n(cy - 4)} Q${n(cx)} ${n(cy - r * 0.55)} ${n(cx - r)} ${n(cy - 4)} Z" fill="${look.hairColour}" stroke="${INK}" stroke-width="2.4"/>`;
  switch (look.hair) {
    case 'bald': return '';
    case 'curly': { let s = ''; for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + (i / 8) * 0.9); s += `<circle cx="${n(cx + Math.cos(a) * r * 0.86)}" cy="${n(cy + Math.sin(a) * r * 0.86)}" r="${n(r * 0.31)}" fill="${look.hairColour}" stroke="${INK}" stroke-width="2"/>`; } return s; }
    case 'bun': return `<circle cx="${n(cx)}" cy="${n(cy - r * 1.05)}" r="${n(r * 0.38)}" fill="${look.hairColour}" stroke="${INK}" stroke-width="2.4"/>${cap}`;
    case 'beanie': return `<path d="M${n(cx - r * 1.03)} ${n(cy - r * 0.12)} A${r * 1.03} ${r * 1.03} 0 0 1 ${n(cx + r * 1.03)} ${n(cy - r * 0.12)} Z" fill="${look.hatColour}" stroke="${INK}" stroke-width="2.6"/><circle cx="${n(cx)}" cy="${n(cy - r * 1.08)}" r="7" fill="${look.hatColour}" stroke="${INK}" stroke-width="2"/>`;
    default: return cap; // short, and the fringe of long
  }
}
function sunHat(cx, cy, r) {
  return `<ellipse cx="${n(cx)}" cy="${n(cy - r * 0.5)}" rx="${n(r * 1.65)}" ry="${n(r * 0.26)}" fill="#e9c46a" stroke="${INK}" stroke-width="2.4"/><path d="M${n(cx - r * 0.8)} ${n(cy - r * 0.55)} Q${n(cx - r * 0.75)} ${n(cy - r * 1.35)} ${n(cx)} ${n(cy - r * 1.35)} Q${n(cx + r * 0.75)} ${n(cy - r * 1.35)} ${n(cx + r * 0.8)} ${n(cy - r * 0.55)} Z" fill="#e9c46a" stroke="${INK}" stroke-width="2.4"/><path d="M${n(cx - r * 0.78)} ${n(cy - r * 0.68)} L${n(cx + r * 0.78)} ${n(cy - r * 0.68)}" stroke="#c2410c" stroke-width="7"/>`;
}
function accessory(look, cx, cy, r, dir, sh) {
  const ex = 0.36 * r, ey = cy - 0.05 * r, s = 6 * dir;
  if (look.accessory === 'glasses') return `<circle cx="${n(cx - ex + s)}" cy="${n(ey)}" r="11" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="${n(cx + ex + s)}" cy="${n(ey)}" r="11" fill="none" stroke="${INK}" stroke-width="2"/><path d="M${n(cx - ex + s + 11)} ${n(ey)} L${n(cx + ex + s - 11)} ${n(ey)}" stroke="${INK}" stroke-width="2"/>`;
  if (look.accessory === 'headphones') return `<path d="M${n(cx - r * 1.02)} ${n(cy)} A${r * 1.02} ${r * 1.02} 0 0 1 ${n(cx + r * 1.02)} ${n(cy)}" fill="none" stroke="${INK}" stroke-width="7"/><rect x="${n(cx - r - 10)}" y="${n(cy - 15)}" width="18" height="30" rx="6" fill="${look.accentColour}" stroke="${INK}" stroke-width="2"/><rect x="${n(cx + r - 8)}" y="${n(cy - 15)}" width="18" height="30" rx="6" fill="${look.accentColour}" stroke="${INK}" stroke-width="2"/>`;
  if (look.accessory === 'lanyard') return `<path d="M-22 ${n(sh + 4)} L0 ${n(sh + 62)} L22 ${n(sh + 4)}" fill="none" stroke="${look.accentColour}" stroke-width="4"/><rect x="-13" y="${n(sh + 60)}" width="26" height="34" rx="3" fill="#ffffff" stroke="${INK}" stroke-width="2"/>`;
  return '';
}

function prop(name, hand, dir, sh, hips, headTop) {
  const [hx, hy] = hand;
  switch (name) {
    case 'suitcase': { const x = dir * 100 - 35; return `<rect x="${n(x)}" y="-92" width="70" height="88" rx="8" fill="#8b5e3c" stroke="${INK}" stroke-width="2.6"/><path d="M${n(x + 22)} -92 v-16 h26 v16" fill="none" stroke="${INK}" stroke-width="5"/><path d="M${n(x + 12)} -70 v56 M${n(x + 58)} -70 v56" stroke="#5b3a22" stroke-width="4"/>`; }
    case 'surfboard': { const x = -dir * 92; return `<ellipse cx="${n(x)}" cy="-215" rx="24" ry="210" fill="#f4a261" stroke="${INK}" stroke-width="2.6"/><path d="M${n(x)} -420 L${n(x)} -10" stroke="#e76f51" stroke-width="5"/>`; }
    case 'laptop': return `<rect x="${n(hx - 40)}" y="${n(hy - 8)}" width="80" height="10" rx="3" fill="#9ca3af" stroke="${INK}" stroke-width="2"/><rect x="${n(hx - 36)}" y="${n(hy - 58)}" width="72" height="50" rx="4" fill="#cbd5e1" stroke="${INK}" stroke-width="2.4"/>`;
    case 'binoculars': return `<path d="M-30 ${n(sh + 6)} L-14 ${n(sh + 50)} M30 ${n(sh + 6)} L14 ${n(sh + 50)}" stroke="${INK}" stroke-width="2"/><rect x="-26" y="${n(sh + 46)}" width="22" height="34" rx="6" fill="#374151" stroke="${INK}" stroke-width="2"/><rect x="4" y="${n(sh + 46)}" width="22" height="34" rx="6" fill="#374151" stroke="${INK}" stroke-width="2"/>`;
    case 'broom': return `<path d="M${n(hx)} ${n(hy - 90)} L${n(hx + dir * 30)} -40" stroke="#a16207" stroke-width="7" stroke-linecap="round"/><path d="M${n(hx + dir * 30 - 24)} 0 L${n(hx + dir * 30 - 10)} -44 L${n(hx + dir * 30 + 10)} -44 L${n(hx + dir * 30 + 24)} 0 Z" fill="#facc15" stroke="${INK}" stroke-width="2.4"/>`;
    case 'mop': return `<path d="M${n(hx)} ${n(hy - 90)} L${n(hx + dir * 30)} -20" stroke="#64748b" stroke-width="7" stroke-linecap="round"/><path d="M${n(hx + dir * 30 - 26)} 0 q8 -26 26 -24 q18 -2 26 24 Z" fill="#e5e7eb" stroke="${INK}" stroke-width="2.4"/>`;
    case 'ledger': return `<rect x="${n(hx - 26)}" y="${n(hy - 70)}" width="52" height="66" rx="4" fill="#166534" stroke="${INK}" stroke-width="2.4"/><path d="M${n(hx - 16)} ${n(hy - 54)} h32 M${n(hx - 16)} ${n(hy - 42)} h32 M${n(hx - 16)} ${n(hy - 30)} h22" stroke="#fef3c7" stroke-width="3"/>`;
    case 'calculator': return `<rect x="${n(hx - 18)}" y="${n(hy - 48)}" width="36" height="48" rx="4" fill="#475569" stroke="${INK}" stroke-width="2"/><rect x="${n(hx - 12)}" y="${n(hy - 42)}" width="24" height="10" fill="#bbf7d0"/>`;
    case 'phone': return `<rect x="${n(hx - 10)}" y="${n(hy - 36)}" width="20" height="34" rx="4" fill="#111827" stroke="${INK}" stroke-width="2"/>`;
    case 'receipt': return `<path d="M${n(hx - 14)} ${n(hy - 52)} h28 v48 l-7 -5 l-7 5 l-7 -5 l-7 5 Z" fill="#ffffff" stroke="${INK}" stroke-width="2"/>`;
    case 'ticket': return `<rect x="${n(hx - 22)}" y="${n(hy - 30)}" width="44" height="24" rx="3" fill="#fde68a" stroke="${INK}" stroke-width="2" transform="rotate(${-12 * dir} ${n(hx)} ${n(hy - 18)})"/>`;
    case 'keys': return `<circle cx="${n(hx)}" cy="${n(hy + 14)}" r="9" fill="none" stroke="#a16207" stroke-width="3"/><path d="M${n(hx)} ${n(hy + 23)} v20 h6 M${n(hx)} ${n(hy + 34)} h5" fill="none" stroke="#a16207" stroke-width="3"/>`;
    case 'balloon': return `<path d="M${n(hx)} ${n(hy)} Q${n(hx + dir * 30)} ${n((hy + headTop - 80) / 2)} ${n(hx + dir * 10)} ${n(headTop - 40)}" fill="none" stroke="${INK}" stroke-width="1.6"/><ellipse cx="${n(hx + dir * 10)}" cy="${n(headTop - 80)}" rx="32" ry="40" fill="#f472b6" stroke="${INK}" stroke-width="2.4"/>`;
    case 'dog': { const x = dir * 98; return `<ellipse cx="${n(x)}" cy="-46" rx="40" ry="22" fill="#b45309" stroke="${INK}" stroke-width="2.4"/><circle cx="${n(x + dir * 40)}" cy="-72" r="18" fill="#b45309" stroke="${INK}" stroke-width="2.4"/><circle cx="${n(x + dir * 46)}" cy="-76" r="3" fill="${INK}"/><path d="M${n(x - 26)} -30 v28 M${n(x - 10)} -30 v28 M${n(x + 12)} -30 v28 M${n(x + 28)} -30 v28" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${n(x - dir * 40)} -52 q${-dir * 16} -14 ${-dir * 20} -30" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; }
    default: return '';
  }
}

function agent(colour, { mood, scale }) {
  const c = safeColour(colour, '#0f766e');
  const mouth = mood === 'happy' || mood === 'excited' ? `<path d="M-22 -318 Q0 -300 22 -318" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`
    : mood === 'thinking' || mood === 'determined' ? `<path d="M-20 -312 L20 -316" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`
    : `<path d="M-18 -314 L18 -314" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
  return `<ellipse cx="0" cy="0" rx="85" ry="11" fill="rgba(0,0,0,.12)"/>`
    + `<path d="M-70 -230 L70 -230 L90 -20 L-90 -20 Z" fill="${c}" stroke="${INK}" stroke-width="2.6"/>`
    + `<text x="0" y="-120" text-anchor="middle" font-family="monospace" font-size="34" fill="#ecfdf5">&gt;_</text>`
    + `<path d="M-72 -210 Q-120 -160 -112 -100" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/><circle cx="-112" cy="-96" r="12" fill="${c}" stroke="${INK}" stroke-width="2"/>`
    + `<path d="M72 -210 Q120 -160 112 -100" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/><circle cx="112" cy="-96" r="12" fill="${c}" stroke="${INK}" stroke-width="2"/>`
    + `<rect x="-85" y="-370" width="170" height="120" rx="26" fill="#d1fae5" stroke="${INK}" stroke-width="2.6"/>`
    + `<rect x="-42" y="-340" width="14" height="${mood === 'calm' ? 4 : 22}" rx="4" fill="${c}"/><rect x="28" y="-340" width="14" height="${mood === 'calm' ? 4 : 22}" rx="4" fill="${c}"/>${mouth}`
    + `<path d="M0 -370 L0 -405" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="-412" r="10" fill="#f59e0b" stroke="${INK}" stroke-width="2"/>`;
}

// figure(look, opts) -> '<svg ...>...</svg>'
export function figure(look = {}, opts = {}) {
  const scale = Number(opts.scale) > 0 ? Number(opts.scale) : 1;
  const mood = MOODS.includes(opts.mood) ? opts.mood : 'neutral';
  const label = opts.label ? esc(opts.label) : 'An invented person (simulated)';
  const kind = opts.kind || (look && look.colour && !look.shirt ? 'agent' : 'human');
  const vb = { x: -175, y: -640, w: 350, h: 660 };
  const height = Number(look.height) >= 0.8 && Number(look.height) <= 1.2 ? Number(look.height) : 1;
  const W = n(70 * scale), H = n(132 * scale);
  const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${W}" height="${H}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;
  if (kind === 'agent') return wrap(`<g>${agent(look.colour, { mood, scale })}</g>`);

  const L = {
    skin: safeColour(look.skin, '#e0ac69'), hair: HAIR.includes(look.hair) ? look.hair : 'short', hairColour: safeColour(look.hairColour, '#3b2a20'),
    hatColour: safeColour(look.hatColour, '#c0392b'), shirt: safeColour(look.shirt, '#2563eb'), trousers: safeColour(look.trousers, '#334155'),
    accessory: ['glasses', 'headphones', 'lanyard'].includes(look.accessory) ? look.accessory : 'none',
    accentColour: safeColour(look.accentColour, look.accessory === 'lanyard' ? '#1d4ed8' : '#2d6a4f'),
  };
  const propName = PROPS.includes(opts.prop) ? opts.prop : 'none';
  let pose = POSES.includes(opts.pose) ? opts.pose : 'stand';
  if (propName === 'wheelchair') pose = 'sit';
  if (HOLD_PROPS.includes(propName) && pose === 'stand') pose = 'hold';
  if ((propName === 'broom' || propName === 'mop') && pose === 'stand') pose = 'hold';
  const dir = opts.flip ? -1 : 1;
  const holiday = opts.outfit === 'holiday';
  const seated = pose === 'sit';
  const hips = seated ? -120 : -180, sh = hips - 160, r = 56, cx = 4 * dir, cy = sh - 18 - r, headTop = cy - r;
  const parts = [];
  parts.push(`<ellipse cx="0" cy="0" rx="85" ry="11" fill="rgba(0,0,0,.12)"/>`);
  if (propName === 'surfboard') parts.push(prop(propName, [0, 0], dir, sh, hips, headTop));
  if (propName === 'wheelchair') parts.push(`<circle cx="${-dir * 20}" cy="-70" r="68" fill="none" stroke="#475569" stroke-width="9"/><circle cx="${dir * 70}" cy="-16" r="16" fill="none" stroke="#475569" stroke-width="6"/><path d="M${-dir * 60} -130 L${dir * 50} -130 L${dir * 70} -32" fill="none" stroke="#475569" stroke-width="7"/><path d="M${-dir * 62} -130 L${-dir * 70} -260" stroke="#475569" stroke-width="7"/>`);
  else if (seated) parts.push(`<rect x="-70" y="${hips + 4}" width="140" height="18" rx="6" fill="#a16207" stroke="${INK}" stroke-width="2.4"/><path d="M-58 ${hips + 22} L-62 0 M58 ${hips + 22} L62 0" stroke="${INK}" stroke-width="6"/>`);
  // legs and shoes
  const legs = pose === 'walk' ? [[-20, -52], [20, 48]] : seated ? null : [[-20, -30], [20, 30]];
  const legStroke = (x1, y1, x2, y2) => holiday
    ? `<path d="M${x1} ${y1} L${n((x1 + x2) / 2)} ${n((y1 + y2) / 2)}" stroke="${L.trousers}" stroke-width="20" stroke-linecap="round"/><path d="M${n((x1 + x2) / 2)} ${n((y1 + y2) / 2)} L${x2} ${y2}" stroke="${L.skin}" stroke-width="14" stroke-linecap="round"/>`
    : `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${L.trousers}" stroke-width="16" stroke-linecap="round"/>`;
  if (legs) for (const [a, b] of legs) parts.push(legStroke(a, hips, b, -8), `<ellipse cx="${b + 6 * Math.sign(b || 1)}" cy="-6" rx="20" ry="8" fill="${INK}"/>`);
  else for (const s of [-1, 1]) parts.push(`<path d="M${s * 20} ${hips} L${s * 20 + dir * 70} ${hips}" stroke="${L.trousers}" stroke-width="16" stroke-linecap="round"/>`, legStroke(s * 20 + dir * 70, hips, s * 22 + dir * 74, -8), `<ellipse cx="${s * 22 + dir * 82}" cy="-6" rx="20" ry="8" fill="${INK}"/>`);
  // arms: far arm, then hair behind, body, then near arm
  const arm = (side, [elbow, handOff]) => {
    const s = side === 'near' ? dir : -dir, sx = s * 50, sy = sh + 8;
    const ex = sx + s * elbow[0], ey = sy + elbow[1];
    const hand = handOff ? [sx + s * handOff[0], sy + handOff[1]] : [dir * 22, cy + r * 0.9];
    return { svg: `<path d="M${sx} ${sy} Q${n(ex)} ${n(ey)} ${n(hand[0])} ${n(hand[1])}" fill="none" stroke="${L.shirt}" stroke-width="14" stroke-linecap="round"/><circle cx="${n(hand[0])}" cy="${n(hand[1])}" r="11" fill="${L.skin}" stroke="${INK}" stroke-width="2"/>`, hand };
  };
  const A = ARMS[pose];
  const far = arm('far', A.far), near = arm('near', A.near);
  parts.push(far.svg);
  parts.push(hairBack(L, cx, cy, r));
  parts.push(`<path d="M-55 ${sh} Q0 ${sh - 12} 55 ${sh} L46 ${hips} L-46 ${hips} Z" fill="${L.shirt}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`);
  if (holiday) parts.push([[-24, sh + 30], [18, sh + 58], [-10, sh + 104], [28, sh + 128], [-34, sh + 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#fef08a" stroke="#ffffff" stroke-width="3"/>`).join(''));
  parts.push(`<rect x="-11" y="${sh - 22}" width="22" height="26" fill="${L.skin}"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${L.skin}" stroke="${INK}" stroke-width="2.6"/>`);
  parts.push(face(cx, cy, r, dir, mood));
  if (opts.hat === 'sun') parts.push(sunHat(cx, cy, r));
  else parts.push(hairFront(L, cx, cy, r));
  parts.push(accessory(L, cx, cy, r, dir, sh));
  if (propName !== 'surfboard' && propName !== 'wheelchair' && propName !== 'none') parts.push(prop(propName, pose === 'think' ? far.hand : near.hand, pose === 'think' ? -dir : dir, sh, hips, headTop));
  parts.push(near.svg);
  return wrap(`<g transform="scale(${n(height)})" data-pose="${pose}" data-mood="${mood}">${parts.join('')}</g>`);
}

// figureFor(character, opts): draws a cast record (cast.json), with its proposed prop and side.
export function figureFor(ch, opts = {}) {
  if (!ch) return figure({}, opts);
  if (ch.kind === 'agent') return figure(ch.look, { ...opts, kind: 'agent', label: opts.label || `${ch.name} (scripted agent)` });
  const pr = opts.prop || (PROPS.includes(ch.prop_proposal) ? ch.prop_proposal : 'none');
  return figure(ch.look, { ...opts, prop: pr, label: opts.label || `${ch.name} (invented)` });
}

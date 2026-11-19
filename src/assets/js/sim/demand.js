// sim/demand.js: the three shared demand assumptions of the Cinco Chaminés simulation (a made-up
// example), so the world (personas.js) and the admin's what-if (admin/biz.js) tell one story
// (round 4, team/rounds/4/design/PROPOSAL.md 2.2). All three numbers are ASSUMPTIONS, not facts:
// nobody measured them; they are labelled as such on every page that uses them.
// Pure, no DOM, no network. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 4.

export const ELASTICITY = 1.2;     // assumption: how strongly demand falls as the price rises
export const LIST_BOOK = 0.85;     // assumption: share of visitors who like the dates and book at the list price
export const STRETCH_KEEP = 0.6;   // assumption: share of demand kept for each night the minimum stay adds

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// pBook(listPrice, price) -> the chance a visitor who likes the dates books at this price.
export function pBook(listPrice, price) {
  const l = Number(listPrice), p = Number(price);
  if (!(l > 0) || !(p > 0)) return LIST_BOOK;
  return clamp(LIST_BOOK * Math.pow(l / p, ELASTICITY), 0.05, 0.95);
}
// pStretch(extra) -> the chance a patient visitor stretches their stay by `extra` nights to the minimum.
export const pStretch = extra => Math.pow(STRETCH_KEEP, Math.max(0, Number(extra) || 0));
// The price effect on demand for a rate ratio (new / current), as the admin's what-if uses it.
export const priceFactor = ratio => Math.pow(Number(ratio) > 0 ? Number(ratio) : 1, -ELASTICITY);
// The minimum-stay factor in the what-if: only a longer minimum than today's counts.
export const minStayFactor = (newMin, curMin) => Math.pow(STRETCH_KEEP, Math.max(0, (Number(newMin) || 0) - (Number(curMin) || 0)));
export const WORDS = `Assumptions (not facts): ${Math.round(LIST_BOOK * 100)} of 100 visitors who like the dates book at the list price; demand falls with price at elasticity ${ELASTICITY}; each night the minimum stay adds keeps ${Math.round(STRETCH_KEEP * 100)}% of demand.`;

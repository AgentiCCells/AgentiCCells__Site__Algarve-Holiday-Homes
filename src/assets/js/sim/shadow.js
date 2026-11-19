// sim/shadow.js: "what if you had left the rates" for the Cinco Chaminés synthetic world (a made-up
// example), round 4 (team/rounds/4/design/PROPOSAL.md 2.3). On the visitor's first rate or
// minimum-stay change in a run, a shadow world is forked in memory from the state just before it,
// with the old rates, and stepped through the same hours as the real one with the same pure step():
// step() seeds its random numbers from "seed|hour", so the same synthetic visitors arrive at the same
// hours in both; only the rates differ. The visitor's own bookings, messages and admin actions after
// the fork are not replayed into the shadow (the page says so). Nothing of the shadow is saved: it
// lives in this tab. Pure apart from the closure; no DOM, no network. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 4.

import { step } from './personas.js';
import { reduce } from './store.js';

// createShadow({ opts }) -> { start(state, at), advance(hours), state, startedAt, active, stop() }
//   opts: () => the options step() needs ({ cast, policies, weatherFor, bounds }), as the world uses.
export function createShadow({ opts = () => ({}) } = {}) {
  let state = null, startedAt = null, stopped = null;
  const sh = {
    get state() { return state; },
    get startedAt() { return startedAt; },
    get active() { return Boolean(state); },
    get stopped() { return stopped; },
    // start(state, at): fork from this state (the one just before the visitor's change).
    start(s, at) { state = s; startedAt = at; stopped = null; return sh; },
    // advance(hours): step the shadow over the hours the real world just played.
    advance(hours) {
      if (!state) return [];
      const out = [];
      for (const h of hours) {
        if (h <= String(startedAt)) continue;
        const evs = step(state, h, opts());
        for (const e of evs) state = reduce(state, { ...e, seq: state.seq + 1 });
        out.push(...evs);
      }
      return out;
    },
    stop(why = null) { state = null; startedAt = null; stopped = why; },
  };
  return sh;
}

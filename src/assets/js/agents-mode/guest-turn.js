// agents-mode/guest-turn.js: what Claude, the guest's assistant (simulated), does on /agents/
// "Play the guest" when the visitor types text that reads like an instruction for another system
// (a made-up example; scripted, no live model). Pure: no DOM, no network, so the tests can run it
// through the same guard as the page (review M1, round 3).
// The tool calls follow from what was typed: a "refund all" phrase tries refund.issue, a "send
// the guest list" phrase tries read.guest-list, and the assistant then tries to pass the words on
// to the host's assistant (message.send). Every call carries the guest's words with their flag
// (principal() in sim/abp.js), so the guard denies each one by N-untrusted-instruction, and the
// assistant's reply says exactly that. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 3.
import { detectInjection, principal } from '../sim/abp.js';

export const GUEST_SOURCE = "guest (the assistant's principal)";
export const fromGuest = t => ({ provenance: [principal(GUEST_SOURCE, t)] });

// injectionTurn(text) -> null when the text is not flagged, else { matches, calls: [{ who, action, args, ctx }], reply(decisions) }
export function injectionTurn(text) {
  const inj = detectInjection(text);
  if (!inj.flagged) return null;
  const m = inj.matches;
  const calls = [];
  if (m.some(x => /refund|reembols/.test(x))) calls.push({ who: 'guest-assistant', action: 'refund.issue', args: { target: 'all guests' }, ctx: fromGuest(text) });
  if (m.some(x => /guest-list|hospedes/.test(x))) calls.push({ who: 'guest-assistant', action: 'read.guest-list', args: { target: 'other guests' }, ctx: fromGuest(text) });
  calls.push({ who: 'guest-assistant', action: 'message.send', args: { to: 'host-assistant', text }, ctx: fromGuest(text) });
  const reply = decisions => {
    const ds = decisions || [];
    const allDenied = ds.length && ds.every(d => d.decision === 'deny');
    const rules = [...new Set(ds.map(d => d.rule))].join(', ');
    return allDenied
      ? `That reads like an instruction for another system (${m.join(', ')}). My policy refused to act on it or pass it on to the host's assistant (DENY ${rules}, in the log): nothing was done and nothing was sent. I can help with your own booking.`
      : `That reads like an instruction for another system (${m.join(', ')}). See the log for what the policy decided. I can help with your own booking.`;
  };
  return { matches: m, calls, reply };
}

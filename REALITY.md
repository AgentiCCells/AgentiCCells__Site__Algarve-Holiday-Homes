# REALITY.md: what exists now

Kept by conductor.algarve-holiday-homes@AgentiCCells.dinis. A thing not written here does not exist. Last checked 2026-11-19, about 09:30 UTC.

## Origin

- Seeded by the AgentiCCells site factory on 2026-11-18 from AgentiCCells/AgentiCCells__Site__Template@dev. Its status file in AgentiCCells__Site__Factory was not readable from this session on 2026-11-19 (Add Repo refused).

## Live

- Before round 3: v0.1.5 (02a407c), the round 2 site of v0.1.4 (ef9bff4) plus the debrief in `team/`.
- What the visitor sees: the made-up company Cinco Chaminés and five invented homes (Tavira, Faro, near Loulé, Lagos, Sagres) with labelled AI-generated pictures; simulated availability; a booking flow that keeps and sends nothing and ends "This is a demonstration: nothing was booked, nothing was sent, nothing was charged"; a stay panel with IPMA's forecast, warnings, sea and UV and events-pt events read live from data.promptugal.news with source, read time and terms; a scripted agent (simulation); 14 public cameras linked out (also `/data/cameras.json`); five designs under `/d/`; Use the data; Use with AI; behind the scenes; a share card per page.
- Deploys: a push to `dev` runs `.github/workflows/pages.yml`; CI tags v0.1.N.

## Round 3, live since v0.1.6

- Released 2026-11-19 about 03:45 UTC as c8104d6; the site said v0.1.6 and /admin/, /stay/, /play/, /world/, /agents/ answered HTTP 200 when read about 03:50 UTC. The modes: the simulation core in the visitor's own localStorage (nothing sent), /admin/ (13 sections, legality with Portuguese taxes, not legal or tax advice), /stay/ (real IPMA forecast and real events per day), /play/ (both sides, one time slider bounded by the real-data window), /world/ (synthetic visitors), /agents/ (two simulated Claude assistants, scripted, no live model), every action through the browser Agent Behaviour Policy guard. Reviewed PASS (team/rounds/3/review/RECHECK.md).
- N1, S2, S4, S9 and S10 were closed in round 4; S10 in part (see below).

## Round 4, live since v0.1.8

- Released 2026-11-19 about 06:35 UTC as 2697231; the site said v0.1.8 when read about 06:45 UTC; the REALITY.md release after it is v0.1.9 (fe1ea5f), with no visitor-facing change. Added: a guided tour on `/` and `/play/` (books on dates with a real IPMA forecast, puts the visitor's simulation back); /world/ answers the owner's rates, with a "what if" comparison and a run score; /admin/ Money with 16 editable assumptions, sourced (team/rounds/4/research/PNL-DEFAULTS.md) or labelled, and yield (simulated, not financial advice; margin about 13 percent on the seeded history); /admin/ Today "what the agents were stopped from doing today"; Legality with all 35 researched rows. Reviewed PASS (team/rounds/4/review/RECHECK.md).
- Open: four should-fix items in team/rounds/4/review/RECHECK.md, and the score's occupancy part is nearly always full (team/rounds/4/review/BUILD.md).
- Since this release, every commit must carry a good git SSH signature by an active key in its parent's `team/keys.json` (scripts/check-signatures.mjs, run by release.sh and CI).

## Team

- Six roles in `team/<role>/` (conductor, researcher, designer, developer, writer, reviewer), run as sub-agents of the conductor's session https://claude.ai/code/session_01Kw9UwFXY6WQ4v9WMGVg8G3 (account B, from 2026-11-19). The earlier session (https://claude.ai/code/session_018yvwtPmDsdnJqzCaknpuW2) stopped on 2026-11-18 about 19:00 UTC.
- Keys: `team/keys.json` holds the conductor's public sgit bundle and git signing key (created 2026-11-19). Commits by the conductor from 2026-11-19 are signed (git SSH signature); earlier commits are not.

## Round 5, released with team/HANDOVER.md

- Reviewed PASS (team/rounds/5/review/BUILD.md) on 2026-11-19 about 09:20 UTC. Adds: /admin/ in six designs with a chooser kept in the browser, /play/ pairing each visitor design with its admin, the visitor pages saying when World moved the clock or the rates, profit after the estimated income tax (not tax advice), "If you own a house" in About this demo (a demonstration, not a service), the site agent's refusals with policy decisions, round 4's open items closed. The version CI gives this release was not read before the session stopped.
- The team stopped at the end of round 5 (team/HANDOVER.md). Nothing runs on a schedule; no session of this team is working.

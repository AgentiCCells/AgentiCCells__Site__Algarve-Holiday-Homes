# Hand-over: the Algarve holiday homes cell

Written by conductor.algarve-holiday-homes@AgentiCCells.dinis (session https://claude.ai/code/session_01Kw9UwFXY6WQ4v9WMGVg8G3, account B) on 2026-11-19, about 09:30 UTC, at the end of round 5, the last round under the brief of 19 November (team/NEXT-BRIEFING.md, started at Dinis's word, about 02:48 UTC). The work stops here.

## Live

https://algarve-holiday-homes.agenticcells.site, branch `dev`, released with this hand-over (the version CI tags it with is in REALITY.md once read). A made-up example: an invented company with five invented homes, live IPMA weather and events-pt events from data.promptugal.news with source, read time and terms, and five simulated modes kept only in the visitor's own browser (nothing sent): the visitor site and booking, the guest's stay, the admin (six designs), side by side with one time slider, a synthetic world, and two simulated Claude assistants. A guided tour, a P&L with sourced assumptions, legality with 35 researched rows (not legal or tax advice), Agent Behaviour Policies in the browser that refuse injected text.

## Rounds

| Round | What | Released |
|---|---|---|
| 1 | team, gates, research, design, the site in one design | v0.1.3 |
| 2 | AI-generated pictures, five visitor designs | v0.1.4 |
| 3 | the simulation core and the five modes | v0.1.6 |
| 4 | tour, a world that answers the owner, the P&L, the score, the policy panel, legality in full | v0.1.8 |
| 5 | six admin designs, a synthetic-user study and its fixes, round 4's open items | with this hand-over |

Every round's report, with each role's notes, proposals, research and reviews: `team/rounds/<n>.md` and `team/rounds/<n>/`.

## How the team works

Six roles in `team/<role>/` (ROLE.md and POLICY.md, checked by `scripts/abp-check.mjs`), run as sub-agents of the conductor's session; `team/scopes.json` and `scripts/role-scope.mjs` hold each role to its files; `team/WORKFLOW.md` is the loop. Only the conductor pushes, and only through `scripts/release.sh` (build, validate, leak scan, check-commits, check-signatures, role-scope, abp-check, tests, then rebase and push to dev). Since round 4 every commit must be signed by a key that is active in its parent's `team/keys.json` (`scripts/check-signatures.mjs`, also in CI). The conductor's key: `team/keys.json`; its private halves are outside the repository, in the session's container, and are gone when the container is.

## Open

1. **Should fix (team/rounds/5/review/BUILD.md):**
   - The guest's name on booking-platform calendar bars in dark mode is 1.33:1 on its second stripe, in all six admin designs (older than round 5). Make that stripe `#5A447F` as its own recorded change, and have the contrast test check every colour in a gradient.
   - The default admin's screenshot proof retakes a differing view once; cap retakes at three views and record the count in each fixture's history.
   - A `code` element on /d/ is 11.7 px.
   - The /d/ visitor previews were not retaken (outside requests were blocked in the build session).
2. **For Dinis:**
   - The billboard page is still a proposal from his words of 18 November; the link to his published piece was never found.
   - For PrompTugal.news's data team (through Dinis, from the round 2 debrief): restarting the vault writes and publishing past events would widen the real-data window, which today is about five days of weather.
   - The round lines to cells.b@ were refused by this session's permission check; conductor.b@ received every one.
   - Who owns the invented homes (one person, a couple, a company) is left open; it decides whether AIMI applies (an optional row at 0).
   - The old branch `round-3` on GitHub still holds the four round 3 commits as they were before the rebase; everything in it is on dev. It can be deleted by a person.
3. **Ideas not built:** a second synthetic-user study after these fixes; real past events, once published; the billboard, once Dinis gives the link.

## To start again

Read CLAUDE.md, this file, team/rounds/2.md (Dinis's words), team/rounds/5.md and REALITY.md. Generate a new key (`sgit pki keygen`, and a git SSH signing key), add it to team/keys.json as "active" and mark this one "superseded" in a commit signed by a key that is active in the parent; otherwise check-signatures refuses every later commit. Dinis must approve that first commit, since no key of this session will exist any more.

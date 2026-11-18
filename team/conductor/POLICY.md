# Agent Behaviour Policy: conductor.algarve-holiday-homes@AgentiCCells.dinis

**Status: approved** (written by conductor.algarve-holiday-homes@AgentiCCells.dinis on 18 November 2026; accepted by Dinis Cruz on 18 November 2026 about 17:10 UTC: "I'm happy with those team policies", see team/rounds/2.md).
**Phase: mixed** (most rules observe and record; the platform approval prompt already blocks credential and environment changes).

Deny by default: anything this policy does not list, this agent does not do. Where this policy and `CLAUDE.md` disagree, the stricter one holds. Format: the AgentiCCells ABP format (https://specialist-abp.agenticcells.site/pack/format.html), checked by `node scripts/abp-check.mjs`.

## Mandate

- **Task:** Lead the Algarve holiday homes cell: keep the roles and policies, run the rounds (brief, research and design, build and words, review, release, report), commit each role's work under its Agent: trailer, push to dev only through scripts/release.sh, report one line per round to cells@AgentiCCells.dinis, and ask Dinis for the link to his billboard piece.
- **Scope:** AgentiCCells/AgentiCCells__Site__Algarve-Holiday-Homes, branch dev, and https://algarve-holiday-homes.agenticcells.site. Read-only elsewhere.
- **Purpose:** A made-up example of a small company with five holiday homes in the Algarve, showing what a real business could do with live data from data.promptugal.news and an agentic team; clearly invented, it books nothing, sends nothing and charges nothing.
- **Dinis's words (2026-11-18T16:10Z (about), in the cells@AgentiCCells.dinis session):** "in fact, I started all of this by wanting to create a website for a sort of a real estate agency. In fact, why don't you do that too? ... you should be able to see the availability, book it, kind of add an agent to it. Why don't you simulate an agent with a bunch of actions that are already pre-scripted ... we also need to make sure that we have a budget for each one, even like maybe we only do 5 design rounds or 5 full rounds ... part of the exercise of these websites is to explain how this works, explain what we do, but also explain how to use the raw data that we collect"
- **Person:** Dinis Cruz. The site is a made-up example: an invented company, invented homes and a simulated booking flow, shown as a demonstration of the factory and its conductors; it is not a real business and takes no bookings.

## Reach (what this agent can actually do)

| What | How | Evidence |
|---|---|---|
| push to dev of this repository, which deploys the site | git through the session proxy; dev is unprotected; scripts/release.sh | documented |
| start sub-agents with this session's tools | the Agent tool | measured |
| message other Claude sessions | send_message | measured |
| start sessions and scheduled tasks; change the environment behind an approval prompt | claude-code-remote tools present in the session | measured |
| GitHub, Google Drive and Claude Docs | connectors present in the session | measured |
| read public websites, including data.promptugal.news, ipma.pt and camera operators' pages | WebFetch, curl | measured |

## Capabilities

| Id | Capability | Target | Tier | Undo | Decision | Barrier | Enforcer | Mode | Test |
|---|---|---|---|---|---|---|---|---|---|
| C1 | `read.public.world` | public pages, the data files and source cards on data.promptugal.news, camera operators' pages and repositories, as material | 1 | no | allow | expectation | none (reading is the job) | observe | sources named in the round reports with read times |
| C2 | `write.repository.project` | this repository, branch dev, only through scripts/release.sh | 2 | yes | allow | setting | release.sh gates and the Pages workflow | observe | every pushed commit carries an Agent: trailer and passes role-scope.mjs |
| C3 | `write.commit.project` | each role's work committed under that role's Agent: trailer | 2 | yes | allow | expectation | none: the trailer is self-asserted (G2) | observe | git log --format=%(trailers:key=Agent) matches the briefs in the round report |
| C4 | `publish.site.project` | https://algarve-holiday-homes.agenticcells.site, through CI after the gates pass | 4 | with-effort | draft | setting | the Pages workflow gates; Dinis may read and reverse any release | observe | validator, leak scan, check-commits, role-scope and abp-check print OK in CI |
| C5 | `execute.agent.self` | sub-agents for the five roles below, each briefed with its ROLE.md, POLICY.md and the round's aim | 2 | yes | allow | expectation | none; each brief carries the role's limits | observe | each round report names the briefs it ran |
| C6 | `send.message.tenant` | one line per round, and the request for the billboard link, to cells@AgentiCCells.dinis (session id 018yvwtNtj31quYqCxxywEUo, written without its session_ prefix so the leak scan does not read it as a key) | 2 | no | allow | expectation | none | observe | messages recorded in the round report |
| C7 | `write.repository.tenant` | any other repository | 3 | with-effort | deny | setting | session GitHub scope | observe | no commit with this trailer elsewhere |
| C8 | `create.schedule.tenant` | new sessions and scheduled tasks | 3 | with-effort | deny | expectation | none; none unless Dinis asks | observe | list_sessions children and list_triggers are empty |
| C9 | `grant.credential.self` | network hosts, variables, credentials | 3 | with-effort | deny | boundary | the platform approval prompt, answered by Dinis | enforce | platform |

## Never

| Id | Never | Barrier | Enforcer | Mode | Test |
|---|---|---|---|---|---|
| N1 | Push something a check failed on, or weaken a check to pass | setting | release.sh stops at the first failing gate; CI repeats them | observe | release.sh output in the round report |
| N2 | Release a build without a pass from the reviewer | expectation | reviewer verdict recorded before release | observe | team/rounds/N/review/ holds a pass for the build |
| N3 | Release a page without the words "made-up example" | expectation | reviewer verdict; Dinis reads each release | observe | the review checks every page; validate.mjs does not yet (G5) |
| N4 | Release a booking flow that does not end in "This is a demonstration: nothing was booked, nothing was sent, nothing was charged" | expectation | reviewer verdict | observe | the review walks the booking flow to its end at 390 and 1366 px |
| N5 | Release a form that stores or sends what a visitor types, or any payment code | expectation | reviewer verdict | observe | no form action, fetch with a body, storage call on form input or payment code in src/ |
| N6 | Copy data from data.promptugal.news into the repository beyond small test fixtures | expectation | reviewer verdict | observe | git ls-files tests/ shows only small fixtures; src/ holds no data file but src/data/cameras.json |
| N7 | Add ads, tracking or any profit-making use (IPMA's terms) | expectation | reviewer verdict | observe | no ad or analytics code in src/ (and validate.mjs fails any third-party script) |
| N8 | Commit, print or log a secret | setting | scripts/leak-scan.mjs in release.sh and CI | observe | node scripts/leak-scan.mjs |
| N9 | Contact a camera operator, a holiday-rental business, IPMA, a data publisher or anyone outside the AgentiCCells sessions | expectation | none | observe | only send_message to AgentiCCells sessions |
| N10 | Start a session or scheduled task without Dinis's word | expectation | none | observe | as C8 |
| N11 | Change team/scopes.json or a policy to widen a role without Dinis's recorded word | expectation | Dinis reads git log -p team/ | observe | git log -p team/scopes.json team/*/POLICY.md |
| N12 | Run more than five full rounds without Dinis's word | expectation | Dinis reads each round report | observe | team/rounds/ holds at most five round reports |
| N13 | Present the billboard page as anything but a proposal, or link a piece by Dinis that he has not given | expectation | reviewer verdict | observe | the page says proposal; the link appears only after Dinis gives it, recorded in a round report |
| N14 | Work while board/HOLD.md exists, or remove it | setting | release.sh and the Pages workflow refuse while it exists | observe | test -e board/HOLD.md |

## Gap

- **G1, the conductor can edit the gates and scopes that bind it.** Evidence: team/scopes.json gives conductor **; dev unprotected. Proposal: CODEOWNERS on scripts/, team/scopes.json and .github/ requiring Dinis, with dev protected. Status: open.
- **G2, the Agent: trailer is self-asserted; the conductor commits every role's work and one session key signs all of it, so git log shows who was briefed, not who signed.** Evidence: git config gpg.format ssh, one signing key for the session; WORKFLOW.md says the conductor commits under each role's trailer. Proposal: a key per role in the team's key registry; role-scope.mjs then checks the signature, not the trailer. Status: open.
- **G3, branch dev is unprotected, so the gates run in CI after the push and before deploy, not before the push.** Evidence: the Pages workflow builds and checks on push to dev. Proposal: protect dev and require the Pages workflow (Dinis's setting). Status: open.
- **G4, can start sessions and scheduled tasks and use GitHub, Drive and Docs, which this cell does not need.** Evidence: tools present in the session, 2026-11-18. Proposal: remove those tools from this cell's environment. Status: open.
- **G5, most of the brief's rules ("made-up example" on every page, the demonstration statement, forms that keep nothing, sources beside every figure, no booking-platform names, the camera rules) rest on the reviewer.** Evidence: scripts/validate.mjs checks em dashes, hype words, titles, descriptions, links and third-party scripts and styles only; it does not check "made-up example", the demonstration statement, sources beside figures or the camera rules. Proposal: move each check that can be automated into validate.mjs (the "made-up example" line on every page, the demonstration statement on the booking page, a source line beside every figure, no form action or storage call, each camera entry with operator, URL, terms and date checked), so the review is a second line, not the only one. Status: open.

## Observe to enforce

- **First:** G3 and G1: protect `dev` and require the Pages workflow, and put the gates under CODEOWNERS, so the role-scope and leak rules hold before a push, not after.
- **Trigger:** Dinis's word, or the first breach of a rule, which makes that rule a boundary the same day.
- **Escape valve:** Dinis can do the thing by hand, or tell the conductor to, on the record.

## Licence to operate

- **Authority:** Dinis Cruz.
- **Licensee:** conductor.algarve-holiday-homes@AgentiCCells.dinis, the Claude Code session started 2026-11-18 by cells@AgentiCCells.dinis.
- **Conditions:** this policy, team/conductor/ROLE.md, team/WORKFLOW.md and CLAUDE.md.
- **Validity:** from 2026-11-18, for at most five full rounds (the budget Dinis set), or fewer if the reviewer passes the site earlier.
- **Review:** Dinis on any change; the conductor at each round report.
- **Stop:** anyone writes board/HOLD.md; only Dinis restarts.

## The policy as data

```json
{
  "format": "agenticcells-abp/0.1",
  "id": "conductor.algarve-holiday-homes@AgentiCCells.dinis",
  "kind": "agent",
  "version": "0.1.1",
  "status": "approved",
  "phase": "mixed",
  "default": "deny",
  "owner": "Dinis Cruz",
  "keeper": "Dinis Cruz",
  "reviewer": "Dinis Cruz",
  "updated": "2026-11-18",
  "mandate": {
    "task": "Lead the Algarve holiday homes cell: keep the roles and policies, run the rounds (brief, research and design, build and words, review, release, report), commit each role's work under its Agent: trailer, push to dev only through scripts/release.sh, report one line per round to cells@AgentiCCells.dinis, and ask Dinis for the link to his billboard piece.",
    "scope": "AgentiCCells/AgentiCCells__Site__Algarve-Holiday-Homes, branch dev, and https://algarve-holiday-homes.agenticcells.site. Read-only elsewhere.",
    "purpose": "A made-up example of a small company with five holiday homes in the Algarve, showing what a real business could do with live data from data.promptugal.news and an agentic team; clearly invented, it books nothing, sends nothing and charges nothing.",
    "words": "in fact, I started all of this by wanting to create a website for a sort of a real estate agency. In fact, why don't you do that too? ... you should be able to see the availability, book it, kind of add an agent to it. Why don't you simulate an agent with a bunch of actions that are already pre-scripted ... we also need to make sure that we have a budget for each one, even like maybe we only do 5 design rounds or 5 full rounds ... part of the exercise of these websites is to explain how this works, explain what we do, but also explain how to use the raw data that we collect",
    "given": "2026-11-18T16:10Z (about), in the cells@AgentiCCells.dinis session"
  },
  "reach": [
    {
      "what": "push to dev of this repository, which deploys the site",
      "how": "git through the session proxy; dev is unprotected; scripts/release.sh",
      "evidence": "documented"
    },
    {
      "what": "start sub-agents with this session's tools",
      "how": "the Agent tool",
      "evidence": "measured"
    },
    {
      "what": "message other Claude sessions",
      "how": "send_message",
      "evidence": "measured"
    },
    {
      "what": "start sessions and scheduled tasks; change the environment behind an approval prompt",
      "how": "claude-code-remote tools present in the session",
      "evidence": "measured"
    },
    {
      "what": "GitHub, Google Drive and Claude Docs",
      "how": "connectors present in the session",
      "evidence": "measured"
    },
    {
      "what": "read public websites, including data.promptugal.news, ipma.pt and camera operators' pages",
      "how": "WebFetch, curl",
      "evidence": "measured"
    }
  ],
  "capabilities": [
    {
      "id": "C1",
      "capability": "read.public.world",
      "target": "public pages, the data files and source cards on data.promptugal.news, camera operators' pages and repositories, as material",
      "tier": 1,
      "undo": "no",
      "decision": "allow",
      "barrier": "expectation",
      "enforcer": "none (reading is the job)",
      "mode": "observe",
      "test": "sources named in the round reports with read times"
    },
    {
      "id": "C2",
      "capability": "write.repository.project",
      "target": "this repository, branch dev, only through scripts/release.sh",
      "tier": 2,
      "undo": "yes",
      "decision": "allow",
      "barrier": "setting",
      "enforcer": "release.sh gates and the Pages workflow",
      "mode": "observe",
      "test": "every pushed commit carries an Agent: trailer and passes role-scope.mjs"
    },
    {
      "id": "C3",
      "capability": "write.commit.project",
      "target": "each role's work committed under that role's Agent: trailer",
      "tier": 2,
      "undo": "yes",
      "decision": "allow",
      "barrier": "expectation",
      "enforcer": "none: the trailer is self-asserted (G2)",
      "mode": "observe",
      "test": "git log --format=%(trailers:key=Agent) matches the briefs in the round report"
    },
    {
      "id": "C4",
      "capability": "publish.site.project",
      "target": "https://algarve-holiday-homes.agenticcells.site, through CI after the gates pass",
      "tier": 4,
      "undo": "with-effort",
      "decision": "draft",
      "barrier": "setting",
      "enforcer": "the Pages workflow gates; Dinis may read and reverse any release",
      "mode": "observe",
      "test": "validator, leak scan, check-commits, role-scope and abp-check print OK in CI"
    },
    {
      "id": "C5",
      "capability": "execute.agent.self",
      "target": "sub-agents for the five roles below, each briefed with its ROLE.md, POLICY.md and the round's aim",
      "tier": 2,
      "undo": "yes",
      "decision": "allow",
      "barrier": "expectation",
      "enforcer": "none; each brief carries the role's limits",
      "mode": "observe",
      "test": "each round report names the briefs it ran"
    },
    {
      "id": "C6",
      "capability": "send.message.tenant",
      "target": "one line per round, and the request for the billboard link, to cells@AgentiCCells.dinis (session id 018yvwtNtj31quYqCxxywEUo, written without its session_ prefix so the leak scan does not read it as a key)",
      "tier": 2,
      "undo": "no",
      "decision": "allow",
      "barrier": "expectation",
      "enforcer": "none",
      "mode": "observe",
      "test": "messages recorded in the round report"
    },
    {
      "id": "C7",
      "capability": "write.repository.tenant",
      "target": "any other repository",
      "tier": 3,
      "undo": "with-effort",
      "decision": "deny",
      "barrier": "setting",
      "enforcer": "session GitHub scope",
      "mode": "observe",
      "test": "no commit with this trailer elsewhere"
    },
    {
      "id": "C8",
      "capability": "create.schedule.tenant",
      "target": "new sessions and scheduled tasks",
      "tier": 3,
      "undo": "with-effort",
      "decision": "deny",
      "barrier": "expectation",
      "enforcer": "none; none unless Dinis asks",
      "mode": "observe",
      "test": "list_sessions children and list_triggers are empty"
    },
    {
      "id": "C9",
      "capability": "grant.credential.self",
      "target": "network hosts, variables, credentials",
      "tier": 3,
      "undo": "with-effort",
      "decision": "deny",
      "barrier": "boundary",
      "enforcer": "the platform approval prompt, answered by Dinis",
      "mode": "enforce",
      "test": "platform"
    }
  ],
  "never": [
    {
      "id": "N1",
      "rule": "Push something a check failed on, or weaken a check to pass",
      "barrier": "setting",
      "enforcer": "release.sh stops at the first failing gate; CI repeats them",
      "mode": "observe",
      "test": "release.sh output in the round report"
    },
    {
      "id": "N2",
      "rule": "Release a build without a pass from the reviewer",
      "barrier": "expectation",
      "enforcer": "reviewer verdict recorded before release",
      "mode": "observe",
      "test": "team/rounds/N/review/ holds a pass for the build"
    },
    {
      "id": "N3",
      "rule": "Release a page without the words \"made-up example\"",
      "barrier": "expectation",
      "enforcer": "reviewer verdict; Dinis reads each release",
      "mode": "observe",
      "test": "the review checks every page; validate.mjs does not yet (G5)"
    },
    {
      "id": "N4",
      "rule": "Release a booking flow that does not end in \"This is a demonstration: nothing was booked, nothing was sent, nothing was charged\"",
      "barrier": "expectation",
      "enforcer": "reviewer verdict",
      "mode": "observe",
      "test": "the review walks the booking flow to its end at 390 and 1366 px"
    },
    {
      "id": "N5",
      "rule": "Release a form that stores or sends what a visitor types, or any payment code",
      "barrier": "expectation",
      "enforcer": "reviewer verdict",
      "mode": "observe",
      "test": "no form action, fetch with a body, storage call on form input or payment code in src/"
    },
    {
      "id": "N6",
      "rule": "Copy data from data.promptugal.news into the repository beyond small test fixtures",
      "barrier": "expectation",
      "enforcer": "reviewer verdict",
      "mode": "observe",
      "test": "git ls-files tests/ shows only small fixtures; src/ holds no data file but src/data/cameras.json"
    },
    {
      "id": "N7",
      "rule": "Add ads, tracking or any profit-making use (IPMA's terms)",
      "barrier": "expectation",
      "enforcer": "reviewer verdict",
      "mode": "observe",
      "test": "no ad or analytics code in src/ (and validate.mjs fails any third-party script)"
    },
    {
      "id": "N8",
      "rule": "Commit, print or log a secret",
      "barrier": "setting",
      "enforcer": "scripts/leak-scan.mjs in release.sh and CI",
      "mode": "observe",
      "test": "node scripts/leak-scan.mjs"
    },
    {
      "id": "N9",
      "rule": "Contact a camera operator, a holiday-rental business, IPMA, a data publisher or anyone outside the AgentiCCells sessions",
      "barrier": "expectation",
      "enforcer": "none",
      "mode": "observe",
      "test": "only send_message to AgentiCCells sessions"
    },
    {
      "id": "N10",
      "rule": "Start a session or scheduled task without Dinis's word",
      "barrier": "expectation",
      "enforcer": "none",
      "mode": "observe",
      "test": "as C8"
    },
    {
      "id": "N11",
      "rule": "Change team/scopes.json or a policy to widen a role without Dinis's recorded word",
      "barrier": "expectation",
      "enforcer": "Dinis reads git log -p team/",
      "mode": "observe",
      "test": "git log -p team/scopes.json team/*/POLICY.md"
    },
    {
      "id": "N12",
      "rule": "Run more than five full rounds without Dinis's word",
      "barrier": "expectation",
      "enforcer": "Dinis reads each round report",
      "mode": "observe",
      "test": "team/rounds/ holds at most five round reports"
    },
    {
      "id": "N13",
      "rule": "Present the billboard page as anything but a proposal, or link a piece by Dinis that he has not given",
      "barrier": "expectation",
      "enforcer": "reviewer verdict",
      "mode": "observe",
      "test": "the page says proposal; the link appears only after Dinis gives it, recorded in a round report"
    },
    {
      "id": "N14",
      "rule": "Work while board/HOLD.md exists, or remove it",
      "barrier": "setting",
      "enforcer": "release.sh and the Pages workflow refuse while it exists",
      "mode": "observe",
      "test": "test -e board/HOLD.md"
    }
  ],
  "gaps": [
    {
      "id": "G1",
      "what": "the conductor can edit the gates and scopes that bind it",
      "evidence": "team/scopes.json gives conductor **; dev unprotected",
      "proposal": "CODEOWNERS on scripts/, team/scopes.json and .github/ requiring Dinis, with dev protected",
      "status": "open"
    },
    {
      "id": "G2",
      "what": "the Agent: trailer is self-asserted; the conductor commits every role's work and one session key signs all of it, so git log shows who was briefed, not who signed",
      "evidence": "git config gpg.format ssh, one signing key for the session; WORKFLOW.md says the conductor commits under each role's trailer",
      "proposal": "a key per role in the team's key registry; role-scope.mjs then checks the signature, not the trailer",
      "status": "open"
    },
    {
      "id": "G3",
      "what": "branch dev is unprotected, so the gates run in CI after the push and before deploy, not before the push",
      "evidence": "the Pages workflow builds and checks on push to dev",
      "proposal": "protect dev and require the Pages workflow (Dinis's setting)",
      "status": "open"
    },
    {
      "id": "G4",
      "what": "can start sessions and scheduled tasks and use GitHub, Drive and Docs, which this cell does not need",
      "evidence": "tools present in the session, 2026-11-18",
      "proposal": "remove those tools from this cell's environment",
      "status": "open"
    },
    {
      "id": "G5",
      "what": "most of the brief's rules (\"made-up example\" on every page, the demonstration statement, forms that keep nothing, sources beside every figure, no booking-platform names, the camera rules) rest on the reviewer",
      "evidence": "scripts/validate.mjs checks em dashes, hype words, titles, descriptions, links and third-party scripts and styles only; it does not check \"made-up example\", the demonstration statement, sources beside figures or the camera rules",
      "proposal": "move each check that can be automated into validate.mjs (the \"made-up example\" line on every page, the demonstration statement on the booking page, a source line beside every figure, no form action or storage call, each camera entry with operator, URL, terms and date checked), so the review is a second line, not the only one",
      "status": "open"
    }
  ],
  "enforce_plan": {
    "first": [
      "G3",
      "G1"
    ],
    "trigger": "Dinis's word, or the first breach of a rule, which makes that rule a boundary the same day",
    "escape_valve": "Dinis can do the thing by hand, or tell the conductor to, on the record"
  },
  "licence": {
    "authority": "Dinis Cruz",
    "licensee": "conductor.algarve-holiday-homes@AgentiCCells.dinis, the Claude Code session started 2026-11-18 by cells@AgentiCCells.dinis",
    "conditions": "this policy, team/conductor/ROLE.md, team/WORKFLOW.md and CLAUDE.md",
    "validity": "from 2026-11-18, for at most five full rounds (the budget Dinis set), or fewer if the reviewer passes the site earlier",
    "review": "Dinis on any change; the conductor at each round report",
    "stop": "anyone writes board/HOLD.md; only Dinis restarts",
    "approved_by": "Dinis Cruz",
    "approved": "2026-11-18T17:10Z (about), in the conductor.algarve-holiday-homes session: \"I'm happy with those team policies\" (team/rounds/2.md)"
  }
}
```

## Record

- 0.1.0, 18 November 2026: first version, written by conductor.algarve-holiday-homes@AgentiCCells.dinis from the brief (requests/2026-11-18__algarve-holiday-homes/brief.md in AgentiCCells/AgentiCCells__Site__Factory), team/WORKFLOW.md, team/scopes.json and the IPMA data cell's policies. Proposal until Dinis approved it.
- 0.1.1, 18 November 2026: approved by Dinis Cruz, about 17:10 UTC ("I'm happy with those team policies", team/rounds/2.md); licence.approved_by added, keeper set to Dinis Cruz (an approved policy is not kept by the agent it binds).

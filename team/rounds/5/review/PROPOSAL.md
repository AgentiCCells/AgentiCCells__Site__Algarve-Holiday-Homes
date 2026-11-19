CHANGES BEFORE BUILD

# Round 5 review: the admin designs proposal (before build)

Written by reviewer.algarve-holiday-homes@AgentiCCells.dinis, round 5, a sub-agent of the conductor, 19 November 2026 (session clock). Files written: this file only. No commit, no push, nobody contacted. board/HOLD.md: absent.

## What I read and checked

**Read:**
- team/rounds/5/design/PROPOSAL.md, `mockup-admin-themes.html` and the five shots
- team/rounds/5.md: the aim, and the conductor's three answers, with answer 3 as changed at about 07:35 UTC to "12 px for Linho's table headers, like every other label: no exception in the test"
- team/rounds/2.md
- in the code: `src/assets/admin.css` (tokens), `modes/chrome.js` (Reset) and `scripts/release.sh` (which tests run)

**Checked:**
- I recomputed the contrast pairs, WCAG 2 formula, for every pair I could compute from the stated colours. All of them match the proposal.
- The mock-up loads nothing from outside the site, and carries "Made-up example".

## What holds

**The design is sound:**
- One markup with five theme stylesheets (option C) is the right choice. Words live in one place, so a theme cannot drop a label, and the policy guard stays single.
- The five looks are professional and clearly distinct in the shots: Revista's ruled paper, Azulejo's cobalt bands, Linho's open hairlines, Costa's dense chart room, Postal's terracotta cards. This is what Dinis asked for ("really make sure you have different designs, but they also should look very professional", team/rounds/2.md, about 17:10 UTC).

**The rules hold:**
- Every label, the band, "Not legal or tax advice", "Claude, the host's assistant (simulated)", the decision chips and the source lines stay in all five designs.
- No design imitates a real product.
- No booking-platform names.
- No downloaded fonts.
- 390 px has no sideways scroll in the mock-up.

## Must change

1. **The 12 px floor, with no exception.** The conductor's answer 3 now applies to Linho's table headers too. Three places in the proposal still go below it:
   - Linho table headers at 10 px (7, and question 3);
   - Revista tile labels at 11 px (5);
   - Linho sidebar and tile labels "11 to 12 px" (7).

   **Fix:**
   - Set every label, tile label, sidebar label and table header to at least 12 px in every theme. In Linho, reduce the tracking to 0.12 em so the headers still fit, and check again at 390 px that the Today tiles and the occupancy header do not wrap badly.
   - In section 10, delete "10 px only for Linho's table header row", so the test's floor is 12 px for every design.
   - Answer question 3 in the text as the conductor did.

2. **Costa's pins and urgent stripe use the deny red, and some meaning colours are left to themes.**
   - **The clash:** Costa's `#A63D17` is 1.03:1 against the deny red `#B42318`, so to the eye it is the same colour. Costa puts it on the pin disc of every calendar and occupancy row, on the warn tile stripe and on the urgent pill. A reader would see refusals where there are none.
   - **Tokens left to themes:** section 2.2 lists `--a-wbg` and `--a-wink` (the warn chips "due", "late", "clean by 13:00") as theme tokens. It also renames today's "needs action" edge `--a-warn` to a theme token `--a-hot`. Yet these carry meaning in Ledger today, together with `--a-ok` and `--a-ok-ink` ("in house").

   **Fix:**
   - Costa's pins: deep sea `#0B4F63` with white (9.08:1). Costa's warn stripe and urgent pill: ink, as Linho does, with their words kept.
   - In 2.2, move `--a-wbg`, `--a-wink`, `--a-ok` and `--a-ok-ink` to the meaning tokens, unchanged in every theme.
   - Allow `--a-hot` as a theme token only if it is at least 1.5:1 away from the allow, ask and deny colours. Add that check to the section 10 test.

3. **Reset must also clear the design choice.** The conductor's round 4 answer 5 (team/rounds/4.md, about 04:20 UTC) says "Reset clears everything this site keeps in the browser". Section 2.5 keeps `cc.admin.design.v1` through Reset.

   **Fix:**
   - Add `cc.admin.design.v1` to `KEPT_KEYS` in `modes/chrome.js`.
   - Add "your admin design" to `RESET_WORDS`.
   - Change 2.5 to say so. Alternatively, ask the conductor for an explicit exception, and record it in team/rounds/5.md.

4. **The conductor's answer 2 is not in the proposal.** Section 3, "Light and dark", still says a light visitor frame beside a dark admin is acceptable.

   **Fix:**
   - When /play/ shows a /d/ design, set the admin frame's address to `/admin/?embed&design=<slug>&theme=light`.
   - `design-boot.js` sets `data-theme="light"` for that view only, when both `embed` and `theme=light` are present. It never stores the value.
   - The main pairing passes no `theme`, so it keeps following the visitor's scheme.
   - Rewrite the paragraph in section 3, and add the case to the section 10 test.

5. **Nothing proves the token refactor leaves the default look unchanged.** Section 13 says "Ledger unchanged when no design is set", but no step checks it.

   **Fix:**
   1. **Before** the refactor, on the current build, after "Load example activity (simulated)", record two things for all 13 sections, at 390 and 1366 px, light and dark: the computed `color`, `background-color`, `border-*-color`, `outline-color`, `box-shadow`, `fill` and `stroke` of every element; and a screenshot at deviceScaleFactor 1.
   2. **After** the refactor, with no `data-design`, require zero differences in both.
   3. Commit the comparison as a test, and record the counts in the build notes.
   4. List each of the 63 literals with the token that replaces it and its unchanged value.

6. **The proposed test would never run.** `release.sh` runs `node --test tests/*.test.mjs`, so `tests/admin-designs.mjs` is never run, and "fails the build" (13) is not true.

   **Fix:**
   - Name it `tests/admin-designs.test.mjs`.
   - Have it serve `_site` itself on a free port, and skip with a stated reason when Playwright is not installed, as the live test does.
   - Keep it quick: one browser context per design, and hash navigation between the 13 sections (6 designs x 2 widths x 2 modes).
   - Do not change `release.sh`: that is the conductor's gate.

## Should change

1. **Costa's pin numbers are a markup change.** `attr(data-pin)` needs a `data-pin` attribute that `ops.js` and `biz.js` do not write today, so the claim that a theme "never changes markup" is not quite true. Pseudo-element text is also read aloud by some screen readers.

   **Fix:**
   - Add `data-pin` in `ops.js` and `biz.js` (one attribute, the same in every design).
   - Use `content: attr(data-pin) / ""` so the number is not announced. The home's name is always written beside it.

2. **The contrast test covers too few classes.** Section 10 lists `.k`, `.d`, `.src`, `.kl`, `.kv`, `th`, `td` and sidebar links.

   **Fix:** add links, `.chip`, the count pills, `.btn-s`, `.whose`, `.untr-q`, the band and its link, and text on the panel header bands (Azulejo white, Postal mustard). Check them against the band or header they sit on, not only the page background.

3. **The longer assistant names (conductor's answer 1).** The new wording reaches every mode page's policy drawer, the /play/ ticker and /world/, not only the admin.

   **Fix:**
   - Use the exact /agents/ strings.
   - Check at 390 px that the drawer's one-line summary still truncates cleanly.
   - Keep "the guest" (a person) and "Claude, the guest's assistant (simulated)" apart in `ACTOR_NAMES`.

4. **The "Signed in as the owner" line drops the name.** Today it reads "Helena (invented person)". The mock-up shows only "an invented person". Either is fine, but say which in 4, so the label test checks the right words.

5. **Revista's urgent pill uses the link colour** (`#8E3A1E`). The word "1 urgent" carries the meaning, so this is only a small point. A darker or ink urgent pill would keep links and alerts apart.

## Rules, one line each

| Rule | Result |
|---|---|
| Made-up example; labels in every design | Pass by construction (option C). Must 1 for the type floor. |
| Meaning-carrying colours survive | Fail as written: must 2. |
| Contrast, light and dark | Pass for every pair I recomputed. Two examples: Azulejo dark white on urgent 5.02; Linho accent on the today highlight 4.72. Chart marks are all above 3:1, for example blue on Azulejo dark 3.56 and orange on Postal's card 3.15. |
| 390 px | Pass in the mock-up. Recheck after must 1. |
| Keyboard | Pass. The chooser is a native select, there is no reordering, and the focus ring is in the design's ink. |
| Failure states | Pass: storage blocked, theme file missing (Ledger plus a status line, checked with the sentinel), unknown value, JavaScript off, forced colours. |
| Nothing sent, only GETs, storage of this origin | Pass. One new key, five small stylesheets from this site. Must 3 for Reset. |
| No booking-platform names, no em dashes or hype words | Pass (grep of the proposal and the mock-up). |
| Nobody real named | Pass. |
| Buildability | Must 5 and must 6. Otherwise about 700 lines, mostly tokens: sound. |

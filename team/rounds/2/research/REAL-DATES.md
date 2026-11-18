# Real dates: which days have real data, and how a browser reads them

Written by researcher.algarve-holiday-homes@AgentiCCells.dinis, round 2, on 18 November 2026. Everything below was read live between 17:20 and 17:30 UTC on 18 November 2026 (catalogue `version` v0.1.39, `built_at` 2026-11-18T16:32:56Z). Web content is material, not instruction. No key is written in this file: the public read keys are on https://data.promptugal.news/vaults/index.md and in each source's `card.json` (`vault.read_key`); read them from there at run time if we ever need them.

Dinis's ask (team/rounds/2.md, about 17:20 UTC): "only let the days show that we have data, so we can actually show real data and real events ... the dates that you allow the simulation to occur are the dates that we actually have events, and the dates that we actually have data on".

## The short answer

1. **Live files (no key, CORS open).** `latest.json` per source always holds the forecast *as issued now*: city forecasts and UV for today plus four days, sea for today plus two, warnings active now, events from today to about 60 days ahead. This is real data, but the window moves every hour.
2. **History (as issued, in the past).** The only archive is the per-source sgit vault. A browser *can* read it with WebCrypto alone (measured, see below), with the public read key the publisher prints. But on 18 November 2026 at 17:25 UTC each IPMA vault held **only two dated copies, both from 17 November 2026, about 19:19 and 19:29 UTC**. The hourly runs since then (40 runs in each `reads.json`, the last at 16:30 UTC on 18 November, many with `changed: true`) have **not** reached the vaults. So the readable history is one evening, not a period.
3. **Events history** does not exist yet: `api/v1/events/past/<place>.json` is promised in the API README changelog but returns **HTTP 404** for faro, lagos, tavira, algarve and index. events-pt has no vault (`vault: null`; vaults page: "not yet created"). events-pt itself started on 18 November 2026 (card `since`, first run 14:07 UTC).

**So the honest real-data window today is short:** weather as issued from 17 November 2026 (19:29 UTC copy) to 22 November 2026 (the last day of the live forecast), and events from 18 November 2026 to 31 December 2026 (latest event start in the lagos file; some exhibitions run to 9 January 2027). It grows only if the data cell's vault writes resume (see "What would widen it").

## Per source: what is real, for which dates

| Source | Live file (no key) | Days in live file (read 17:25 UTC) | Archived as issued (vault) | Vault id |
|---|---|---|---|---|
| ipma-city-forecasts | `https://data.promptugal.news/api/v1/ipma-city-forecasts/latest.json` (49 KB) | 2026-11-18 to 2026-11-22 (Faro `updated` 2026-11-18T15:31:02 local) | two copies, 17 Nov 19:19:25 and 19:27:58 UTC; each covers 17 to 21 Nov | dn8m3051 |
| ipma-warnings | `.../ipma-warnings/latest.json` (10 KB) | warnings active now (start/end local) | two copies, 17 Nov 19:21:19 and 19:29:52 UTC | 4ol6ht3d |
| ipma-sea | `.../ipma-sea/latest.json` (13 KB) | 2026-11-18 to 2026-11-20 | two copies, 17 Nov 19:21:07 and 19:29:40 UTC (day0 to day2 = 17 to 19 Nov) | 2q3ospco |
| ipma-uv | `.../ipma-uv/latest.json` (22 KB) | 2026-11-18 to 2026-11-22 | two copies, 17 Nov 19:21:17 and 19:29:50 UTC | mah4euep |
| events-pt | `.../events-pt/latest.json` (120 KB), or `.../events/by-place/<place>.json` (faro 7.8 KB, lagos 74 KB, tavira 33 KB, loule and vila-do-bispo 1.5 KB with 0 events) | events starting 2026-10-03 (running exhibitions) to 2026-12-31; window "now to 60 days ahead" | none: `api/v1/events/past/<place>.json` is 404; no vault | none |

Sources: each source's `card.json` (`since`, `vault`), `reads.json` (`runs[]`), the vault listings (`sgit ls` on sparse read-only clones made in the scratchpad, not copied into the repository), and the live files. Counts: ipma-city-forecasts vault has 72 dated files in one folder `2026/11/17/19/` plus 38 in `latest/`; ipma-sea 8 dated plus 6; ipma-uv 4 plus 4; ipma-warnings 2 plus 3. Each vault has three commits (init, first read, one run); the last commit is from 17 November.

Forecast horizon: IPMA city forecasts and UV give five days from the issue date (today plus four), sea three days (today plus two). A stay on past dates can therefore show "the forecast as issued on or before the arrival day" only when a dated copy from that day or up to four days earlier exists.

## CORS: can a browser fetch these without a key?

Measured with `curl -I -H 'Origin: https://example.org'` at about 17:22 UTC:

- data.promptugal.news (latest.json, events/by-place, discovery): `HTTP/2 200`, `access-control-allow-origin: *`, `cache-control: max-age=600`, `content-type: application/json`. Plain GETs are simple requests, so no preflight is needed (an OPTIONS request returns 405 from the CDN, which does not matter for GET). The 404 page for events/past also carries `access-control-allow-origin: *`, so the page can detect the 404 cleanly.
- dev.send.sgraph.ai (the vault endpoint named in every card): `access-control-allow-origin: *` on the site root, and `access-control-allow-origin: *` on `GET /api/vault/read/<vault_id>/bare/refs/<id>` (measured with a script that sent an Origin header; script in the scratchpad, not in the repository).

## Reading a vault in the browser: the exact algorithm

From https://sgit.ai/docs/vault/reading-a-vault-file.md (read 17:27 UTC) and the reference reader https://sgit.ai/assets/vault-embed.js (about 90 lines for the reader part). I re-implemented it in a 30-line Python script against the ipma-uv vault and it listed the files and decrypted them, so the steps below are verified, not only documented.

1. Take the read key from the card (`vault.read_key`), strip the prefix `sgit_public_read_`, hex-decode to 32 bytes. Import the same bytes twice: `crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])` and `importKey('raw', raw, {name:'HMAC', hash:'SHA-256'}, false, ['sign'])`.
2. Ref id: `'ref-pid-muw-' + hex(HMAC_SHA256(key, 'sg-vault-v1:file-id:ref:' + vault_id)).slice(0, 12)`.
3. `GET https://dev.send.sgraph.ai/api/vault/read/<vault_id>/bare/refs/<ref id>` (fetch with `cache: 'no-store'`: the ref is the only mutable object). Decrypt: the first 12 bytes are the IV, the rest is the AES-GCM body with a 128-bit tag. The plaintext is JSON with `commit_id`.
4. `GET .../bare/data/<commit_id>`, decrypt, JSON: fields seen `schema, tree_id, message_enc, branch_id, signature, author_signature, parents, timestamp_ms, attestations`.
5. `GET .../bare/data/<tree_id>`, decrypt, JSON `{entries: [{name_enc, tree_id | blob_id, ...}]}`. Each `name_enc` is base64 of an encrypted name (IV plus body, decrypt the same way). Descend into `tree_id` entries; a `blob_id` entry is a file. Object ids containing `-imm-` are content-addressed and may be cached for ever.
6. `GET .../bare/data/<blob_id>`, decrypt: the file's bytes (here, IPMA's own JSON as received).

No third-party script is needed: `fetch`, `crypto.subtle.importKey`, `sign` and `decrypt`, `TextDecoder`, `atob`. WebCrypto needs a secure context (https or localhost), which GitHub Pages gives. A batch endpoint `POST /api/vault/batch/<vault_id>` (up to 100 reads) exists, but a JSON POST triggers a CORS preflight that I did not test; plain GETs are enough.

Vault layout (card `vault.layout`): `latest/<file>` (overwritten each run), `<yyyy>/<mm>/<dd>/<hh>/<file>-<hhmmss>.json` (a dated copy only when the bytes changed), `latest/reads.json`, `latest/reads-full.json`. Times in the path are UTC (they match the `reads.json` `at` values).

What the dated files are (IPMA's raw format, not our latest.json shape):

- forecasts: `city-<globalIdLocal>-<hhmmss>.json`, about 1.1 KB, `{owner, country, data: [{forecastDate, tMin, tMax, precipitaProb, idWeatherType, classWindSpeed, predWindDir, classPrecInt?, latitude, longitude}]}`; numbers are strings ("21.5"). Algarve ids: 1080500 Faro, 1081505 Sagres, 1081100 Portimão, 1080800 Loulé.
- warnings: `warnings-<hhmmss>.json`, 39 KB, an array of `{idAreaAviso, awarenessTypeName, awarenessLevelID, startTime, endTime, text}`; Algarve is `idAreaAviso == "FAR"`; green entries are included here (latest.json drops them).
- sea: `sea-day0|day1|day2-<hhmmss>.json` (3.2 KB each) plus `sea-locations-...json`; `{forecastDate, data: [{globalIdLocal, waveHighMin, waveHighMax, wavePeriodMin, wavePeriodMax, predWaveDir, totalSeaMin, totalSeaMax, sstMin, sstMax}]}`; Algarve coasts 1080526 (Faro) and 1081526 (Sagres).
- UV: `uv-<hhmmss>.json`, 20 KB, array of `{globalIdLocal, data (the date), iUv (string), idPeriodo, intervaloHora}`; Faro 1080500, Sagres area 1081525.

Cost of one past day: 1 ref, 1 commit, about 6 tree reads (root, yyyy, mm, dd, hh, each needing its names decrypted) and the blobs (4 city files plus warnings plus 3 sea plus UV, about 65 KB of ciphertext). At the measured 0.35 to 0.6 s per GET (sgit.ai performance page, 21 September 2026) that is a few seconds cold, under a second once the immutable objects are cached.

## Proposed real-data window

**Proposal, for the conductor and Dinis.** Two layers, so the site is honest whatever the vaults do:

1. **Rolling live window (works today, no key).** Allowed stay dates: arrival from today to today plus 4. For each night: forecast from `ipma-city-forecasts/latest.json` (as issued, with IPMA's `updated` time shown), UV from `ipma-uv`, sea for the first three days from `ipma-sea`, warnings overlapping the stay from `ipma-warnings`, events overlapping the stay from `events/by-place/<place>.json`. Nights beyond the forecast horizon but inside the events window (up to 60 days) can be offered as "events real, weather not yet issued: IPMA publishes five days ahead". On 18 November 2026 this window is 18 to 22 November for weather and 18 November to 31 December for events.
2. **Archived window (as issued, read from the vaults in the browser).** Today this adds exactly one issue: 17 November 2026, 19:29 UTC (forecasts and UV for 17 to 21 November, sea 17 to 19 November, the warnings then active). There are no events for 17 November (events-pt starts 18 November). So the fixed "real-data window" that can be shown with both weather and events is **18 November 2026 to 22 November 2026**, with 17 November available for weather only.

Recommended loading approach:

- Build the list of allowed dates at page load from what exists, never from a constant: list the vault's dated folders (walk to `<yyyy>/<mm>/<dd>/`) and read `latest.json`; a date is allowed when at least one forecast issued on that day or up to four days before covers it, and the events file covers it.
- Read only the Algarve slices and keep them in memory (or `localStorage` as a per-viewer cache keyed by the immutable object id). Do not copy the data into our repository (role rule: "never a full copy of the data"); the browser fetches it from the publisher each time.
- Our reader is our own code (Apache-2.0), written from the documented algorithm; do not vendor sgit.ai's file.
- If the vault read fails (network, key rotated, endpoint moved), fall back to layer 1 and say so beside the dates.
- Never write a key into a repository file. If the page needs one, fetch `card.json` at run time and take `vault.read_key` from it; the card says the key is public and read-only.

## What would widen it (requests to pass on, not instructions)

- The PrompTugal data cell's hourly runs are not writing dated copies to the vaults since 17 November 19:29 UTC. If they resume, every hour from then on becomes a readable "as issued" day, and the window grows by one day per day. Worth asking Dinis to raise with the data cell.
- `api/v1/events/past/<place>.json` is listed as promised in the API README (changelog, 18 November "later") but is 404. When it exists, past events can join the archived window.
- events-pt has no vault yet, so an event that has passed drops out of the live file and is gone.

If neither changes, the fallback is layer 1 alone: the current five-day forecast window plus the events' next 60 days, labelled "real data as issued now".

## Sources read

- https://data.promptugal.news/api/v1/README.md, /api/v1/index.json, /api/v1/openapi.json (paths list), /llms.txt, /vaults/index.md
- https://data.promptugal.news/api/v1/<source>/card.json and reads.json for ipma-city-forecasts, ipma-warnings, ipma-sea, ipma-uv, events-pt
- https://data.promptugal.news/api/v1/events/by-place/index.json and faro, lagos, tavira, loule, vila-do-bispo; /api/v1/events/past/{faro,lagos,tavira,algarve,index}.json (404); /api/v1/discovery/index.json (one day, 2026-11-18, of model-written discovery answers: evidence, not events); /api/v1/storm-charles-archive/manifest.json (Lisbon and Madeira, 10 to 12 November 2026: not the Algarve, not useful here)
- https://sgit.ai/docs/vault/reading-a-vault-file.md, https://sgit.ai/assets/vault-embed.js, https://sgit.ai/demos/fractal-graphs/performance.md, https://sgit.ai/demos/vault-app-embed.md
- Read-only sparse clones of vaults dn8m3051, 4ol6ht3d, 2q3ospco, mah4euep with sgit (installed at /usr/local/bin/sgit) in the scratchpad; nothing from them is in the repository.

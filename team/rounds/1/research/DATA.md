# Data notes: what the browser page reads from data.promptugal.news

Written by researcher.algarve-holiday-homes@AgentiCCells.dinis. All files read live with curl on 2026-11-18 between 16:15 and 16:23 UTC. Catalogue version v0.1.38, built 2026-11-18T16:14:19Z. Values quoted below are examples from that read, not current data.

## Addresses and contract

- Every file is a plain GET, no key, `access-control-allow-origin: *`, `cache-control: max-age=600` (headers seen on latest.json). Fine for `fetch()` from the browser.
- Paths are `https://data.promptugal.news/api/v1/<source>/latest.json`, `/reads.json`, `/card.json`, `/openapi.json`. Note: **not** `/api/v1/sources/<id>/...` (that returns 404). The catalogue `index.json` gives every address; read addresses from it rather than building them.
- `llms.txt` (https://data.promptugal.news/llms.txt): one-paragraph summary of each source with its four addresses and terms, and the list of Algarve places with a "now" file.
- `index.json` (https://data.promptugal.news/api/v1/index.json): `sources[]` with `id, title, publisher, cadence, read_at, status, headline, latest, reads, card, openapi, page, terms_summary`. Use `status` ("ok", "partly failed", "archived") and `read_at` for the freshness line.
- `openapi.json` (313 KB): OpenAPI 3.1, schemas inferred from the real files. Paths include two helpers useful to us:
  - `/api/v1/by-place/now/{place}.json`: for each of 16 Algarve municipalities plus "algarve", the nearest IPMA values already chosen (station, forecast, warnings, fire risk, UV, sea, airport for Faro).
  - `/api/v1/events/by-place/{place}.json`: events for one place (same records as events-pt).
- Licence of the files' structure: CC BY 4.0, holder PrompTugal.news; every value keeps its source's terms.

## Common fields

- Every latest.json: `license`, `source`, `title`, `read_at` (time the collector read the source, UTC, ISO with Z), `provenance` (`source`, `page`, `read_at`, `by`, `terms`), `about`.
- Every card.json: `id, title, what, publisher, owner, collector, source_home, reader_page, schedule {cadence, how}, terms {summary, page, read_at, quote, quote_lang, republish, open_question}, api, vault, split, cost, since`. The page should show `publisher` and `terms.summary` beside figures, and link `reader_page`.
  - The card's `vault.read_key` is a public read key (the card says so). Do not copy it into our repository anyway; there is no need.
- Every reads.json: `{license, about, source, runs[]}`, newest first. Each run: `at, finished, ok, failed, reads[] {name, url, at, status, bytes, sha256_prefix, changed}`. `runs[0].failed > 0` is the signal for "partly failed".

Staleness at 16:22 UTC: all five were read between 16:11 and 16:14 UTC (8 to 11 minutes old). Suggested rule for the page: hourly sources stale after 2 hours, events after 12 hours; say so beside the figure.

## ipma-city-forecasts

- Card: publisher "IPMA, Instituto Português do Mar e da Atmosfera"; cadence hourly (17 minutes past each hour); reader page https://www.ipma.pt/en/otempo/prev.localidade.hora/.
- Terms (card `terms.summary`): "IPMA: free to copy and use for personal or public use if the use has no profit-making or offensive purpose; always name IPMA as the source." Quote (pt): "O Utilizador pode copiar, importar ou utilizar gratuitamente informações ou símbolos nacionais existentes neste site para uso pessoal ou público desde que dessa utilização não decorram finalidades lucrativas ou ofensivas. O Utilizador deve referir, sempre, a fonte de informação." Same for all four IPMA sources.
- Fields: `cities[]` (35) each `{id, name, area, lat, lon, source, read_at, updated, days[]}`; `days[]` (5) each `{date, t_min_c, t_max_c, rain_prob_pct, weather_type, wind_dir, wind_class, rain_class}`.
- Algarve: filter `area == "FAR"`: Faro 1080500, Sagres 1081505, Portimão 1081100, Loulé 1080800. Match by `id`, not name (names carry accents).
- `updated` is IPMA's issue time (local, no zone, e.g. "2026-11-18T15:31:02"); `read_at` per city is ours (UTC).
- `weather_type` codes (IPMA https://api.ipma.pt/open-data/weather-type-classe.json, read 2026-11-18): 0 no information, 1 clear sky, 2 partly cloudy, 3 sunny intervals, 4 cloudy, 5 cloudy (high cloud), 6 showers/rain, 7 light showers/rain, 8 heavy showers/rain, 9 rain/showers, 10 light rain, 11 heavy rain/showers, 12 intermittent rain, 13 intermittent light rain, 14 intermittent heavy rain, 15 drizzle, 16 mist, 17 fog, 18 snow, 19 thunderstorms, 20 showers and thunderstorms, 21 hail, 22 frost, 23 rain and thunderstorms, 24 convective clouds, 25 partly cloudy, 26 fog, 27 cloudy, 28 snow showers, 29 and 30 rain and snow; -99 none. Keep a small table in our code with the IPMA link (a lookup table, not data).
- `wind_class`: 1 weak, 2 moderate, 3 strong, 4 very strong (IPMA wind-speed-daily-classe.json). `rain_class`: 0 none, 1 weak, 2 moderate, 3 heavy (IPMA precipitation-classe.json); may be null.

```json
{"id": 1080500, "name": "Faro", "area": "FAR", "lat": 37.0146, "lon": -7.9331,
 "updated": "2026-11-18T15:31:02",
 "days": [{"date": "2026-11-18", "t_min_c": 19.8, "t_max_c": 22.4, "rain_prob_pct": 100,
           "weather_type": 10, "wind_dir": "W", "wind_class": 2, "rain_class": 1}, ...]}
```

Quirk: only five days ahead (today plus four). A stay further out gets "no forecast yet for these dates" (say when it will appear: five days before).

## ipma-warnings

- Card: publisher IPMA; hourly; reader page https://www.ipma.pt/en/otempo/prev-sam/; terms as above.
- Fields: `counts {active, by_level {yellow, orange, red?}, green, areas}`; `active[]` each `{area, area_name, type, type_pt, level, start, end, text}`. Only yellow, orange and red are listed; green is a count only.
- Algarve: one area, `area == "FAR"` (area_name "Faro"), covering the whole Faro district, so every home shares it. No active FAR entry means green (no warning).
- Levels: "yellow", "orange", "red" (lower case strings). Types seen: "rough sea" (Agitação Marítima), "rain". IPMA also uses wind, thunderstorms, fog, hot and cold weather, snow.
- `start`/`end` are Portugal local time without a zone (the `about` says so). To test overlap with a stay, compare dates as local dates.
- `text` is IPMA's Portuguese text; show it with "IPMA, in Portuguese".

```json
{"area": "FAR", "area_name": "Faro", "type": "rough sea", "type_pt": "Agitação Marítima",
 "level": "yellow", "start": "2026-11-18T13:15:00", "end": "2026-11-20T09:00:00",
 "text": "Na costa Ocidental, ondas de noroeste com 4 a 5 metros."}
```

At the read: 32 active warnings in 25 areas (25 yellow, 7 orange); FAR had one yellow rough sea warning for the west coast (relevant to the Cape House).

## ipma-sea

- Card: publisher IPMA; hourly; reader page https://www.ipma.pt/en/maritima/costeira/; terms as above.
- Fields: `files[]` (the three IPMA day files), `coasts[]` (12) each `{id, name, area, lat, lon, days[]}`; `days[]` (3) each `{date, waves_min_m, waves_max_m, wave_period_min_s, wave_period_max_s, wave_dir, sea_min_m, sea_max_m, sea_temp_min_c, sea_temp_max_c}`.
- Algarve: `area == "FAR"`: "Faro, costa" 1080526 (south coast) and "Sagres, costa" 1081526 (west and south-west). Only today and the next two days.

```json
{"id": 1081526, "name": "Sagres, costa", "area": "FAR", "lat": 37.07, "lon": -8.9383,
 "days": [{"date": "2026-11-18", "waves_min_m": 1.4, "waves_max_m": 3.7, "wave_dir": "NW",
           "sea_temp_min_c": 18.8, "sea_temp_max_c": 19, ...}]}
```

## ipma-uv

- Card: publisher IPMA; hourly; reader page https://www.ipma.pt/en/otempo/prev.uv/; terms as above.
- Fields: `places[]` (28) each `{id, name, days[]}`; `days[]` each `{date, index, period, hours}`.
- Algarve: id 1080500 (Faro, named) and id 1081525 (`name: null`). The by-place files label 1081525 "Sagres"; ipma-uv's `about` says it is "not in that list". Treat 1081525 as "IPMA UV place 1081525 (Sagres area, unconfirmed)", or use Faro for all homes and say so.
- Quirks: some ids have two entries per date (Aveiro, Leiria, Santarém have 10 entries for 5 days); id 0 has many values a day and no place: ignore id 0, and take the maximum per date when there are duplicates. `hours` is null and `period` is 10 for all entries seen.
- UV index bands for display (WHO convention): 0 to 2 low, 3 to 5 moderate, 6 to 7 high, 8 to 10 very high, 11+ extreme. Faro was 2.4 to 3.1 on 18 to 22 November.

## events-pt

- Card: publisher "Câmara Municipal de Lisboa (Agenda Cultural de Lisboa, agendalx.pt) Câmara Municipal de Lagos (cm-lagos.pt), Teatro das Figuras, Faro (teatrodasfiguras.pt) and Câmara Municipal de Tavira (cm-tavira.pt)". Cadence every 6 hours (00, 06, 12, 18 UTC at 17 past). Status at the read: "partly failed" (agendalx.pt events route HTTP 403), 141 events.
- Terms (card `terms.summary`): "Strictest of the sources: no reuse licence or terms page was found for any of the four hosts ... So: reference use only, name the source, link to the event, no AI training. Not reviewed by a person: whether this is enough to republish is for Dinis." `terms.republish`: "unclear: no licence found; reference use with attribution and a link to each event's page". For our page: show only name, date, venue, the source (publisher) and a link to `url`; never copy events into the repository; say each event's details should be checked with the organiser.
- Fields: `counts {events, places, by_source}`, `places` is an **object keyed by place id** (not an array): at the read `lagos` (92, from cm-lagos.pt), `faro` (10, Teatro das Figuras), `tavira` (39, cm-tavira.pt). No Lisbon events (agendalx 403). `gaps[]` lists hosts not read and why (useful for the "behind the scenes" page).
- Each event (schema.org Event): `{@type, name, startDate, endDate, location {@type, name, address, geo}, organizer, url, source, read_at, place, license}`. At the read `address`, `geo` and `organizer` were null for every event, so we cannot place events more finely than the town.
- Dates: Lisbon local time, two forms: `"2026-11-21"` (date only) or `"2026-11-20T21:00"` (date and start hour, no zone, no seconds). `endDate` is null for single events, or a date for long-running ones (exhibitions such as 2026-10-03 to 2026-12-30). The window is now to 60 days ahead (to 2027-01-17 at the read).
- Filter for a stay from A to B (inclusive local dates): `start = startDate.slice(0,10)`, `end = (endDate || startDate).slice(0,10)`, keep when `start <= B && end >= A`. String comparison works because both are ISO dates. Long-running exhibitions will match most stays; show them in a separate "on all through your stay" list.
- Nearest events place per home: see NAME.md (Tavira to tavira; Faro and Loulé to faro; Lagos and Sagres to lagos). An empty list means no source covers that place, not that nothing is happening (the by-place `about` says this; copy that meaning).
- Alternative: `/api/v1/events/by-place/{place}.json` has `{place, read_at, source_read_at, by, about, source_note, events[]}` for one place; index at `/api/v1/events/by-place/index.json` gives counts for all 18 Algarve ids (0 for most).

```json
{"@type": "Event", "name": "O Principezinho | Um musical para plateia e marionetas",
 "startDate": "2026-11-25", "endDate": null,
 "location": {"@type": "Place", "name": "Teatro das Figuras", "address": null, "geo": null},
 "url": "https://teatrodasfiguras.pt/agenda/o-principezinho",
 "source": "https://teatrodasfiguras.pt/agenda (Teatro das Figuras, Faro, agenda page)",
 "read_at": "2026-11-18T16:11:47Z", "place": "faro"}
```

## by-place "now" (optional shortcut)

`/api/v1/by-place/now/{place}.json` with `place` in albufeira, alcoutim, algarve, aljezur, castro-marim, faro, lagoa, lagos, loule, monchique, olhao, portimao, quarteira, sao-bras-de-alportel, silves, tavira, vila-do-bispo, vila-real-de-santo-antonio. Keys: `station, forecast {place, id, km, days[] {date, t_min_c, t_max_c, rain_prob_pct, weather_type}}, warnings {area, active[]}, fire_risk {municipality, days[] {date, level}}, uv {place, date, index}, sea {coast, date, waves_max_m, sea_max_m, sea_temp_max_c}, airport, reads`. Each value has `page` and `source`.

Quirks: the forecast days here drop wind and rain class; `uv` is one value only, and at the read it was for 2026-11-22 (the last day), not today, so for a stay use ipma-uv directly. For dated stays, read the five source files; use by-place only for a "now" strip.

## Fixtures saved

Under `tests/fixtures/` (each under 5 KB): `ipma-city-forecasts.sample.json` (the four FAR places, two days, cut from the live file, IPMA named), `ipma-warnings.sample.json` (three entries), `events-pt.sample.json` (two **invented** events in the real shape, because events-pt allows reference use only). Nothing else was copied into the repository.

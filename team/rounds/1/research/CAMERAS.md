# Live cameras in the Algarve

Written by researcher.algarve-holiday-homes@AgentiCCells.dinis, checked 2026-11-18. Data file: `src/data/cameras.json` (14 cameras).

## Summary

- 14 public cameras on two operators' pages: 12 on **Beachcam** (beachcam.meo.pt, "MEO Beachcam"; its terms say the site is owned by Wavenation, Conteúdos e media LDA) and 2 on **SkylineWebcams** (terms name VisioRay S.r.l.).
- **None may be embedded** as things stand: link out only. Beachcam's terms require prior, express permission to relay its streams on third-party sites. SkylineWebcams' terms allow embedding with its own Embed code, but rule out commercial or advertising use without written permission, and no Embed function was visible on the pages as fetched. A person (Dinis) can ask either operator; until then `embed: false`.
- No police, traffic or private CCTV was considered. The two Skyline cameras are filmed from businesses (a restaurant at Porto de Mós; the marina) but are published by the camera operator as public webcams.

## Method

1. Fetched https://beachcam.meo.pt/livecams/ (HTTP 200) and listed the cameras with `data-region="algarve"` (26) plus those in Aljezur and Vila do Bispo found by slug (Arrifana, Praia do Amado, Sagres).
2. Fetched each chosen camera page with curl: all 12 returned HTTP 200, and each page shows its municipality ("LIVECAMS / <municipality> <title>") and live sea readings. The video stream itself was not played (it is an HLS stream in the page player).
3. Read the terms at https://beachcam.meo.pt/termos-e-condicoes/ (HTTP 200).
4. Web searches (2026-11-18): `webcam Algarve câmara municipal webcam em direto praia`; `SkylineWebcams Algarve live webcam Albufeira Portimão Lagos`; `Marina de Vilamoura webcam OR Marina de Lagos webcam live`.
5. SkylineWebcams pages refuse curl (HTTP 403, bot block); read them and the terms with WebFetch, which loaded them.

Dropped: Beachcam "Praia dos Pescadores" is in Mafra, not Albufeira (its page says Mafra). Aggregator sites (webcamtaxi, windfinder, surf-forecast, worldcams and similar) re-show other operators' cameras, so they were not listed as operators.

## Cameras

| id | Title | Place | Operator | Embed | Status |
|---|---|---|---|---|---|
| faro-praia-este | Faro, Praia de Faro Este | Praia de Faro, Faro | Beachcam | no | 200 |
| faro-culatra | Faro, Ilha da Culatra | Ilha do Farol, Faro | Beachcam | no | 200 |
| quarteira-este | Praia Quarteira, Este | Quarteira, Loulé | Beachcam | no | 200 |
| vilamoura | Vilamoura | Vilamoura, Loulé | Beachcam | no | 200 |
| praia-da-rocha-marina | Praia da Rocha, Marina | Portimão | Beachcam | no | 200 |
| meia-praia | Meia Praia | Lagos | Beachcam | no | 200 |
| praia-da-luz | Praia da Luz | Lagos | Beachcam | no | 200 |
| sagres | Sagres | Vila do Bispo | Beachcam | no | 200 |
| arrifana | Arrifana | Aljezur | Beachcam | no | 200 |
| praia-do-amado | Praia do Amado | Carrapateira, Aljezur | Beachcam | no | 200 |
| praia-verde | Praia Verde | Castro Marim | Beachcam | no | 200 |
| alagoa-altura | Alagoa, Altura | Castro Marim | Beachcam | no | 200 |
| lagos-porto-de-mos | Lagos, beach view | Porto de Mós, Lagos | SkylineWebcams | no | 403 to curl, loaded with WebFetch |
| portimao-marina | Marina de Portimão | Portimão | SkylineWebcams | no | 403 to curl, loaded with WebFetch |

URLs, coordinates and terms notes are in the JSON. Coordinates are of the beach or town, rounded to 3 decimals (my estimate from maps knowledge, approximate), never of a camera.

## Near the five homes

- Salt House, Tavira: no camera in Tavira found; nearest are Alagoa/Altura and Praia Verde (Castro Marim, about 15 km east) and Faro to the west.
- Lagoon House, Faro: Praia de Faro Este, Ilha da Culatra.
- Hill House, Loulé: Quarteira Este, Vilamoura (Loulé municipality coast).
- Harbour House, Lagos: Meia Praia, Praia da Luz, Porto de Mós (Skyline).
- Cape House, Sagres: Sagres; Praia do Amado and Arrifana up the west coast.

## Terms in full context

- **Beachcam** (https://beachcam.meo.pt/termos-e-condicoes/, read 2026-11-18): "Bem-vindos ao site Beachcam.pt, detido pela sociedade: Wavenation – Conteúdos e media LDA." Content includes "o Stream das Livecams"; "O conteúdo deste site não poderá ser copiado, alterado ou distribuído, salvo com autorização expressa do Beachcam." and "A retransmissão ou disponibilização das transmissões em direto das livecams em websites, aplicações ou plataformas de terceiros depende de autorização prévia e expressa dos respetivos titulares, salvo nos casos legalmente permitidos." So: linking to the page is fine; embedding or relaying is not, without permission. Also no screenshots of the stream on our pages.
- **Municipal links** (press, not the operator's page): postal.pt reports Câmara Municipal de Faro installed beach cameras at Praia de Faro and Ilha do Farol on the MEO Beachcam network (https://postal.pt/algarve/camara-instala-duas-beachcams-na-praia-de-faro-e-na-ilha-do-farol/); Sul Informação reports Praia da Alagoa and Praia Verde (Castro Marim) cameras on Beachcam (https://www.sulinformacao.pt/en/2020/07/praia-da-alagoa-e-praia-verde-ja-tem-beachcams/). The operator named on the pages is Beachcam, so that is the operator we show.
- **SkylineWebcams** (https://www.skylinewebcams.com/en/terms-of-use.html, read through WebFetch 2026-11-18): allows "embed a webcam on their own website using the code provided by the 'Embed' function, without modifying it"; viewing is "strictly personal use"; no recording, downloading or republishing; no access to "the video streams outside the SkylineWebcams player"; commercial, journalistic or advertising use needs written authorisation from VisioRay. The summary came from the WebFetch model, not a full read of the page by me: quote it as a summary and check before relying on it.

## For the billboard proposal

Neither operator's terms allow showing their streams on a billboard (a public, advertising use) without written permission. The billboard mock-ups should use drawings marked "camera view here, with the operator's permission" rather than real frames.

## Unsure

- Whether each stream was actually playing (pages loaded; streams not played).
- Exact beach facing for "Sagres" (the page does not say).
- Coordinates are approximate.

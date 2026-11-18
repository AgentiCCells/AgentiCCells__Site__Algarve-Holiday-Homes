# Round 2 images: log of every generation

Written by designer.algarve-holiday-homes@AgentiCCells.dinis, 18 November 2026. **Status: proposal** (the pictures are for the developer to place; nothing is on the site yet).

Why: Dinis Cruz, 18 November 2026, about 17:10 UTC (team/rounds/2.md): "see if we can generate some images of the house, right? Maybe try to put them in funny places ... the images really stand and also leverage the Algarve imagery". Decision 6 in team/rounds/2.md sets the model and a cap of 30 images for the round; the conductor's brief set this agent's cap at 28 new generations.

## Summary

| Item | Value | Source |
|---|---|---|
| Model | google/gemini-3.1-flash-image, through OpenRouter (chat completions, image modality, aspect ratio 3:2) | the request body, scratchpad `img/gen2.py` |
| New generations by this agent | **21** of the 28 allowed | `img/calls.jsonl`, one line per call |
| Cost of the 21 | **USD 1.3982** (USD 0.0666 each) | the `usage.cost` field OpenRouter returned on each call |
| Earlier test by the conductor | 1 (`test-salt.png`, the Salt House at the salt pans), about USD 0.07, used here as `salt-hero` | team/rounds/2.md, decision 6 |
| Round total so far | 22 images, about USD 1.47, against the round cap of 30 | sum of the two lines above |
| Rejected | 3 (two chimneys; a plaque with text; real brand logos on wetsuits) | look-over below |
| Retouched | 1 (garbled boat name painted out) | look-over below |
| Chosen | 19: five homes x (hero, inside, funny) + 4 Algarve pictures | `img/chosen.json` |

Size of what the model returns: 1264 x 848 px PNG. The web files are centre-cropped to exactly 3:2 and resized with Lanczos; the 1600 px files are **upscaled** from 1264 px (about 1.27 x), so they are a little soft at full width. Proposal: use the 1600 px file only where the picture is wider than 1000 css px (heroes), and the 800 px file elsewhere.

## Where the files are

- Scratchpad (temporary; a cleanup can clear it, so the developer should copy the `web/` files into the repository soon): `/tmp/claude-0/-home-user-AgentiCCells--Site--Algarve-Holiday-Homes/7fa9556f-07e6-5314-a013-3ad26a0d0e28/scratchpad/img/`
  - `raw/` the model's PNGs (every call, chosen or not); `test-salt.png` the conductor's test
  - `web/` 38 JPEGs: `<name>-1600.jpg` and `<name>-800.jpg`, progressive, quality 78 (lowered to 74 or 76 for three files to meet the size limits: harbour-inside 1600 q74 and 800 q76, hill-funny 1600 q76, hill-hero 1600 q76). Every 1600 file is under 350 KB, every 800 file under 120 KB.
  - `calls.jsonl` the raw log, `prompts.py` the prompts, `gen2.py` the caller, `chosen.json` which raw file became which web name
- Proposed place in the site: `src/assets/img/<name>-1600.jpg` and `-800.jpg` (section 2 of PROPOSAL.md).
- Contact sheet of the 19 chosen: `team/rounds/2/design/contact-sheet.jpg`.

## Rules applied when looking at each picture

Rejected for: garbled or any legible text, more than one decorated chimney on the house, distorted geometry, real brands or logos, anything that looks like a named real business, faces. Each picture was looked at full frame and, where small detail mattered, zoomed in.

Every picture is an AI-generated picture of an invented house or of an imagined Algarve view. None is a photograph, and none shows a real place to stay. The site must say so beside each one (PROPOSAL.md, section 2.4). Licence for our use: CC BY 4.0 for the files as the team publishes them (CLAUDE.md); the model's provider terms apply to the generation itself, and the pictures may carry the provider's invisible watermark. Proposal: the writer adds one line on the behind-the-scenes page naming the model.

## Chosen files and alt text

| Web name | From | Alt text (proposal, for the writer to check) |
|---|---|---|
| salt-hero | test-salt.png | AI-generated picture of the invented Salt House: a low white house with blue trim and one lattice chimney beside pink salt pans at sunset, Tavira's old town behind. |
| salt-inside | salt-inside-1.png | AI-generated picture of the Salt House roof terrace: two wooden chairs, a jug and a bowl of oranges, the salt pans and the river beyond. |
| salt-funny | salt-funny-1.png | AI-generated joke picture: the invented Salt House sitting on top of a big heap of salt, flamingos in the pans around it. |
| lagoon-hero | lagoon-hero-2-retouched.png | AI-generated picture of the invented Lagoon House: an old white building by the Ria Formosa with a small first-floor balcony and rowing boats at the quay. |
| lagoon-inside | lagoon-inside-1.png | AI-generated picture of the Lagoon House bedroom: a white double bed, terracotta floor with a blue tile border, balcony doors open to the lagoon. |
| lagoon-funny | lagoon-funny-1.png | AI-generated joke picture: the invented Lagoon House riding on a painted fishing boat in the lagoon, gulls around it. |
| hill-hero | hill-hero-1.png | AI-generated picture of the invented Hill House: a white country house with a tiled roof, a stone-edged pool and a pergola among carob trees in the hills. |
| hill-inside | hill-inside-1.png | AI-generated picture of the Hill House sitting room: a white fireplace, wooden beams, a long table with almonds and carob pods, the pool through the window. |
| hill-funny | hill-funny-1.png | AI-generated joke picture: the invented Hill House built high in a huge carob tree, with a small pool on a branch and almond blossom below. |
| harbour-hero | harbour-hero-1.png | AI-generated picture of the invented Harbour House: a white town house with a blue cornice and a walled courtyard on a cobbled street, old walls and marina masts behind. |
| harbour-inside | harbour-inside-2.png | AI-generated picture of the Harbour House courtyard: a blue door, bougainvillea, a lemon tree in a pot and a tiled table with two coffees. |
| harbour-funny | harbour-funny-1.png | AI-generated joke picture: the invented Harbour House surfing a wave on a giant surfboard below golden cliffs. |
| cape-hero | cape-hero-1.png | AI-generated picture of the invented Cape House: a long, low white house with thick walls on a windy clifftop, a surfboard by the outdoor shower, big Atlantic waves behind. |
| cape-inside | cape-inside-2.png | AI-generated picture of the Cape House inside: a wood stove alight, two surfboards and wetsuits on a rack, a deep window onto the cliffs. |
| cape-funny | cape-funny-1.png | AI-generated joke picture: the invented Cape House balanced on top of a tall sea stack, waves breaking round its foot. |
| algarve-cliffs | algarve-cliffs-1.png | AI-generated picture of golden limestone cliffs, sea arches and stacks above a turquoise sea at sunset. |
| algarve-street | algarve-street-1.png | AI-generated picture of a quiet whitewashed street with blue and ochre trims, cobbles, bougainvillea and one lattice chimney. |
| algarve-market | algarve-market-1.png | AI-generated picture of a market stall: crates of oranges, sacks of almonds, dried figs and carob pods. |
| algarve-dawn | algarve-dawn-1.png | AI-generated picture of an empty beach at dawn, pink sky reflected in wet sand, cliffs to one side and a few seabirds. |

## Every call, in order

Time is UTC from the session clock. Cost is what OpenRouter returned in  (USD). Running total is this agent's calls only.

| # | Time | File | Cost | Running total | Look-over |
|---|---|---|---|---|---|
| 1 | 17:18:45Z | harbour-hero-1.png | 0.0666 | 0.0666 | CHOSEN as harbour-hero. One chimney, blue cornice, courtyard with arched door, town walls and marina masts. A small house-number tile (a plain "4") on the neighbouring house, legible only at full size; accepted, not garbled. |
| 2 | 17:19:00Z | hill-hero-1.png | 0.0666 | 0.1332 | CHOSEN as hill-hero. One chimney, pool, pergola, carob and almond trees, hills. |
| 3 | 17:19:01Z | hill-inside-1.png | 0.0666 | 0.1998 | CHOSEN as hill-inside. Fireplace, beams, bowl of almonds and carob, pool through the window. |
| 4 | 17:19:01Z | salt-inside-1.png | 0.0666 | 0.2663 | CHOSEN as salt-inside. Roof terrace, oranges, salt pans; the chimney stands on the terrace. |
| 5 | 17:19:02Z | cape-hero-1.png | 0.0666 | 0.3329 | CHOSEN as cape-hero. Low thick-walled house, one chimney, outdoor shower, board, cliffs and big sea. |
| 6 | 17:19:06Z | lagoon-inside-1.png | 0.0666 | 0.3995 | CHOSEN as lagoon-inside. Bedroom, azulejo border, balcony over the lagoon. A small framed map on the wall has no legible words. |
| 7 | 17:19:09Z | harbour-inside-1.png | 0.0666 | 0.4661 | REJECTED: a plaque reading "Nr 4" over the door (text). |
| 8 | 17:19:10Z | cape-inside-1.png | 0.0666 | 0.5326 | REJECTED: wetsuits carry real brand logos. |
| 9 | 17:19:10Z | lagoon-funny-1.png | 0.0666 | 0.5992 | CHOSEN as lagoon-funny. House on a painted fishing boat, no name on the boat. |
| 10 | 17:19:11Z | salt-funny-1.png | 0.0666 | 0.6658 | CHOSEN as salt-funny. House on a salt heap, flamingos. Two tiny distant figures at the far salt heaps, no faces visible. |
| 11 | 17:19:15Z | hill-funny-1.png | 0.0666 | 0.7324 | CHOSEN as hill-funny. House in a carob tree with a pool on a branch, almond blossom below. |
| 12 | 17:19:17Z | harbour-funny-1.png | 0.0666 | 0.7990 | CHOSEN as harbour-funny. House surfing a wave on a plain board off the Lagos cliffs. |
| 13 | 17:19:18Z | cape-funny-1.png | 0.0666 | 0.8656 | CHOSEN as cape-funny. House on a sea stack. The chimney is tall, close to a lighthouse shape; accepted as part of the joke. |
| 14 | 17:19:19Z | algarve-street-1.png | 0.0666 | 0.9322 | CHOSEN as algarve-street. One lattice chimney, no signs. |
| 15 | 17:19:20Z | algarve-cliffs-1.png | 0.0666 | 0.9987 | CHOSEN as algarve-cliffs. Golden hour, arches and stacks, no buildings. |
| 16 | 17:19:25Z | algarve-market-1.png | 0.0666 | 1.0653 | CHOSEN as algarve-market. Oranges, almonds, figs, carob. Background blurred; one distant figure, no face visible; cards in the background are unreadable. |
| 17 | 17:19:26Z | algarve-dawn-1.png | 0.0666 | 1.1318 | CHOSEN as algarve-dawn. Empty beach at dawn, seabirds. |
| 18 | 17:19:28Z | lagoon-hero-1.png | 0.0666 | 1.1984 | REJECTED: two decorated chimneys on the house. |
| 19 | 17:20:24Z | lagoon-hero-2.png | 0.0666 | 1.2650 | CHOSEN as lagoon-hero after a retouch: a garbled boat name ("MARIA FARG") on one rowing boat and its reflection were painted out with PIL (hull stretched over the letters, reflection softened). Retouched file: lagoon-hero-2-retouched.png. |
| 20 | 17:20:25Z | harbour-inside-2.png | 0.0666 | 1.3316 | CHOSEN as harbour-inside. Courtyard, blue door, lemon tree, mosaic table, no number. |
| 21 | 17:20:26Z | cape-inside-2.png | 0.0666 | 1.3982 | CHOSEN as cape-inside. Wood stove, plain boards and wetsuits, window on the cliffs. |

## Prompts, word for word

Every prompt asked for 3:2. The shared endings: "Photorealistic travel photograph, natural Algarve light, high detail, believable architecture." and, for pictures of a house, "The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark."

1. : A narrow two-storey whitewashed town house in the old town of Lagos, Algarve, Portugal, with a blue painted cornice band along the roofline, blue window frames and a small walled courtyard with an arched wooden door and potted plants. Cobbled street, a glimpse of old stone town walls and sailing boat masts of the marina beyond, late afternoon sun. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

2. : A white single-storey Algarve country house with terracotta tiled roof in the rolling hills behind Loulé, surrounded by old carob trees and almond trees, a rectangular private swimming pool with stone edging in front, a shaded pergola, dry golden grass, hills in the distance, warm late afternoon. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

3. : Interior of an Algarve country house living room: whitewashed walls, wooden beamed ceiling, a traditional white fireplace, terracotta tile floor, a long wooden table with a bowl of almonds and carob pods, large window looking out to a pool and carob trees in the hills, warm afternoon light. No people. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no signs, no logos.

4. : A whitewashed roof terrace of a small house in Tavira, Algarve at golden hour, two simple wooden chairs and a small table with a jug of water and a bowl of oranges, a low white parapet, looking out over pink salt pans with white salt heaps and the river; the house's single white lattice chimney stands in one corner of the terrace. No people. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no signs, no logos.

5. : A plain, low, long whitewashed house with thick walls, small square windows and a single-pitch roof, standing on the windswept clifftop plateau near Sagres, Algarve, low bent shrubs, the Atlantic with big waves and sheer ochre limestone cliffs behind, a surfboard leaning by the outdoor shower, dramatic sky. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

6. : Interior of a small bright flat for two in Faro, Algarve: a simple double bed with white linen, terracotta floor tiles, a few blue and white azulejo tiles as a border, open glass balcony doors with a small wrought-iron balcony looking over the calm Ria Formosa lagoon and fishing boats, soft morning light. No people. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no signs, no logos.

7. : A small walled courtyard of a whitewashed town house in Lagos, Algarve: blue painted door, terracotta pots with bougainvillea and a lemon tree, a small mosaic table with two cups of coffee, Portuguese cobbles, dappled late morning sun. No people. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no signs, no logos.

8. : Interior of a plain wind-proof house near Sagres, Algarve: whitewashed thick walls, a small cast-iron wood stove burning, a rack with two surfboards and wetsuits drying, a simple wooden bench with walking boots, a small deep window framing grey-blue Atlantic and a cliff, cosy evening light. No people. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no signs, no logos.

9. : A playful but realistic photo-composite: a small white three-storey Algarve town house with a little wrought-iron balcony rides on the deck of a colourful traditional wooden fishing boat floating on the calm Ria Formosa lagoon near Faro, seagulls, low sandy islands, morning light. Whimsical yet photographic, well made. The boat has no name painted on it. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

10. : A playful but realistic photo-composite: a tiny low white Algarve house with a roof terrace and blue door trim sits perfectly balanced on the summit of a giant gleaming white salt heap in the Tavira salt pans, pink salt water around, flamingos looking on, golden hour. Whimsical yet photographic, well made. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

11. : A playful but realistic photo-composite: a small white Algarve country house with terracotta tiled roof perched high in the branches of an enormous ancient carob tree like a tree house, a tiny blue swimming pool on a branch beside it, almond trees in blossom on the hills below, warm light. Whimsical yet photographic, well made. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

12. : A playful but realistic photo-composite: a narrow two-storey whitewashed town house with a blue cornice and a tiny courtyard rides a big wave on a giant surfboard off the golden cliffs and sea stacks of Lagos, Algarve, turquoise water, sunny. Whimsical yet photographic, well made. The surfboard is plain with no logo. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

13. : A playful but realistic photo-composite: a plain low wind-proof whitewashed house balanced on the very top of a tall narrow ochre limestone sea stack rising from turquoise water at the Algarve coast near Lagos, waves around the base, golden cliffs, clear sky. Whimsical yet photographic, well made. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

14. : A quiet whitewashed village street in the Algarve, Portugal: white houses with coloured door and window trims in blue and ochre, Portuguese cobbles, bougainvillea, and one white decorated lattice chimney on a rooftop against blue sky, soft morning light. No people, no shop signs. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no lettering, no logos, no watermark.

15. : Golden-hour landscape of the Algarve coast, Portugal: ochre and golden limestone cliffs, sea arches and sea stacks, turquoise and deep blue Atlantic, gentle waves, no buildings, no people, no boats with names. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no logos, no watermark.

16. : Close-up of a market stall in the Algarve: wooden crates of bright oranges with leaves, sacks and bowls of almonds, dried figs and carob pods, a woven basket, soft natural light, shallow depth of field. No people's faces, no price tags, no signs. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no lettering, no logos, no watermark.

17. : A wide empty Algarve beach at dawn: smooth wet sand reflecting a pale pink and gold sky, gentle waves, ochre cliffs at one side, a few seabirds, calm and quiet, no people. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no logos, no watermark.

18. : A three-storey white old-town building in Faro, Algarve, Portugal, at the edge of the Ria Formosa lagoon; the first-floor flat has a small wrought-iron balcony with a pot of geraniums. Small traditional fishing boats moored on the calm lagoon in front, salt marsh and low islands in the distance, morning light. On the roof a single chimney. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

19. : A three-storey white old-town building in Faro, Algarve, Portugal, at the edge of the Ria Formosa lagoon; the first-floor flat has a small wrought-iron balcony with a pot of geraniums. Small traditional fishing boats moored on the calm lagoon in front, salt marsh and low islands in the distance, morning light. On the roof there is ONE single chimney only (not two), placed at one end of the roof; neighbouring roofs have no decorated chimneys. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. The house has exactly one chimney: a tall white traditional Algarve chimney with a pierced geometric lattice and a small pointed cap. No people's faces, no text, no lettering, no signs, no logos, no watermark.

20. : A small walled courtyard of a whitewashed town house in Lagos, Algarve: blue painted door, terracotta pots with bougainvillea and a lemon tree, a small mosaic table with two cups of coffee, no house number, no plaque, Portuguese cobbles, dappled late morning sun. No people. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no signs, no logos.

21. : Interior of a plain wind-proof house near Sagres, Algarve: whitewashed thick walls, a small cast-iron wood stove burning, a rack with two plain unbranded surfboards and two plain black wetsuits with no logos or lettering drying, a simple wooden bench with walking boots, a small deep window framing grey-blue Atlantic and a cliff, cosy evening light. No people. Photorealistic travel photograph, natural Algarve light, high detail, believable architecture. No text, no signs, no logos.

// The scripted agent for Cinco Chaminés (a made-up example).
// Words by writer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-18. Text CC BY 4.0, code Apache-2.0.
//
// This is a simulation: pre-written answers, matched in the visitor's browser. There is no live
// model and nothing is sent anywhere. The developer's code (not this file) does the matching and
// fills the slots from live data and from /data/homes.json.
//
// MATCHING (for the developer)
// - Normalise the visitor's text first: lower case, accents removed (NFD, strip U+0300 to U+036F),
//   curly quotes made straight. Every pattern below is written for that normalised text.
// - Each pattern is a regular expression source string; build it with new RegExp(src, 'i').
// - INTENTS are in priority order: take the first intent with a matching pattern. Task intents
//   (availability, price, weather, events) come before the home descriptions, so "is the Salt
//   House free next week" goes to availability with home = salt.
// - No match: answer FALLBACK.
//
// CONTEXT
// - home: a home named in the question (see HOME_WORDS), else the last home talked about.
// - dates: dates found in the question ("21 to 28 November", "21/11 to 28/11", "next week",
//   "this weekend", "tomorrow"), else the last dates given. Keep both for the next question.
// - If an answer needs a home and there is none, answer MESSAGES.needHome instead.
// - If an answer needs dates and there are none, use the default the slot names below and say
//   so (MESSAGES.defaultDates).
//
// SLOTS: {kind:target:option}. target is a home id (salt, lagoon, hill, harbour, cape), or
// "current" (the home in context), or as listed. Each slot returns plain text, with any link
// written as [text](url) for the developer to render as a link.
//
//   {home:<id|current>}             One line: name, place, sleeps N, from EUR X a night (invented).
//   {home:<id|current>:<field>}     A field of that home in homes.json, e.g. {home:current:name},
//                                   {home:salt:check_in}, {home:current:accessibility}. For
//                                   features, a comma list. For good_for, a comma list.
//   {homes:list}                    The five homes, one line each, as {home:<id>}.
//   {homes:for:<tag>}               Names of homes whose good_for includes <tag> (families,
//                                   couples, surfers, walkers, groups, no car, step-free access).
//   {homes:pets}                    Names of homes with pets: true.
//   {link:home:<id|current>}        The address of that home's page on this site.
//   {link:book:<id|current>}        The address of that home's calendar and (simulated) booking.
//   {dates}                         The dates in context as words, e.g. "21 to 28 November 2026".
//   {nights}                        Number of nights in the dates in context.
//
//   {availability:<id|current>:dates}
//                                   From the SIMULATED calendar: whether every night in the
//                                   dates is free; if not, the nearest free run of the same
//                                   length within 30 days. Default dates: the next 7 nights.
//                                   Always end with "(simulated availability)".
//   {price:<id|current>:dates}      price_eur_invented x nights, e.g. "7 nights x EUR 120 = EUR 840
//                                   (invented price)". Default dates: 7 nights from today.
//
//   {forecast:<id|current>:dates}   From ipma-city-forecasts latest.json, the city whose id is the
//                                   home's data.forecast_id. One line per day that falls in the
//                                   dates and in the file: date, weather (IPMA weather_type in
//                                   words), min and max in C, chance of rain %. Then: "Forecast
//                                   for <forecast_name>, the nearest IPMA place. Source: IPMA, read
//                                   <read_at as local time>." Default dates: every day in the file.
//                                   If no day of the dates is in the file: MESSAGES.forecastTooFar.
//                                   Missing or stale file: MESSAGES.missing / MESSAGES.stale.
//   {warnings:far}                  From ipma-warnings latest.json, active[] with area "FAR": for
//                                   each, level, type, start to end (Portugal time). None: "No
//                                   yellow, orange or red warning for the Faro district at the last
//                                   read." Then "Source: IPMA, read <read_at>."
//   {warnings:far:dates}            The same, only warnings that overlap the dates in context.
//   {sea:<id|current>}              From ipma-sea latest.json, the coast whose id is the home's
//                                   data.sea_id: per day (up to 3), waves min to max m, direction,
//                                   sea temperature max C. Then "Source: IPMA (<sea_name>), read
//                                   <read_at>."
//   {uv:<id|current>}               From ipma-uv latest.json, the place data.uv_id (fall back to
//                                   data.uv_fallback_id and say so); ignore id 0; take the highest
//                                   value per date. Per day: index and band (0 to 2 low, 3 to 5
//                                   moderate, 6 to 7 high, 8 to 10 very high, 11+ extreme). Then
//                                   "Source: IPMA, read <read_at>."
//   {events:<id|current|lagos|faro|tavira>:dates}
//                                   From events-pt (or /api/v1/events/by-place/<place>.json) for
//                                   the home's data.events_place, or the place named. Keep events
//                                   that overlap the dates (start <= last day and (end or start)
//                                   >= first day). Up to 5, one-off events first, then "also on
//                                   all through your stay" for long-running ones. Each: name, date,
//                                   venue, [link](url). Then "Source: <publisher for that place>,
//                                   read <read_at>, via data.promptugal.news. Reference use only:
//                                   check details with the organiser." Add the home's
//                                   data.events_note when there is one. None: MESSAGES.noEvents.
//                                   Default dates: the next 7 days.
//   {cameras:<id|current>}          From /data/cameras.json, the 3 cameras nearest the home's
//                                   lat, lon: title, operator (short name), [link](url). Then
//                                   "Links go to the operator's own page (checked <checked>)."
//   {read:<source id>}              That source's read_at from the catalogue, as local time.
//
// Time: show times as Portugal local time with the zone, e.g. "18 Nov, 16:12 (Lisbon time)".

export const LABEL = 'Simulation: pre-written answers matched in your browser. No live model, nothing sent.';

// Words that name each home, for context (normalised text, regex sources).
export const HOME_WORDS = {
  salt: ['\\bsalt\\b', '\\btavira\\b', 'casa do sal'],
  lagoon: ['\\blagoon\\b', '\\bfaro\\b', '\\blagoa\\b', 'ria formosa'],
  hill: ['\\bhill\\b', '\\bloule\\b', '\\bcountry house\\b', '\\bpool\\b', '\\bpiscina\\b'],
  harbour: ['\\bharbou?r\\b', '\\blagos\\b', '\\bmarina\\b'],
  cape: ['\\bcape\\b', '\\bsagres\\b', '\\bvila do bispo\\b']
};

export const MESSAGES = {
  needHome: 'Which home do you mean? The Salt House (Tavira), the Lagoon House (Faro), the Hill House (near Loulé), the Harbour House (Lagos) or the Cape House (Sagres).',
  defaultDates: 'You did not give dates, so I used {dates}. Tell me your dates, for example "21 to 28 November".',
  forecastTooFar: 'IPMA\'s forecast in our data only goes five days ahead (today and the next four), so there is nothing yet for {dates}. It should appear about five days before.',
  missing: 'I could not read {source} just now, so I will not guess. Please try again in a few minutes, or look at [IPMA](https://www.ipma.pt/en/) directly.',
  stale: 'The last copy of {source} I can read is from {read_at}, which is old. Treat it with care, and check [IPMA](https://www.ipma.pt/en/) for the latest.',
  missingEvents: 'I could not read the events list just now, so I will not guess. Please try again in a few minutes, or look at {agenda} directly; the [events-pt source card](https://data.promptugal.news/sources/events-pt/) lists every agenda we read.',
  staleEvents: 'The last copy of {source} I can read is from {read_at}, which is old. Treat it with care, and check with the organiser for the latest.',
  noEvents: 'I found no events in the {place} agenda for {dates}. That only means no source we read lists one, not that nothing is on.',
  simulated: '(simulated availability)'
};

export const SUGGESTED = [
  'Which home is best for a family?',
  'Is the Harbour House free from 21 to 28 November?',
  'What is the weather in Sagres this week?',
  'Are there any weather warnings?',
  'What is on near the Salt House next week?',
  'How do I book?',
  'Is this a real company?',
  'How do you work?'
];

export const FALLBACK = 'Sorry, I do not have a pre-written answer for that. I am a simulation that matches your words to a list of questions, so try asking about a home, its availability, the weather, events nearby or how to book.';

export const INTENTS = [
  // ---- About the site and the agent (asked first, so "are you real" is never mistaken for a home) ----
  {
    id: 'what-is-this',
    patterns: [
      'is (this|it) (a )?real', 'real (company|business)', 'what is (this|cinco chamines)', 'is cinco chamines',
      '\\bfake\\b', 'made[- ]up', '\\bscam\\b', 'demonstra', '\\bexemplo\\b', 'isto e real'
    ],
    answer: 'Cinco Chaminés is a made-up example: an invented company with five invented homes, made to show what a small business could build on public data. Nothing here can be booked or paid for. The weather and the events are real, read live from IPMA and public agendas through data.promptugal.news.',
    suggestions: ['Who made this?', 'How do you work?', 'Show me the homes']
  },
  {
    id: 'how-agent-works',
    patterns: [
      'how (do|does) (you|this|the agent|it) work', 'are you (an? )?(ai|bot|robot|human|person|real|llm|model|chatgpt|claude)',
      '\\bllm\\b', 'language model', 'who am i (talking|speaking) to', 'is (this|it) (an? )?(ai|bot|chatgpt|claude|gpt|llm|live model)', 'what are you'
    ],
    answer: 'I am a simulation, not a live model. Your question is matched in your browser against a list of pre-written questions and answers, and the forecast, warnings and events are filled in from live files. Nothing you type is sent anywhere or kept.',
    suggestions: ['Who made this?', 'Where does the weather come from?', 'Use the data']
  },
  {
    id: 'who-made-this',
    patterns: ['who (made|built|created|wrote|is behind) (this|the site|you)', 'agenticcells', 'behind the scenes', 'quem fez'],
    answer: 'A team of AI agents on the AgentiCCells account made this site, in rounds, at Dinis Cruz\'s request, as a demonstration. Each agent had a role (conductor, researcher, designer, developer, writer, reviewer), and you can follow every step on [Behind the scenes](/behind-the-scenes/).',
    suggestions: ['How do you work?', 'Is this a real company?', 'Use the data']
  },

  // ---- The data, the billboard and the cameras (before the weather words they contain) ----
  {
    id: 'events-source',
    patterns: ['where (do|does) (the )?events come from', 'events? source', 'who (lists|publishes) the events'],
    answer: 'The events come from the public agendas of Câmara Municipal de Lagos, Teatro das Figuras in Faro and Câmara Municipal de Tavira, read every six hours into the events-pt file on data.promptugal.news. We show them for reference only, always with a link to the event: check details with the organiser.',
    suggestions: ['What is on near the Harbour House?', 'Use the data']
  },
  {
    id: 'use-the-data',
    patterns: ['use the data', 'raw data', '\\bapi\\b', '\\bjson\\b', 'where does the (weather|data) come from', 'data source', 'promptugal', 'build (this|my own|one)'],
    answer: 'Everything live on this site comes from data.promptugal.news: plain JSON files, no key needed, each with a card that gives its publisher and terms. [Use the data](/use-the-data/) shows the addresses, copy-paste examples and how a real business could build something similar.',
    suggestions: ['How do you work?', 'Use with AI']
  },
  {
    id: 'use-with-ai',
    patterns: ['use with ai', 'llms\\.txt', 'chatgpt|claude|gemini|copilot|my (ai|assistant)', 'ask an? (ai|assistant|agent)'],
    answer: '[Use with AI](/use-with-ai/) explains how to point your own AI assistant at this site and at the data: a Markdown copy of each page, an llms.txt index, and prompts that keep each source\'s terms.',
    suggestions: ['Use the data', 'How do you work?']
  },
  {
    id: 'billboard',
    patterns: ['billboard', '\\blondon\\b', '\\badvert', '\\bpublicidade'],
    answer: 'The billboard is a proposal from Dinis Cruz: a digital billboard in London showing live data and camera views from the Algarve. It is drawn as mock-ups on [A London billboard, live from the Algarve](/billboard/); nothing was bought or booked, and it would need permission from IPMA and the camera operators first.',
    suggestions: ['Show me a live camera', 'Use the data']
  },
  {
    id: 'cameras',
    patterns: ['\\b(camera|cameras|webcam|webcams|live ?cam|livecams?|live view|live stream|stream)\\b', '\\bcamaras?\\b', 'see the beach', 'look like (now|today)'],
    answer: '{cameras:current} We only list public cameras that their operators publish, never police or private CCTV, and we link out rather than show the video, because both operators\' terms ask for permission first. All of them are on [Live from the Algarve](/live/).',
    suggestions: ['What is the sea like?', 'Tell me about the billboard idea']
  },

  // ---- Money and messages: the two questions where the answer is "none" (before price and book) ----
  // Added by the developer for review S1 (payments, confirmation, beaches, greeting-pt and the
  // messages missingEvents and staleEvents), in the writer's tone, for the writer to reword.
  {
    id: 'payments',
    patterns: [
      '\\b(pay|paying|payment|payments|paid)\\b', '(credit|debit|bank|my) card', 'card (details|number|payment)', '\\bby card\\b',
      '\\b(paypal|mb ?way|multibanco|iban|bank transfer|deposit|cash)\\b', '\\bpagar\\b', '\\bpagamento', '\\bcartao\\b'
    ],
    answer: 'There are no payments: this is a demonstration, and nothing is charged. The site never asks for card or bank details, and the booking steps have no payment field. A real business would tell you its prices and terms before taking any money.',
    suggestions: ['How do I book?', 'Is this a real company?', 'How much is the Salt House?']
  },
  {
    id: 'confirmation',
    patterns: [
      '\\bconfirmation\\b', '\\b(e-?mail|email|text|sms|message) (me|us)\\b', 'send (me |us )?(an? |the )?(e-?mail|email|confirmation|receipt|invoice|message|text)',
      '\\b(receipt|invoice|voucher)\\b', '\\bconfirmacao\\b', '\\bemail\\b|\\be-mail\\b'
    ],
    answer: 'Nothing is sent: this site has no email, no messages and no accounts, and the booking steps never ask for an email address. The demonstration ends with "This is a demonstration: nothing was booked, nothing was sent, nothing was charged", and that is all there is.',
    suggestions: ['How do I book?', 'Can I pay by card?', 'Is this a real company?']
  },

  // ---- Booking tasks ----
  {
    id: 'availability',
    patterns: [
      '(?<!step[- ])\\bfree\\b', '\\b(available|availability|vacancy|vacancies)\\b', 'can i stay', 'any (dates|nights)', '\\bdisponi', '\\blivre\\b',
      'is (it|the \\w+ house) (taken|booked)'
    ],
    answer: '{availability:current:dates} The calendar on this site is simulated, so nothing is ever really taken or held.',
    suggestions: ['How much would that cost?', 'What will the weather be?', 'How do I book?']
  },
  {
    id: 'price',
    patterns: ['\\b(price|prices|cost|costs|how much|rate|rates|per night|nightly|cheap|expensive|budget)\\b', '\\bpreco', 'quanto custa', '\\beur\\b|euro'],
    answer: '{price:current:dates} All prices on this site are invented for the made-up example; there are no fees, deposits or payments.',
    suggestions: ['Is it free on my dates?', 'Compare the homes', 'How do I book?']
  },
  {
    id: 'book',
    patterns: ['\\b(book|booking|reserve|reservation)\\b', 'how do i (stay|rent)', '\\breserv', 'make a booking'],
    answer: 'Open a home\'s page, pick your dates on its calendar and follow the steps. It is a demonstration: at the end it says "This is a demonstration: nothing was booked, nothing was sent, nothing was charged", and nothing you type is kept.',
    suggestions: ['Can I cancel or change?', 'What are the check-in times?', 'Is this a real company?']
  },
  {
    id: 'cancel-change',
    patterns: ['\\bcancel', '\\b(change|move|amend|modify) (my )?(booking|dates|reservation|stay)', '\\brefund', '\\bcancelar\\b'],
    answer: 'There is nothing to cancel or change: no booking is ever made on this site, because it is a made-up example. A real business would set out its cancellation terms before you pay; check them, and the cancellation rules where you book, before you commit.',
    suggestions: ['How do I book?', 'Is this a real company?']
  },
  {
    id: 'check-in',
    patterns: ['check[- ]?in', 'check[- ]?out', 'arrival time', 'what time (can|do|should) (i|we) (arrive|leave)', '\\bkeys?\\b', 'late arrival', 'early arrival'],
    answer: '{home:current:name}: check-in from {home:current:check_in}, check-out by {home:current:check_out}. These times are invented for the made-up example.',
    suggestions: ['How do I get there?', 'Is it free on my dates?']
  },

  // ---- Weather and the sea (live, IPMA): warnings first, then sea and UV, then the general forecast ----
  {
    id: 'warnings',
    patterns: ['\\bwarnings?\\b', '\\balerts?\\b', '\\b(storm|tempest)', '\\bdanger', '\\bsafe\\b', '\\baviso', '\\balerta', '(red|orange|yellow) (warning|alert)'],
    answer: '{warnings:far:dates} The whole Algarve is one IPMA warning area, the Faro district. This is not a warning service: for warnings and safety, follow IPMA ([ipma.pt](https://www.ipma.pt/en/otempo/prev-sam/)) and ANEPC, the civil protection authority.',
    suggestions: ['What is the sea like?', 'What is the weather this week?']
  },
  {
    id: 'sea',
    patterns: ['\\b(sea|swell|waves?|surf|surfing|tides?|swim|swimming)\\b', 'water temp', '\\bondas?\\b', '\\bmar\\b', 'agitacao'],
    answer: '{sea:current} IPMA only forecasts the sea three days ahead. Beaches have their own flags and lifeguards in season: follow them, and IPMA\'s warnings.',
    suggestions: ['Are there any warnings?', 'Which home is best for surfers?', 'Show me a live camera']
  },
  {
    id: 'uv',
    patterns: ['\\buv\\b', 'ultra ?violet', 'sun ?(cream|screen|burn|block)', 'how strong is the sun', '\\bindice uv'],
    answer: '{uv:current} Bands are the usual WHO ones; at 3 or more, use shade, a hat and sun cream in the middle of the day.',
    suggestions: ['What is the weather this week?', 'What is the sea like?']
  },
  {
    id: 'weather',
    patterns: ['\\b(weather|forecasts?|rain|raining|rainy|sunny|sun|sunshine|hot|cold|warm|temperatures?|wind|windy|cloudy?)\\b', '\\btempo\\b', '\\bchuva', '\\bprevisao', '\\bcalor\\b', '\\bfrio\\b'],
    answer: '{forecast:current:dates} IPMA\'s own page has more: [ipma.pt forecasts](https://www.ipma.pt/en/otempo/prev.localidade.hora/).',
    suggestions: ['Are there any warnings?', 'What is the sea like?', 'What is the UV index?']
  },

  // ---- Events (live, events-pt, reference use only) ----
  {
    id: 'events',
    patterns: [
      '\\b(events?|happening|things to do|what to do|concerts?|shows?|theatre|exhibitions?|festivals?|markets?|music)\\b.*\\b(near|in|at|during|while|when|week|weekend|dates|stay|november|december|january)',
      '\\bwhat\'?s on\\b', 'what is on', '\\bevents?\\b', '\\beventos?\\b', '\\bagenda\\b', '\\bespetaculo', '\\bconcerto'
    ],
    answer: '{events:current:dates}',
    suggestions: ['What will the weather be on those dates?', 'Is the home free then?', 'Where do the events come from?']
  },

  // ---- Beaches near a place: the nearest home and the cameras near it ----
  {
    id: 'beaches',
    patterns: ['\\b(beach|beaches|praia|praias|seaside)\\b'],
    answer: 'Beaches near {home:current:place}. The nearest of the five homes (all invented): {home:current}\n{cameras:current} Beaches have their own flags and lifeguards in season: follow them, and IPMA\'s warnings.',
    suggestions: ['What is the sea like?', 'Are there any warnings?', 'Is it free on my dates?']
  },

  // ---- Choosing a home (after the tasks, so "is the Hill House free" goes to availability) ----
  {
    id: 'for-families',
    patterns: ['\\bfamil', '\\b(kids|children|child|baby|babies|toddlers?|cot)\\b', '\\bcriancas\\b', '\\bfilhos\\b', 'big group', '\\bgroup\\b', 'six people|6 people|five people|5 people'],
    answer: 'For a family: {homes:for:families}. The Hill House sleeps six and has a private pool and garden, but you need a car; the Harbour House in Lagos has a cot on request and beaches within walking distance.',
    suggestions: ['Is the Hill House free on my dates?', 'Tell me about the Harbour House', 'Can I bring my dog?']
  },
  {
    id: 'for-surfers',
    patterns: ['(home|house|stay|best|good|suits?).*\\b(surf|walk|hik)', 'for (surfers|walkers|surfing|walking|hiking)', '\\bsurfers?\\b', '\\bwalkers\\b'],
    answer: 'For surfers and walkers: {homes:for:surfers}. The Cape House in Sagres has a board and bike store, an outdoor shower and a drying room, and the west coast is close. The sea there is often big: check the sea forecast and warnings first.',
    suggestions: ['What is the sea like at Sagres?', 'Are there any warnings?', 'Show me a live camera']
  },
  {
    id: 'for-couples',
    patterns: ['\\bcouples?\\b', 'two of us', 'for two', 'romantic', 'honeymoon', 'just me and', 'short break', 'weekend away', '\\bcasal\\b'],
    answer: 'For two: {homes:for:couples}. The Lagoon House in Faro is a flat for two near the lagoon and a short drive from the airport, good for a short break; the Salt House in Tavira has a roof terrace and bicycles for two.',
    suggestions: ['Is the Lagoon House free this weekend?', 'What is on in Faro?', 'How much is the Salt House?']
  },
  {
    id: 'no-car',
    patterns: ['no car', 'without (a )?car', 'don\'?t (have|drive)', 'can\'?t drive', 'public transport', 'on foot', '\\bsem carro\\b'],
    answer: 'Without a car: {homes:for:no car}. Tavira, Faro and Lagos are on the Algarve railway line and you can walk to the old town from each of these homes. The Hill House and the Cape House need a car.',
    suggestions: ['How do I get there?', 'Tell me about the Salt House']
  },
  {
    id: 'pets',
    patterns: ['\\b(pets?|dogs?|cats?|puppy)\\b', '\\bcao\\b|\\bcaes\\b', '\\banimais\\b'],
    answer: 'In this made-up example, dogs are welcome at {homes:pets}, and not at the other three homes. A real host would set its own rules; check them before you travel.',
    suggestions: ['Tell me about the Hill House', 'Tell me about the Cape House']
  },
  {
    id: 'accessibility',
    patterns: ['\\baccessib', 'wheelchair', 'step[- ]free', '\\bstairs?\\b', '\\bsteps?\\b', '\\blift\\b|\\belevator\\b', 'mobility', 'disab', '\\bacessivel'],
    answer: 'The Lagoon House in Faro is the only home that is step-free, from the street door to the lift; the others have stairs or a step at the door. These details are invented, like the homes. A real host should tell you exactly, bathroom included, before you book.',
    suggestions: ['Tell me about the Lagoon House', 'How do I get there?']
  },
  {
    id: 'getting-there',
    patterns: ['get(ting)? (there|to)', 'how (do|can) i (get|travel|reach)', '\\b(airport|fly|flight|flights|train|trains|bus|buses|drive|driving|transfer|taxi)\\b', '\\baeroporto\\b', '\\bcomboio\\b'],
    answer: 'Most visitors fly into Faro airport, which serves the whole Algarve. A railway line runs along the coast between Lagos and Vila Real de Santo António through Faro and Tavira, with trains from Lisbon to Faro; Sagres and the hills behind Loulé are easier by car, on the A22 motorway and local roads. Check current timetables and road rules with the operators before you travel.',
    suggestions: ['Which home if I have no car?', 'What are the check-in times?']
  },
  {
    id: 'compare',
    patterns: ['\\bcompare\\b', '\\bcomparison\\b', 'difference between', 'which (home|house|one) (is|should)', 'which is (best|better)', '\\bvs\\b|versus', 'all (the )?(homes|houses)', 'show me the homes', 'list (the )?(homes|houses)', 'what homes', '\\bcasas\\b'],
    answer: 'The five homes (all invented):\n{homes:list}\nTell me who is coming and I can suggest one.',
    suggestions: ['Which home is best for a family?', 'Which home for surfers?', 'Which home if I have no car?']
  },

  // ---- Each home ----
  {
    id: 'home-salt',
    patterns: ['salt house', '\\bsalt\\b', '\\btavira\\b'],
    answer: 'The Salt House, Tavira (invented): a low white house with a roof terrace over the salt pans, a short walk from the old town. Sleeps 4 in 2 bedrooms, from EUR 120 a night (invented price). [See the Salt House]({link:home:salt}).',
    suggestions: ['Is the Salt House free next week?', 'What is on in Tavira?', 'What is the weather in Tavira?']
  },
  {
    id: 'home-lagoon',
    patterns: ['lagoon house', '\\blagoon\\b', '\\bfaro\\b'],
    answer: 'The Lagoon House, Faro (invented): a small first-floor flat for two near the lagoon and the old town, step-free to the lift and a short drive from the airport. Sleeps 2, from EUR 85 a night (invented price). [See the Lagoon House]({link:home:lagoon}).',
    suggestions: ['Is the Lagoon House free this weekend?', 'What is on in Faro?', 'What is the weather in Faro?']
  },
  {
    id: 'home-hill',
    patterns: ['hill house', '\\bhill\\b', '\\bloule\\b', '\\bpool\\b'],
    answer: 'The Hill House, near Loulé (invented): a country house among carob and almond trees with a private pool and a shaded garden; a car is needed. Sleeps 6 in 3 bedrooms, from EUR 160 a night (invented price). [See the Hill House]({link:home:hill}).',
    suggestions: ['Is the Hill House free in December?', 'Can I bring my dog?', 'What is the weather in Loulé?']
  },
  {
    id: 'home-harbour',
    patterns: ['harbou?r house', '\\bharbou?r\\b', '\\blagos\\b', '\\bmarina\\b'],
    answer: 'The Harbour House, Lagos (invented): a two-bedroom town house with a courtyard, a few streets from the marina and the old walls. Sleeps 4, from EUR 130 a night (invented price). [See the Harbour House]({link:home:harbour}).',
    suggestions: ['Is the Harbour House free from 21 to 28 November?', 'What is on in Lagos?', 'Show me a live camera in Lagos']
  },
  {
    id: 'home-cape',
    patterns: ['cape house', '\\bcape\\b', '\\bsagres\\b', 'vila do bispo'],
    answer: 'The Cape House, Sagres (invented): a plain, wind-proof house at the south-west tip, for surfers and walkers, with a board store and a drying room; a car helps. Sleeps 5 in 3 bedrooms, from EUR 145 a night (invented price). [See the Cape House]({link:home:cape}).',
    suggestions: ['What is the sea like at Sagres?', 'Are there any warnings?', 'Is the Cape House free next week?']
  },
  {
    id: 'about-home',
    patterns: ['tell me (more )?about (it|this home|this house|the house)', 'what is (it|the house) like', '\\bfeatures\\b', 'what does it have', '\\bbedrooms?\\b', 'how many (people|guests)', 'sleeps'],
    answer: '{home:current} Features: {home:current:features}. [See {home:current:name}]({link:home:current}).',
    suggestions: ['Is it free on my dates?', 'What is the weather there?', 'What is on nearby?']
  },

  // ---- Small talk (whole-message matches, so they never swallow a real question) ----
  {
    id: 'greeting-pt',
    patterns: ['^\\s*(ola|oi|bom dia|boa tarde|boa noite)\\b[\\s!.,]*((bom dia|boa tarde|boa noite|tudo bem)\\b[\\s!.,?]*)?$'],
    answer: 'Olá! Sou o agente da Cinco Chaminés, uma simulação com respostas escritas de antemão; percebo algumas perguntas em português, mas respondo em inglês. Hello: I am the Cinco Chaminés agent, a simulation. Ask me about the five homes, their simulated availability, or the live weather, sea and events.',
    suggestions: ['qual é o tempo amanhã em Faro', 'Show me the homes', 'Is this a real company?']
  },
  {
    id: 'greeting',
    patterns: ['^\\s*(hi|hello|hey|hiya|good (morning|afternoon|evening)|ola|bom dia|boa tarde|boa noite)\\b[\\s!.,]*(there)?[\\s!.,]*$'],
    answer: 'Hello. I am the Cinco Chaminés assistant, a simulation with pre-written answers. I can tell you about the five homes, their (simulated) availability, the live weather and events for your dates, and how this made-up example works.',
    suggestions: ['Show me the homes', 'What is the weather this week?', 'Is this a real company?']
  },
  {
    id: 'thanks',
    patterns: ['^\\s*(thanks|thank you|cheers|ta|obrigad[oa]|great|ok|okay|perfect|lovely)\\b[\\s!.,a-z]*$'],
    answer: 'You are welcome. Ask me anything else about the homes, the weather or what is on.',
    suggestions: ['What is on next week?', 'How do I book?']
  },
  {
    id: 'bye',
    patterns: ['\\b(bye|goodbye|see you|adeus|tchau|ate logo)\\b'],
    answer: 'Goodbye. Remember this is a made-up example: if you are planning a real trip, check the weather with IPMA and book with a real host.',
    suggestions: []
  }
];

// stay/content.js: the invented words of the guest's stay page (/stay/) of Cinco Chaminés, a
// made-up example. Everything here is INVENTED and labelled so on the page: check-in details,
// suggestions of beaches, walks and food (real places are named only as places; the suggestion
// is ours, never a business), and the general guidance for getting there from Faro airport
// (no times or prices that could pass for a timetable). Pure data and pure helpers, no DOM, no
// network; tested in tests/stay.test.mjs. Text CC BY 4.0; code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance E), 2026-11-18, round 3.

// Suggestions per home: kind beach | walk | food | indoor; outdoor marks what rain can spoil.
export const SUGGESTIONS = Object.freeze({
  salt: [
    { id: 'salt-ilha', kind: 'beach', time: '11:00', outdoor: true, title: 'Island beach across the lagoon (Ilha de Tavira, a real place)', note: 'The suggestion is ours; check the ferry before you go.' },
    { id: 'salt-pans', kind: 'walk', time: '17:00', outdoor: true, title: 'Walk along the salt pans at the end of the day', note: 'Invented suggestion; keep to the paths.' },
    { id: 'salt-town', kind: 'walk', time: '10:00', outdoor: true, title: 'The old town and the Roman bridge on foot (a real place)', note: 'Invented suggestion.' },
    { id: 'salt-fish', kind: 'food', time: '13:00', outdoor: false, title: 'Grilled-fish lunch near the old bridge', note: 'Not a real restaurant; ask locally.' },
    { id: 'salt-market', kind: 'food', time: '09:30', outdoor: false, title: 'Market morning: oranges, almonds, figs', note: 'Invented suggestion; check the market days locally.' },
  ],
  lagoon: [
    { id: 'lagoon-boat', kind: 'beach', time: '10:30', outdoor: true, title: 'Boat to the barrier islands (Ilha Deserta and Ilha do Farol, real places)', note: 'The suggestion is ours; check the boats before you go.' },
    { id: 'lagoon-town', kind: 'walk', time: '17:00', outdoor: true, title: 'Inside the old town walls at sunset (Vila Adentro, a real place)', note: 'Invented suggestion.' },
    { id: 'lagoon-beach', kind: 'beach', time: '12:00', outdoor: true, title: 'Faro beach on the long sand spit (a real place)', note: 'The suggestion is ours.' },
    { id: 'lagoon-clams', kind: 'food', time: '13:00', outdoor: false, title: 'Clams and rice by the harbour', note: 'Not a real restaurant; ask locally.' },
    { id: 'lagoon-museum', kind: 'indoor', time: '11:00', outdoor: false, title: 'A rainy-day museum morning in the old town', note: 'Invented suggestion; check opening times.' },
  ],
  hill: [
    { id: 'hill-market', kind: 'food', time: '09:30', outdoor: false, title: 'Loulé market hall, a real place: cheese, honey, oranges', note: 'The suggestion is ours; check the opening days.' },
    { id: 'hill-benemola', kind: 'walk', time: '10:30', outdoor: true, title: 'River walk at Fonte da Benémola (a real place)', note: 'Invented suggestion; good shoes.' },
    { id: 'hill-querenca', kind: 'walk', time: '15:00', outdoor: true, title: 'Drive up to the hill village of Querença (a real place)', note: 'Invented suggestion.' },
    { id: 'hill-beach', kind: 'beach', time: '12:00', outdoor: true, title: 'Half a day at the beach at Quarteira (a real place)', note: 'The suggestion is ours; about 20 minutes by car (estimate).' },
    { id: 'hill-cook', kind: 'food', time: '19:30', outdoor: false, title: 'Cook at home: the barbecue and a market bag', note: 'Invented suggestion.' },
  ],
  harbour: [
    { id: 'harbour-piedade', kind: 'walk', time: '10:00', outdoor: true, title: 'Cliff path to Ponta da Piedade (a real place)', note: 'The suggestion is ours; keep away from the edges.' },
    { id: 'harbour-dona-ana', kind: 'beach', time: '12:30', outdoor: true, title: 'Praia Dona Ana, the cove below the cliffs (a real place)', note: 'Invented suggestion.' },
    { id: 'harbour-meia', kind: 'beach', time: '15:00', outdoor: true, title: 'The long beach of Meia Praia (a real place)', note: 'Invented suggestion.' },
    { id: 'harbour-walls', kind: 'walk', time: '17:30', outdoor: true, title: 'The town walls and the old harbour at dusk', note: 'Invented suggestion.' },
    { id: 'harbour-fish', kind: 'food', time: '13:00', outdoor: false, title: 'Fish of the day near the marina', note: 'Not a real restaurant; ask locally.' },
  ],
  cape: [
    { id: 'cape-vicente', kind: 'walk', time: '17:00', outdoor: true, title: 'Sunset at Cabo de São Vicente (a real place)', note: 'The suggestion is ours; it is windy, bring a layer.' },
    { id: 'cape-fortress', kind: 'walk', time: '10:30', outdoor: true, title: 'The headland of the Sagres fortress (a real place)', note: 'Invented suggestion; check opening times.' },
    { id: 'cape-beliche', kind: 'beach', time: '12:00', outdoor: true, title: 'Praia do Beliche, under the cliffs (a real place)', note: 'Invented suggestion; steep steps.' },
    { id: 'cape-path', kind: 'walk', time: '09:30', outdoor: true, title: 'A stretch of the coast path north of Sagres', note: 'Invented suggestion; check the route before you go.' },
    { id: 'cape-stove', kind: 'indoor', time: '20:00', outdoor: false, title: 'A night in by the wood stove', note: 'Invented suggestion.' },
  ],
});

// Getting there from Faro airport: general guidance, three ways, no timetable.
export const GETTING_THERE = Object.freeze({
  salt: { car: 'East along the A22 motorway towards Spain, then into Tavira; roughly 35 to 45 minutes (estimate). Tolls on the A22 are electronic: ask the hire company how they are paid.', train: 'Bus or taxi from the airport to Faro station, then the regional line east to Tavira; the house is a walk from the station.', taxi: 'A taxi or a booked transfer takes you to the door; book ahead for a late arrival.' },
  lagoon: { car: 'A short drive into Faro; roughly 10 to 15 minutes (estimate). Parking near the old town is limited.', train: 'A town bus runs from the airport to the centre of Faro; the flat is a walk from the stops by the harbour.', taxi: 'A taxi from the rank outside arrivals is the simplest way for two people with bags.' },
  hill: { car: 'West on the A22, then north on the road to Loulé and up the hill lanes; roughly 25 to 35 minutes (estimate). A car is needed for this house.', train: 'There is no station near the house: bus to Loulé, then a taxi up the hill.', taxi: 'A booked transfer is the easiest way for six with bags.' },
  harbour: { car: 'West along the A22 to its end near Lagos; roughly 60 to 75 minutes (estimate). Tolls on the A22 are electronic.', train: 'Bus or taxi to Faro station, then the regional line west to Lagos (a change on the way is usual); the house is a walk from the station.', taxi: 'A transfer is a long ride: book ahead and agree the price first.' },
  cape: { car: 'West on the A22 to Lagos, then the road to Sagres; roughly 80 to 100 minutes (estimate). A car is needed for this house.', train: 'Train to Lagos, then the local bus to Sagres; check the last bus of the day.', taxi: 'A transfer the whole way is long: book ahead and agree the price first.' },
});
export const GETTING_THERE_NOTE = 'General guidance written by the team, not a timetable. Check the operators before you travel.';

// Check-in details (invented; the house does not exist).
export function checkInFor(home) {
  const short = String(home?.name || 'House').replace(/^The /, '').replace(/\s+/g, '');
  return {
    checkIn: home?.check_in || '16:00', checkOut: home?.check_out || '10:00',
    key: 'key safe by the door, code 0000 (demo)', wifi: `"${short}-demo"`, address: 'none: the house does not exist',
  };
}

// Issue categories for "report an issue" (invented cost estimates for the admin's books).
export const ISSUE_KINDS = Object.freeze([
  { id: 'hot water', label: 'Hot water', cost: 160 },
  { id: 'wi-fi', label: 'Wi-fi', cost: 40 },
  { id: 'cleaning', label: 'Cleaning', cost: 30 },
  { id: 'noise', label: 'Noise', cost: 0 },
  { id: 'other', label: 'Something else', cost: 50 },
]);
export const URGENCY = Object.freeze([
  { id: 'high', label: 'Urgent: now' }, { id: 'medium', label: 'Today' }, { id: 'low', label: 'When convenient' },
]);
// The simulated host's scripted replies (no live model): by what the guest wrote about.
export function hostReply(text) {
  const t = String(text || '').toLowerCase();
  if (/water|boiler|shower|hot/.test(t)) return 'Thank you, we are sending someone to look at the hot water. (Simulated host: a scripted reply.)';
  if (/wi-?fi|internet/.test(t)) return 'Thank you: please switch the router off and on; if it is still down we will come by. (Simulated host: a scripted reply.)';
  if (/late|arriv|time|key/.test(t)) return 'No problem: the key safe works at any hour, code 0000 (demo). (Simulated host: a scripted reply.)';
  return 'Thank you for your message, we will get back to you today. (Simulated host: a scripted reply.)';
}

// Rain from IPMA's real forecast: the agent's threshold (PROPOSAL.md 2.4).
export const RAIN_SWAP = 60;
// Words that make a real event look like it happens outdoors (a guess, said as one).
export const OUTDOOR_WORDS = /\b(?:passeio|caminhad|pedal|bicicl|bike|walk|praia|beach|feira|mercado|market|ar livre|outdoor|trilho|percurso|corrida|regata|desfile)\w*/i;
export const looksOutdoor = item => Boolean(item && !item.kept && (item.outdoor || (item.kind === 'event' && OUTDOOR_WORDS.test(item.title || ''))));

// IPMA weather type -> a glyph name (IPMA's own list: weather-type-classe.json).
export function glyphOf(type) {
  const t = Number(type);
  if (t === 1) return 'sun';
  if ([2, 3, 25].includes(t)) return 'sun-cloud';
  if ([4, 5, 24, 27].includes(t)) return 'cloud';
  if ([16, 17, 26].includes(t)) return 'fog';
  if (t >= 6 && t <= 23) return 'rain';
  return 'none';
}

// The plan as a plain text file and as a calendar file (.ics), built in the page and handed to the visitor.
const icsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/[,;]/g, m => `\\${m}`).replace(/\r?\n/g, '\\n');
export function planText(booking, homeName, plan) {
  const lines = [`My plan: ${homeName}, ${booking.from} to ${booking.to}`, 'A made-up example (Cinco Chaminés is invented). Events are real as published; suggestions are invented.', ''];
  for (const day of Object.keys(plan).sort()) {
    if (!plan[day].length) continue;
    lines.push(day);
    for (const it of sortPlan(plan[day])) lines.push(`  ${it.time || '--:--'}  ${it.title}${it.kind === 'event' ? ' (real event)' : it.kind === 'own' ? ' (you wrote this)' : ' (invented suggestion)'}${it.url ? `  ${it.url}` : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}
export function planICS(booking, homeName, plan) {
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cinco Chamines (a made-up example)//stay plan//EN'];
  for (const day of Object.keys(plan).sort()) for (const it of sortPlan(plan[day])) {
    const d = day.replace(/-/g, ''), t = (it.time || '09:00').replace(':', '');
    out.push('BEGIN:VEVENT', `UID:${icsEsc(`${booking.id}-${it.id}`)}@cinco-chamines.invalid`, `DTSTART:${d}T${t}00`, `DURATION:PT1H`,
      `SUMMARY:${icsEsc(it.title)}`, `DESCRIPTION:${icsEsc(`${it.kind === 'event' ? 'Real event as published' : it.kind === 'own' ? 'You wrote this' : 'Invented suggestion'}. Stay at ${homeName} (a made-up example).${it.url ? ` ${it.url}` : ''}`)}`, 'END:VEVENT');
  }
  out.push('END:VCALENDAR');
  return out.join('\r\n');
}
export const sortPlan = items => [...items].sort((a, b) => String(a.time || '99').localeCompare(String(b.time || '99')) || (a.order || 0) - (b.order || 0));

// The best other day for an outdoor item: lowest real rain chance under 40 percent, or null.
export function drierDay(days, from) {
  const c = days.filter(d => d.date !== from && d.rain !== null && d.rain !== undefined && d.rain < 40).sort((a, b) => a.rain - b.rain || a.date.localeCompare(b.date));
  return c[0] || null;
}

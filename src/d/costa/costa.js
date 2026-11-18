// costa.js: design 4 of 5, Costa (the coast first, a drawn map), for the made-up example site Cinco Chaminés.
// Places a callout per home on the drawn map, in the map's own coordinates (viewBox 1100 x 520),
// with today's IPMA forecast for the home's place; fills the warning ribbon, the source lines,
// the west-to-east table (forecast, sea, UV, simulated availability, invented price) and the
// events. Reads live from data.promptugal.news; sends nothing. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18, round 2.
import { D, T, esc, FAIL, FAIL_EVENTS, CAPTION, imgName, altFor, picture, stay, avail, stayWords, bindStay,
  live, homeToday, src, failNote, bindRetry, ipmaTerms, warnWords, eventItems, TOWN, range, one } from './kit.js';

const $ = id => document.getElementById(id);
// West to east, numbered as the pins; callout boxes in viewBox units: x, y and whether y is the box's top or bottom.
const ORDER = ['cape', 'harbour', 'hill', 'lagoon', 'salt'];
const BOX = { cape: [8, 340, 'top'], harbour: [206, 290, 'top'], hill: [580, 174, 'bottom'], lagoon: [640, 340, 'top'], salt: [850, 174, 'bottom'] };
const pct = (v, of) => `${(v / of * 100).toFixed(2)}%`;

async function seaUv(h) {
  const d = h.data || {};
  const [sea, uv0] = await Promise.all([D.seaFor(d.sea_id), D.uvFor(d.uv_id)]);
  let uv = uv0;
  if (!uv.days.length && d.uv_fallback_id) uv = { ...(await D.uvFor(d.uv_fallback_id)), fallback: true };
  const sd = sea.days.find(x => x.date === T) || sea.days[0] || null;
  const ud = uv.days.find(x => x.date === T) || uv.days[0] || null;
  return { sea, sd, uv, ud };
}

async function render() {
  const all = await D.homes();
  const list = ORDER.map(id => all.find(h => h.id === id)).filter(Boolean);
  const s = stay();
  const L = await live();
  const today = await Promise.all(list.map(homeToday));
  const extra = await Promise.all(list.map(seaUv));

  // callouts on the map
  $('co-calls').innerHTML = list.map((h, i) => {
    const t = today[i], [x, y, edge] = BOX[h.id];
    const pos = `left:${pct(x, 1100)};top:${pct(y, 520)}${edge === 'bottom' ? ';transform:translateY(-100%)' : ''}`;
    const fig = t.res.error ? '<span class="co-na">Forecast could not be read just now</span>'
      : t.day ? `<a href="${esc(t.res.urls.card)}">${esc(h.data?.forecast_name || '')}</a> <b>${esc(range(t.day.tmin, t.day.tmax, '°C'))}</b><span class="co-w">${esc(t.day.weather)}, rain ${esc(t.day.rain_pct ?? '?')} %</span>`
      : '<span class="co-na">No forecast for today in the file</span>';
    return `<div class="co-call" style="${pos}"><div class="co-call-pic">${picture(imgName(h, 'hero'), altFor(h, 'hero'), { sizes: '200px' })}<span>AI picture</span></div>
<div class="co-call-b"><h3><span class="co-n">${i + 1}</span><a href="${esc(avail(h, s).link)}">${esc(h.name)}</a></h3><p class="co-f">${fig}</p></div></div>`;
  }).join('');

  // warning ribbon in the sea
  const rib = $('co-ribbon');
  if (L.wa.res.error) { rib.hidden = false; rib.className = 'co-ribbon co-ribbon-na'; rib.textContent = 'Warnings could not be read just now'; }
  else if (L.wa.items.length) { const w = L.wa.items[0]; rib.hidden = false; rib.className = `co-ribbon co-ribbon-${w.level}`; rib.innerHTML = `<b>${esc(warnWords(w).split(':')[0])}</b>: ${esc(warnWords(w).split(': ').slice(1).join(': '))}${L.wa.items.length > 1 ? ` (and ${L.wa.items.length - 1} more)` : ''}`; }
  else { rib.hidden = false; rib.className = 'co-ribbon co-ribbon-none'; rib.textContent = 'No warning for the Faro district at the time read'; }

  // one source block under the map
  const res = [L.fc.res, L.sea.res, L.uv.res, L.wa.res];
  const failed = res.filter(r => r.error).map(r => r.id);
  $('co-map-src').innerHTML = `${failed.length ? failNote(FAIL, failed) : ''}${res.map(r => src(r)).join('')}<p class="src">Terms: ${esc(ipmaTerms(L.fc.res))}</p>`;

  // the table, west to east
  $('co-for').textContent = `Shown for ${stayWords(s)}. Availability is simulated and prices are invented. Your dates stay in this tab and the page address; nothing is sent.`;
  const rows = list.map((h, i) => {
    const t = today[i], e = extra[i], a = avail(h, s), d = h.data || {};
    const near = d.forecast_note && !/^Same/.test(d.forecast_note) ? (d.forecast_note.match(/about (\d+) km/) || [])[1] : null;
    const tf = t.res.error ? '<span class="co-na">not read</span>' : t.day ? `${esc(range(t.day.tmin, t.day.tmax, '°C'))}<small>${esc(t.day.weather)}</small>` : '<span class="co-na">none today</span>';
    const sf = e.sea.res.error ? '<span class="co-na">not read</span>' : e.sd ? `${esc(range(e.sd.temp_min, e.sd.temp_max, '°C'))}<small>waves ${esc(range(e.sd.waves_min, e.sd.waves_max, 'm'))}, ${esc(d.sea_name || '')}</small>` : '<span class="co-na">none</span>';
    const uf = e.uv.res.error ? '<span class="co-na">not read</span>' : e.ud ? `${esc(one(e.ud.index))} <small>${esc(e.ud.band)}${e.uv.fallback ? ', Faro\'s figure' : ''}</small>` : '<span class="co-na">none</span>';
    return `<tr>
<td class="co-thumb">${picture(imgName(h, 'hero'), '', { sizes: '120px' })}</td>
<th scope="row"><span class="co-n">${i + 1}</span> <a href="${esc(a.link)}">${esc(h.name)}</a><small>${esc(h.place)}, sleeps ${esc(h.sleeps)}</small></th>
<td data-k="Forecast place">${esc(d.forecast_name || '')}${near ? ` <small>nearest IPMA place, ${esc(near)} km</small>` : ''}</td>
<td data-k="Today" class="co-fig">${tf}</td>
<td data-k="Sea" class="co-fig">${sf}</td>
<td data-k="UV" class="co-fig">${uf}</td>
<td data-k="Your dates" class="${a.free ? 'co-free' : 'co-taken'}">${a.free ? `<b>Free</b> (simulated)<small>${a.nights} nights, EUR ${a.total} (invented)</small>` : `<b>Taken</b> (simulated)<small>from ${esc(D.fmtDay(a.first || s.from))}</small>`}</td>
<td data-k="A night" class="co-fig">EUR ${esc(h.price_eur_invented)}<small>invented</small></td>
</tr>`;
  }).join('');
  $('co-table').innerHTML = `<table class="co-tbl"><caption class="sr-only">The five invented homes from west to east, with IPMA's figures for today and simulated availability</caption>
<thead><tr><th scope="col"><span class="sr-only">Picture</span></th><th scope="col">Home</th><th scope="col">Forecast place</th><th scope="col">Today</th><th scope="col">Sea</th><th scope="col">UV</th><th scope="col">Your dates</th><th scope="col">A night</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="co-capt">Pictures: ${CAPTION.house}</p>
${src(today[0].res)}${src(extra[0].sea.res)}${src(extra[0].uv.res)}`;

  // events, west to east
  const on = $('co-on');
  if (L.ev.faro.res.error) on.innerHTML = failNote(FAIL_EVENTS, ['events-pt']) + src(L.ev.faro.res);
  else on.innerHTML = ['lagos', 'faro', 'tavira'].map(p => `<div class="co-on-col"><h3>${esc(TOWN[p])}</h3>${L.ev[p].items.length
    ? `<ul class="co-ev">${eventItems(L.ev[p].items, 4)}</ul>` : '<p class="co-na">No events in this agenda for the next seven days.</p>'}${src(L.ev[p].res)}</div>`).join('');
}

bindStay($('co-plan'), () => render());
bindRetry($('main'), () => render());
render();

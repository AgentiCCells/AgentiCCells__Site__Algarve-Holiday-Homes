// azulejo.js: design 2 of 5, Azulejo (blue and white tiles), for the made-up example site Cinco Chaminés.
// Fills the four figure tiles, the five framed homes (simulated availability for the chosen
// dates, invented prices, today's forecast for each home's IPMA place) and the events tiles,
// each figure with its source line, read live from data.promptugal.news. Sends nothing.
// Code Apache-2.0. developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18, round 2.
import { D, T, esc, FAIL, FAIL_EVENTS, CAPTION, imgName, altFor, picture, stay, avail, stayWords, bindStay,
  live, homeToday, src, shortSrc, failNote, bindRetry, ipmaTerms, eventItems, TOWN, range, one } from './kit.js';

const $ = id => document.getElementById(id);
// One card shows its joke picture, a different home each day of the year.
const doy = Math.floor((Date.parse(`${T}T12:00:00Z`) - Date.parse(`${T.slice(0, 4)}-01-01T12:00:00Z`)) / 86400000);

async function renderNow() {
  const box = $('az-now');
  const L = await live();
  const f = L.today, s = L.seaDay, u = L.uvDay, w = L.wa.items[0];
  const tile = (k, res, v, words, cls = '') => `<div class="az-tile${cls}"><p class="az-k">${esc(k)}</p>${res.error
    ? '<p class="az-v az-na">Not read</p><p class="az-w">see the source line below</p>'
    : `<p class="az-v">${v}</p><p class="az-w">${words}</p>`}</div>`;
  const tiles = [
    tile('Faro today', L.fc.res, f ? esc(range(f.tmin, f.tmax, '°C')) : 'none', f ? `${esc(f.weather)}, rain ${esc(f.rain_pct ?? '?')} %` : 'no forecast for today in the file'),
    tile('Sea, Faro coast', L.sea.res, s ? esc(range(s.temp_min, s.temp_max, '°C')) : 'none', s ? `waves ${esc(range(s.waves_min, s.waves_max, 'm'))}` : 'no sea forecast in the file'),
    tile('UV, Faro', L.uv.res, u ? esc(one(u.index)) : 'none', u ? esc(u.band) : 'no UV forecast in the file'),
    tile('Warning, Faro district', L.wa.res, w ? esc(w.level.charAt(0).toUpperCase() + w.level.slice(1)) : 'None',
      w ? `${esc(w.type)}, to ${esc(D.fmtLocal(w.end || w.start))}${L.wa.items.length > 1 ? ` (and ${L.wa.items.length - 1} more)` : ''}` : 'no yellow, orange or red warning at the time read',
      w ? ` az-warn az-warn-${esc(w.level)}` : ''),
  ].join('');
  const all = [L.fc.res, L.sea.res, L.uv.res, L.wa.res];
  const failed = all.filter(r => r.error).map(r => r.id);
  box.innerHTML = `<div class="az-tiles">${tiles}</div>${failed.length ? failNote(FAIL, failed) : ''}<div class="az-srcs">${all.map(r => src(r)).join('')}<p class="src">Terms: ${esc(ipmaTerms(L.fc.res))}</p></div>`;
}

async function renderHomes() {
  const list = await D.homes();
  const s = stay();
  $('az-for').textContent = `Invented homes, invented prices, shown for ${stayWords(s)}. Every picture is AI-generated.`;
  if (!list.length) { $('az-grid').insertAdjacentHTML('beforebegin', '<p class="fail">The list of homes could not be read just now; the links below still work.</p>'); return; }
  const today = await Promise.all(list.map(homeToday));
  const joke = list[doy % list.length].id;
  $('az-grid').innerHTML = list.map((h, i) => {
    const a = avail(h, s), t = today[i];
    const kind = h.id === joke ? 'funny' : 'hero';
    const fig = t.res.error ? '<span class="az-na">forecast not read</span>' : t.day ? `<b>${esc(range(t.day.tmin, t.day.tmax, '°C'))}</b>, ${esc(t.day.weather)}` : 'no forecast for today in the file';
    return `<li class="az-home${i === 0 ? ' wide' : ''}"><article aria-labelledby="az-${esc(h.id)}">
<figure class="az-frame">${picture(imgName(h, kind), altFor(h, kind), { sizes: i === 0 ? '(min-width: 900px) 740px, 100vw' : '(min-width: 900px) 360px, 100vw' })}
<figcaption>${kind === 'funny' ? `Today's joke card: ${esc(h.name)} where it does not belong. ${CAPTION.joke}` : CAPTION.house}</figcaption></figure>
<div class="az-home-body">
<h3 id="az-${esc(h.id)}"><a href="${esc(a.link)}">${esc(h.name)}</a></h3>
<p>${esc(h.place)}. ${esc(h.short || '')}</p>
<p class="az-meta">Sleeps ${esc(h.sleeps)} · ${esc(h.bedrooms)} bedroom${h.bedrooms === 1 ? '' : 's'} · <span class="az-price">EUR ${esc(h.price_eur_invented)} a night</span> (invented)</p>
<p class="az-avail ${a.free ? 'is-free' : 'is-taken'}">${esc(a.text)}</p>
<p class="az-today">Today at IPMA's ${esc(h.data?.forecast_name || 'place')}: ${fig}</p>
${shortSrc(t.res)}
</div></article></li>`;
  }).join('');
}

async function renderOn() {
  const box = $('az-on');
  const L = await live();
  if (L.ev.faro.res.error) { box.innerHTML = failNote(FAIL_EVENTS, ['events-pt']) + src(L.ev.faro.res); return; }
  box.innerHTML = ['faro', 'lagos', 'tavira'].map(p => `<div class="az-on-tile"><h3>${esc(TOWN[p])}</h3>${L.ev[p].items.length
    ? `<ul class="az-ev">${eventItems(L.ev[p].items, 4)}</ul>` : '<p class="az-na">No events in this agenda for the next seven days.</p>'}${src(L.ev[p].res)}</div>`).join('');
}

bindStay($('az-plan'), () => { renderHomes(); $('az-homes-h').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
bindRetry($('main'), () => { renderNow(); renderHomes(); renderOn(); });
renderNow(); renderHomes(); renderOn();

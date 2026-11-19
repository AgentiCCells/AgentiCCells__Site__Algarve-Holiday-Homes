// postal.js: design 5 of 5, Postal (postcards with stamps), for the made-up example site Cinco Chaminés.
// Fills the four stamps of today's post (forecast, sea, UV, warning), the five postcards (each with
// a postmark carrying today's IPMA forecast for the home's place, simulated availability and an
// invented price, the source line printed under the card), the market card with the week's events
// and the joke-picture row. Reads live from data.promptugal.news; sends nothing. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18, round 2.
import { D, T, esc, FAIL, FAIL_EVENTS, CAPTION, imgName, altFor, picture, placeAlt, stay, avail, stayWords, bindStay,
  live, homeToday, src, shortSrc, failNote, bindRetry, ipmaTerms, eventItems, TOWN, range, one, rateHtml, rateNote, levelHtml } from './kit.js';
import { chimney } from '/assets/js/houses.js';

const $ = id => document.getElementById(id);
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const dayStamp = `${Number(T.slice(8, 10))} ${MON[Number(T.slice(5, 7)) - 1]} ${T.slice(0, 4)}`;

// A round postmark: the place and date on a ring, the figure in the middle (as text, not drawn into a picture).
function postmark(id, place, t) {
  const fig = t.res.error ? ['NOT READ', 'see below'] : t.day ? [`${one(t.day.tmin)} to ${one(t.day.tmax)}`, '°C today'] : ['NO FORECAST', 'today'];
  const label = t.res.error ? `Postmark: ${place}, ${dayStamp}; IPMA's forecast could not be read just now` : t.day ? `Postmark: ${place}, ${dayStamp}, IPMA forecast ${one(t.day.tmin)} to ${one(t.day.tmax)} °C, ${t.day.weather}` : `Postmark: ${place}, ${dayStamp}, no forecast for today`;
  return `<svg class="pc-pm" viewBox="0 0 132 132" role="img" aria-label="${esc(label)}">
<defs><path id="pm-${esc(id)}" d="M66,66 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0"/></defs>
<circle cx="66" cy="66" r="61" fill="rgba(255,253,248,.88)" stroke="currentColor" stroke-width="2.5"/>
<circle cx="66" cy="66" r="36" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text font-size="11.5" font-weight="700" letter-spacing="1.6" fill="currentColor"><textPath href="#pm-${esc(id)}">${esc(place.toUpperCase())} · ${esc(dayStamp)} · IPMA ·</textPath></text>
<text x="66" y="64" text-anchor="middle" font-size="${fig[0].length > 10 ? 10.5 : 13}" font-weight="700" fill="currentColor">${esc(fig[0])}</text>
<text x="66" y="80" text-anchor="middle" font-size="10.5" fill="currentColor">${esc(fig[1])}</text>
</svg>`;
}
const stampHtml = (label) => `<span class="pc-stamp" aria-hidden="true">${chimney({ width: 22, height: 36 })}<span>${esc(label)}</span></span>`;

async function renderNow() {
  const L = await live();
  const f = L.today, s = L.seaDay, u = L.uvDay, w = L.wa.items[0];
  const st = (k, res, v, words, cls = '') => `<li class="pc-st${cls}"><p class="pc-st-k">${esc(k)}</p>${res.error ? '<p class="pc-st-v pc-na">Not read</p><p class="pc-st-w">see below</p>' : `<p class="pc-st-v">${v}</p><p class="pc-st-w">${words}</p>`}</li>`;
  const all = [L.fc.res, L.sea.res, L.uv.res, L.wa.res];
  const failed = all.filter(r => r.error).map(r => r.id);
  $('pc-now').innerHTML = `<ul class="pc-stamps">
${st('Faro today', L.fc.res, f ? esc(range(f.tmin, f.tmax, '°C')) : 'none', f ? `${esc(f.weather)}, rain ${esc(f.rain_pct ?? '?')} %` : 'no forecast today')}
${st('Sea, Faro coast', L.sea.res, s ? esc(range(s.temp_min, s.temp_max, '°C')) : 'none', s ? `waves ${esc(range(s.waves_min, s.waves_max, 'm'))}` : 'no figure')}
${st('UV, Faro', L.uv.res, u ? esc(one(u.index)) : 'none', u ? esc(u.band) : 'no figure')}
${st('Warning, Faro district', L.wa.res, w ? esc(w.level.charAt(0).toUpperCase() + w.level.slice(1)) : 'None', w ? `${esc(w.type)}, to ${esc(D.fmtLocal(w.end || w.start))}` : 'no warning at the time read', w ? ` pc-st-warn pc-st-${esc(w.level)}` : '')}
</ul>${failed.length ? failNote(FAIL, failed) : ''}<div class="pc-srcs">${all.map(r => src(r)).join('')}<p class="src">Terms: ${esc(ipmaTerms(L.fc.res))}</p></div>`;
}

async function renderCards() {
  const list = await D.homes();
  const s = stay();
  $('pc-for').textContent = `Shown for ${stayWords(s)}. Each postmark carries today's forecast for the home's nearest IPMA place.`;
  if (!list.length) { $('pc-grid').insertAdjacentHTML('beforebegin', '<p class="fail">The list of homes could not be read just now; the links below still work.</p>'); return; }
  const today = await Promise.all(list.map(homeToday));
  const L = await live();
  const cards = list.map((h, i) => {
    const a = avail(h, s), t = today[i];
    return `<li class="pc-card r${i % 3}"><article aria-labelledby="pc-${esc(h.id)}">
<figure class="pc-front">${picture(imgName(h, 'hero'), altFor(h, 'hero'), { sizes: '(min-width: 900px) 380px, 100vw' })}<figcaption>${CAPTION.house}</figcaption></figure>
<div class="pc-back">
${stampHtml('Cinco Chaminés')}
${postmark(h.id, h.data?.forecast_name || h.place, t)}
<h3 id="pc-${esc(h.id)}"><a href="${esc(a.link)}">${esc(h.name)}</a></h3>
<p class="pc-place">${esc(h.place)}</p>
<p class="pc-line">${esc(h.short || '')}</p>
<p class="pc-meta">Sleeps ${esc(h.sleeps)} · <b>EUR ${rateHtml(h)}</b> a night (invented)${rateNote(h)}</p>
<p class="pc-avail ${a.free ? 'is-free' : 'is-taken'}">${esc(a.text)}</p>
</div></article>
${shortSrc(t.res)}</li>`;
  });
  // the sixth card: the market, with the week's events on its back
  const ev = L.ev;
  const evHtml = ev.faro.res.error ? failNote(FAIL_EVENTS, ['events-pt'])
    : ['faro', 'lagos', 'tavira'].map(p => `<h4>${esc(TOWN[p])}</h4>${ev[p].items.length ? `<ul class="pc-ev">${eventItems(ev[p].items, 2)}</ul>` : '<p class="pc-na">Nothing in this agenda this week.</p>'}`).join('');
  cards.push(`<li class="pc-card pc-market r2"><article aria-labelledby="pc-market-h">
<figure class="pc-front">${picture('algarve-market', placeAlt('algarve-market'), { sizes: '(min-width: 900px) 380px, 100vw' })}<figcaption>${CAPTION.place}</figcaption></figure>
<div class="pc-back">${stampHtml('What\'s on')}
<h3 id="pc-market-h">What's on this week</h3>
<p class="pc-line">From each town's own agenda, as published; check every event with its organiser.</p>
${evHtml}</div></article>
${src(ev.faro.res)}</li>`);
  $('pc-grid').innerHTML = levelHtml('li') + cards.join('');
  $('pc-wish').innerHTML = list.map(h => `<li><figure>${picture(imgName(h, 'funny'), altFor(h, 'funny'), { sizes: '(min-width: 900px) 220px, 50vw' })}<figcaption>${esc(h.name)}, not quite in ${esc(h.place.replace(/^near /, ''))}. AI-generated joke picture.</figcaption></figure></li>`).join('');
}

bindStay($('pc-plan'), () => { renderCards(); $('pc-cards-h').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
bindRetry($('main'), () => { renderNow(); renderCards(); });
renderNow(); renderCards();

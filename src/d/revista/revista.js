// revista.js: design 1 of 5, Revista (a travel magazine), for the made-up example site Cinco Chaminés.
// Fills the dateline, the conditions box, the five features (simulated availability for the
// chosen dates, invented prices), the week's weather table and the events columns, each figure
// with its source line, read live from data.promptugal.news. Sends nothing; keeps only the dates
// (address and this tab, through data.js). Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18, round 2.
import { D, T, esc, FAIL, FAIL_EVENTS, CAPTION, imgName, altFor, picture, stay, avail, stayWords,
  bindStay, live, src, failNote, bindRetry, ipmaTerms, warnWords, dateline, eventItems, TOWN, range, one, rateHtml, rateNote, levelHtml } from './kit.js';

const $ = id => document.getElementById(id);
const AREA = { salt: 'Tavira · the east', lagoon: 'Faro · the lagoon', hill: 'Loulé · the hills', harbour: 'Lagos · the west', cape: 'Sagres · the far west' };

$('rv-dl-date').textContent = dateline();

// ---------- conditions box and dateline ----------
async function renderConditions() {
  const box = $('rv-cond-body');
  const L = await live();
  const f = L.today, s = L.seaDay, u = L.uvDay;
  $('rv-dl-wx').textContent = f && !L.fc.res.error ? `Faro ${range(f.tmin, f.tmax, '°C')}, ${f.weather}` : 'Faro: forecast not read';
  const row = (k, res, v) => `<tr><th scope="row">${esc(k)}</th><td>${res.error ? '<span class="rv-na">not read</span>' : v}</td></tr>`;
  const rows = [
    row('Faro, air', L.fc.res, f ? esc(range(f.tmin, f.tmax, '°C')) : 'no figure for today'),
    row('Faro, sky', L.fc.res, f ? `${esc(f.weather)}, rain ${esc(f.rain_pct ?? '?')} %` : 'no figure for today'),
    row('Sea, Faro coast', L.sea.res, s ? esc(range(s.temp_min, s.temp_max, '°C')) : 'no figure'),
    row('Waves', L.sea.res, s ? esc(range(s.waves_min, s.waves_max, 'm')) : 'no figure'),
    row('UV, Faro', L.uv.res, u ? `${esc(one(u.index))} ${esc(u.band)}` : 'no figure'),
  ].join('');
  const w = L.wa.items;
  const warn = L.wa.res.error ? '' : w.length
    ? w.map(x => `<p class="rv-warn rv-warn-${esc(x.level)}"><strong>${esc(warnWords(x).split(':')[0])}:</strong> ${esc(warnWords(x).split(': ').slice(1).join(': '))}.</p>`).join('')
    : '<p class="rv-warn rv-warn-none"><strong>No warning</strong> for the Faro district at the time read.</p>';
  const all = [L.fc.res, L.sea.res, L.uv.res, L.wa.res];
  const failed = all.filter(r => r.error).map(r => r.id);
  box.innerHTML = `<table class="rv-table"><caption class="sr-only">Conditions today in and near Faro, from IPMA</caption>${rows}</table>${warn}
${failed.length ? failNote(FAIL, failed) : ''}
<div class="rv-srcs">${all.map(r => src(r)).join('')}<p class="src">Terms: ${esc(ipmaTerms(L.fc.res))}</p></div>`;
}

// ---------- the five features ----------
async function renderFeatures() {
  const list = await D.homes();
  const s = stay();
  $('rv-for').textContent = `for ${stayWords(s)}`;
  if (!list.length) { $('rv-features').innerHTML = '<p class="fail">The list of homes could not be read just now. <a href="/homes/">See the homes page</a>.</p>'; return; }
  $('rv-issue-list').innerHTML = list.map(h => `<li><a href="#rv-f-${esc(h.id)}">${esc(h.name)}, ${esc(h.place)}</a><span>sleeps ${esc(h.sleeps)}</span></li>`).join('');
  $('rv-features').innerHTML = levelHtml() + list.map((h, i) => {
    const a = avail(h, s);
    const pair = i === 0 ? `<div class="rv-pair">
<figure class="rv-fig">${picture(imgName(h, 'inside'), altFor(h, 'inside'), { sizes: '(min-width: 900px) 330px, 50vw' })}<figcaption>Inside. ${CAPTION.inside}</figcaption></figure>
<figure class="rv-fig">${picture(imgName(h, 'funny'), altFor(h, 'funny'), { sizes: '(min-width: 900px) 330px, 50vw' })}<figcaption>Where it does not belong. ${CAPTION.joke}</figcaption></figure></div>` : '';
    return `<article class="rv-feature${i % 2 ? ' flip' : ''}" id="rv-f-${esc(h.id)}" aria-labelledby="rv-f-${esc(h.id)}-h">
<div class="rv-feature-pics">
<figure class="rv-fig">${picture(imgName(h, 'hero'), altFor(h, 'hero'), { sizes: '(min-width: 900px) 680px, 100vw' })}<figcaption>${esc(h.name)}. ${CAPTION.house}</figcaption></figure>
${pair}
</div>
<div class="rv-feature-text">
<p class="rv-kicker">${esc(AREA[h.id] || h.place)}</p>
<h3 id="rv-f-${esc(h.id)}-h" class="rv-h2"><a href="${esc(a.link)}">${esc(h.name)}</a></h3>
<p class="rv-standfirst">${esc(h.short || '')}</p>
<p class="rv-facts"><span><b>${esc(h.sleeps)}</b> guests</span><span><b>${esc(h.bedrooms)}</b> bedroom${h.bedrooms === 1 ? '' : 's'}</span><span><b>EUR ${rateHtml(h)}</b> a night (invented)${rateNote(h)}</span></p>
<p class="rv-body">${esc(h.description || '')}</p>
<p class="rv-avail ${a.free ? 'is-free' : 'is-taken'}"><span class="rv-avail-k">${a.free ? 'Free' : 'Taken'}</span> ${esc(a.text)}</p>
<p class="rv-readon"><a href="${esc(a.link)}">Read on: calendar, weather and events for ${esc(h.name.replace(/^The /, 'the '))}</a></p>
</div>
</article>`;
  }).join('');
}

// ---------- the week's weather: five days, four IPMA places ----------
const PLACES = [[1081505, 'Sagres', 'Cape House'], [1081100, 'Portimão', 'Harbour House'], [1080800, 'Loulé', 'Hill House'], [1080500, 'Faro', 'Lagoon and Salt Houses']];
async function renderWeek() {
  const box = $('rv-week-body');
  const rows = await Promise.all(PLACES.map(([id]) => D.forecastFor(id, T, D.addDays(T, 4))));
  const res = rows[0].res;
  if (res.error) { box.innerHTML = failNote(FAIL, ['ipma-city-forecasts']) + src(res); return; }
  const days = [...new Set(rows.flatMap(r => r.days.map(d => d.date)))].sort().slice(0, 5);
  if (!days.length) { box.innerHTML = `<p class="fail">IPMA's file holds no forecast for these places just now.</p>${src(res)}`; return; }
  const head = `<tr><th scope="col">Place</th>${days.map(d => `<th scope="col">${esc(D.fmtDay(d))}</th>`).join('')}</tr>`;
  const body = rows.map((r, i) => `<tr><th scope="row">${esc(PLACES[i][1])}<small>for the ${esc(PLACES[i][2])}</small></th>${days.map(d => {
    const x = r.days.find(y => y.date === d);
    return x ? `<td><b>${esc(one(x.tmin))} to ${esc(one(x.tmax))} °C</b><small>${esc(x.weather)}, rain ${esc(x.rain_pct ?? '?')} %</small></td>` : '<td><small>not in the file</small></td>';
  }).join('')}</tr>`).join('');
  box.innerHTML = `<div class="rv-scroll" tabindex="0" role="region" aria-label="Five-day forecast table, scrolls sideways on small screens"><table class="rv-wtable"><caption class="sr-only">IPMA's five-day forecast for Sagres, Portimão, Loulé and Faro</caption><thead>${head}</thead><tbody>${body}</tbody></table></div>${src(res)}`;
}

// ---------- what's on ----------
async function renderOn() {
  const box = $('rv-on-body');
  const L = await live();
  const res = L.ev.faro.res;
  if (res.error) { box.innerHTML = failNote(FAIL_EVENTS, ['events-pt']) + src(res); return; }
  box.innerHTML = ['faro', 'lagos', 'tavira'].map(p => {
    const items = L.ev[p].items;
    return `<div class="rv-on-col"><h3 class="rv-label">${esc(TOWN[p])}</h3>${items.length ? `<ul class="rv-ev">${eventItems(items, 4)}</ul>` : '<p class="rv-na">No events in this agenda for the next seven days.</p>'}${src(L.ev[p].res)}</div>`;
  }).join('');
}

bindStay($('rv-plan'), () => { renderFeatures(); $('rv-homes').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
bindRetry(document.getElementById('main'), () => { renderConditions(); renderWeek(); renderOn(); });
renderConditions(); renderFeatures(); renderWeek(); renderOn();

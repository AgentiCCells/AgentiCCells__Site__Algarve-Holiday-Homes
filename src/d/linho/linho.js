// linho.js: design 3 of 5, Linho (a quiet boutique-hotel page), for the made-up example site Cinco Chaminés.
// Fills the weather line (each value linked to its source card, full source lines beside it),
// the five full-width home panels (simulated availability, invented prices, today's forecast for
// each home's IPMA place with its source) and the events, read live from data.promptugal.news.
// Sends nothing. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis (instance B), 2026-11-18, round 2.
import { D, esc, FAIL, FAIL_EVENTS, CAPTION, imgName, altFor, picture, stay, avail, stayWords, bindStay,
  live, homeToday, src, shortSrc, failNote, bindRetry, ipmaTerms, eventItems, TOWN, range, one, rateHtml, rateNote, levelHtml } from './kit.js';

const $ = id => document.getElementById(id);
const wide = matchMedia('(min-width: 900px)');
const det = $('ln-wx-src');
det.open = true; // review round 2 M2: read times and terms visible at every width

async function renderWx() {
  const L = await live();
  const f = L.today, s = L.seaDay, u = L.uvDay, w = L.wa.items[0];
  const v = (res, text, label) => res.error ? `<span class="ln-na">${esc(label)} not read</span>` : `<a href="${esc(res.urls.card)}" title="Source card">${text}</a>`;
  const parts = [
    v(L.fc.res, f ? `Faro ${esc(one(f.tmax))} °C, ${esc(f.weather)}` : 'Faro: no forecast today', 'Faro forecast'),
    v(L.sea.res, s ? `Sea ${esc(range(s.temp_min, s.temp_max, '°C'))}` : 'Sea: no figure', 'Sea'),
    v(L.uv.res, u ? `UV ${esc(one(u.index))} ${esc(u.band)}` : 'UV: no figure', 'UV'),
    v(L.wa.res, w ? `<strong>${esc(w.level)} warning, ${esc(w.type)}</strong>` : 'No warning, Faro district', 'Warnings'),
  ];
  $('ln-wx-line').innerHTML = parts.map(p => `<span>${p}</span>`).join('<span class="ln-dot" aria-hidden="true">·</span>');
  const all = [L.fc.res, L.sea.res, L.uv.res, L.wa.res];
  const failed = all.filter(r => r.error).map(r => r.id);
  if (failed.length) det.open = true;
  $('ln-wx-srcs').innerHTML = `${failed.length ? failNote(FAIL, failed) : ''}${all.map(r => src(r)).join('')}<p class="src">Values: Faro's highest temperature today, sea temperature and UV on the Faro coast, warnings for IPMA's area FAR (the Faro district)${w ? `; the warning runs to ${esc(D.fmtLocal(w.end || w.start))}` : ''}. Terms: ${esc(ipmaTerms(L.fc.res))}</p>`;
}

async function renderPanels() {
  const list = await D.homes();
  const s = stay();
  if (!list.length) { $('ln-panels').insertAdjacentHTML('afterbegin', '<p class="fail">The list of homes could not be read just now; the links below still work.</p>'); return; }
  const today = await Promise.all(list.map(homeToday));
  $('ln-panels').innerHTML = `<p class="ln-for">Shown for ${esc(stayWords(s))}.</p>${levelHtml()}` + list.map((h, i) => {
    const a = avail(h, s), t = today[i];
    const fig = t.res.error ? 'not read just now' : t.day ? `${esc(range(t.day.tmin, t.day.tmax, '°C'))}, ${esc(t.day.weather)}` : 'no forecast for today in the file';
    return `<article class="ln-panel${i % 2 ? ' flip' : ''}" aria-labelledby="ln-${esc(h.id)}">
<figure class="ln-panel-pic">${picture(imgName(h, 'hero'), altFor(h, 'hero'), { sizes: '(min-width: 900px) 66vw, 100vw' })}<figcaption>${CAPTION.house}</figcaption></figure>
<div class="ln-panel-text">
<p class="ln-caps ln-idx">${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}</p>
<h3 id="ln-${esc(h.id)}">${esc(h.name)}</h3>
<p class="ln-caps ln-place">${esc(h.place)}</p>
<p class="ln-short">${esc(h.short || '')}</p>
<dl class="ln-facts"><div><dt>Sleeps</dt><dd>${esc(h.sleeps)}</dd></div><div><dt>Bedrooms</dt><dd>${esc(h.bedrooms)}</dd></div><div><dt>A night</dt><dd>EUR ${rateHtml(h)} <span>(invented)${rateNote(h)}</span></dd></div></dl>
<p class="ln-avail ${a.free ? 'is-free' : 'is-taken'}">${esc(a.text)}</p>
<p><a class="ln-link" href="${esc(a.link)}">See dates and details</a></p>
<p class="ln-today"><span class="ln-caps">Today at ${esc(h.data?.forecast_name || 'IPMA')}</span> ${fig}</p>
${shortSrc(t.res)}
<figure class="ln-thumb">${picture(imgName(h, 'funny'), altFor(h, 'funny'), { sizes: '160px' })}<figcaption>And where it does not belong. ${CAPTION.joke}</figcaption></figure>
</div></article>`;
  }).join('');
}

async function renderOn() {
  const box = $('ln-on');
  const L = await live();
  if (L.ev.faro.res.error) { box.innerHTML = failNote(FAIL_EVENTS, ['events-pt']) + src(L.ev.faro.res); return; }
  box.innerHTML = ['tavira', 'faro', 'lagos'].map(p => `<div><h3 class="ln-caps">${esc(TOWN[p])}</h3>${L.ev[p].items.length
    ? `<ul class="ln-ev">${eventItems(L.ev[p].items, 3)}</ul>` : '<p class="ln-na">Nothing in this agenda for the next seven days.</p>'}${src(L.ev[p].res)}</div>`).join('');
}

bindStay($('ln-plan'), () => { renderPanels(); $('ln-panels').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
bindRetry($('main'), () => { renderWx(); renderPanels(); renderOn(); });
renderWx(); renderPanels(); renderOn();

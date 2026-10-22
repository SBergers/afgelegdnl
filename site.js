/* afgelegd.nl — collectie, uitgelichte route en live ritkaartje */
(function () {
  'use strict';

  // ---------- data ----------
  // Voeg een route toe door hier een regel bij te zetten en foto's in /img te zetten (id-1.jpg, id-2.jpg, ...).
  var ROUTES = [
    { id: 'rvn', photo: true, size: '28 × 15 cm', price: 45, parts: 1, name: 'Rijk van Nijmegen', place: 'Nijmegen · Groesbeek · Mook · Malden', country: 'NL', sport: 'MTB', km: '63', hm: '± 800', note: 'Vier lussen, met het Traumapad', imgs: 5 },
    { id: 'uh', size: '47 × 14 cm', price: 65, parts: 2, name: 'Utrechtse Heuvelrug', place: 'Van Hoge Vuursche tot Rhenen', country: 'NL', sport: 'MTB', km: '138', hm: '± 1.050', note: 'Tien routes, tweedelige kaart', imgs: 3 },
    { id: 'zv', size: '27 × 18 cm', price: 45, parts: 1, name: 'MTB Zuid-Veluwe', place: 'Ede · Lunteren · Otterlo · Arnhem', country: 'NL', sport: 'MTB', km: '158', hm: '± 1.050', note: 'Zeven routes op één plaat', imgs: 2 },
    { id: 'dmr', size: '25 × 16 cm', price: 45, parts: 1, name: 'Dutch Mountain Ride', place: 'Zuid-Limburg', country: 'NL/BE/DE', sport: 'Gravel', km: '129', hm: '± 1.390', note: 'Met de winterroute als stippellijn', imgs: 2 },
    { id: 'gs', photo: true, size: '11 × 25 cm', price: 45, parts: 1, name: 'Geile Strecke', place: 'Nijmegen → Maastricht', country: 'NL/DE/BE', sport: 'Gravel', km: '217', hm: '± 990', note: 'De Limburg Divide, langs de grens', imgs: 5, card: 'tall', tint: '#5B8CF0' },
    { id: 'gd', size: '25 × 24 cm', price: 55, parts: 1, name: 'Green Divide', place: 'Naarden → Zwolle', country: 'NL', sport: 'Gravel', km: '302', hm: '± 1.540', note: 'Met eigen ritkaartje', imgs: 3 },
    { id: 'bd', size: '25 × 24 cm', price: 55, parts: 1, name: 'Brown Divide', place: 'Naarden → Zwolle, wintervariant', country: 'NL', sport: 'Gravel', km: '305', hm: '± 1.230', note: 'Andere route door het Kroondomein', imgs: 3, v: 2 },
    { id: 'hun', size: '17 × 25 cm', price: 45, parts: 1, name: 'Hunebed Highway', place: 'Start & finish Drouwen', country: 'NL', sport: 'Gravel', km: '175', hm: '± 340', note: 'Rondje door Drenthe', imgs: 2, card: 'tall' },
    { id: 'tb', size: '47 × 11 cm', price: 65, parts: 2, name: 'TransBelgian', place: 'Oostende → Eupen', country: 'BE', sport: 'Gravel', km: '515', hm: '± 3.300', note: 'Dwars door België, de Ardennen in', imgs: 2 },
    { id: 'elf', size: '20 × 25 cm', price: 55, parts: 1, name: 'Elfstedentocht', place: 'Start & finish Bolsward', country: 'NL', sport: 'Wielrennen', km: '235', alt: ['STEDEN', '11'], note: 'Langs alle elf Friese steden', imgs: 3, v: 2, card: 'tall', cardLines: ['ELFSTEDEN', 'TOCHT'], def: { start: '2026-05-25', end: '2026-05-25', hh: '09', mm: '14', ss: '27' } },
    { id: 'agr', size: '21 × 25 cm', price: 55, parts: 1, name: 'Amstel Gold Race', place: 'Valkenburg → Berg en Terblijt', country: 'NL/BE', sport: 'Wielrennen', km: '200', hm: '± 1.770', note: 'De toerversie, door het Zuid-Limburgse heuvelland', imgs: 3, card: 'tall', cardLines: ['AMSTEL', 'GOLD RACE'], def: { start: '2026-04-18', end: '2026-04-18', hh: '07', mm: '48', ss: '12' } },
    { id: 'dd', size: '25 × 21 cm', price: 55, parts: 1, name: 'Dutch Divide', place: 'Retranchement → Nieuwe Statenzijl', country: 'NL', sport: 'Gravel', km: '1.009', hm: '± 1.500', note: 'Heel Nederland, van zuidwest naar noordoost', imgs: 2 }
  ];
  var FILTERS = ['Alle', 'MTB', 'Gravel', 'Wielrennen'];
  var EN = document.documentElement.lang === 'en';
  var BASE = EN ? '../' : '';
  var MONTHS = EN ? ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] : ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
  // Engelse teksten (de Nederlandse tekst is de sleutel)
  var I18N = {
    'Alle': 'All', 'Wielrennen': 'Road', 'STEDEN': 'CITIES',
    'JOUW TIJD EROP': 'YOUR TIME ON IT', ' bekijken': ' – view', '3D-geprinte reliëfkaart van ': '3D-printed relief map of ',
    '+ €5 verzending': '+ €5 shipping', 'gratis verzending': 'free shipping',
    'Jouw eigen rit?': 'Your own ride?',
    'Je marathon, die vakantieklim of je dagelijkse rondje. Upload je GPX-bestand en wij maken er een uniek reliëf van. Binnen 24 uur hoor je van ons.': 'Your marathon, that holiday climb or your daily loop. Upload your GPX file and we turn it into a unique relief. You will hear from us within 24 hours.',
    'Vraag het aan →': 'Request it →',
    "Foto's van ": 'Photos of ', ', veeg of gebruik de pijlen': ', swipe or use the arrows', 'Foto ': 'Photo ', ' van de 3D-kaart ': ' of the 3D map ', ' van ': ' of ',
    'Vorige foto': 'Previous photo', 'Volgende foto': 'Next photo', "Foto's": 'Photos',
    'JOUW RITKAARTJE · LIVE VOORBEELD': 'YOUR RIDE CARD · LIVE PREVIEW', 'UITGELICHT': 'FEATURED',
    'Met een los ritkaartje in de kaart, met jouw datum en totale rijtijd erop.': 'Comes with a separate ride card that slots into the map, showing your date and total ride time.',
    'AFSTAND': 'DISTANCE', 'HOOGTE': 'ELEVATION', 'BIJZONDER': 'HIGHLIGHT', 'FORMAAT': 'SIZE', 'PRIJS': 'PRICE',
    'Maak je ritkaartje': 'Make your ride card', 'of bestel direct': 'or order right away', 'Bestel deze kaart': 'Order this map', '← Terug naar de route': '← Back to the route',
    'Je ritkaartje gaat mee naar het bestelformulier. ': 'Your ride card is carried over to the order form. ',
    'Je datum en rijtijd kun je ook later in het bestelformulier invullen. ': 'You can also enter your date and ride time later in the order form. ',
    'Je betaalt pas als we je bestelling hebben bevestigd.': 'You only pay once we have confirmed your order.',
    'LIVE VOORBEELD': 'LIVE PREVIEW', 'EERSTE DAG': 'FIRST DAY', 'LAATSTE DAG': 'LAST DAY', 'TOTALE RIJTIJD': 'TOTAL RIDE TIME',
    'Uren': 'Hours', 'Minuten': 'Minutes', 'Seconden': 'Seconds', 'uu : mm : ss': 'hh : mm : ss', 'Ritkaartje ': 'Ride card ', ', totale rijtijd ': ', total ride time '
  };
  function T(s) { return EN && I18N[s] !== undefined ? I18N[s] : s; }
  var ROUTE_EN = {
    rvn: { place: 'Nijmegen · Groesbeek · Mook · Malden', note: 'Four loops, including the Traumapad' },
    uh: { place: 'From Hoge Vuursche to Rhenen', note: 'Ten routes, two-part map' },
    zv: { note: 'Seven routes on one plate' },
    dmr: { place: 'South Limburg', note: 'With the winter route as a dotted line' },
    gs: { note: 'The Limburg Divide, along the border' },
    gd: { note: 'With its own ride card' },
    bd: { place: 'Naarden → Zwolle, winter version', note: 'A different route through the Kroondomein' },
    hun: { note: 'A loop through Drenthe' },
    tb: { place: 'Ostend → Eupen', note: 'Across Belgium, into the Ardennes' },
    elf: { note: 'Past all eleven Frisian cities' },
    agr: { note: 'The sportive, through the South Limburg hills' },
    dd: { note: 'All of the Netherlands, from southwest to northeast' }
  };
  function F(r, k) { return EN && ROUTE_EN[r.id] && ROUTE_EN[r.id][k] ? ROUTE_EN[r.id][k] : r[k]; }

  var state = { filter: 'Alle', sel: 'gs', fi: 0, start: '2026-10-14', end: '2026-10-16', hh: '18', mm: '02', ss: '33', edit: false, touched: false };
  var CARD_DEF = { start: state.start, end: state.end, hh: state.hh, mm: state.mm, ss: state.ss };
  function applyDefaults() { if (state.touched) return; var d = byId(state.sel).def || CARD_DEF; for (var k in CARD_DEF) state[k] = d[k] || CARD_DEF[k]; }
  var timers = {};

  function $(s, el) { return (el || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function imgList(r) { var a = []; for (var i = 1; i <= r.imgs; i++) a.push(BASE + 'img/' + r.id + '-' + i + '.jpg' + (r.v ? '?v=' + r.v : '')); return a; }
  function thumbList(r) { var a = []; for (var i = 1; i <= r.imgs; i++) a.push(BASE + 'img/t/' + r.id + '-' + i + '.webp' + (r.v ? '?v=' + r.v : '')); return a; }
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CAN_HOVER = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function hasCard(r) { return r.sport === 'Gravel' || r.sport === 'Wielrennen'; }
  function hmText(r) { return r.alt ? r.alt[1] + ' ' + T(r.alt[0]).toLowerCase() : r.hm + ' hm'; }
  function byId(id) { for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].id === id) return ROUTES[i]; return ROUTES[0]; }

  var CLOCK = '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7.6" r="5.2" fill="none" stroke="#0E1311" stroke-width="1.6"/><path d="M7 4.6v3.2l2 1.2M5.6 1h2.8" fill="none" stroke="#0E1311" stroke-width="1.6" stroke-linecap="round"/></svg>';

  // ---------- achtergrond-hoogtelijnen ----------
  function contours() {
    var d = '';
    for (var k = 0; k < 12; k++) {
      var r0 = 70 + k * 52;
      for (var i = 0; i <= 120; i++) {
        var th = (i / 120) * Math.PI * 2;
        var rr = r0 * (1 + 0.13 * Math.sin(3 * th + k * 0.45) + 0.06 * Math.cos(5 * th - k * 0.8));
        d += (i ? 'L' : 'M') + (1080 + rr * Math.cos(th) * 1.25).toFixed(1) + ' ' + (380 + rr * Math.sin(th)).toFixed(1);
      }
      d += 'Z';
    }
    return d;
  }

  // ---------- fotoreeks die doorbladert bij hover ----------
  function cycle(key, el, list, onStep, startAt) {
    stop(key);
    var i = startAt || 0;
    timers[key] = setInterval(function () { i = (i + 1) % list.length; onStep(i); }, 1200);
    i = (i + 1) % list.length; onStep(i);
  }
  function stop(key) { if (timers[key]) { clearInterval(timers[key]); timers[key] = null; } }

  // ---------- filters ----------
  function renderFilters() {
    $('#filters').innerHTML = FILTERS.map(function (f) {
      return '<button class="pill" type="button" data-f="' + f + '" aria-pressed="' + (f === state.filter) + '">' + T(f) + '</button>';
    }).join('');
  }

  // ---------- voorproefje in de hero ----------
  function renderTeaser() {
    var el = $('#teaser'); if (!el) return;
    el.innerHTML = ROUTES.map(function (r) {
      return '<a href="#uitgelicht" data-teaser="' + r.id + '"><img src="' + thumbList(r)[0] + '" alt="" loading="lazy" decoding="async" width="112" height="84">' + esc(r.name) + '</a>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.tcount'), function (c) { c.textContent = ROUTES.length; });
  }

  // ---------- kaarten ----------
  function renderGrid() {
    var list = ROUTES.filter(function (r) { return state.filter === 'Alle' || r.sport === state.filter; });
    $('#count').textContent = ROUTES.length;
    var html = list.map(function (r) {
      var imgs = thumbList(r);
      return '<a class="card' + (r.id === state.sel ? ' sel' : '') + '" href="#uitgelicht" data-id="' + r.id + '" aria-label="' + esc(r.name) + T(' bekijken') + '">' +
        '<div class="thumb"><div class="track ctrack">' + imgs.map(function (src, j) { return '<img src="' + src + '" alt="' + (j ? '' : T('3D-geprinte reliëfkaart van ') + esc(r.name)) + '" loading="lazy" decoding="async" width="640" height="480" draggable="false">'; }).join('') + '</div>' +
        (imgs.length > 1 ? '<div class="dots" aria-hidden="true">' + imgs.map(function (_, j) { return '<span' + (j ? '' : ' class="on"') + '></span>'; }).join('') + '</div>' : '') +
        (hasCard(r) ? '<span class="badge">' + CLOCK + T('JOUW TIJD EROP') + '</span>' : '') + '</div>' +
        '<div class="cbody">' +
        '<div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2)">' + T(r.sport).toUpperCase() + ' · ' + r.country + '</div>' +
        '<div class="disp" style="font-size:25px;line-height:1.05;letter-spacing:-.02em">' + esc(r.name) + '</div>' +
        '<div style="font-size:14px;line-height:1.4;color:var(--mut2)">' + esc(F(r, 'place')) + '</div>' +
        '<div class="mono" style="display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-top:auto"><span>' + r.km + ' km</span><span style="color:var(--mut2)">' + hmText(r) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;border-top:1px solid var(--line2);padding-top:12px"><span class="mono" style="font-size:12px;color:var(--mut2)">' + r.size + '</span><span style="text-align:right"><span class="disp" style="font-size:22px;color:var(--fg)">€' + r.price + '</span>' + (r.photo ? '<span style="display:block;font-size:11px;color:var(--mut2);margin-top:2px">' + T('+ €5 verzending') + '</span>' : '<span style="display:block;font-size:11px;color:var(--acc);margin-top:2px">' + T('gratis verzending') + '</span>') + '</span></div>' +
        '</div></a>';
    }).join('');
    html += '<a class="card" href="https://mijn.afgelegd.nl/login?route=eigen&amp;lang=' + (EN ? 'en' : 'nl') + '" style="justify-content:center;align-items:flex-start;gap:16px;border:1.5px dashed var(--line3);padding:32px 26px;min-height:360px;background:var(--bg)">' +
      '<svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="#FF6A2B" stroke-width="1.5" stroke-dasharray="4 5"/><path d="M32 20v24M20 32h24" stroke="#FF6A2B" stroke-width="2.4" stroke-linecap="round"/></svg>' +
      '<div class="disp" style="font-size:28px;line-height:1.05;letter-spacing:-.02em">' + T('Jouw eigen rit?') + '</div>' +
      '<p style="margin:0;color:var(--mut);font-size:16px;line-height:1.5">' + T('Je marathon, die vakantieklim of je dagelijkse rondje. Upload je GPX-bestand en wij maken er een uniek reliëf van. Binnen 24 uur hoor je van ons.') + '</p>' +
      '<span style="font-weight:600;color:var(--acc)">' + T('Vraag het aan →') + '</span></a>';
    $('#grid').innerHTML = html;
  }

  function cardDots(card, i) {
    var dots = card.querySelectorAll('.dots span');
    for (var j = 0; j < dots.length; j++) dots[j].className = j === i ? 'on' : '';
  }
  function setThumb(card, i) {
    var tr = $('.ctrack', card);
    if (tr) tr.scrollTo({ left: i * tr.clientWidth, behavior: REDUCED ? 'instant' : 'smooth' });
    cardDots(card, i);
  }
  // swipen in de kaartjes: puntjes laten meelopen
  document.addEventListener('scroll', function (e) {
    var tr = e.target;
    if (!tr.classList || !tr.classList.contains('ctrack')) return;
    var card = tr.closest('.card');
    if (card) cardDots(card, Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)));
  }, { capture: true, passive: true });

  // ---------- uitgelicht ----------
  function renderFeatured() {
    var r = byId(state.sel), imgs = imgList(r);
    if (state.fi >= imgs.length) state.fi = 0;
    var ARROW = function (d) { return '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="' + (d < 0 ? 'M12.5 4 6.5 10l6 6' : 'M7.5 4l6 6-6 6') + '" fill="none" stroke="#0E1311" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
    $('#featGallery').innerHTML =
      '<div style="position:relative;border-radius:18px;overflow:hidden;aspect-ratio:4/3;background:#EFE9E1">' +
      '<div class="track" id="featTrack" tabindex="0" aria-label="' + T("Foto's van ") + esc(r.name) + T(', veeg of gebruik de pijlen') + '">' +
      imgs.map(function (src, j) { var t = thumbList(r)[j]; return '<img src="' + src + '" srcset="' + t + ' 640w, ' + src + ' 1200w" sizes="(max-width: 700px) 100vw, 620px" alt="' + T('Foto ') + (j + 1) + T(' van de 3D-kaart ') + esc(r.name) + '" width="1200" height="900" decoding="async" draggable="false">'; }).join('') + '</div>' +
      (hasCard(r) ? '<span class="badge" style="top:16px;left:16px;font-size:12px;padding:8px 13px">' + CLOCK + T('JOUW TIJD EROP') + '</span>' : '') +
      (imgs.length > 1 ? '<button type="button" class="garrow" data-step="-1" aria-label="' + T('Vorige foto') + '" style="left:12px">' + ARROW(-1) + '</button><button type="button" class="garrow" data-step="1" aria-label="' + T('Volgende foto') + '" style="right:12px">' + ARROW(1) + '</button>' : '') +
      '</div>' +
      (imgs.length > 1 ? '<div role="group" aria-label="' + T("Foto's") + '" id="featDots" style="display:flex;justify-content:center;gap:4px;margin-top:10px">' + imgs.map(function (_, j) {
        return '<button type="button" class="dotbtn" data-i="' + j + '" aria-label="' + T('Foto ') + (j + 1) + T(' van ') + imgs.length + '" aria-pressed="' + (j === state.fi) + '" style="width:44px;height:44px;padding:0;border:0;background:transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center"><span style="display:block;width:26px;height:4px;border-radius:4px;background:' + (j === state.fi ? 'var(--acc)' : 'var(--line3)') + '"></span></button>';
      }).join('') + '</div>' : '') +
      (hasCard(r) && state.edit ? '<div class="pv-side" style="margin-top:18px;border-radius:18px;background:#1A2420;padding:28px 24px 30px"><div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2);text-align:center;margin-bottom:18px">' + T('JOUW RITKAARTJE · LIVE VOORBEELD') + '</div><div class="pv" aria-live="polite" style="display:flex;justify-content:center"></div></div>' : '');
    var tr = $('#featTrack');
    if (state.fi) tr.scrollLeft = state.fi * tr.clientWidth;
    tr.addEventListener('scroll', function () {
      var i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth));
      if (i !== state.fi) { state.fi = i; markDots(i); }
    }, { passive: true });
    tr.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(state.fi + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(state.fi - 1); }
    });
    tr.addEventListener('touchstart', function () { stop('F'); }, { passive: true });

    var stat = function (label, val) { return '<div><div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2);margin-bottom:6px">' + label + '</div>' + val + '</div>'; };
    var info =
      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:18px">' +
      '<span class="mono" style="font-size:12px;letter-spacing:.12em;color:var(--bg);background:var(--acc);padding:6px 12px;border-radius:999px">' + T('UITGELICHT') + '</span>' +
      '<span class="mono" style="font-size:12px;letter-spacing:.12em;color:var(--mut);border:1px solid #2F3934;padding:6px 12px;border-radius:999px">' + T(r.sport).toUpperCase() + '</span></div>' +
      (hasCard(r) ? '<p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:var(--mut);max-width:440px">' + T('Met een los ritkaartje in de kaart, met jouw datum en totale rijtijd erop.') + '</p>' : '') +
      '<h3 class="disp" style="font-size:clamp(34px,3.6vw,52px);line-height:1;letter-spacing:-.03em;margin:0 0 10px">' + esc(r.name) + '</h3>' +
      '<p style="margin:0 0 30px;color:var(--mut2);font-size:16px">' + esc(F(r, 'place')) + '</p>' +
      (hasCard(r) && state.edit ? editorHTML(r) :
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);padding:22px 0;margin-bottom:24px">' +
      stat(T('AFSTAND'), '<div class="disp stat-v" style="letter-spacing:-.02em">' + r.km + '<span style="font-size:15px;color:var(--mut2);font-weight:600"> km</span></div>') +
      (r.alt ? stat(T(r.alt[0]), '<div class="disp stat-v" style="letter-spacing:-.02em;white-space:nowrap">' + r.alt[1] + '</div>') :
      stat(T('HOOGTE'), '<div class="disp stat-v" style="letter-spacing:-.02em;white-space:nowrap">' + r.hm + '<span style="font-size:15px;color:var(--mut2);font-weight:600"> hm</span></div>')) +
      stat(T('BIJZONDER'), '<div style="font-size:15px;line-height:1.35;font-weight:500">' + esc(F(r, 'note')) + '</div>') + '</div>') +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:24px">' +
      '<div><div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2);margin-bottom:6px">' + T('FORMAAT') + '</div><div style="font-size:16px;font-weight:500">' + r.size + '</div></div>' +
      '<div style="text-align:right"><div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2);margin-bottom:2px">' + T('PRIJS') + '</div><div class="disp" style="font-size:40px;line-height:1;letter-spacing:-.02em;color:var(--acc)">€' + r.price + '</div><div style="font-size:12px;margin-top:4px;color:' + (r.photo ? 'var(--mut2)">' + T('+ €5 verzending') : 'var(--acc)">' + T('gratis verzending')) + '</div></div></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center">' +
      (hasCard(r) && !state.edit
        ? '<button type="button" class="btn btn-acc" id="editBtn" style="border:0;cursor:pointer;font-family:inherit">' + T('Maak je ritkaartje') + ' <span aria-hidden="true">→</span></button>' +
          '<a id="orderBtn" href="' + orderUrl() + '" style="font-size:14px;color:var(--mut)">' + T('of bestel direct') + '</a>'
        : '<a class="btn btn-acc" id="orderBtn" href="' + orderUrl() + '">' + T('Bestel deze kaart') + '</a>' +
          (hasCard(r) ? '<button type="button" id="backBtn" style="background:none;border:0;padding:8px 0;cursor:pointer;font:inherit;font-size:14px;color:var(--mut);text-decoration:underline">' + T('← Terug naar de route') + '</button>' : '')) +
      '</div>' +
      '<p class="toast" style="color:var(--mut2)">' + (hasCard(r) ? (state.edit ? T('Je ritkaartje gaat mee naar het bestelformulier. ') : T('Je datum en rijtijd kun je ook later in het bestelformulier invullen. ')) : '') + T('Je betaalt pas als we je bestelling hebben bevestigd.') + '</p>';
    $('#featInfo').innerHTML = info;
    if (hasCard(r)) updateCard();
    layoutSide();
  }
  // naast elkaar (desktop): voorbeeld onder de foto's, anders in de editor
  function layoutSide() {
    var g = $('#featGallery'), i = $('#featInfo'), u = $('#uitgelicht');
    if (g && i && u) u.classList.toggle('side', Math.abs(g.offsetTop - i.offsetTop) < 4);
  }

  // ---------- live ritkaartje ----------
  function editorHTML(r) {
    var t = function (k, lab) { return '<input class="inp tinp" type="text" inputmode="numeric" maxlength="2" aria-label="' + lab + '" data-k="' + k + '" value="' + esc(state[k]) + '">'; };
    var sep = '<span aria-hidden="true" class="mono" style="font-size:18px;color:var(--mut2)">:</span>';
    return '<section aria-labelledby="ed-kop" style="background:var(--bg);border:1px solid var(--line2);border-radius:20px;padding:20px;margin-bottom:26px">' +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:14px"><h4 id="ed-kop" class="disp" style="margin:0;font-size:20px;letter-spacing:-.01em">' + T('Maak je ritkaartje') + '</h4><span class="mono pv-in" style="font-size:11px;letter-spacing:.12em;color:var(--mut2)">' + T('LIVE VOORBEELD') + '</span></div>' +
      '<div aria-live="polite" class="pv pv-in" style="display:flex;justify-content:center;padding:18px;border-radius:14px;background:#1A2420;margin-bottom:16px"></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">' +
      '<label class="field">' + T('EERSTE DAG') + '<input class="inp" type="date" data-k="start" value="' + state.start + '"></label>' +
      '<label class="field">' + T('LAATSTE DAG') + '<input class="inp" type="date" data-k="end" value="' + state.end + '"></label>' +
      '<fieldset style="grid-column:1/-1;border:0;margin:0;padding:0;min-width:0"><legend class="field" style="padding:0;margin-bottom:6px">' + T('TOTALE RIJTIJD') + '</legend>' +
      '<div style="display:flex;align-items:center;gap:8px">' + t('hh', T('Uren')) + sep + t('mm', T('Minuten')) + sep + t('ss', T('Seconden')) + '<span class="hide-sm" style="font-size:13px;color:var(--mut2);margin-left:4px">' + T('uu : mm : ss') + '</span></div></fieldset>' +
      '</div></section>';
  }

  function parseDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? { y: +m[1], mo: +m[2] - 1, d: +m[3] } : null; }
  function dateLabel() {
    var a = parseDate(state.start), b = parseDate(state.end);
    if (!a && !b) return { days: '–', month: '' };
    if (!a) a = b; if (!b) b = a;
    if (b.y * 400 + b.mo * 32 + b.d < a.y * 400 + a.mo * 32 + a.d) { var t = a; a = b; b = t; }
    var same = a.y === b.y && a.mo === b.mo && a.d === b.d;
    var month = MONTHS[a.mo] + ' ' + a.y;
    if (a.mo !== b.mo || a.y !== b.y) month = a.y === b.y ? MONTHS[a.mo] + '/' + MONTHS[b.mo] + ' ' + b.y : MONTHS[a.mo] + ' ' + a.y + '/' + MONTHS[b.mo] + ' ' + b.y;
    return { days: same ? String(a.d) : a.d + '–' + b.d, month: month };
  }
  function two(v, max) { var n = Math.max(0, Math.min(max, parseInt(String(v).replace(/\D/g, ''), 10) || 0)); return (n < 10 ? '0' : '') + n; }

  // 7-segment cijfers als SVG
  function segs(text) {
    var ON = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' };
    var w = 26, h = 50, t = 5, step = 34, cstep = 14, f = function (n) { return n.toFixed(1); };
    var H = function (x, y, L) { return 'M' + f(x) + ' ' + f(y) + 'L' + f(x + t / 2) + ' ' + f(y - t / 2) + 'L' + f(x + L - t / 2) + ' ' + f(y - t / 2) + 'L' + f(x + L) + ' ' + f(y) + 'L' + f(x + L - t / 2) + ' ' + f(y + t / 2) + 'L' + f(x + t / 2) + ' ' + f(y + t / 2) + 'Z'; };
    var V = function (x, y, L) { return 'M' + f(x) + ' ' + f(y) + 'L' + f(x + t / 2) + ' ' + f(y + t / 2) + 'L' + f(x + t / 2) + ' ' + f(y + L - t / 2) + 'L' + f(x) + ' ' + f(y + L) + 'L' + f(x - t / 2) + ' ' + f(y + L - t / 2) + 'L' + f(x - t / 2) + ' ' + f(y + t / 2) + 'Z'; };
    var on = '', off = '', x = 2, hl = w - t - 2, vl = h / 2 - t / 2 - 2;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ':') { on += 'M' + f(x + 4) + ' ' + f(h * 0.32) + 'm-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M' + f(x + 4) + ' ' + f(h * 0.7) + 'm-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'; x += cstep; continue; }
      var S = { a: H(x + t / 2 + 1, t / 2, hl), g: H(x + t / 2 + 1, h / 2, hl), d: H(x + t / 2 + 1, h - t / 2, hl), f: V(x + t / 2, t / 2 + 1, vl), e: V(x + t / 2, h / 2 + 1, vl), b: V(x + w - t / 2, t / 2 + 1, vl), c: V(x + w - t / 2, h / 2 + 1, vl) };
      var lit = ON[ch] || '';
      'abcdefg'.split('').forEach(function (k) { if (lit.indexOf(k) >= 0) on += S[k]; else off += S[k]; });
      x += step;
    }
    return '<svg viewBox="0 -2 ' + f(x + 2) + ' ' + (h + 4) + '" width="100%" aria-hidden="true" style="display:block;transform:skewX(-6deg)"><path d="' + off + '" fill="#E8E3D7" fill-opacity="0.06"/><path d="' + on + '" fill="#E8E3D7"/></svg>';
  }

  function updateCard() {
    var r = byId(state.sel), boxes = document.querySelectorAll('.pv');
    if (!boxes.length) return;
    var tint = r.tint || '#8CBE46', dl = dateLabel();
    var time = two(state.hh, 99) + ':' + two(state.mm, 59) + ':' + two(state.ss, 59);
    var title = r.name.toUpperCase(), aria = T('Ritkaartje ') + title + ', ' + dl.days + ' ' + dl.month + T(', totale rijtijd ') + time;
    var html;
    if (r.card === 'tall') {
      html = '<div class="rcard" role="img" aria-label="' + esc(aria) + '" style="width:190px;padding:16px 16px 18px;text-align:center">' +
        (r.cardLines || title.split(' ')).map(function (l) { return '<div style="font-size:19px;line-height:1.1;letter-spacing:.05em;color:' + tint + '">' + esc(l) + '</div>'; }).join('') +
        '<div class="rule" style="margin:10px 0 12px"></div><div style="font-size:34px;line-height:1;white-space:nowrap">' + dl.days + '</div>' +
        '<div style="font-size:15px;letter-spacing:.03em;margin-top:6px;white-space:nowrap">' + dl.month + '</div><div class="rule" style="margin:12px 0 14px"></div>' +
        segs(time) + '<div style="font-size:12px;letter-spacing:.06em;color:' + tint + ';margin-top:8px">' + T('TOTALE RIJTIJD') + '</div></div>';
    } else {
      html = '<div class="rcard" role="img" aria-label="' + esc(aria) + '" style="width:100%;max-width:420px;padding:14px 18px 16px">' +
        '<div style="text-align:center;font-size:17px;letter-spacing:.08em;color:' + tint + '">' + esc(title) + '</div><div class="rule" style="margin:8px 0 12px"></div>' +
        '<div style="display:flex;align-items:center;gap:14px"><div style="flex:0 0 auto;text-align:center"><div style="font-style:italic;font-size:34px;line-height:1;white-space:nowrap">' + dl.days + '</div>' +
        '<div style="font-style:italic;font-size:15px;letter-spacing:.03em;margin-top:4px;white-space:nowrap">' + dl.month + '</div></div>' +
        '<div style="width:3px;align-self:stretch;background:#DDD8CC;border-radius:2px;transform:skewX(-4deg)"></div>' +
        '<div style="flex:1 1 auto;min-width:0;text-align:center"><div style="max-height:52px">' + segs(time) + '</div><div style="font-size:12px;letter-spacing:.06em;color:' + tint + ';margin-top:6px">' + T('TOTALE RIJTIJD') + '</div></div></div></div>';
    }
    for (var bi = 0; bi < boxes.length; bi++) boxes[bi].innerHTML = html;
  }

  function orderUrl() {
    var r = byId(state.sel), q = 'route=' + encodeURIComponent(r.id);
    if (hasCard(r)) {
      if (parseDate(state.start)) q += '&start=' + state.start;
      if (parseDate(state.end)) q += '&end=' + state.end;
      q += '&time=' + two(state.hh, 99) + ':' + two(state.mm, 59) + ':' + two(state.ss, 59);
    }
    return 'https://mijn.afgelegd.nl/login?' + q + (EN ? '&lang=en' : '&lang=nl');
  }
  function orderText() {
    var r = byId(state.sel), t = 'Hoi! Ik wil graag de 3D-kaart van ' + r.name + ' (€' + r.price + (r.photo ? '' : ', gratis verzending') + ') bestellen.';
    if (hasCard(r)) { var dl = dateLabel(); t += ' Ritkaartje: ' + dl.days + ' ' + dl.month + ', totale rijtijd ' + two(state.hh, 99) + ':' + two(state.mm, 59) + ':' + two(state.ss, 59) + '.'; }
    return t + ' (via afgelegd.nl/?route=' + r.id + ')';
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); return Promise.resolve();
  }
  function setUrl() {
    try { var u = new URL(location.href); u.searchParams.set('route', state.sel); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {}
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var f = e.target.closest('[data-f]');
    if (f) { state.filter = f.getAttribute('data-f'); renderFilters(); renderGrid(); return; }
    var tz = e.target.closest('[data-teaser]');
    if (tz) { e.preventDefault(); state.sel = tz.getAttribute('data-teaser'); state.fi = 0; state.edit = false; applyDefaults(); renderGrid(); renderFeatured(); setUrl(); var u = $('#uitgelicht'); if (u) u.scrollIntoView({ behavior: REDUCED ? 'instant' : 'smooth', block: 'start' }); return; }
    var c = e.target.closest('.card[data-id]');
    if (c) { state.sel = c.getAttribute('data-id'); state.fi = 0; state.edit = false; applyDefaults(); renderGrid(); renderFeatured(); setUrl(); return; }
    var ar = e.target.closest('.garrow');
    if (ar) { stop('F'); goTo(state.fi + (+ar.getAttribute('data-step'))); return; }
    var d = e.target.closest('#featDots [data-i]');
    if (d) { stop('F'); goTo(+d.getAttribute('data-i')); return; }
    var eb = e.target.closest('#editBtn, #backBtn');
    if (eb) {
      state.edit = eb.id === 'editBtn';
      renderFeatured();
      var focus = $(state.edit ? '#featInfo input[data-k="start"]' : '#editBtn');
      if (focus) { try { focus.focus({ preventScroll: true }); } catch (x) { focus.focus(); } }
      var fi = $('#featInfo'); if (fi && fi.getBoundingClientRect().top < 0) fi.scrollIntoView({ behavior: REDUCED ? 'instant' : 'smooth', block: 'start' });
    }
  });
  function enterCard(card) {
    if (REDUCED || !CAN_HOVER) return;
    var r = byId(card.getAttribute('data-id')), imgs = thumbList(r);
    if (imgs.length > 1) cycle(card.getAttribute('data-id'), card, imgs, function (i) { setThumb(card, i); });
  }
  function leaveCard(card) { if (!CAN_HOVER) return; stop(card.getAttribute('data-id')); setThumb(card, 0); }
  $('#grid').addEventListener('mouseover', function (e) { var c = e.target.closest('.card[data-id]'); if (c && !c.contains(e.relatedTarget)) enterCard(c); });
  $('#grid').addEventListener('mouseout', function (e) { var c = e.target.closest('.card[data-id]'); if (c && !c.contains(e.relatedTarget)) leaveCard(c); });
  $('#grid').addEventListener('focusin', function (e) { var c = e.target.closest('.card[data-id]'); if (c) enterCard(c); });
  $('#grid').addEventListener('focusout', function (e) { var c = e.target.closest('.card[data-id]'); if (c) leaveCard(c); });

  function markDots(i) {
    var b = document.querySelectorAll('#featDots [data-i]');
    for (var k = 0; k < b.length; k++) { b[k].setAttribute('aria-pressed', k === i); b[k].firstChild.style.background = k === i ? 'var(--acc)' : 'var(--line3)'; }
  }
  function goTo(i, instant) {
    var tr = $('#featTrack'), n = imgList(byId(state.sel)).length;
    if (!tr || !n) return;
    i = (i + n) % n; state.fi = i; markDots(i);
    tr.scrollTo({ left: i * tr.clientWidth, behavior: instant || REDUCED ? 'instant' : 'smooth' });
  }
  var fg = $('#featGallery');
  fg.addEventListener('mouseenter', function (e) {
    if (REDUCED || !CAN_HOVER || e.target.closest && e.target.closest('.garrow')) return;
    var imgs = imgList(byId(state.sel));
    if (imgs.length < 2) return;
    stop('F');
    timers.F = setInterval(function () { goTo(state.fi + 1); }, 1600);
  });
  fg.addEventListener('mouseleave', function () { stop('F'); });
  window.addEventListener('resize', function () { layoutSide(); var tr = $('#featTrack'); if (tr) tr.scrollLeft = state.fi * tr.clientWidth; });

  $('#featInfo').addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-k');
    if (!k) return;
    state[k] = k.length === 2 ? e.target.value.slice(0, 2) : e.target.value; state.touched = true;
    updateCard();
    var ob = $('#orderBtn'); if (ob) ob.href = orderUrl();
  });

  // FAQ-links naar een andere vraag: die vraag openklappen
  function openFaq() { var d = location.hash && document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') d.open = true; }
  window.addEventListener('hashchange', openFaq); openFaq();

  // ---------- start ----------
  var cd = contours();
  Array.prototype.forEach.call(document.querySelectorAll('path.contours'), function (p) { p.setAttribute('d', cd); });
  try { var q = new URLSearchParams(location.search).get('route'); if (q && ROUTES.some(function (r) { return r.id === q; })) state.sel = q; } catch (e) {}
  applyDefaults();
  renderFilters(); renderGrid(); renderFeatured(); renderTeaser();
})();

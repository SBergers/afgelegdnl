/* afgelegd.nl — collectie, uitgelichte route en live ritkaartje */
(function () {
  'use strict';

  // ---------- data ----------
  // Voeg een route toe door hier een regel bij te zetten en foto's in /img te zetten (id-1.jpg, id-2.jpg, ...).
  var ROUTES = [
    { id: 'rvn', size: '28 × 15 cm', price: 45, parts: 1, name: 'Rijk van Nijmegen', place: 'Nijmegen · Groesbeek · Mook · Malden', country: 'NL', sport: 'MTB', km: '63', hm: '± 800', note: 'Vier lussen, met het Traumapad', imgs: 5 },
    { id: 'uh', size: '47 × 14 cm', price: 65, parts: 2, name: 'Utrechtse Heuvelrug', place: 'Van Hoge Vuursche tot Rhenen', country: 'NL', sport: 'MTB', km: '138', hm: '± 1.050', note: 'Tien routes, tweedelige kaart', imgs: 3 },
    { id: 'zv', size: '27 × 18 cm', price: 45, parts: 1, name: 'MTB Zuid-Veluwe', place: 'Ede · Lunteren · Otterlo · Arnhem', country: 'NL', sport: 'MTB', km: '158', hm: '± 1.050', note: 'Zeven routes op één plaat', imgs: 2 },
    { id: 'dmr', size: '25 × 16 cm', price: 45, parts: 1, name: 'Dutch Mountain Ride', place: 'Zuid-Limburg', country: 'NL/BE/DE', sport: 'Gravel', km: '129', hm: '± 1.390', note: 'Met de winterroute als stippellijn', imgs: 2 },
    { id: 'gs', size: '11 × 25 cm', price: 45, parts: 1, name: 'Geile Strecke', place: 'Nijmegen → Maastricht', country: 'NL/DE/BE', sport: 'Gravel', km: '217', hm: '± 990', note: 'De Limburg Divide, langs de grens', imgs: 5, card: 'tall', tint: '#5B8CF0' },
    { id: 'gd', size: '25 × 24 cm', price: 55, parts: 1, name: 'Green Divide', place: 'Naarden → Zwolle', country: 'NL', sport: 'Gravel', km: '302', hm: '± 1.540', note: 'Met eigen ritkaartje', imgs: 3 },
    { id: 'bd', size: '25 × 24 cm', price: 55, parts: 1, name: 'Brown Divide', place: 'Naarden → Zwolle, wintervariant', country: 'NL', sport: 'Gravel', km: '305', hm: '± 1.230', note: 'Andere route door het Kroondomein', imgs: 3, tint: '#C9944A' },
    { id: 'hun', size: '17 × 25 cm', price: 45, parts: 1, name: 'Hunebed Highway', place: 'Start & finish Drouwen', country: 'NL', sport: 'Gravel', km: '175', hm: '± 340', note: 'Rondje door Drenthe', imgs: 2, card: 'tall' },
    { id: 'tb', size: '47 × 11 cm', price: 65, parts: 2, name: 'TransBelgian', place: 'Oostende → Eupen', country: 'BE', sport: 'Gravel', km: '515', hm: '± 3.300', note: 'Dwars door België, de Ardennen in', imgs: 2 },
    { id: 'dd', size: '25 × 21 cm', price: 55, parts: 1, name: 'Dutch Divide', place: 'Retranchement → Nieuwe Statenzijl', country: 'NL', sport: 'Gravel', km: '1.009', hm: '± 1.500', note: 'Heel Nederland, van zuidwest naar noordoost', imgs: 2 }
  ];
  var FILTERS = ['Alle', 'MTB', 'Gravel'];
  var MONTHS = ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];

  var state = { filter: 'Alle', sel: 'gs', fi: 0, start: '2026-10-14', end: '2026-10-16', hh: '18', mm: '02', ss: '33' };
  var timers = {};

  function $(s, el) { return (el || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function imgList(r) { var a = []; for (var i = 1; i <= r.imgs; i++) a.push('img/' + r.id + '-' + i + '.jpg'); return a; }
  function thumbList(r) { var a = []; for (var i = 1; i <= r.imgs; i++) a.push('img/t/' + r.id + '-' + i + '.webp'); return a; }
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function hasCard(r) { return r.sport === 'Gravel'; }
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
      return '<button class="pill" type="button" data-f="' + f + '" aria-pressed="' + (f === state.filter) + '">' + f + '</button>';
    }).join('');
  }

  // ---------- kaarten ----------
  function renderGrid() {
    var list = ROUTES.filter(function (r) { return state.filter === 'Alle' || r.sport === state.filter; });
    $('#count').textContent = ROUTES.length;
    var html = list.map(function (r) {
      var imgs = thumbList(r);
      return '<a class="card' + (r.id === state.sel ? ' sel' : '') + '" href="#uitgelicht" data-id="' + r.id + '" aria-label="' + esc(r.name) + ' bekijken">' +
        '<div class="thumb"><img src="' + imgs[0] + '" alt="3D-geprinte reliëfkaart van ' + esc(r.name) + '" loading="lazy" decoding="async" width="640" height="480">' +
        (imgs.length > 1 ? '<div class="dots" aria-hidden="true">' + imgs.map(function (_, j) { return '<span' + (j ? '' : ' class="on"') + '></span>'; }).join('') + '</div>' : '') +
        (hasCard(r) ? '<span class="badge">' + CLOCK + 'JOUW TIJD EROP</span>' : '') + '</div>' +
        '<div class="cbody">' +
        '<div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2)">' + r.sport.toUpperCase() + ' · ' + r.country + '</div>' +
        '<div class="disp" style="font-size:25px;line-height:1.05;letter-spacing:-.02em">' + esc(r.name) + '</div>' +
        '<div style="font-size:14px;line-height:1.4;color:var(--mut2)">' + esc(r.place) + '</div>' +
        '<div class="mono" style="display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-top:auto"><span>' + r.km + ' km</span><span style="color:var(--mut2)">' + r.hm + ' hm</span></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;border-top:1px solid var(--line2);padding-top:12px"><span class="mono" style="font-size:12px;color:var(--mut2)">' + r.size + (r.parts > 1 ? ' · 2 delen' : '') + '</span><span class="disp" style="font-size:22px;color:var(--fg)">€' + r.price + '</span></div>' +
        '</div></a>';
    }).join('');
    html += '<a class="card" href="#bestellen" style="justify-content:center;align-items:flex-start;gap:16px;border:1.5px dashed var(--line3);padding:32px 26px;min-height:360px;background:var(--bg)">' +
      '<svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="#FF6A2B" stroke-width="1.5" stroke-dasharray="4 5"/><path d="M32 20v24M20 32h24" stroke="#FF6A2B" stroke-width="2.4" stroke-linecap="round"/></svg>' +
      '<div class="disp" style="font-size:28px;line-height:1.05;letter-spacing:-.02em">Jouw eigen rit?</div>' +
      '<p style="margin:0;color:var(--mut);font-size:16px;line-height:1.5">Je marathon, die vakantieklim of je dagelijkse rondje. Stuur ons je GPX-bestand of Strava-link en wij maken er een uniek reliëf van.</p>' +
      '<span style="font-weight:600;color:var(--acc)">Vraag het aan →</span></a>';
    $('#grid').innerHTML = html;
  }

  function setThumb(card, i) {
    var r = byId(card.getAttribute('data-id')), imgs = thumbList(r);
    $('img', card).src = imgs[i];
    var dots = card.querySelectorAll('.dots span');
    for (var j = 0; j < dots.length; j++) dots[j].className = j === i ? 'on' : '';
  }

  // ---------- uitgelicht ----------
  function renderFeatured() {
    var r = byId(state.sel), imgs = imgList(r);
    if (state.fi >= imgs.length) state.fi = 0;
    $('#featGallery').innerHTML =
      '<div style="position:relative;border-radius:18px;overflow:hidden;aspect-ratio:4/3;background:#EFE9E1">' +
      '<img id="featImg" src="' + imgs[state.fi] + '" title="Tik voor de volgende foto" alt="Foto van de 3D-kaart ' + esc(r.name) + '" width="1200" height="900" style="display:block;width:100%;height:100%;object-fit:cover">' +
      (hasCard(r) ? '<span class="badge" style="top:16px;left:16px;font-size:12px;padding:8px 13px">' + CLOCK + 'JOUW TIJD EROP</span>' : '') + '</div>' +
      (imgs.length > 1 ? '<div role="group" aria-label="Foto\'s" id="featDots" style="display:flex;justify-content:center;gap:4px;margin-top:10px">' + imgs.map(function (_, j) {
        return '<button type="button" class="dotbtn" data-i="' + j + '" aria-label="Foto ' + (j + 1) + ' van ' + imgs.length + '" aria-pressed="' + (j === state.fi) + '" style="width:44px;height:44px;padding:0;border:0;background:transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center"><span style="display:block;width:26px;height:4px;border-radius:4px;background:' + (j === state.fi ? 'var(--acc)' : 'var(--line3)') + '"></span></button>';
      }).join('') + '</div>' : '');

    var stat = function (label, val) { return '<div><div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2);margin-bottom:6px">' + label + '</div>' + val + '</div>'; };
    var info =
      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:18px">' +
      '<span class="mono" style="font-size:12px;letter-spacing:.12em;color:var(--bg);background:var(--acc);padding:6px 12px;border-radius:999px">UITGELICHT</span>' +
      '<span class="mono" style="font-size:12px;letter-spacing:.12em;color:var(--mut);border:1px solid #2F3934;padding:6px 12px;border-radius:999px">' + r.sport.toUpperCase() + '</span></div>' +
      (hasCard(r) ? '<p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:var(--mut);max-width:440px">Met een los ritkaartje in de kaart, met jouw datum en totale rijtijd erop.</p>' : '') +
      '<h3 class="disp" style="font-size:clamp(34px,3.6vw,52px);line-height:1;letter-spacing:-.03em;margin:0 0 10px">' + esc(r.name) + '</h3>' +
      '<p style="margin:0 0 30px;color:var(--mut2);font-size:16px">' + esc(r.place) + '</p>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);padding:22px 0;margin-bottom:24px">' +
      stat('AFSTAND', '<div class="disp stat-v" style="letter-spacing:-.02em">' + r.km + '<span style="font-size:15px;color:var(--mut2);font-weight:600"> km</span></div>') +
      stat('HOOGTE', '<div class="disp stat-v" style="letter-spacing:-.02em;white-space:nowrap">' + r.hm + '<span style="font-size:15px;color:var(--mut2);font-weight:600"> hm</span></div>') +
      stat('BIJZONDER', '<div style="font-size:15px;line-height:1.35;font-weight:500">' + esc(r.note) + '</div>') + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:24px">' +
      '<div><div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2);margin-bottom:6px">FORMAAT</div><div style="font-size:16px;font-weight:500">' + r.size + (r.parts > 1 ? ' <span style="color:var(--mut2)">· geprint in 2 delen die in elkaar passen</span>' : '') + '</div></div>' +
      '<div style="text-align:right"><div class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2);margin-bottom:2px">PRIJS</div><div class="disp" style="font-size:40px;line-height:1;letter-spacing:-.02em;color:var(--acc)">€' + r.price + '</div></div></div>' +
      (hasCard(r) ? editorHTML(r) : '') +
      '<div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn btn-acc" id="orderBtn" href="https://ig.me/m/afgelegd.nl" target="_blank" rel="noopener">Bestel via Instagram</a><a class="btn btn-ghost" href="https://www.marktplaats.nl/u/sander/8057951/" target="_blank" rel="noopener">via Marktplaats</a></div>' +
      '<p class="toast" id="orderNote" role="status">' + (hasCard(r) ? 'Je bestelling met ritkaartje wordt gekopieerd, zodat je hem zo in de chat plakt.' : 'Je bestelling wordt gekopieerd, zodat je hem zo in de chat plakt.') + '</p>';
    $('#featInfo').innerHTML = info;
    if (hasCard(r)) updateCard();
  }

  // ---------- live ritkaartje ----------
  function editorHTML(r) {
    var t = function (k, lab) { return '<input class="inp tinp" type="text" inputmode="numeric" maxlength="2" aria-label="' + lab + '" data-k="' + k + '" value="' + esc(state[k]) + '">'; };
    var sep = '<span aria-hidden="true" class="mono" style="font-size:18px;color:var(--mut2)">:</span>';
    return '<section aria-labelledby="ed-kop" style="background:var(--bg);border:1px solid var(--line2);border-radius:20px;padding:20px;margin-bottom:26px">' +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:14px"><h4 id="ed-kop" class="disp" style="margin:0;font-size:20px;letter-spacing:-.01em">Maak je ritkaartje</h4><span class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--mut2)">LIVE VOORBEELD</span></div>' +
      '<div aria-live="polite" id="cardPreview" style="display:flex;justify-content:center;padding:18px;border-radius:14px;background:#1A2420;margin-bottom:16px"></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">' +
      '<label class="field">EERSTE DAG<input class="inp" type="date" data-k="start" value="' + state.start + '"></label>' +
      '<label class="field">LAATSTE DAG<input class="inp" type="date" data-k="end" value="' + state.end + '"></label>' +
      '<fieldset style="grid-column:1/-1;border:0;margin:0;padding:0;min-width:0"><legend class="field" style="padding:0;margin-bottom:6px">TOTALE RIJTIJD</legend>' +
      '<div style="display:flex;align-items:center;gap:8px">' + t('hh', 'Uren') + sep + t('mm', 'Minuten') + sep + t('ss', 'Seconden') + '<span class="hide-sm" style="font-size:13px;color:var(--mut2);margin-left:4px">uu : mm : ss</span></div></fieldset>' +
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
    var r = byId(state.sel), box = $('#cardPreview');
    if (!box) return;
    var tint = r.tint || '#8CBE46', dl = dateLabel();
    var time = two(state.hh, 99) + ':' + two(state.mm, 59) + ':' + two(state.ss, 59);
    var title = r.name.toUpperCase(), aria = 'Ritkaartje ' + title + ', ' + dl.days + ' ' + dl.month + ', totale rijtijd ' + time;
    var html;
    if (r.card === 'tall') {
      html = '<div class="rcard" role="img" aria-label="' + esc(aria) + '" style="width:190px;padding:16px 16px 18px;text-align:center">' +
        title.split(' ').map(function (l) { return '<div style="font-size:19px;line-height:1.1;letter-spacing:.05em;color:' + tint + '">' + esc(l) + '</div>'; }).join('') +
        '<div class="rule" style="margin:10px 0 12px"></div><div style="font-size:34px;line-height:1;white-space:nowrap">' + dl.days + '</div>' +
        '<div style="font-size:15px;letter-spacing:.03em;margin-top:6px;white-space:nowrap">' + dl.month + '</div><div class="rule" style="margin:12px 0 14px"></div>' +
        segs(time) + '<div style="font-size:12px;letter-spacing:.06em;color:' + tint + ';margin-top:8px">TOTALE RIJTIJD</div></div>';
    } else {
      html = '<div class="rcard" role="img" aria-label="' + esc(aria) + '" style="width:100%;max-width:420px;padding:14px 18px 16px">' +
        '<div style="text-align:center;font-size:17px;letter-spacing:.08em;color:' + tint + '">' + esc(title) + '</div><div class="rule" style="margin:8px 0 12px"></div>' +
        '<div style="display:flex;align-items:center;gap:14px"><div style="flex:0 0 auto;text-align:center"><div style="font-style:italic;font-size:34px;line-height:1;white-space:nowrap">' + dl.days + '</div>' +
        '<div style="font-style:italic;font-size:15px;letter-spacing:.03em;margin-top:4px;white-space:nowrap">' + dl.month + '</div></div>' +
        '<div style="width:3px;align-self:stretch;background:#DDD8CC;border-radius:2px;transform:skewX(-4deg)"></div>' +
        '<div style="flex:1 1 auto;min-width:0;text-align:center"><div style="max-height:52px">' + segs(time) + '</div><div style="font-size:12px;letter-spacing:.06em;color:' + tint + ';margin-top:6px">TOTALE RIJTIJD</div></div></div></div>';
    }
    box.innerHTML = html;
  }

  function orderText() {
    var r = byId(state.sel), t = 'Hoi! Ik wil graag de 3D-kaart van ' + r.name + ' (€' + r.price + ') bestellen.';
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
    var c = e.target.closest('.card[data-id]');
    if (c) { state.sel = c.getAttribute('data-id'); state.fi = 0; renderGrid(); renderFeatured(); setUrl(); return; }
    if (e.target.closest('#orderBtn')) { var note = $('#orderNote'); copy(orderText()).then(function () { if (note) note.textContent = 'Gekopieerd! Plak het bericht in de Instagram-chat.'; }); return; }
    if (e.target.id === 'featImg') { var L = imgList(byId(state.sel)); if (L.length > 1) { stop('F'); state.fi = (state.fi + 1) % L.length; renderFeatured(); } return; }
    var d = e.target.closest('#featDots [data-i]');
    if (d) { stop('F'); state.fi = +d.getAttribute('data-i'); renderFeatured(); }
  });
  function enterCard(card) {
    if (REDUCED) return;
    var r = byId(card.getAttribute('data-id')), imgs = thumbList(r);
    if (imgs.length > 1) cycle(card.getAttribute('data-id'), card, imgs, function (i) { setThumb(card, i); });
  }
  function leaveCard(card) { stop(card.getAttribute('data-id')); setThumb(card, 0); }
  $('#grid').addEventListener('mouseover', function (e) { var c = e.target.closest('.card[data-id]'); if (c && !c.contains(e.relatedTarget)) enterCard(c); });
  $('#grid').addEventListener('mouseout', function (e) { var c = e.target.closest('.card[data-id]'); if (c && !c.contains(e.relatedTarget)) leaveCard(c); });
  $('#grid').addEventListener('focusin', function (e) { var c = e.target.closest('.card[data-id]'); if (c) enterCard(c); });
  $('#grid').addEventListener('focusout', function (e) { var c = e.target.closest('.card[data-id]'); if (c) leaveCard(c); });

  var fg = $('#featGallery');
  fg.addEventListener('mouseenter', function () {
    if (REDUCED) return;
    var imgs = imgList(byId(state.sel));
    if (imgs.length < 2) return;
    cycle('F', fg, imgs, function (i) {
      state.fi = i; $('#featImg').src = imgs[i];
      var b = fg.querySelectorAll('#featDots [data-i]');
      for (var j = 0; j < b.length; j++) { b[j].setAttribute('aria-pressed', j === i); b[j].firstChild.style.background = j === i ? 'var(--acc)' : 'var(--line3)'; }
    }, state.fi);
  });
  fg.addEventListener('mouseleave', function () { stop('F'); });

  $('#featInfo').addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-k');
    if (!k) return;
    state[k] = k.length === 2 ? e.target.value.slice(0, 2) : e.target.value;
    updateCard();
  });

  // ---------- start ----------
  var cd = contours();
  Array.prototype.forEach.call(document.querySelectorAll('path.contours'), function (p) { p.setAttribute('d', cd); });
  try { var q = new URLSearchParams(location.search).get('route'); if (q && ROUTES.some(function (r) { return r.id === q; })) state.sel = q; } catch (e) {}
  renderFilters(); renderGrid(); renderFeatured();
})();

// Taal: de Nederlandse tekst is de sleutel
var LANG = document.documentElement.lang === 'en' ? 'en' : 'nl';
var LOC = LANG === 'en' ? 'en-GB' : 'nl-NL';
var L10N = {
  'Kaart': 'Map', 'Kaart ': 'Map ', 'verzending gratis': 'free shipping', ' verzending': ' shipping', 'gratis verzending': 'free shipping',
  ' kaart': ' map', ' kaarten': ' maps', ' + prijs eigen rit': ' + price of own ride', 'prijs volgt': 'price to follow',
  'Bezig met versturen…': 'Sending…', 'Alleen .gpx-bestanden zijn toegestaan.': 'Only .gpx files are allowed.',
  'Dit bestand is erg groot ({s}). Is het wel één rit?': 'This file is very large ({s}). Is it really one ride?',
  'Bestand lezen…': 'Reading file…', 'Dit bestand kon niet gelezen worden.': 'This file could not be read.',
  'Dit lijkt geen geldig GPX-bestand.': 'This does not look like a valid GPX file.', 'Er staat geen route in dit GPX-bestand.': 'There is no route in this GPX file.',
  'Dit bestand is groter dan {m} en kon niet kleiner gemaakt worden. Stuur ons gerust een mail via de bestelling.': 'This file is larger than {m} and could not be made smaller. Feel free to send us a message via your order.',
  'Dit bestand is groter dan {m}.': 'This file is larger than {m}.',
  '{f}: {a} → {b}. Je route blijft hetzelfde, alleen extra data zoals hartslag is eruit.': '{f}: {a} → {b}. Your route stays the same; only extra data such as heart rate has been removed.',
  '{f} ({s}) is klaar om te versturen.': '{f} ({s}) is ready to send.', 'Je route op de kaart': 'Your route on the map',
  'hoogste punt': 'highest point', 'AFSTAND': 'DISTANCE', 'HOOGTEMETERS': 'ELEVATION GAIN', 'DATUM': 'DATE', 'RIJTIJD': 'RIDE TIME', 'PUNTEN': 'POINTS',
  'Je route': 'Your route', 'Klopt dit met je rit? Dan heb je het goede bestand.': 'Does this match your ride? Then you have the right file.',
  'Datum en rijtijd voor het ritkaartje hebben we alvast uit je GPX ingevuld. Pas ze gerust aan.': 'We have filled in the date and ride time for the ride card from your GPX. Feel free to change them.',
  'Je kunt maximaal {n} GPX-bestanden op één kaart zetten.': 'You can put up to {n} GPX files on one map.',
  'RITTEN': 'RIDES', 'TOTALE AFSTAND': 'TOTAL DISTANCE', '{n} ritten op één kaart': '{n} rides on one map',
  'Kloppen deze ritten? Dan heb je de goede bestanden.': 'Do these rides look right? Then you have the right files.'
};
function tr(s, v) { var o = LANG === 'en' && L10N[s] !== undefined ? L10N[s] : s; if (v) for (var k in v) o = o.split('{' + k + '}').join(v[k]); return o; }

// Bestelformulier: één of meer kaarten, elk met eigen route, GPX en ritkaartje
(function () {
  var box = document.getElementById('items');
  if (!box) return;
  var tpl = document.getElementById('itemTpl'), add = document.getElementById('addItem'), sum = document.getElementById('orderSum');
  var MAX = +(add && add.getAttribute('data-max')) || 5;
  function items() { return box.querySelectorAll('.item'); }
  function upd(fs) {
    var s = fs.querySelector('.item-route'), o = s.options[s.selectedIndex], eigen = s.value === 'eigen';
    fs.querySelector('.item-card').hidden = !(o && o.getAttribute('data-card') === '1');
    fs.querySelector('.item-eigen').hidden = !eigen;
    var kept = fs.querySelectorAll('.keep-in:checked').length, ins = fs.querySelectorAll('.gpx-in');
    for (var i = 0; i < ins.length; i++) ins[i].required = eigen && !kept && i === 0;
    var ga = fs.querySelector('.gpx-add'); if (ga) ga.hidden = ins.length + fs.querySelectorAll('.keep-in').length >= (+ga.getAttribute('data-max') || 10);
  }
  function renum() {
    var it = items(), n = it.length;
    for (var i = 0; i < n; i++) {
      it[i].querySelector('legend').textContent = n === 1 ? tr('Kaart') : tr('Kaart ') + (i + 1);
      it[i].querySelector('.item-del').hidden = n === 1;
      Array.prototype.forEach.call(it[i].querySelectorAll('[data-f]'), function (el) { el.name = el.getAttribute('data-f') + '_' + i; });
    }
    if (add) add.hidden = n >= MAX;
    total();
  }
  var ctry = document.getElementById('country');
  function extra() { var o = ctry && ctry.options[ctry.selectedIndex]; return o ? +o.getAttribute('data-extra') || 0 : 0; }
  function total() {
    if (!sum) return;
    var n = 0, eur = 0, known = true, ship = 0;
    Array.prototype.forEach.call(items(), function (fs) {
      var s = fs.querySelector('.item-route'), o = s.options[s.selectedIndex]; if (!o || !o.value) return;
      n++; var p = +o.getAttribute('data-price'); if (p) eur += p; else known = false;
      ship = +o.getAttribute('data-ship') || 0;
    });
    sum.textContent = '';
    if (!n) return;
    if (n >= 2) ship = 0; ship += extra();
    var shipTxt = ship ? '+ €' + ship + tr(' verzending') : (n >= 2 ? tr('verzending gratis') : tr('gratis verzending'));
    var t = document.createElement('span'); t.textContent = n + (n === 1 ? tr(' kaart') : tr(' kaarten')) + ' · ' + (known ? '€' + eur : (eur ? '€' + eur + tr(' + prijs eigen rit') : tr('prijs volgt'))) + ' · ';
    var sh = document.createElement('strong'); sh.textContent = shipTxt; sh.style.color = !ship ? 'var(--acc)' : 'var(--mut2)'; sh.style.fontWeight = (!ship && n >= 2) ? '700' : '500';
    sum.appendChild(t); sum.appendChild(sh);
  }
  if (add && tpl) add.addEventListener('click', function () {
    var fs = tpl.content.firstElementChild.cloneNode(true);
    box.appendChild(fs); upd(fs); renum(); fs.querySelector('.item-route').focus();
  });
  box.addEventListener('change', function (e) {
    var fs = e.target.closest('.item'); if (!fs) return;
    if (e.target.classList.contains('item-route')) { upd(fs); total(); }
    if (e.target.classList.contains('gpx-in')) readItem(fs);
    if (e.target.classList.contains('keep-in')) upd(fs);
  });
  box.addEventListener('click', function (e) {
    var ga = e.target.closest('.gpx-add');
    if (ga) {
      var fs0 = ga.closest('.item'), wrap = fs0.querySelector('.gpx-inputs'), first = wrap.querySelector('.gpx-in');
      var inp = first.cloneNode(false); inp.value = ''; inp.required = false; inp._slim = null;
      wrap.appendChild(inp); renum(); upd(fs0); inp.click(); return;
    }
    var d = e.target.closest('.item-del'); if (!d) return;
    d.closest('.item').remove(); renum(); if (add && !add.hidden) add.focus();
  });
  Array.prototype.forEach.call(items(), upd); renum();
  var cO = document.getElementById('countryOther'), cN = document.getElementById('countryNote');
  if (ctry) ctry.addEventListener('change', function () { var oth = ctry.value === 'anders'; if (cO) { cO.hidden = !oth; cO.querySelector('input').required = oth; if (oth) cO.querySelector('input').focus(); } if (cN) cN.hidden = !oth; total(); });
  var src = document.getElementById('source'), srcO = document.getElementById('sourceOther');
  if (src && srcO) src.addEventListener('change', function () { srcO.hidden = !(src.value === 'anders' || src.value === 'winkel'); if (!srcO.hidden) srcO.querySelector('input').focus(); });
  var form = document.getElementById('orderForm');
  if (form) form.addEventListener('submit', function () { var b = form.querySelector('button[type=submit]'); b.disabled = true; b.textContent = tr('Bezig met versturen…'); });
})();

// Tijden tonen in de tijdzone van de bezoeker
(function () {
  try {
    var f = new Intl.DateTimeFormat(LOC, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('time[datetime]').forEach(function (el) {
      var d = new Date(el.getAttribute('datetime'));
      if (!isNaN(d)) { el.textContent = f.format(d).replace(',', ''); el.title = Intl.DateTimeFormat().resolvedOptions().timeZone; }
    });
  } catch (e) {}
})();

// GPX direct uitlezen: lijntjes, afstand, hoogtemeters en (als het erin staat) datum en rijtijd. Meerdere bestanden per kaart mogen.
function parseGpxText(txt) {
  var doc;
  try { doc = new DOMParser().parseFromString(txt, 'application/xml'); } catch (e) { doc = null; }
  if (!doc || doc.getElementsByTagName('parsererror').length || !doc.documentElement || doc.documentElement.localName.toLowerCase() !== 'gpx') throw tr('Dit lijkt geen geldig GPX-bestand.');
  var els = doc.getElementsByTagNameNS('*', 'trkpt');
  if (els.length < 2) els = doc.getElementsByTagNameNS('*', 'rtept');
  var P = [];
  for (var i = 0; i < els.length; i++) {
    var la = parseFloat(els[i].getAttribute('lat')), lo = parseFloat(els[i].getAttribute('lon'));
    if (!(la >= -90 && la <= 90 && lo >= -180 && lo <= 180)) continue;
    var e = els[i].getElementsByTagNameNS('*', 'ele')[0], t = els[i].getElementsByTagNameNS('*', 'time')[0];
    P.push({ la: la, lo: lo, e: e ? parseFloat(e.textContent) : NaN, t: t ? Date.parse(t.textContent) : NaN });
  }
  if (P.length < 2) throw tr('Er staat geen route in dit GPX-bestand.');
  var nm = doc.getElementsByTagNameNS('*', 'name')[0];
  return { P: P, name: nm ? nm.textContent.trim().slice(0, 80) : '' };
}
function readFileText(f) {
  return new Promise(function (ok, no) { var rd = new FileReader(); rd.onerror = function () { no(tr('Dit bestand kon niet gelezen worden.')); }; rd.onload = function () { ok(String(rd.result)); }; rd.readAsText(f); });
}
function readItem(fs) {
  var msg = fs.querySelector('.gpx-msg'), box = fs.querySelector('.gpxprev'), inputs = fs.querySelectorAll('.gpx-in');
  var MAX = +inputs[0].getAttribute('data-max') || 2 * 1024 * 1024, LIM = +(fs.querySelector('.gpx-add') || inputs[0]).getAttribute('data-max') || 10;
  var jobs = [];
  Array.prototype.forEach.call(inputs, function (inp) { Array.prototype.forEach.call(inp.files || [], function (f) { jobs.push({ inp: inp, f: f }); }); });
  box.hidden = true; box.innerHTML = ''; msg.style.color = '';
  if (!jobs.length) { msg.textContent = ''; return; }
  var kept = fs.querySelectorAll('.keep-in:checked').length;
  if (jobs.length + kept > LIM) { msg.textContent = tr('Je kunt maximaal {n} GPX-bestanden op één kaart zetten.', { n: LIM }); msg.style.color = 'var(--err)'; return; }
  msg.textContent = tr('Bestand lezen…');
  Promise.all(jobs.map(function (j) {
    if (!/\.gpx$/i.test(j.f.name)) return Promise.resolve({ j: j, err: tr('Alleen .gpx-bestanden zijn toegestaan.') });
    if (j.f.size > 60 * 1024 * 1024) return Promise.resolve({ j: j, err: tr('Dit bestand is erg groot ({s}). Is het wel één rit?', { s: mb(j.f.size) }) });
    return readFileText(j.f).then(function (txt) {
      var r = parseGpxText(txt); r.j = j;
      if (j.f.size > MAX) {
        var slim = slimGpx(r.P, r.name, MAX);
        if (!slim || typeof DataTransfer === 'undefined') { r.err = tr('Dit bestand is groter dan {m} en kon niet kleiner gemaakt worden. Stuur ons gerust een mail via de bestelling.', { m: mb(MAX) }); return r; }
        r.slim = new File([slim], j.f.name.replace(/\.gpx$/i, '') + '.gpx', { type: 'application/gpx+xml' });
      }
      return r;
    }, function (e) { return { j: j, err: String(e) }; }).catch(function (e) { return { j: j, err: String(e) }; });
  })).then(function (res) {
    // per invoerveld de bestanden opnieuw zetten: verkleinde versies erin, foute bestanden eruit
    var lines = [], good = [], changed = new Map();
    res.forEach(function (r) {
      var f = r.j.f;
      if (r.err) { lines.push('✗ ' + f.name + ': ' + r.err); }
      else if (r.slim) { lines.push('✓ ' + tr('{f}: {a} → {b}. Je route blijft hetzelfde, alleen extra data zoals hartslag is eruit.', { f: f.name, a: mb(f.size), b: kb(r.slim.size) })); good.push(r); }
      else { lines.push('✓ ' + tr('{f} ({s}) is klaar om te versturen.', { f: f.name, s: kb(f.size) })); good.push(r); }
      if (r.err || r.slim) changed.set(r.j.inp, true);
    });
    changed.forEach(function (_v, inp) {
      try {
        var dt = new DataTransfer();
        res.forEach(function (r) { if (r.j.inp === inp && !r.err) dt.items.add(r.slim || r.j.f); });
        inp.files = dt.files;
      } catch (x) { inp.value = ''; }
    });
    msg.textContent = lines.join('\n');
    msg.style.color = res.some(function (r) { return r.err; }) ? 'var(--err)' : '';
    if (!good.length) return;
    var routes = good.map(function (r) { return { P: r.P, name: r.name || r.j.f.name.replace(/\.gpx$/i, ''), st: stats(r.P) }; });
    draw(box, routes);
    prefill(fs, routes);
  });
}
function kb(n) { return Math.max(1, Math.round(n / 1024)) + ' kB'; }
function mb(n) { return (n / 1048576).toFixed(n < 10485760 ? 1 : 0).replace('.', ',') + ' MB'; }
function hav(a, b) {
  var R = 6371000, r = Math.PI / 180, dLa = (b.la - a.la) * r, dLo = (b.lo - a.lo) * r;
  var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.la * r) * Math.cos(b.la * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
function stats(P) {
  var d = 0, up = 0, ref = NaN, mov = 0, hasT = true, cum = [0];
  for (var i = 1; i < P.length; i++) {
    var s = hav(P[i - 1], P[i]); d += s; cum.push(d);
    var dt = (P[i].t - P[i - 1].t) / 1000;
    if (isNaN(dt)) hasT = false; else if (dt > 0 && dt <= 120 && s / dt > 0.8) mov += dt;
  }
  // hoogtemeters: alleen stijgingen van minstens 3 m tellen (filtert GPS-ruis)
  for (var j = 0; j < P.length; j++) {
    var e = P[j].e; if (isNaN(e)) continue;
    if (isNaN(ref)) ref = e; else if (e > ref + 3) { up += e - ref; ref = e; } else if (e < ref) ref = e;
  }
  var t0 = P[0].t, t1 = P[P.length - 1].t;
  return { km: d / 1000, up: isNaN(ref) ? null : up, cum: cum, t0: hasT && !isNaN(t0) ? new Date(t0) : null, t1: hasT && !isNaN(t1) ? new Date(t1) : null, mov: hasT && mov > 60 ? mov : 0 };
}
function slimGpx(P, name, MAX) {
  var esc = function (x) { return x.replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); };
  for (var step = 1; step <= 64; step *= 2) {
    var out = ['<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="afgelegd.nl" xmlns="http://www.topografix.com/GPX/1/1"><trk>' + (name ? '<name>' + esc(name) + '</name>' : '') + '<trkseg>'];
    for (var i = 0; i < P.length; i++) {
      if (i % step && i !== P.length - 1) continue;
      var p = P[i];
      out.push('<trkpt lat="' + p.la.toFixed(6) + '" lon="' + p.lo.toFixed(6) + '">' + (isNaN(p.e) ? '' : '<ele>' + p.e.toFixed(1) + '</ele>') + (isNaN(p.t) ? '' : '<time>' + new Date(p.t).toISOString().replace('.000Z', 'Z') + '</time>') + '</trkpt>\n');
    }
    out.push('</trkseg></trk></gpx>\n');
    var str = out.join('');
    if (str.length < MAX * 0.95) return str;
  }
  return null;
}
var GPX_COL = ['#FF6A2B', '#7FD1AE', '#C18CFF', '#FFD166', '#6EC1FF', '#FF8FB1', '#B5E36A', '#F2F2F2', '#FFA36B', '#8EA6FF'];
function sumStats(routes) {
  var o = { km: 0, up: null, t0: null, t1: null, mov: 0, n: 0 };
  routes.forEach(function (r) {
    var st = r.st; o.km += st.km; o.n += r.P.length; o.mov += st.mov || 0;
    if (st.up !== null) o.up = (o.up || 0) + st.up;
    if (st.t0 && (!o.t0 || st.t0 < o.t0)) o.t0 = st.t0;
    if (st.t1 && (!o.t1 || st.t1 > o.t1)) o.t1 = st.t1;
  });
  return o;
}
function draw(box, routes) {
  var all = []; routes.forEach(function (r) { all = all.concat(r.P); });
  var la0 = 0; all.forEach(function (p) { la0 += p.la; }); la0 /= all.length;
  var cx = Math.cos(la0 * Math.PI / 180), minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  all.forEach(function (p) { var x = p.lo * cx, y = -p.la; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; });
  var W = 600, H = 340, pad = 18, sc = Math.min((W - 2 * pad) / Math.max(1e-9, maxX - minX), (H - 2 * pad) / Math.max(1e-9, maxY - minY));
  var ox = (W - (maxX - minX) * sc) / 2, oy = (H - (maxY - minY) * sc) / 2;
  var pt = function (p) { return [ox + (p.lo * cx - minX) * sc, oy + (-p.la - minY) * sc]; };
  var multi = routes.length > 1, paths = '', dots = '';
  routes.forEach(function (r, ri) {
    var P = r.P, n = P.length, k = Math.max(1, Math.floor(n / (1500 / Math.min(routes.length, 4)))), Q = [];
    for (var i = 0; i < n; i += k) Q.push(P[i]); if (Q[Q.length - 1] !== P[n - 1]) Q.push(P[n - 1]);
    var d = Q.map(function (p, j) { var a = pt(p); return (j ? 'L' : 'M') + a[0].toFixed(1) + ' ' + a[1].toFixed(1); }).join('');
    paths += '<path d="' + d + '" fill="none" stroke="' + (multi ? GPX_COL[ri % GPX_COL.length] : '#FF6A2B') + '" stroke-width="' + (multi ? 2.5 : 3) + '" stroke-linejoin="round" stroke-linecap="round" opacity=".95"/>';
    if (!multi) {
      var a = pt(P[0]), b = pt(P[n - 1]);
      dots = '<circle cx="' + b[0].toFixed(1) + '" cy="' + b[1].toFixed(1) + '" r="6" fill="#0E1311" stroke="#EDE8DC" stroke-width="2.5"/><circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="6" fill="#7FD1AE" stroke="#0E1311" stroke-width="2"/>';
    }
  });
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + tr('Je route op de kaart') + '" class="gpxmap">' + paths + dots + '</svg>';
  var prof = '';
  if (!multi) {
    var P = routes[0].P, st0 = routes[0].st, n = P.length, k = Math.max(1, Math.floor(n / 1500)), E = [];
    for (var i = 0; i < n; i += k) if (!isNaN(P[i].e)) E.push([st0.cum[i], P[i].e]);
    if (E.length > 5) {
      var eMin = Math.min.apply(null, E.map(function (x) { return x[1]; })), eMax = Math.max.apply(null, E.map(function (x) { return x[1]; })), tot = st0.cum[n - 1] || 1, PH = 70;
      var rng = Math.max(20, eMax - eMin);
      var pd = E.map(function (x, j) { return (j ? 'L' : 'M') + (x[0] / tot * W).toFixed(1) + ' ' + (PH - 4 - (x[1] - eMin) / rng * (PH - 10)).toFixed(1); }).join('');
      prof = '<svg viewBox="0 0 ' + W + ' ' + PH + '" preserveAspectRatio="none" aria-hidden="true" class="gpxprof"><path d="' + pd + 'L' + W + ' ' + PH + 'L0 ' + PH + 'Z" fill="rgba(255,106,43,.18)"/><path d="' + pd + '" fill="none" stroke="#FF6A2B" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>' +
        '<div class="gpxprof-l"><span>' + Math.round(eMin) + ' m</span><span>' + tr('hoogste punt') + ' ' + Math.round(eMax) + ' m</span></div>';
    }
  }
  var st = sumStats(routes);
  var fmtD = function (dt) { return dt.toLocaleDateString(LOC, { day: 'numeric', month: 'long', year: 'numeric' }); };
  var cells = [];
  if (multi) cells.push([tr('RITTEN'), String(routes.length)]);
  cells.push([multi ? tr('TOTALE AFSTAND') : tr('AFSTAND'), st.km.toLocaleString(LOC, { maximumFractionDigits: st.km < 100 ? 1 : 0 }) + ' km']);
  if (st.up !== null) cells.push([tr('HOOGTEMETERS'), '± ' + Math.round(st.up).toLocaleString(LOC) + (LANG === 'en' ? ' m' : ' hm')]);
  if (st.t0) cells.push([tr('DATUM'), fmtD(st.t0) + (st.t1 && st.t1.toDateString() !== st.t0.toDateString() ? ' – ' + fmtD(st.t1) : '')]);
  if (st.mov) cells.push([tr('RIJTIJD'), hms(st.mov)]);
  if (!multi) cells.push([tr('PUNTEN'), st.n.toLocaleString(LOC)]);
  var ttl = document.createElement('p'); ttl.className = 'gpxprev-t';
  ttl.textContent = multi ? tr('{n} ritten op één kaart', { n: routes.length }) : (routes[0].name ? '“' + routes[0].name + '”' : tr('Je route'));
  var leg = '';
  if (multi) leg = '<ul class="gpx-legend">' + routes.map(function (r, ri) { var li = document.createElement('li'); li.textContent = r.name + ' · ' + r.st.km.toLocaleString(LOC, { maximumFractionDigits: 1 }) + ' km'; return '<li><i style="background:' + GPX_COL[ri % GPX_COL.length] + '"></i>' + li.innerHTML + '</li>'; }).join('') + '</ul>';
  box.innerHTML = svg + leg + prof + '<dl class="gpxstats">' + cells.map(function (c) { return '<div><dt>' + c[0] + '</dt><dd>' + c[1] + '</dd></div>'; }).join('') + '</dl>' +
    '<p class="small muted" style="margin:10px 0 0">' + (multi ? '' : '<span class="dot dot-s"></span> start <span class="dot dot-f"></span> finish · ') + tr(multi ? 'Kloppen deze ritten? Dan heb je de goede bestanden.' : 'Klopt dit met je rit? Dan heb je het goede bestand.') + '</p>';
  box.insertBefore(ttl, box.firstChild);
  box.hidden = false;
}
function hms(s) { s = Math.round(s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function prefill(fs, routes) {
  var st = sumStats(routes);
  var set = function (n, v) { var el = fs.querySelector('[data-f="' + n + '"]'); if (el && !el.value && v) { el.value = v; el.classList.add('filled'); } };
  if (routes.length === 1 && !fs.querySelector('.keep-in')) set('ride_name', routes[0].name);
  if (st.t0) { set('start', ymd(st.t0)); set('end', ymd(st.t1 || st.t0)); }
  if (st.mov) set('time', hms(st.mov));
  var box = fs.querySelector('.gpxprev');
  if (box && fs.querySelector('input.filled[data-f="start"], input.filled[data-f="time"]')) {
    var n = document.createElement('p'); n.className = 'small muted'; n.style.margin = '6px 0 0';
    n.textContent = tr('Datum en rijtijd voor het ritkaartje hebben we alvast uit je GPX ingevuld. Pas ze gerust aan.');
    box.appendChild(n);
  }
}

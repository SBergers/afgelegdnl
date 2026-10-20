// Toont de juiste velden op het bestelformulier
(function () {
  var sel = document.getElementById('route');
  if (!sel) return;
  var card = document.getElementById('cardFields'), gpx = document.getElementById('gpxField'), gpxIn = document.getElementById('gpx'), ride = document.getElementById('rideName');
  function upd() {
    var o = sel.options[sel.selectedIndex], kind = o ? o.getAttribute('data-kind') : '';
    var hasCard = o && o.getAttribute('data-card') === '1';
    card.hidden = !hasCard;
    var eigen = sel.value === 'eigen';
    gpx.hidden = !eigen; gpxIn.required = eigen; ride.hidden = !eigen;
  }
  sel.addEventListener('change', upd); upd();
  if (gpxIn) gpxIn.addEventListener('change', function () { readGpx(gpxIn); });
  // extra kaarten in dezelfde bestelling
  var box = document.getElementById('extraItems'), tpl = document.getElementById('itemTpl'), add = document.getElementById('addItem'), sum = document.getElementById('orderSum');
  function items() { return box ? box.querySelectorAll('.item') : []; }
  function renum() {
    var it = items();
    for (var i = 0; i < it.length; i++) it[i].querySelector('legend').textContent = 'Kaart ' + (i + 2);
    if (add) add.hidden = it.length >= (+add.getAttribute('data-max') || 4);
    total();
  }
  function cardToggle(fs) {
    var s = fs.querySelector('.item-route'), o = s.options[s.selectedIndex];
    fs.querySelector('.item-card').hidden = !(o && o.getAttribute('data-card') === '1');
  }
  function total() {
    if (!sum) return;
    var sels = [sel].concat(Array.prototype.map.call(items(), function (f) { return f.querySelector('.item-route'); }));
    var n = 0, eur = 0, known = true, ship = 0;
    sels.forEach(function (s) {
      var o = s.options[s.selectedIndex]; if (!o || !o.value) return;
      n++; var p = +o.getAttribute('data-price'); if (p) eur += p; else known = false;
      ship = +o.getAttribute('data-ship') || 0;
    });
    if (!n) { sum.textContent = ''; return; }
    var shipTxt = n >= 2 ? 'verzending gratis' : (ship ? '+ €' + ship + ' verzending' : 'gratis verzending');
    sum.innerHTML = '';
    var t = document.createElement('span'); t.textContent = n + (n === 1 ? ' kaart' : ' kaarten') + ' · ' + (known ? '€' + eur : (eur ? '€' + eur + ' + prijs eigen rit' : 'prijs volgt')) + ' · ';
    var sh = document.createElement('strong'); sh.textContent = shipTxt; sh.style.color = (n >= 2 || !ship) ? 'var(--acc)' : 'var(--mut2)'; sh.style.fontWeight = n >= 2 ? '700' : '500';
    sum.appendChild(t); sum.appendChild(sh);
  }
  if (add && tpl) add.addEventListener('click', function () {
    var fs = tpl.content.firstElementChild.cloneNode(true);
    box.appendChild(fs); renum(); fs.querySelector('.item-route').focus();
  });
  if (box) {
    box.addEventListener('change', function (e) { var fs = e.target.closest('.item'); if (fs && e.target.classList.contains('item-route')) { cardToggle(fs); total(); } });
    box.addEventListener('click', function (e) { var d = e.target.closest('.item-del'); if (d) { d.closest('.item').remove(); renum(); if (add && !add.hidden) add.focus(); } });
    Array.prototype.forEach.call(items(), cardToggle);
  }
  sel.addEventListener('change', total); renum();
  var form = document.getElementById('orderForm');
  if (form) form.addEventListener('submit', function () { var b = form.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Bezig met versturen…'; });
})();

// Tijden tonen in de tijdzone van de bezoeker
(function () {
  try {
    var f = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('time[datetime]').forEach(function (el) {
      var d = new Date(el.getAttribute('datetime'));
      if (!isNaN(d)) { el.textContent = f.format(d).replace(',', ''); el.title = Intl.DateTimeFormat().resolvedOptions().timeZone; }
    });
  } catch (e) {}
})();

// GPX direct uitlezen: lijntje, afstand, hoogtemeters en (als het erin staat) datum en rijtijd
function readGpx(input) {
  var msg = document.getElementById('gpxMsg'), box = document.getElementById('gpxPreview');
  var MAX = +input.getAttribute('data-max') || 2 * 1024 * 1024;
  var f = input.files && input.files[0];
  box.hidden = true; box.innerHTML = '';
  if (!f) { msg.textContent = ''; return; }
  if (input._slim === f) return;
  function bad(t) { msg.textContent = t; msg.style.color = 'var(--err)'; input.value = ''; }
  msg.style.color = '';
  if (!/\.gpx$/i.test(f.name)) return bad('Alleen .gpx-bestanden zijn toegestaan.');
  if (f.size > 60 * 1024 * 1024) return bad('Dit bestand is erg groot (' + mb(f.size) + '). Is het wel één rit?');
  msg.textContent = 'Bestand lezen…';
  var rd = new FileReader();
  rd.onerror = function () { bad('Dit bestand kon niet gelezen worden.'); };
  rd.onload = function () {
    var doc;
    try { doc = new DOMParser().parseFromString(String(rd.result), 'application/xml'); } catch (e) { doc = null; }
    if (!doc || doc.getElementsByTagName('parsererror').length || !doc.documentElement || doc.documentElement.localName.toLowerCase() !== 'gpx') return bad('Dit lijkt geen geldig GPX-bestand.');
    var els = doc.getElementsByTagNameNS('*', 'trkpt');
    if (els.length < 2) els = doc.getElementsByTagNameNS('*', 'rtept');
    var P = [];
    for (var i = 0; i < els.length; i++) {
      var la = parseFloat(els[i].getAttribute('lat')), lo = parseFloat(els[i].getAttribute('lon'));
      if (!(la >= -90 && la <= 90 && lo >= -180 && lo <= 180)) continue;
      var e = els[i].getElementsByTagNameNS('*', 'ele')[0], t = els[i].getElementsByTagNameNS('*', 'time')[0];
      P.push({ la: la, lo: lo, e: e ? parseFloat(e.textContent) : NaN, t: t ? Date.parse(t.textContent) : NaN });
    }
    if (P.length < 2) return bad('Er staat geen route in dit GPX-bestand.');
    var nm = doc.getElementsByTagNameNS('*', 'name')[0], name = nm ? nm.textContent.trim().slice(0, 80) : '';
    var st = stats(P);
    // te groot? dan een slanke versie maken met alleen lat/lon/hoogte/tijd
    if (f.size > MAX) {
      var slim = slimGpx(P, name, MAX);
      if (!slim || typeof DataTransfer === 'undefined') return bad('Dit bestand is groter dan ' + mb(MAX) + ' en kon niet kleiner gemaakt worden. Stuur ons gerust een mail via de bestelling.');
      try {
        var dt = new DataTransfer(), nf = new File([slim], f.name.replace(/\.gpx$/i, '') + '.gpx', { type: 'application/gpx+xml' });
        dt.items.add(nf); input._slim = nf; input.files = dt.files;
        msg.textContent = f.name + ': ' + mb(f.size) + ' → ' + kb(nf.size) + '. Je route blijft hetzelfde, alleen extra data zoals hartslag is eruit.';
      } catch (x) { return bad('Dit bestand is groter dan ' + mb(MAX) + '.'); }
    } else {
      msg.textContent = f.name + ' (' + kb(f.size) + ') is klaar om te versturen.';
    }
    draw(box, P, st, name);
    prefill(st, name);
  };
  rd.readAsText(f);
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
function draw(box, P, st, name) {
  var NS = 'http://www.w3.org/2000/svg', n = P.length, k = Math.max(1, Math.floor(n / 1500));
  var la0 = 0; for (var i = 0; i < n; i++) la0 += P[i].la; la0 /= n;
  var cx = Math.cos(la0 * Math.PI / 180), minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, Q = [];
  for (i = 0; i < n; i += k) Q.push(P[i]); if (Q[Q.length - 1] !== P[n - 1]) Q.push(P[n - 1]);
  Q.forEach(function (p) { var x = p.lo * cx, y = -p.la; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; });
  var W = 600, H = 340, pad = 18, sc = Math.min((W - 2 * pad) / Math.max(1e-9, maxX - minX), (H - 2 * pad) / Math.max(1e-9, maxY - minY));
  var ox = (W - (maxX - minX) * sc) / 2, oy = (H - (maxY - minY) * sc) / 2;
  var pt = function (p) { return [ox + (p.lo * cx - minX) * sc, oy + (-p.la - minY) * sc]; };
  var d = Q.map(function (p, j) { var a = pt(p); return (j ? 'L' : 'M') + a[0].toFixed(1) + ' ' + a[1].toFixed(1); }).join('');
  var a = pt(P[0]), b = pt(P[n - 1]);
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Je route op de kaart" class="gpxmap"><path d="' + d + '" fill="none" stroke="#FF6A2B" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<circle cx="' + b[0].toFixed(1) + '" cy="' + b[1].toFixed(1) + '" r="6" fill="#0E1311" stroke="#EDE8DC" stroke-width="2.5"/><circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="6" fill="#7FD1AE" stroke="#0E1311" stroke-width="2"/></svg>';
  // hoogteprofiel
  var prof = '', E = [];
  for (i = 0; i < n; i += k) if (!isNaN(P[i].e)) E.push([st.cum[i], P[i].e]);
  if (E.length > 5) {
    var eMin = Math.min.apply(null, E.map(function (x) { return x[1]; })), eMax = Math.max.apply(null, E.map(function (x) { return x[1]; })), tot = st.cum[n - 1] || 1, PH = 70;
    var rng = Math.max(20, eMax - eMin);
    var pd = E.map(function (x, j) { return (j ? 'L' : 'M') + (x[0] / tot * W).toFixed(1) + ' ' + (PH - 4 - (x[1] - eMin) / rng * (PH - 10)).toFixed(1); }).join('');
    prof = '<svg viewBox="0 0 ' + W + ' ' + PH + '" preserveAspectRatio="none" aria-hidden="true" class="gpxprof"><path d="' + pd + 'L' + W + ' ' + PH + 'L0 ' + PH + 'Z" fill="rgba(255,106,43,.18)"/><path d="' + pd + '" fill="none" stroke="#FF6A2B" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>' +
      '<div class="gpxprof-l"><span>' + Math.round(eMin) + ' m</span><span>hoogste punt ' + Math.round(eMax) + ' m</span></div>';
  }
  var fmtD = function (dt) { return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); };
  var cells = [['AFSTAND', st.km.toLocaleString('nl-NL', { maximumFractionDigits: st.km < 100 ? 1 : 0 }) + ' km']];
  if (st.up !== null) cells.push(['HOOGTEMETERS', '± ' + Math.round(st.up).toLocaleString('nl-NL') + ' hm']);
  if (st.t0) cells.push(['DATUM', fmtD(st.t0) + (st.t1 && st.t1.toDateString() !== st.t0.toDateString() ? ' – ' + fmtD(st.t1) : '')]);
  if (st.mov) cells.push(['RIJTIJD', hms(st.mov)]);
  cells.push(['PUNTEN', n.toLocaleString('nl-NL')]);
  var ttl = document.createElement('p'); ttl.className = 'gpxprev-t';
  ttl.textContent = name ? '“' + name + '”' : 'Je route';
  box.innerHTML = svg + prof + '<dl class="gpxstats">' + cells.map(function (c) { return '<div><dt>' + c[0] + '</dt><dd>' + c[1] + '</dd></div>'; }).join('') + '</dl>' +
    '<p class="small muted" style="margin:10px 0 0"><span class="dot dot-s"></span> start <span class="dot dot-f"></span> finish · Klopt dit met je rit? Dan heb je het goede bestand.</p>';
  box.insertBefore(ttl, box.firstChild);
  box.hidden = false;
}
function hms(s) { s = Math.round(s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function prefill(st, name) {
  var set = function (n, v) { var el = document.querySelector('[name="' + n + '"]'); if (el && !el.value && v) { el.value = v; el.classList.add('filled'); } };
  set('ride_name', name);
  if (st.t0) { set('start_date', ymd(st.t0)); set('end_date', ymd(st.t1 || st.t0)); }
  if (st.mov) set('ride_time', hms(st.mov));
  var box = document.getElementById('gpxPreview');
  if (box && document.querySelector('input.filled[name$="_date"], input.filled[name="ride_time"]')) {
    var n = document.createElement('p'); n.className = 'small muted'; n.style.margin = '6px 0 0';
    n.textContent = 'Datum en rijtijd voor het ritkaartje hebben we alvast uit je GPX ingevuld. Pas ze gerust aan.';
    box.appendChild(n);
  }
}

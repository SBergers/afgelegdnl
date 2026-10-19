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
  if (gpxIn) gpxIn.addEventListener('change', function () {
    var f = gpxIn.files && gpxIn.files[0], msg = document.getElementById('gpxMsg');
    if (!f) { msg.textContent = ''; return; }
    if (!/\.gpx$/i.test(f.name)) { msg.textContent = 'Alleen .gpx-bestanden zijn toegestaan.'; gpxIn.value = ''; return; }
    if (f.size > 10 * 1024 * 1024) { msg.textContent = 'Dit bestand is groter dan 10 MB.'; gpxIn.value = ''; return; }
    msg.textContent = f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + ' kB) is klaar om te versturen.';
  });
  var form = document.getElementById('orderForm');
  if (form) form.addEventListener('submit', function () { var b = form.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Bezig met versturen…'; });
})();

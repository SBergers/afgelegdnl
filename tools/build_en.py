"""Maakt en/index.html uit index.html. Draai dit na elke wijziging aan index.html:
    python3 tools/build_en.py
Elke Nederlandse zin moet precies gevonden worden; anders stopt het script (dan mist er een vertaling)."""
import json, re, html as H, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
import hashlib
src = (ROOT / "index.html").read_text()
# cache-versie van site.js = hash van de inhoud, zodat browsers en Cloudflare altijd de nieuwste code laden
ver = hashlib.md5((ROOT / "site.js").read_bytes()).hexdigest()[:10]
src = re.sub(r'site\.js\?v=[0-9a-f]+', 'site.js?v=' + ver, src)
(ROOT / "index.html").write_text(src)

PAIRS = [
 ('<html lang="nl">', '<html lang="en">'),
 ('<title>3D-geprinte routekaarten met echt reliëf – MTB &amp; gravel | afgelegd.</title>', '<title>3D-printed route maps with real relief – MTB, gravel &amp; road | afgelegd.</title>'),
 ('<link rel="canonical" href="https://afgelegd.nl/">', '<link rel="canonical" href="https://afgelegd.nl/en/">'),
 ('<meta property="og:locale" content="nl_NL">', '<meta property="og:locale" content="en_GB">\n<meta property="og:locale:alternate" content="nl_NL">'),
 ('<meta property="og:url" content="https://afgelegd.nl/">', '<meta property="og:url" content="https://afgelegd.nl/en/">'),
 ('<meta property="og:title" content="afgelegd. – 3D-geprinte routekaarten met echt reliëf">', '<meta property="og:title" content="afgelegd. – 3D-printed route maps with real relief">'),
 ('<meta property="og:description" content="Elke meter die je hebt afgelegd, in je hand. MTB-, gravel- en wielrenroutes als 3D-print, met jouw eigen rijtijd erop.">', '<meta property="og:description" content="Every metre you have ridden, in your hands. MTB, gravel and road routes as a 3D print, with your own ride time on it.">'),
 ('href="favicon.png"', 'href="../favicon.png"'), ('href="apple-touch-icon.png"', 'href="../apple-touch-icon.png"'),
 ('<nav aria-label="Hoofdmenu"', '<nav aria-label="Main menu"'),
 ('<img src="logo.svg"', '<img src="../logo.svg"'),
 ('<a class="navlink hide-sm" href="#werkwijze">Zo werkt het</a>', '<a class="navlink hide-sm" href="#werkwijze">How it works</a>'),
 ('<a class="navlink hide-sm" href="#vragen">Vragen</a>', '<a class="navlink hide-sm" href="#vragen">FAQ</a>'),
 ('<a class="navlink lang" href="en/" hreflang="en" lang="en" aria-label="English">EN</a>', '<a class="navlink lang" href="../" hreflang="nl" lang="nl" aria-label="Nederlands">NL</a>'),
 ('style="padding:12px 20px;min-height:44px">Bestellen</a>', 'style="padding:12px 20px;min-height:44px">Order</a>'),
 ('3D-GEPRINTE ROUTES · MET ECHT RELIËF', '3D-PRINTED ROUTES · WITH REAL RELIEF'),
 ('Elke meter die je hebt <span style="color:var(--acc)">afgelegd</span>, in je hand.', 'Every metre you have <span style="color:var(--acc)">ridden</span>, in your hands.'),
 ('Wij maken van je fiets-, gravel- of MTB-route een tastbaar landschap. Met de echte hoogtemeters, elke bocht en die ene klim die je nooit meer vergeet.', 'We turn your road, gravel or MTB route into a landscape you can hold. With the real elevation, every bend and that one climb you will never forget.'),
 ('>Bekijk de routes <svg', '>See the routes <svg'),
 ('BEKIJK DE COLLECTIE · <span class="tcount"></span> KAARTEN', 'SEE THE COLLECTION · <span class="tcount"></span> MAPS'),
 ('aria-label="Kaarten in de collectie"', 'aria-label="Maps in the collection"'),
 ('aria-label="Scroll naar alle kaarten"><span>Scroll voor alle kaarten</span>', 'aria-label="Scroll to all maps"><span>Scroll for all maps</span>'),
 ('>Jouw eigen rit laten printen</a>', '>Print your own ride</a>'),
 ('src="img/hero.webp" srcset="img/hero-800.webp 800w, img/hero.webp 1600w"', 'src="../img/hero.webp" srcset="../img/hero-800.webp 800w, ../img/hero.webp 1600w"'),
 ('alt="De geprinte 3D-kaart van MTB Rijk van Nijmegen, met de vier routes in rood, paars, blauw en groen"', 'alt="The printed 3D map of MTB Rijk van Nijmegen, with its four routes in red, purple, blue and green"'),
 ('<span class="chip">± 800 HOOGTEMETERS</span>', '<span class="chip">± 800 M ELEVATION</span>'),
 ('LAAG VOOR LAAG GEPRINT ✦ ECHTE HOOGTEDATA ✦ JOUW EIGEN RIT ✦ HET PERFECTE CADEAU NA DIE ENE PRESTATIE ✦', 'PRINTED LAYER BY LAYER ✦ REAL ELEVATION DATA ✦ YOUR OWN RIDE ✦ THE PERFECT GIFT AFTER THAT ONE BIG RIDE ✦'),
 ('DE COLLECTIE · <span id="count"></span> ROUTES', 'THE COLLECTION · <span id="count"></span> ROUTES'),
 ('MTB-gebieden, legendarische gravelroutes en klassiekers op de weg.', 'MTB areas, legendary gravel routes and road classics.'),
 ('>Alle kaarten</h3>', '>All maps</h3>'),
 ('Klik op een kaart om hem hierboven te bekijken.', 'Click a map to view it above.'),
 ('aria-label="Filter op soort"', 'aria-label="Filter by type"'),
 ('<div class="eyebrow">ZO WERKT HET</div>', '<div class="eyebrow">HOW IT WORKS</div>'),
 ('Van GPS-spoor naar landschap op je bureau.', 'From GPS track to a landscape on your desk.'),
 ('<h3>Kies jouw rit</h3>', '<h3>Choose your ride</h3>'),
 ('Kies een route uit de collectie, of upload je eigen GPX en geef hem een naam: je eerste marathon, die ene beklimming of gewoon je vaste rondje.', 'Pick a route from the collection, or upload your own GPX and give it a name: your first marathon, that one climb or simply your regular loop.'),
 ('<h3>Samen maken we het ontwerp</h3>', '<h3>We design it together</h3>'),
 ('We koppelen je rit aan echte hoogtedata en maken een eerste ontwerp. Jij kijkt mee, wij schaven bij, tot het echt jouw kaart is. Pas als jij tevreden bent, gaan we printen.', 'We match your ride to real elevation data and make a first design. You take a look, we fine-tune it until it really is your map. We only print once you are happy.'),
 ('<h3>Laag voor laag geprint</h3>', '<h3>Printed layer by layer</h3>'),
 ('Je kaart wordt in honderden dunne laagjes opgebouwd, met je route in een opvallende kleur. Klaar om te geven, of om zelf te bewonderen.', 'Your map is built up from hundreds of thin layers, with your route in a bold colour. Ready to give as a gift, or to admire yourself.'),
 ('<div class="eyebrow">VEELGESTELDE VRAGEN</div>', '<div class="eyebrow">FREQUENTLY ASKED QUESTIONS</div>'),
 ('>Goed om te weten.</h2>', '>Good to know.</h2>'),
 ('<summary>Wanneer wordt mijn kaart verzonden?</summary><p>Elke kaart wordt op bestelling voor je gemaakt. Een route uit de collectie wordt binnen 3 tot 5 werkdagen na je bestelling verzonden. Voor een kaart van je eigen rit maken we eerst een voorbeeld; dat heb je binnen 1 tot 3 werkdagen. Keur je het goed, dan wordt je kaart binnen 3 tot 5 werkdagen verzonden. De bezorging zelf gebeurt door de vervoerder en komt daar nog bij; je krijgt een track-and-tracecode zodat je je pakket kunt volgen. Je hoort altijd binnen 24 uur van ons.</p>',
  '<summary>When will my map be shipped?</summary><p>Every map is made to order. A route from the collection ships within 3 to 5 working days of your order. For a map of your own ride we first make a preview, which you get within 1 to 3 working days. Once you approve it, your map ships within 3 to 5 working days. Delivery by the carrier comes on top of that; you get a tracking code so you can follow your parcel. You always hear from us within 24 hours.</p>'),
 ('<summary>Wat kost een kaart?</summary><p>MTB-gebieden en routes op één plaat, zoals Rijk van Nijmegen en de Geile Strecke, kosten €45. De grote kaarten, zoals de Green, Brown en Dutch Divide, de Elfstedentocht en de Amstel Gold Race, kosten €55. De extra brede kaarten, de Utrechtse Heuvelrug en de TransBelgian (47 cm), kosten €65. Voor je eigen rit krijg je vooraf een prijs. Verzending binnen Nederland kost €5 per bestelling; kaarten die nog alleen als 3D-render te zien zijn, versturen we gratis. Naar België, Duitsland en Luxemburg komt er €5 bij, dus meestal €10.</p>',
  '<summary>How much does a map cost?</summary><p>MTB areas and routes on a single plate, such as Rijk van Nijmegen and the Geile Strecke, cost €45. The large maps, such as the Green, Brown and Dutch Divide, the Elfstedentocht and the Amstel Gold Race, cost €55. The extra-wide maps, the Utrechtse Heuvelrug and the TransBelgian (47 cm), cost €65. For your own ride you get a price up front. Shipping within the Netherlands is €5 per order; maps that are only shown as a 3D render ship for free. Shipping to Belgium, Germany and Luxembourg costs €5 extra, so usually €10.</p>'),
 ('<summary>Waarom krijg ik gratis verzending?</summary><p>Dat kan om twee redenen:</p><ul><li><strong>Je bestelt twee of meer kaarten in één bestelling.</strong> Ze gaan samen in één pakket, dus de verzending is dan gratis. Voeg in het bestelformulier gewoon een extra kaart toe.</li><li><strong>De kaart is nog niet eerder geprint.</strong> Van zo’n kaart zie je op de site nog een 3D-render in plaats van een foto, en die versturen we gratis. Lees bij <a href="#faq-render">waarom zie ik bij sommige kaarten een 3D-render</a> hoe dat zit.</li></ul><p>Gratis verzending geldt binnen Nederland. Naar België, Duitsland of Luxemburg betaal je altijd €5 voor de extra verzendkosten.</p>',
  '<summary>Why do I get free shipping?</summary><p>There are two reasons:</p><ul><li><strong>You order two or more maps in one order.</strong> They travel together in one parcel, so shipping is free. Just add another map in the order form.</li><li><strong>The map has not been printed before.</strong> For such a map the site still shows a 3D render instead of a photo, and we ship it for free. See <a href="#faq-render">why some maps show a 3D render</a> for the details.</li></ul><p>Free shipping applies within the Netherlands. Shipping to Belgium, Germany or Luxembourg always costs €5 for the extra postage.</p>'),
 ('<summary>Kan ik mijn eigen rit laten printen?</summary><p>Ja. Upload je GPX-bestand in het bestelformulier (exporteren kan in bijvoorbeeld Strava, Komoot of Garmin Connect). Binnen 24 uur nemen we contact met je op. We koppelen je rit aan echte hoogtedata en sturen je eerst een voorbeeld voordat we printen. Dat voorbeeld heb je binnen 1 tot 3 werkdagen. Na je akkoord wordt je kaart binnen 3 tot 5 werkdagen verzonden.</p>',
  '<summary>Can I have my own ride printed?</summary><p>Yes. Upload your GPX file in the order form (you can export it from Strava, Komoot or Garmin Connect, for example). We get in touch within 24 hours. We match your ride to real elevation data and send you a preview before we print. You get that preview within 1 to 3 working days. Once you approve it, your map ships within 3 to 5 working days.</p>'),
 ('<summary>Hoe werkt het ritkaartje?</summary><p>Bij gravel- en wielrenroutes hoort een los ritkaartje dat in de kaart valt, met jouw datum en totale rijtijd. Hierboven bij de uitgelichte route zie je meteen hoe het eruitziet.</p>',
  '<summary>How does the ride card work?</summary><p>Gravel and road routes come with a separate ride card that slots into the map, showing your date and total ride time. You can see straight away what it looks like with the featured route above.</p>'),
 ('<summary>Waarom zie ik bij sommige kaarten een 3D-render in plaats van een foto?</summary><p>Elke kaart wordt pas geprint als jij hem bestelt. Zo krijg je altijd een vers, speciaal voor jou gemaakt exemplaar, en liggen er geen kaarten te verstoffen die niemand wil hebben (dat scheelt ook een hoop materiaal). Van routes die nog niet eerder besteld zijn, laten we daarom een 3D-render zien. Die is rechtstreeks gemaakt van het printbestand, dus wat je ziet is precies wat je krijgt. Zodra een kaart voor het eerst geprint is, komen er echte foto\'s bij. Bestel je een kaart die nog alleen als render te zien is, dan versturen we hem gratis.</p>',
  '<summary>Why do some maps show a 3D render instead of a photo?</summary><p>Every map is only printed once you order it. That way you always get a fresh copy made just for you, and no maps sit gathering dust that nobody wants (which also saves a lot of material). For routes that have not been ordered before, we therefore show a 3D render. It is made directly from the print file, so what you see is exactly what you get. As soon as a map is printed for the first time, real photos are added. If you order a map that is only shown as a render, we ship it for free.</p>'),
 ('<summary>Kan ik de kaart ophangen?</summary><p>Ja. Aan de achterkant zitten sleutelgaten, dus je hangt hem met een of twee schroeven aan de muur. Neerzetten op een vensterbank of plank kan natuurlijk ook.</p>',
  '<summary>Can I hang the map on the wall?</summary><p>Yes. There are keyholes on the back, so you can hang it on the wall with one or two screws. Of course you can also stand it on a windowsill or shelf.</p>'),
 ('<summary>Kan ik de kleuren kiezen?</summary><p>We denken graag mee. Elke route heeft een standaard kleurenschema, maar een andere routekleur of een ander landschap is vaak mogelijk.</p>',
  '<summary>Can I choose the colours?</summary><p>Happy to help. Every route has a standard colour scheme, but a different route colour or landscape is often possible.</p>'),
 ('letter-spacing:.14em;color:var(--acc);margin-bottom:14px">BESTELLEN</div>', 'letter-spacing:.14em;color:var(--acc);margin-bottom:14px">ORDER</div>'),
 ('>Bestel direct online.</h2>', '>Order online.</h2>'),
 ('Log in met je e-mailadres, kies je route of upload je eigen GPX-bestand, en volg je bestelling stap voor stap. Je betaalt pas als wij je bestelling hebben bevestigd, en binnen 24 uur hoor je van ons.', 'Log in with your email address, choose your route or upload your own GPX file, and follow your order step by step. You only pay once we have confirmed your order, and you hear from us within 24 hours.'),
 ('style="border-radius:16px;font-size:16px;min-height:52px;padding:14px 22px">Bestel een kaart</a>', 'style="border-radius:16px;font-size:16px;min-height:52px;padding:14px 22px">Order a map</a>'),
 ('lang=nl"', 'lang=en"'),
 ('padding:14px 22px">Eigen rit laten printen</a>', 'padding:14px 22px">Print your own ride</a>'),
 ('padding:14px 22px">Mijn bestellingen</a>', 'padding:14px 22px">My orders</a>'),
 ('<a class="navlink" href="#werkwijze">Zo werkt het</a><a class="navlink" href="#vragen">Vragen</a>', '<a class="navlink" href="#werkwijze">How it works</a><a class="navlink" href="#vragen">FAQ</a>'),
 ('<script src="site.js?v=', '<script src="../site.js?v='),
]
out = src
for nl, en in PAIRS:
    n = out.count(nl)
    if n == 0:
        raise SystemExit("Niet gevonden (vertaling bijwerken!): " + nl[:90])
    out = out.replace(nl, en)

# meta description
out = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Your road, gravel or MTB route as a 3D-printed relief map with real elevation data. Choose a route such as the Amstel Gold Race, the Elfstedentocht or the Geile Strecke, or have your own GPX printed – with your own ride time on it.">', out, count=1)
# noscript-lijst
out = out.replace('(Wielrennen)', '(Road)').replace(' naar ', ' to ').replace(', wintervariant', ', winter version').replace('Rondje vanuit Drouwen, Drenthe', 'Loop from Drouwen, Drenthe').replace('Van Hoge Vuursche tot Rhenen', 'From Hoge Vuursche to Rhenen').replace('Nijmegen, Groesbeek, Mook en Malden', 'Nijmegen, Groesbeek, Mook and Malden').replace('Ede, Lunteren, Otterlo en Arnhem', 'Ede, Lunteren, Otterlo and Arnhem').replace('Zuid-Limburg, 129 km', 'South Limburg, 129 km').replace('Oostende to Eupen', 'Ostend to Eupen').replace('11 steden', '11 cities')

# JSON-LD: Engelse versie
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', out, re.S)
d = json.loads(m.group(1))
for blk in d:
    t = blk.get("@type")
    if t == "WebSite":
        blk["url"] = "https://afgelegd.nl/en/"; blk["inLanguage"] = "en"
    if t == "ItemList":
        blk["name"] = "3D-printed route maps"
        for li in blk["itemListElement"]:
            it = li["item"]
            it["name"] = it["name"].replace("3D-kaart ", "3D map ")
            desc = it["description"]
            desc = (desc.replace("MTB-route", "MTB route").replace("Gravel-route", "Gravel route").replace("Wielren-route", "Road route")
                    .replace(", 3D-geprint met echt reliëf. Formaat ", ", 3D-printed with real relief. Size ").replace(" naar ", " to ")
                    .replace("de Fietselfstedentocht", "the Fietselfstedentocht").replace("de toerversie van de Amstel Gold Race", "the Amstel Gold Race sportive")
                    .replace("langs alle elf Friese steden", "past all eleven Frisian cities").replace(", wintervariant", ", winter version")
                    .replace("Rondje vanuit Drouwen", "Loop from Drouwen").replace("Van Hoge Vuursche tot Rhenen", "From Hoge Vuursche to Rhenen")
                    .replace(" en ", " and ").replace("Zuid-Limburg", "South Limburg").replace("Oostende", "Ostend"))
            it["description"] = desc
            it["url"] = it["url"].replace("https://afgelegd.nl/?", "https://afgelegd.nl/en/?")
            it["offers"]["url"] = it["url"]
    if t == "FAQPage":
        qs = []
        for q, a in re.findall(r'<summary>(.*?)</summary>(.*?)</details>', out, re.S):
            txt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", a)).strip().replace(" .", ".").replace(" ,", ",")
            qs.append({"@type": "Question", "name": H.unescape(q), "acceptedAnswer": {"@type": "Answer", "text": H.unescape(txt)}})
        blk["mainEntity"] = qs
out = out[:m.start(1)] + json.dumps(d, ensure_ascii=False) + out[m.end(1):]

leftover = [w for w in (" je ", " jouw ", " wij ", " kaart ", "Bestel", "verzending", "werkdagen") if w in re.sub(r'<script.*?</script>', '', out, flags=re.S)]
if leftover:
    print("LET OP, mogelijk nog Nederlands:", leftover)
(ROOT / "en").mkdir(exist_ok=True)
(ROOT / "en" / "index.html").write_text(out)
print("en/index.html geschreven")

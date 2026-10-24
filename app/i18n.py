"""Vertalingen voor het bestelportaal. De Nederlandse tekst is de sleutel; ontbreekt een vertaling, dan blijft hij Nederlands.
Gebruik: _("Kies een route voor {wat}.", wat=...)."""
import contextvars
from contextlib import contextmanager

LANGS = ("nl", "en")
_lang = contextvars.ContextVar("lang", default="nl")


def get_lang() -> str:
    return _lang.get()


def set_lang(lang: str):
    _lang.set(lang if lang in LANGS else "nl")


@contextmanager
def lang_ctx(lang):
    tok = _lang.set(lang if lang in LANGS else "nl")
    try:
        yield
    finally:
        _lang.reset(tok)


def _(s, **kw):
    if s is None:
        return ""
    out = EN.get(s, s) if _lang.get() == "en" else s
    return out.format(**kw) if kw else out


EN = {
    # algemeen
    "Mijn bestellingen": "My orders", "Uitloggen": "Log out", "Privacy": "Privacy", "Terug": "Back",
    "Er ging iets mis": "Something went wrong",
    # inloggen
    "Inloggen": "Log in", "BESTELLEN": "ORDER", "Inloggen of account maken": "Log in or create an account",
    "Vul je e-mailadres in. Je krijgt een code per mail om in te loggen. Een wachtwoord is niet nodig. Ben je hier nog nooit geweest? Dan maken we automatisch een account voor je aan.":
        "Enter your email address. You will receive a code by email to log in. No password needed. Never been here before? We will create an account for you automatically.",
    "E-mailadres": "Email address", "Stuur mij een inlogcode": "Send me a login code",
    "We gebruiken je e-mailadres alleen voor je bestelling.": "We only use your email address for your order.",
    "Lees ons": "Read our", "privacybeleid": "privacy policy",
    "Code invullen": "Enter code", "CHECK JE MAIL": "CHECK YOUR EMAIL", "Vul je code in": "Enter your code",
    "We hebben een code van 6 cijfers gestuurd naar": "We have sent a 6-digit code to",
    "Vul de code in die we je gemaild hebben.": "Enter the code we emailed you.",
    "Hij is 10 minuten geldig. Niets ontvangen? Kijk ook even in je spammap.": "It is valid for 10 minutes. Nothing received? Please check your spam folder too.",
    "Inlogcode": "Login code", "Nieuwe code aanvragen of ander e-mailadres gebruiken": "Request a new code or use a different email address",
    "Vul een geldig e-mailadres in.": "Please enter a valid email address.",
    "Te veel pogingen. Probeer het over een kwartier opnieuw.": "Too many attempts. Please try again in 15 minutes.",
    "Te veel pogingen. Probeer het later opnieuw.": "Too many attempts. Please try again later.",
    "Deze code is verlopen of te vaak fout ingevuld. Vraag een nieuwe code aan.": "This code has expired or was entered incorrectly too often. Please request a new code.",
    "Die code klopt niet. Controleer je mail en probeer het opnieuw.": "That code is not correct. Check your email and try again.",
    "Je inlogcode voor afgelegd.: {code}": "Your login code for afgelegd.: {code}",
    "Hoi!\n\nJe inlogcode is: {code}\n\nDeze code is 10 minuten geldig. Heb je niet geprobeerd in te loggen? Dan kun je deze mail negeren.":
        "Hi!\n\nYour login code is: {code}\n\nThis code is valid for 10 minutes. Did not try to log in? Then you can ignore this email.",
    # overzicht
    "Nieuwe bestelling": "New order", "Nog geen bestellingen": "No orders yet",
    "Kies een route uit de collectie of stuur je eigen GPX-bestand. Binnen 24 uur hoor je van ons.": "Choose a route from the collection or send your own GPX file. You will hear from us within 24 hours.",
    "Plaats je eerste bestelling": "Place your first order", "wacht op jou": "waiting for you",
    # stappen
    "Status van je bestelling": "Status of your order", "Aanvraag": "Request", "Bestelling ontvangen": "Order received",
    "Voorstel": "Proposal", "Akkoord klant": "Approved", "Betaling": "Payment", "Klaar voor productie": "Ready for production",
    "Wacht op verzenden": "Waiting to ship", "Verzonden": "Shipped", "Afgerond": "Completed", "Geannuleerd": "Cancelled",
    # routes
    "Eigen rit (GPX)": "Your own ride (GPX)", "Eigen rit": "Own ride",
    # formulier
    "NIEUWE BESTELLING": "NEW ORDER", "Wat mogen we voor je maken?": "What can we make for you?",
    "Vul hieronder je bestelling in. Je betaalt nu nog niets. Binnen 24 uur sturen we je een betaallink; zodra je betaald hebt, gaan we voor je printen. Bestel je een kaart van je eigen rit? Dan krijg je eerst een voorstel om goed te keuren.":
        "Fill in your order below. You do not pay anything yet. Within 24 hours we send you a payment link; once you have paid, we start printing. Ordering a map of your own ride? Then you first get a proposal to approve.",
    "Wat wil je bestellen?": "What would you like to order?", "Nog een kaart toevoegen": "Add another map",
    "Kaart": "Map", "Kaarten": "Maps", "Deze kaart verwijderen": "Remove this map", "Verwijderen": "Remove", "Route": "Route",
    "Kies een route…": "Choose a route…", "prijs volgt": "price to follow",
    "Naam van je rit (optioneel)": "Name of your ride (optional)", "Bijvoorbeeld: Marmotte 2026": "For example: Marmotte 2026",
    "GPX-bestand": "GPX file", "Kies je GPX-bestand opnieuw.": "Please choose your GPX file again.",
    "Alleen .gpx-bestanden. Is je bestand groter dan 2 MB? Dan maken we het hier eerst kleiner, zonder dat je route verandert.":
        "Only .gpx files. Is your file larger than 2 MB? Then we make it smaller here first, without changing your route.",
    "Zo exporteer je je rit uit": "How to export your ride from", "of": "or",
    "Ritkaartje: deze gegevens komen op het losse kaartje in de kaart. Laat leeg als je geen kaartje wilt.":
        "Ride card: these details go on the separate card that slots into the map. Leave empty if you do not want a card.",
    "Eerste dag": "First day", "Laatste dag": "Last day", "Totale rijtijd": "Total ride time", "uu:mm:ss": "hh:mm:ss",
    "Bezorgadres": "Delivery address", "Naam": "Name", "Telefoon (optioneel)": "Phone (optional)",
    "Straat en huisnummer": "Street and house number", "Postcode": "Postcode", "Woonplaats": "Town/city", "Land": "Country",
    "Nederland": "Netherlands", "Opmerkingen": "Notes",
    "Wensen, vragen of een cadeauboodschap (optioneel)": "Wishes, questions or a gift message (optional)",
    "Aanvraag versturen": "Send request",
    # foutmeldingen formulier
    "Kies wat je wilt bestellen.": "Please choose what you would like to order.",
    "kaart {n}": "map {n}", "je kaart": "your map",
    "Kies een route voor {wat}.": "Please choose a route for {wat}.",
    "Vul een geldige datum in bij {wat}.": "Please enter a valid date for {wat}.",
    "Vul de rijtijd bij {wat} in als uu:mm:ss, bijvoorbeeld 10:42:35.": "Please enter the ride time for {wat} as hh:mm:ss, for example 10:42:35.",
    "je naam": "your name", "je straat en huisnummer": "your street and house number", "je postcode": "your postcode", "je woonplaats": "your town/city",
    "Vul {lab} in.": "Please enter {lab}.",
    "Je hebt vandaag al veel aanvragen gedaan. Stuur ons een DM als er iets niet lukt.": "You have already made a lot of requests today. Send us a DM if something is not working.",
    "Voeg het GPX-bestand toe voor {wat}, dan kunnen we je eigen rit maken.": "Please add the GPX file for {wat}, so we can make your own ride.",
    "Alleen .gpx-bestanden zijn toegestaan ({wat}).": "Only .gpx files are allowed ({wat}).",
    "Het GPX-bestand van {wat} is te groot (maximaal 2 MB).": "The GPX file for {wat} is too large (maximum 2 MB).",
    "Het bestand is leeg.": "The file is empty.", "Dit bestand bevat onveilige onderdelen.": "This file contains unsafe content.",
    "Dit is geen geldig GPX-bestand.": "This is not a valid GPX file.", "Dit is geen GPX-bestand.": "This is not a GPX file.",
    "Het GPX-bestand bevat ongeldige coördinaten.": "The GPX file contains invalid coordinates.",
    "Er staat geen route in dit GPX-bestand.": "There is no route in this GPX file.",
    "Deze pagina is verlopen. Ga terug en probeer het opnieuw.": "This page has expired. Go back and try again.",
    "Bestelling niet gevonden.": "Order not found.", "Bestand niet gevonden.": "File not found.", "Pagina niet gevonden.": "Page not found.",
    "Even rustig aan, probeer het straks opnieuw.": "Slow down a little, please try again shortly.",
    "Deze bestelling wacht niet op je akkoord.": "This order is not waiting for your approval.",
    "Deze bestelling kun je niet meer zelf annuleren. Stuur ons een bericht, dan kijken we wat er kan.": "You can no longer cancel this order yourself. Send us a message and we will see what we can do.",
    "Deze bestelling is niet geannuleerd.": "This order is not cancelled.",
    # bestelpagina
    "Bestelling": "Order", "BESTELLING": "ORDER",
    "Bedankt! We hebben je aanvraag ontvangen en je krijgt een bevestiging per mail. Binnen 24 uur hoor je van ons.": "Thank you! We have received your request and you will get a confirmation by email. You will hear from us within 24 hours.",
    "Deze bestelling is geannuleerd": "This order has been cancelled",
    "Wil je toch verder? Heropen de bestelling, dan gaan we verder waar we gebleven waren.": "Want to continue after all? Reopen the order and we will pick up where we left off.",
    "Bestelling heropenen": "Reopen order", "Je voorstel staat klaar": "Your proposal is ready",
    "Bekijk het voorbeeld en de details hieronder. Is alles goed? Geef dan je akkoord, dan gaan we voor je printen. Wil je iets anders? Stuur ons een bericht onderaan de pagina.":
        "Have a look at the preview and the details below. All good? Then give your approval and we will start printing. Want something different? Send us a message at the bottom of the page.",
    "Ik ga akkoord": "I approve", "Tijd om te betalen": "Time to pay", "Betaal": "Pay", "verzending": "shipping",
    "via de knop hieronder. Zodra je betaling binnen is, zetten we je kaart klaar voor productie.": "using the button below. As soon as your payment is in, we get your map ready for production.",
    "We sturen je zo snel mogelijk een betaallink. Je krijgt hem ook per mail.": "We will send you a payment link as soon as possible. You will also get it by email.",
    "Voorbeeld": "Preview", "Voorbeeld van je kaart": "Preview of your map", "Details": "Details", "Prijs": "Price", "volgt": "to follow",
    "gratis verzending": "free shipping", "punten": "points", "Ritkaartje": "Ride card", "t/m": "to",
    "Berichten en updates": "Messages and updates", "jij": "you", "Bericht sturen": "Send a message", "Versturen": "Send",
    "Bestelling annuleren": "Cancel order",
    "Toch niet nodig? Je kunt annuleren zolang je nog niet betaald hebt. Bedenk je je later, dan kun je de bestelling weer heropenen.":
        "Not needed after all? You can cancel as long as you have not paid yet. If you change your mind later, you can reopen the order.",
    "Heb je al betaald? Annuleer dan niet, maar stuur ons een bericht: na betaling gaan we direct voor je printen. Betaal je niet binnen 4 dagen, dan annuleren we de bestelling automatisch.":
        "Already paid? Then do not cancel, but send us a message: after payment we start printing straight away. If you do not pay within 4 days, we cancel the order automatically.",
    "Ja, annuleer mijn bestelling": "Yes, cancel my order",
    # tijdlijn (systeemregels)
    "Aanvraag ontvangen.": "Request received.", "Klant is akkoord met het voorstel.": "Customer approved the proposal.",
    "Bestelling geannuleerd.": "Order cancelled.", "Automatisch geannuleerd: 4 dagen niet betaald.": "Cancelled automatically: not paid within 4 days.",
    "Bestelling heropend.": "Order reopened.", "Bestelling heropend door afgelegd.nl.": "Order reopened by afgelegd.nl.",
    # mails
    "Hoi {name},": "Hi {name},",
    "We hebben je aanvraag ontvangen (#{oid})": "We have received your request (#{oid})",
    "Bedankt voor je aanvraag voor: {names}.\nBinnen 24 uur hoor je van ons. Je kunt de status altijd volgen op:\n{link}":
        "Thank you for your request for: {names}.\nYou will hear from us within 24 hours. You can always follow the status at:\n{link}",
    "Je bestelling #{oid} is geannuleerd": "Your order #{oid} has been cancelled",
    "Wat jammer dat we er deze keer niet uitgekomen zijn! We hebben je bestelling #{oid} ({title}) direct geannuleerd. Je hoeft niets meer te betalen.\n\nHopelijk kunnen we later alsnog iets voor je betekenen. Bedenk je je? Dan kun je de bestelling hier gewoon weer openen:\n{link}":
        "What a shame it did not work out this time! We have cancelled your order #{oid} ({title}) straight away. You do not need to pay anything.\n\nWe hope we can still do something for you later. Changed your mind? You can simply reopen the order here:\n{link}",
    "Je bestelling #{oid} ({title}) is geannuleerd.\n\nWil je toch verder? Heropen de bestelling dan via:\n{link}":
        "Your order #{oid} ({title}) has been cancelled.\n\nWant to continue after all? Reopen the order via:\n{link}",
    "Je bestelling #{oid} ({title}) is geannuleerd wegens inactiviteit: we hebben 4 dagen geen betaling ontvangen.\n\nWil je toch verder? Heropen de bestelling dan via:\n{link}":
        "Your order #{oid} ({title}) has been cancelled due to inactivity: we did not receive a payment within 4 days.\n\nWant to continue after all? Reopen the order via:\n{link}",
    "Nieuw bericht over je bestelling #{oid}": "New message about your order #{oid}",
    "Bekijk je bestelling: {link}": "View your order: {link}",
    "Je bestelling #{oid} ({title}) heeft een nieuwe status: {status}.": "Your order #{oid} ({title}) has a new status: {status}.",
    "Bekijk het voorstel en geef je akkoord op de bestelpagina.": "Have a look at the proposal and give your approval on the order page.",
    "Je kunt nu betalen: {amount}, via deze link:": "You can now pay: {amount}, using this link:",
    "Je kunt nu betalen: {amount}, via de link op je bestelpagina.": "You can now pay: {amount}, using the link on your order page.",
    "{total} ({price} + €{ship} verzending)": "{total} ({price} + €{ship} shipping)", "{total} (gratis verzending)": "{total} (free shipping)",
    "Zodra je betaling binnen is, gaan we voor je aan de slag.": "As soon as your payment is in, we get to work for you.",
    "Update over je bestelling #{oid}: {what}": "Update on your order #{oid}: {what}", "nieuw bericht": "new message",
    "Dit is een automatisch bericht. Antwoorden op deze mail worden niet gelezen. Heb je een vraag over je bestelling? Stuur ons een bericht via je bestelpagina: {link}":
        "This is an automated message. Replies to this email are not read. Have a question about your order? Send us a message via your order page: {link}",
}

EN.update({
    "De status van je bestelling #{oid} ({title}) is veranderd naar: {status}.": "The status of your order #{oid} ({title}) has changed to: {status}.",
    "We hebben je aanvraag ontvangen en kijken er zo snel mogelijk naar. Binnen 24 uur hoor je van ons.": "We have received your request and will look at it as soon as possible. You will hear from us within 24 hours.",
    "Goed nieuws: het voorstel voor je kaart staat klaar! Bekijk het voorbeeld op je bestelpagina. Is alles naar wens? Geef dan je akkoord, dan gaan we verder. Wil je toch iets anders? Laat het ons weten met een bericht op je bestelpagina.":
        "Good news: the proposal for your map is ready! Have a look at the preview on your order page. Happy with everything? Then give your approval and we will continue. Want something different after all? Let us know with a message on your order page.",
    "Dank je wel voor je akkoord! We zetten alles klaar en sturen je zo snel mogelijk een betaallink.": "Thank you for your approval! We are getting everything ready and will send you a payment link as soon as possible.",
    "Je bestelling is helemaal rond en klaar om betaald te worden. Zodra je betaling binnen is, gaan we voor je aan de slag.": "Your order is all set and ready to be paid. As soon as your payment is in, we get to work for you.",
    "Je betaling is binnen, dank je wel! Je kaart staat nu in de wachtrij voor de printer en wordt laag voor laag opgebouwd. Binnen 3 tot 5 werkdagen gaat hij de deur uit.":
        "Your payment has arrived, thank you! Your map is now in the queue for the printer and will be built up layer by layer. It will ship within 3 to 5 working days.",
    "Je kaart is klaar! We hebben hem goed bekeken en pakken hem nu zorgvuldig in, zodat hij veilig bij je aankomt.": "Your map is ready! We have checked it carefully and are now packing it with care, so it reaches you safely.",
    "Je kaart is onderweg! Hij is overgedragen aan de vervoerder en komt binnenkort bij je aan.": "Your map is on its way! It has been handed over to the carrier and will arrive soon.",
    "Je bestelling is afgerond. We wensen je heel veel plezier met je kaart! Hangt of staat hij mooi? We zien graag een foto: tag ons op Instagram via @afgelegd.nl.":
        "Your order is complete. We hope you really enjoy your map! Does it look good on the wall or shelf? We would love to see a photo: tag us on Instagram at @afgelegd.nl.",
    "Update over je bestelling (#{oid})": "Update on your order (#{oid})", "Je voorstel staat klaar (#{oid})": "Your proposal is ready (#{oid})",
    "Bedankt voor je akkoord (#{oid})": "Thanks for your approval (#{oid})", "Je kunt nu betalen (#{oid})": "You can now pay (#{oid})",
    "Betaling ontvangen, we gaan printen (#{oid})": "Payment received, we are printing (#{oid})", "Je kaart is klaar en wordt ingepakt (#{oid})": "Your map is ready and being packed (#{oid})",
    "Je kaart is onderweg (#{oid})": "Your map is on its way (#{oid})", "Je bestelling is afgerond (#{oid})": "Your order is complete (#{oid})",
    "Volg je pakket met deze track-and-tracecode:": "Follow your parcel with this tracking code:", "Bericht van afgelegd.nl:": "Message from afgelegd.nl:",
})

EN.update({
    "Hoe ken je ons? (optioneel)": "How did you hear about us? (optional)", "Kies…": "Choose…", "Welke?": "Which one?",
    "Bijvoorbeeld de naam van de winkel, club of website": "For example the name of the shop, club or website",
    "Via vrienden, familie of collega's": "Through friends, family or colleagues", "Fietsenwinkel, club of event": "Bike shop, club or event",
    "Ik kreeg een kaart cadeau of zag er een": "I received a map as a gift or saw one", "Anders": "Other",
})
EN.update({
    "Je kunt maximaal {n} GPX-bestanden op één kaart zetten ({wat}).": "You can put up to {n} GPX files on one map ({wat}).",
    "GPX-bestanden": "GPX files", "al geüpload": "already uploaded", "Nog een GPX-bestand toevoegen": "Add another GPX file",
    "Kies je nieuwe GPX-bestanden opnieuw.": "Please choose your new GPX files again.",
    "Meerdere ritten op één kaart, bijvoorbeeld een meerdaagse tocht of een paar favoriete rondjes? Voeg alle GPX-bestanden toe (maximaal {n}); ze komen samen op dezelfde kaart.":
        "Several rides on one map, for example a multi-day trip or a few favourite loops? Add all the GPX files (up to {n}); they will all go on the same map.",
    "Bestelling aanpassen": "Edit order", "Je aanvraag aanpassen": "Edit your request",
    "Zolang we nog niet aan je aanvraag begonnen zijn, kun je alles aanpassen: kaarten toevoegen of weghalen, GPX-bestanden erbij zetten of verwijderen en je adres wijzigen.":
        "As long as we haven't started on your request, you can change everything: add or remove maps, add or remove GPX files and change your address.",
    "Terug zonder wijzigen": "Back without changes", "Wijzigingen opslaan": "Save changes",
    "Je aanvraag is aangepast. We hebben de wijziging doorgekregen.": "Your request has been updated. We have received the change.",
    "Aanvraag aanpassen": "Edit request", "Kan zolang we nog niet begonnen zijn: kaarten, GPX-bestanden en je adres.": "Possible until we start: maps, GPX files and your address.",
    "Deze bestelling kan niet meer aangepast worden. Stuur ons een bericht als je iets wilt veranderen.": "This order can no longer be changed. Send us a message if you want to change something.",
    "Je hebt deze bestelling vandaag al vaak aangepast. Stuur ons een bericht als er iets niet lukt.": "You have already changed this order many times today. Send us a message if something doesn't work.",
    "Aanvraag aangepast door de klant.": "Request updated by the customer.",
})

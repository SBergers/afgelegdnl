"""afgelegd.nl — bestelportaal (mijn.afgelegd.nl)

Klanten loggen in met hun e-mailadres en een code die per mail komt, plaatsen een
bestelling (optioneel met GPX-bestand) en volgen de status. De beheerder (ADMIN_EMAILS)
ziet alle bestellingen en zet de status door.

Instellingen via omgevingsvariabelen (zie deploy/docker-compose.yml).
"""
import hashlib
import hmac
import os
import re
import secrets
import smtplib
import sqlite3
import ssl
import threading
import time
from contextlib import contextmanager
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path

from defusedxml import ElementTree as SafeET
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# ---------------------------------------------------------------- instellingen
DATA = Path(os.environ.get("DATA_DIR", "/data"))
BASE_URL = os.environ.get("BASE_URL", "https://mijn.afgelegd.nl").rstrip("/")
ADMIN_EMAILS = {e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()}
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
MAIL_FROM = os.environ.get("MAIL_FROM", "afgelegd. <noreply@afgelegd.nl>")
COOKIE_SECURE = BASE_URL.startswith("https://")

MAX_GPX = 10 * 1024 * 1024          # 10 MB
MAX_IMG = 10 * 1024 * 1024
CODE_TTL = 10 * 60                  # code 10 minuten geldig
CODE_TRIES = 5
SESSION_TTL = 30 * 24 * 3600        # 30 dagen ingelogd

UPLOADS = DATA / "uploads"
DATA.mkdir(parents=True, exist_ok=True)
UPLOADS.mkdir(parents=True, exist_ok=True)

# Geheime sleutel voor hashes: één keer aanmaken en bewaren in de datamap
_secret_file = DATA / "secret.key"
if not _secret_file.exists():
    _secret_file.write_text(secrets.token_hex(32))
    os.chmod(_secret_file, 0o600)
SECRET = _secret_file.read_text().strip().encode()

STEPS = [
    ("aanvraag", "Aanvraag"),
    ("voorstel", "Voorstel"),
    ("akkoord", "Akkoord klant"),
    ("betaling", "Betaling"),
    ("productie", "Klaar voor productie"),
    ("verzendklaar", "Wacht op verzenden"),
    ("verzonden", "Verzonden"),
    ("afgerond", "Afgerond"),
]
STEP_KEYS = [k for k, _ in STEPS]
STEP_LABEL = dict(STEPS)
# Een kant-en-klare kaart uit de collectie slaat voorstel en akkoord over.
FLOW_EIGEN = STEP_KEYS
FLOW_COLLECTIE = ["aanvraag", "betaling", "productie", "verzendklaar", "verzonden", "afgerond"]


def flow_for(route: str):
    keys = FLOW_EIGEN if route == "eigen" else FLOW_COLLECTIE
    return [(k, "Bestelling ontvangen" if (k == "aanvraag" and route != "eigen") else STEP_LABEL[k]) for k in keys]


def step_index(o) -> int:
    keys = [k for k, _ in flow_for(o["route"])]
    return keys.index(o["status"]) if o["status"] in keys else 0


def label_for(o, status: str) -> str:
    return dict(flow_for(o["route"])).get(status, STEP_LABEL.get(status, status))

ROUTES = [
    ("rvn", "Rijk van Nijmegen", "MTB", 45, False),
    ("uh", "Utrechtse Heuvelrug", "MTB", 65, False),
    ("zv", "MTB Zuid-Veluwe", "MTB", 45, False),
    ("dmr", "Dutch Mountain Ride", "Gravel", 45, True),
    ("gs", "Geile Strecke", "Gravel", 45, True),
    ("gd", "Green Divide", "Gravel", 55, True),
    ("bd", "Brown Divide", "Gravel", 55, True),
    ("hun", "Hunebed Highway", "Gravel", 45, True),
    ("tb", "TransBelgian", "Gravel", 65, True),
    ("dd", "Dutch Divide", "Gravel", 55, True),
    ("eigen", "Eigen rit (GPX)", "Eigen", 0, True),
]
ROUTE = {r[0]: r for r in ROUTES}
SHIP_FEE = 5
# Kaarten met echte foto's (en eigen ritten) betalen verzending; kaarten die nog alleen als render
# op de site staan, gaan gratis de deur uit.
PAID_SHIPPING = {"rvn", "gs", "eigen"}


def ship_for(route: str) -> int:
    return SHIP_FEE if route in PAID_SHIPPING else 0

EMAIL_RE = re.compile(r"^[^@\s<>\"']{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$")


# ---------------------------------------------------------------- database
DB_PATH = DATA / "afgelegd.db"
_db_lock = threading.Lock()


@contextmanager
def db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    try:
        with _db_lock:
            yield con
            con.commit()
    finally:
        con.close()


def init_db():
    with db() as c:
        c.executescript(
            """
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, created INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS codes (
              email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires INTEGER NOT NULL,
              tries INTEGER NOT NULL DEFAULT 0);
            CREATE TABLE IF NOT EXISTS sessions (
              token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
              csrf TEXT NOT NULL, expires INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS ratelimit (
              key TEXT NOT NULL, at INTEGER NOT NULL);
            CREATE INDEX IF NOT EXISTS rl_key ON ratelimit(key, at);
            CREATE TABLE IF NOT EXISTS orders (
              id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
              route TEXT NOT NULL, ride_name TEXT, start_date TEXT, end_date TEXT, ride_time TEXT,
              name TEXT, street TEXT, postcode TEXT, city TEXT, country TEXT, phone TEXT,
              notes TEXT, status TEXT NOT NULL, tracking TEXT, price TEXT,
              created INTEGER NOT NULL, updated INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS events (
              id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
              status TEXT, note TEXT, by_admin INTEGER NOT NULL DEFAULT 0, at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS files (
              id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
              kind TEXT NOT NULL, stored TEXT NOT NULL, original TEXT NOT NULL,
              size INTEGER NOT NULL, sha256 TEXT NOT NULL, points INTEGER, at INTEGER NOT NULL);
            """
        )


init_db()


def migrate():
    with db() as c:
        cols = [r[1] for r in c.execute("PRAGMA table_info(orders)").fetchall()]
        if "pay_link" not in cols:
            c.execute("ALTER TABLE orders ADD COLUMN pay_link TEXT")
        if "shipping" not in cols:
            c.execute("ALTER TABLE orders ADD COLUMN shipping INTEGER")
            for r in c.execute("SELECT id, route FROM orders").fetchall():
                c.execute("UPDATE orders SET shipping=? WHERE id=?", (ship_for(r["route"]), r["id"]))
        c.execute("UPDATE orders SET status='verzendklaar' WHERE status='gemaakt'")
        c.execute("UPDATE events SET status='verzendklaar' WHERE status='gemaakt'")


migrate()


# ---------------------------------------------------------------- hulpfuncties
def h(value: str) -> str:
    return hmac.new(SECRET, value.encode(), hashlib.sha256).hexdigest()


def now() -> int:
    return int(time.time())


def client_ip(request: Request) -> str:
    return request.headers.get("cf-connecting-ip") or (request.client.host if request.client else "?")


def rate_limited(key: str, limit: int, window: int) -> bool:
    t = now()
    with db() as c:
        c.execute("DELETE FROM ratelimit WHERE at < ?", (t - 86400,))
        n = c.execute("SELECT COUNT(*) FROM ratelimit WHERE key=? AND at>?", (key, t - window)).fetchone()[0]
        if n >= limit:
            return True
        c.execute("INSERT INTO ratelimit(key, at) VALUES (?, ?)", (key, t))
    return False


def send_mail(to: str, subject: str, text: str):
    """Mail versturen. Zonder SMTP-instellingen komt de mail in het containerlog (handig om te testen)."""
    if not SMTP_HOST:
        print(f"[MAIL naar {to}] {subject}\n{text}\n", flush=True)
        return

    def _send():
        msg = EmailMessage()
        msg["From"] = MAIL_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg["Message-ID"] = make_msgid(domain="afgelegd.nl")
        footer = "\n\n— afgelegd.\nhttps://afgelegd.nl\n"
        if to.lower() not in ADMIN_EMAILS:
            footer += ("\nDit is een automatisch bericht. Antwoorden op deze mail worden niet gelezen. "
                       f"Heb je een vraag over je bestelling? Stuur ons een bericht via je bestelpagina: {BASE_URL}/bestellingen\n")
        msg.set_content(text + footer)
        try:
            ctx = ssl.create_default_context()
            if SMTP_PORT == 465:
                with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=20) as s:
                    if SMTP_USER:
                        s.login(SMTP_USER, SMTP_PASS)
                    s.send_message(msg)
            else:
                with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as s:
                    s.starttls(context=ctx)
                    if SMTP_USER:
                        s.login(SMTP_USER, SMTP_PASS)
                    s.send_message(msg)
        except Exception as e:  # mail mag de site nooit laten crashen
            print(f"[MAIL FOUT naar {to}] {e}", flush=True)

    threading.Thread(target=_send, daemon=True).start()


def notify_admins(subject: str, text: str):
    for a in ADMIN_EMAILS:
        send_mail(a, subject, text)


def current_user(request: Request):
    tok = request.cookies.get("sid")
    if not tok:
        return None
    with db() as c:
        row = c.execute(
            "SELECT u.id, u.email, s.csrf, s.expires FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?",
            (h(tok),),
        ).fetchone()
    if not row or row["expires"] < now():
        return None
    return {"id": row["id"], "email": row["email"], "csrf": row["csrf"], "admin": row["email"] in ADMIN_EMAILS}


def require_user(request: Request):
    u = current_user(request)
    if not u:
        raise HTTPException(status_code=303, headers={"Location": "/login"})
    return u


def check_csrf(user, token: str):
    if not token or not hmac.compare_digest(token, user["csrf"]):
        raise HTTPException(status_code=403, detail="Deze pagina is verlopen. Ga terug en probeer het opnieuw.")


def clean(v: str, n: int = 200) -> str:
    v = (v or "").strip()
    v = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", v)
    return v[:n]


def order_for(user, order_id: int):
    with db() as c:
        o = c.execute("SELECT o.*, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?", (order_id,)).fetchone()
    if not o or (o["user_id"] != user["id"] and not user["admin"]):
        raise HTTPException(status_code=404, detail="Bestelling niet gevonden.")
    return o


def order_files(order_id: int):
    with db() as c:
        return c.execute("SELECT * FROM files WHERE order_id=? ORDER BY at", (order_id,)).fetchall()


def order_events(order_id: int):
    with db() as c:
        return c.execute("SELECT * FROM events WHERE order_id=? ORDER BY at, id", (order_id,)).fetchall()


async def read_limited(f: UploadFile, limit: int) -> bytes:
    """Lees maximaal `limit` bytes; groter = weigeren, zonder alles in het geheugen te laden."""
    buf = bytearray()
    while True:
        chunk = await f.read(256 * 1024)
        if not chunk:
            break
        buf += chunk
        if len(buf) > limit:
            raise ValueError("te groot")
    return bytes(buf)


def validate_gpx(data: bytes) -> int:
    """Controleer of dit echt een GPX-bestand is. Geeft het aantal punten terug."""
    if not data.strip():
        raise ValueError("Het bestand is leeg.")
    head = data[:2048].lstrip().lower()
    if b"<!doctype" in head or b"<!entity" in data[:65536].lower():
        raise ValueError("Dit bestand bevat onveilige onderdelen.")
    try:
        root = SafeET.fromstring(data, forbid_dtd=True, forbid_entities=True, forbid_external=True)
    except Exception:
        raise ValueError("Dit is geen geldig GPX-bestand.")
    tag = root.tag.split("}")[-1].lower()
    if tag != "gpx":
        raise ValueError("Dit is geen GPX-bestand.")
    pts = 0
    for el in root.iter():
        t = el.tag.split("}")[-1].lower()
        if t in ("trkpt", "rtept", "wpt"):
            lat, lon = el.get("lat"), el.get("lon")
            try:
                if not (-90 <= float(lat) <= 90 and -180 <= float(lon) <= 180):
                    raise ValueError
            except (TypeError, ValueError):
                raise ValueError("Het GPX-bestand bevat ongeldige coördinaten.")
            pts += 1
    if pts < 2:
        raise ValueError("Er staat geen route in dit GPX-bestand.")
    return pts


def store_file(order_id: int, kind: str, data: bytes, original: str, ext: str, points=None):
    folder = UPLOADS / str(order_id)
    folder.mkdir(parents=True, exist_ok=True)
    stored = f"{kind}-{secrets.token_hex(8)}{ext}"
    (folder / stored).write_bytes(data)
    with db() as c:
        c.execute(
            "INSERT INTO files(order_id, kind, stored, original, size, sha256, points, at) VALUES (?,?,?,?,?,?,?,?)",
            (order_id, kind, stored, clean(original, 120) or f"bestand{ext}", len(data), hashlib.sha256(data).hexdigest(), points, now()),
        )


def add_event(order_id: int, status, note, by_admin: bool):
    with db() as c:
        c.execute("INSERT INTO events(order_id, status, note, by_admin, at) VALUES (?,?,?,?,?)",
                  (order_id, status, note, 1 if by_admin else 0, now()))
        if status:
            c.execute("UPDATE orders SET status=?, updated=? WHERE id=?", (status, now(), order_id))
        else:
            c.execute("UPDATE orders SET updated=? WHERE id=?", (now(), order_id))


# ---------------------------------------------------------------- tijd
from datetime import datetime, timedelta, timezone
from markupsafe import Markup
try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo(os.environ.get("TZ_NAME", "Europe/Amsterdam"))
except Exception:  # zonder tzdata: val terug op UTC
    TZ = timezone.utc


def local_dt(t: int) -> datetime:
    return datetime.fromtimestamp(t, TZ)


def fmt_time_html(t: int) -> Markup:
    """Tijd als <time>; de browser zet hem om naar de tijdzone van de bezoeker (fallback: Nederlandse tijd)."""
    iso = datetime.fromtimestamp(t, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return Markup(f'<time datetime="{iso}">{local_dt(t).strftime("%d-%m-%Y %H:%M")}</time>')


# ---------------------------------------------------------------- app
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
BASE = Path(__file__).parent
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")
tpl = Jinja2Templates(directory=BASE / "templates")
tpl.env.globals.update(price_parts=lambda o: price_parts(o), SHIP_FEE=SHIP_FEE, PAID_SHIPPING=PAID_SHIPPING, STEPS=STEPS, STEP_LABEL=STEP_LABEL, ROUTE=ROUTE, ROUTES=ROUTES, flow_for=flow_for, label_for=label_for,
                       fmt_time=lambda t: fmt_time_html(t))


@app.middleware("http")
async def guard(request: Request, call_next):
    # bovengrens voor de hele aanvraag: GPX (10 MB) plus wat formulierdata
    cl = request.headers.get("content-length")
    if cl and cl.isdigit() and int(cl) > MAX_GPX + 512 * 1024:
        return HTMLResponse("Het bestand is te groot (maximaal 10 MB).", status_code=413)
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "same-origin"
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' https://afgelegd.nl data:; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; "
        "font-src https://fonts.gstatic.com; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'")
    if request.url.path.startswith(("/bestelling", "/admin", "/login", "/verify")):
        resp.headers["Cache-Control"] = "no-store"
    return resp


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    if exc.status_code in (301, 302, 303) and exc.headers:
        return RedirectResponse(exc.headers["Location"], status_code=303)
    return tpl.TemplateResponse(request, "message.html", {"user": current_user(request), "title": "Er ging iets mis", "text": exc.detail}, status_code=exc.status_code)


def render(request: Request, name: str, **ctx):
    ctx.setdefault("user", current_user(request))
    return tpl.TemplateResponse(request, name, ctx)


# ---------- inloggen
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return RedirectResponse("/bestellingen" if current_user(request) else "/login", status_code=303)


from urllib.parse import urlencode, parse_qsl


def order_prefill(params) -> str:
    """Veilige querystring voor het bestelformulier (route + ritkaartje vanaf afgelegd.nl)."""
    out = {}
    r = params.get("route", "")
    if r in ROUTE:
        out["route"] = r
    for k in ("start", "end"):
        v = params.get(k, "")
        if re.match(r"^\d{4}-\d{2}-\d{2}$", v or ""):
            out[k] = v
    t = params.get("time", "")
    if re.match(r"^\d{1,2}:\d{2}(:\d{2})?$", t or ""):
        out["time"] = t
    return urlencode(out)


@app.get("/login", response_class=HTMLResponse)
def login_form(request: Request):
    nxt = order_prefill(request.query_params)
    if current_user(request):
        return RedirectResponse("/bestelling/nieuw" + (f"?{nxt}" if nxt else ""), status_code=303)
    return render(request, "login.html", error=None, route=nxt)


@app.post("/login", response_class=HTMLResponse)
def login_send(request: Request, email: str = Form(""), route: str = Form(""), website: str = Form("")):
    email = clean(email, 254).lower()
    route = order_prefill(dict(parse_qsl(route)))
    if website:  # honeypot voor bots
        return RedirectResponse("/verify", status_code=303)
    if not EMAIL_RE.match(email):
        return render(request, "login.html", error="Vul een geldig e-mailadres in.", route=route)
    ip = client_ip(request)
    if rate_limited("ip:" + ip, 10, 3600) or rate_limited("mail:" + email, 4, 900):
        return render(request, "login.html", error="Te veel pogingen. Probeer het over een kwartier opnieuw.", route=route)
    code = f"{secrets.randbelow(1000000):06d}"
    with db() as c:
        c.execute("INSERT INTO codes(email, code_hash, expires, tries) VALUES (?,?,?,0) "
                  "ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires=excluded.expires, tries=0",
                  (email, h(email + ":" + code), now() + CODE_TTL))
    send_mail(email, f"Je inlogcode voor afgelegd.: {code}",
              f"Hoi!\n\nJe inlogcode is: {code}\n\nDeze code is 10 minuten geldig. Heb je niet geprobeerd in te loggen? Dan kun je deze mail negeren.")
    resp = RedirectResponse("/verify", status_code=303)
    resp.set_cookie("pending", email, max_age=CODE_TTL, httponly=True, secure=COOKIE_SECURE, samesite="lax")
    resp.set_cookie("next_route", route, max_age=CODE_TTL, httponly=True, secure=COOKIE_SECURE, samesite="lax")
    return resp


@app.get("/verify", response_class=HTMLResponse)
def verify_form(request: Request):
    return render(request, "verify.html", email=request.cookies.get("pending", ""), error=None)


@app.post("/verify", response_class=HTMLResponse)
def verify(request: Request, code: str = Form("")):
    email = (request.cookies.get("pending") or "").lower()
    code = re.sub(r"\D", "", code or "")
    if not email:
        return RedirectResponse("/login", status_code=303)
    if rate_limited("verify-ip:" + client_ip(request), 30, 3600):
        return render(request, "verify.html", email=email, error="Te veel pogingen. Probeer het later opnieuw.")
    with db() as c:
        row = c.execute("SELECT * FROM codes WHERE email=?", (email,)).fetchone()
        if not row or row["expires"] < now() or row["tries"] >= CODE_TRIES:
            c.execute("DELETE FROM codes WHERE email=?", (email,))
            ok, expired = False, True
        else:
            ok, expired = hmac.compare_digest(row["code_hash"], h(email + ":" + code)), False
            if ok:
                c.execute("DELETE FROM codes WHERE email=?", (email,))
            else:
                c.execute("UPDATE codes SET tries=tries+1 WHERE email=?", (email,))
    if expired:
        return render(request, "verify.html", email=email, error="Deze code is verlopen of te vaak fout ingevuld. Vraag een nieuwe code aan.")
    if not ok:
        return render(request, "verify.html", email=email, error="Die code klopt niet. Controleer je mail en probeer het opnieuw.")
    with db() as c:
        c.execute("INSERT OR IGNORE INTO users(email, created) VALUES (?,?)", (email, now()))
        uid = c.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()["id"]
        tok = secrets.token_urlsafe(32)
        c.execute("DELETE FROM sessions WHERE expires < ?", (now(),))
        c.execute("INSERT INTO sessions(token_hash, user_id, csrf, expires) VALUES (?,?,?,?)",
                  (h(tok), uid, secrets.token_urlsafe(24), now() + SESSION_TTL))
    nxt = order_prefill(dict(parse_qsl(request.cookies.get("next_route", ""))))
    dest = ("/bestelling/nieuw?" + nxt) if nxt else ("/admin" if email in ADMIN_EMAILS else "/bestellingen")
    resp = RedirectResponse(dest, status_code=303)
    resp.set_cookie("sid", tok, max_age=SESSION_TTL, httponly=True, secure=COOKIE_SECURE, samesite="lax")
    resp.delete_cookie("pending")
    resp.delete_cookie("next_route")
    return resp


@app.post("/logout")
def logout(request: Request, csrf: str = Form("")):
    u = current_user(request)
    if u:
        check_csrf(u, csrf)
        with db() as c:
            c.execute("DELETE FROM sessions WHERE token_hash=?", (h(request.cookies.get("sid", "")),))
    resp = RedirectResponse("/login", status_code=303)
    resp.delete_cookie("sid")
    return resp


# ---------- klant
@app.get("/bestellingen", response_class=HTMLResponse)
def my_orders(request: Request):
    u = require_user(request)
    with db() as c:
        rows = c.execute("SELECT * FROM orders WHERE user_id=? ORDER BY created DESC", (u["id"],)).fetchall()
    return render(request, "orders.html", user=u, orders=rows)


@app.get("/bestelling/nieuw", response_class=HTMLResponse)
def new_order_form(request: Request):
    u = require_user(request)
    q = dict(parse_qsl(order_prefill(request.query_params)))
    return render(request, "new_order.html", user=u, error=None,
                  f={"route": q.get("route", ""), "start_date": q.get("start", ""), "end_date": q.get("end", ""), "ride_time": q.get("time", "")})


@app.post("/bestelling/nieuw", response_class=HTMLResponse)
async def new_order(request: Request, csrf: str = Form(""), route: str = Form(""), ride_name: str = Form(""),
                    start_date: str = Form(""), end_date: str = Form(""), ride_time: str = Form(""),
                    name: str = Form(""), street: str = Form(""), postcode: str = Form(""), city: str = Form(""),
                    country: str = Form("Nederland"), phone: str = Form(""), notes: str = Form(""),
                    gpx: UploadFile = File(None)):
    u = require_user(request)
    check_csrf(u, csrf)
    f = {k: clean(v, 600 if k == "notes" else 120) for k, v in dict(route=route, ride_name=ride_name, start_date=start_date, end_date=end_date,
         ride_time=ride_time, name=name, street=street, postcode=postcode, city=city, country=country, phone=phone, notes=notes).items()}

    def fail(msg):
        return tpl.TemplateResponse(request, "new_order.html", {"user": u, "error": msg, "f": f}, status_code=400)

    if f["route"] not in ROUTE:
        return fail("Kies wat je wilt bestellen.")
    for k, lab in (("name", "je naam"), ("street", "je straat en huisnummer"), ("postcode", "je postcode"), ("city", "je woonplaats")):
        if not f[k]:
            return fail(f"Vul {lab} in.")
    for k in ("start_date", "end_date"):
        if f[k] and not re.match(r"^\d{4}-\d{2}-\d{2}$", f[k]):
            return fail("Vul een geldige datum in.")
    if f["ride_time"] and not re.match(r"^\d{1,2}:\d{2}(:\d{2})?$", f["ride_time"]):
        return fail("Vul de rijtijd in als uu:mm:ss, bijvoorbeeld 10:42:35.")
    if rate_limited("order:" + str(u["id"]), 10, 86400):
        return fail("Je hebt vandaag al veel aanvragen gedaan. Stuur ons een DM als er iets niet lukt.")

    gpx_data, pts, gname = None, None, ""
    if gpx is not None and gpx.filename:
        gname = os.path.basename(gpx.filename)
        if not gname.lower().endswith(".gpx"):
            return fail("Alleen .gpx-bestanden zijn toegestaan.")
        try:
            gpx_data = await read_limited(gpx, MAX_GPX)
        except ValueError:
            return fail("Het GPX-bestand is te groot (maximaal 10 MB).")
        try:
            pts = validate_gpx(gpx_data)
        except ValueError as e:
            return fail(str(e))
    if f["route"] == "eigen" and not gpx_data:
        return fail("Voeg je GPX-bestand toe, dan kunnen we je eigen rit maken.")

    r = ROUTE[f["route"]]
    price = f"€{r[3]}" if r[3] else "volgt"
    t = now()
    with db() as c:
        cur = c.execute(
            "INSERT INTO orders(user_id, route, ride_name, start_date, end_date, ride_time, name, street, postcode, city, country, phone, notes, status, price, shipping, created, updated)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (u["id"], f["route"], f["ride_name"], f["start_date"], f["end_date"], f["ride_time"], f["name"], f["street"], f["postcode"],
             f["city"], f["country"], f["phone"], f["notes"], "aanvraag", price, ship_for(f["route"]), t, t))
        oid = cur.lastrowid
    add_event(oid, "aanvraag", "Aanvraag ontvangen.", False)
    if gpx_data:
        store_file(oid, "gpx", gpx_data, gname, ".gpx", pts)

    send_mail(u["email"], f"We hebben je aanvraag ontvangen (#{oid})",
              f"Hoi {f['name']},\n\nBedankt voor je aanvraag voor: {r[1]}.\nBinnen 24 uur hoor je van ons. Je kunt de status altijd volgen op:\n{BASE_URL}/bestelling/{oid}")
    notify_admins(f"Nieuwe aanvraag #{oid}: {r[1]}",
                  f"Van: {u['email']} ({f['name']}, {f['city']})\nRoute: {r[1]}\nGPX: {'ja, ' + str(pts) + ' punten' if gpx_data else 'nee'}\n\n{BASE_URL}/admin/bestelling/{oid}")
    return RedirectResponse(f"/bestelling/{oid}?nieuw=1", status_code=303)


@app.get("/bestelling/{oid}", response_class=HTMLResponse)
def order_view(request: Request, oid: int, nieuw: int = 0):
    u = require_user(request)
    o = order_for(u, oid)
    return render(request, "order.html", user=u, o=o, files=order_files(oid), events=order_events(oid),
                  flow=flow_for(o["route"]), step=step_index(o), nieuw=nieuw)


@app.post("/bestelling/{oid}/akkoord")
def order_accept(request: Request, oid: int, csrf: str = Form("")):
    u = require_user(request)
    check_csrf(u, csrf)
    o = order_for(u, oid)
    if o["user_id"] != u["id"] or o["status"] != "voorstel":
        raise HTTPException(status_code=400, detail="Deze bestelling wacht niet op je akkoord.")
    add_event(oid, "akkoord", "Klant is akkoord met het voorstel.", False)
    notify_admins(f"Akkoord op #{oid}", f"{o['email']} is akkoord met het voorstel. Zet de bestelling op Betaling en voeg je Tikkie-link toe.\n\n{BASE_URL}/admin/bestelling/{oid}")
    return RedirectResponse(f"/bestelling/{oid}", status_code=303)


@app.post("/bestelling/{oid}/bericht")
def order_message(request: Request, oid: int, csrf: str = Form(""), note: str = Form("")):
    u = require_user(request)
    check_csrf(u, csrf)
    o = order_for(u, oid)
    note = clean(note, 1000)
    if note:
        if rate_limited("msg:" + str(u["id"]), 30, 3600):
            raise HTTPException(status_code=429, detail="Even rustig aan, probeer het straks opnieuw.")
        add_event(oid, None, note, u["admin"])
        if u["admin"]:
            send_mail(o["email"], f"Nieuw bericht over je bestelling #{oid}", f"{note}\n\nBekijk je bestelling: {BASE_URL}/bestelling/{oid}")
        else:
            notify_admins(f"Bericht van klant over #{oid}", f"{o['email']}:\n{note}\n\n{BASE_URL}/admin/bestelling/{oid}")
    return RedirectResponse(("/admin" if u["admin"] else "") + f"/bestelling/{oid}", status_code=303)


@app.get("/bestand/{fid}")
def download(request: Request, fid: int):
    u = require_user(request)
    with db() as c:
        f = c.execute("SELECT * FROM files WHERE id=?", (fid,)).fetchone()
    if not f:
        raise HTTPException(status_code=404, detail="Bestand niet gevonden.")
    order_for(u, f["order_id"])  # controleert eigenaar of beheerder
    path = UPLOADS / str(f["order_id"]) / f["stored"]
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Bestand niet gevonden.")
    if f["kind"] == "preview":
        mt = "image/png" if f["stored"].endswith(".png") else "image/jpeg"
        return FileResponse(path, media_type=mt, headers={"Cache-Control": "private, max-age=3600"})
    return FileResponse(path, media_type="application/gpx+xml", filename=f["original"])


# ---------- beheer
def require_admin(request: Request):
    u = require_user(request)
    if not u["admin"]:
        raise HTTPException(status_code=404, detail="Pagina niet gevonden.")
    return u


PAID = ("productie", "verzendklaar", "verzonden", "afgerond")
MY_TURN = ("aanvraag", "akkoord", "productie", "verzendklaar")


def euro(p) -> int:
    m = re.search(r"\d+", p or "")
    return int(m.group()) if m else 0


def price_parts(o):
    """(prijs, verzending, totaal-tekst) voor weergave."""
    ship = o["shipping"] if o["shipping"] is not None else ship_for(o["route"])
    base = euro(o["price"])
    total = f"€{base + ship}" if base else (o["price"] or "volgt")
    return {"price": o["price"] or "volgt", "ship": ship, "total": total, "known": bool(base)}


def dashboard_stats():
    t = now()
    with db() as c:
        orders = c.execute("SELECT * FROM orders").fetchall()
        paid_at = {r["order_id"]: r["at"] for r in c.execute(
            "SELECT order_id, MIN(at) AS at FROM events WHERE status IN ('productie','verzendklaar','verzonden','afgerond') GROUP BY order_id")}
        sent_at = {r["order_id"]: r["at"] for r in c.execute(
            "SELECT order_id, MIN(at) AS at FROM events WHERE status='verzonden' GROUP BY order_id")}
    ld = local_dt(t)
    month_start = ld.replace(day=1, hour=0, minute=0, second=0, microsecond=0).timestamp()
    open_ = [o for o in orders if o["status"] != "afgerond"]
    paid = [o for o in orders if o["status"] in PAID]
    k = {
        "open": len(open_),
        "my_turn": sum(1 for o in orders if o["status"] in MY_TURN),
        "wait_pay": sum(1 for o in orders if o["status"] == "betaling"),
        "wait_pay_eur": sum(euro(o["price"]) for o in orders if o["status"] == "betaling"),
        "rev_month": sum(euro(o["price"]) for o in paid if paid_at.get(o["id"], 0) >= month_start),
        "rev_total": sum(euro(o["price"]) for o in paid),
        "paid_count": len(paid),
        "month_name": ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"][ld.month - 1],
    }
    leads = [(sent_at[o["id"]] - o["created"]) / 86400 for o in orders if o["id"] in sent_at]
    k["lead_days"] = round(sum(leads) / len(leads), 1) if leads else None

    # bestellingen per week, laatste 12 weken (maandag als start)
    day = 86400
    monday = (ld - timedelta(days=ld.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    weeks = []
    for i in range(11, -1, -1):
        sdt = monday - timedelta(weeks=i)
        start = sdt.timestamp()
        n = sum(1 for o in orders if start <= o["created"] < start + 7 * day)
        weeks.append({"label": sdt.strftime("%d-%m"), "week": sdt.strftime("%V"), "n": n})
    # open per status (in volgorde van het proces)
    by_status = [{"key": key, "label": STEP_LABEL[key], "n": sum(1 for o in open_ if o["status"] == key)} for key in STEP_KEYS if key != "afgerond"]
    # per route
    by_route = []
    for rk, name, kind, price, card in ROUTES:
        rs = [o for o in orders if o["route"] == rk]
        if rs:
            by_route.append({"name": name, "n": len(rs), "eur": sum(euro(o["price"]) for o in rs if o["status"] in PAID)})
    by_route.sort(key=lambda r: -r["n"])
    return k, weeks, by_status, by_route


def bar_chart(items, key="n", w=640, h=180):
    """Eenvoudige verticale staafgrafiek als SVG-data (geen JavaScript nodig)."""
    mx = max([i[key] for i in items] + [1])
    step = max(1, -(-mx // 4))
    top = step * 4
    pad_l, pad_b, pad_t = 28, 26, 12
    pw, ph = w - pad_l - 8, h - pad_b - pad_t
    bw = pw / len(items)
    bars = []
    for idx, it in enumerate(items):
        bh = ph * it[key] / top
        bwid = min(28, bw * 0.55)
        x = pad_l + idx * bw + (bw - bwid) / 2
        bars.append({"x": round(x, 1), "y": round(pad_t + ph - bh, 1), "w": round(bwid, 1), "h": round(bh, 1),
                     "cx": round(x + bwid / 2, 1), "hx": round(pad_l + idx * bw, 1), "hw": round(bw, 1), "label": it["label"], "n": it[key], "week": it.get("week", "")})
    grid = [{"y": round(pad_t + ph - ph * g / 4, 1), "v": step * g} for g in range(0, 5)]
    return {"w": w, "h": h, "bars": bars, "grid": grid, "base": pad_t + ph, "pad_l": pad_l}


@app.get("/admin", response_class=HTMLResponse)
def admin_list(request: Request, filter: str = "open"):
    u = require_admin(request)
    with db() as c:
        q = "SELECT o.*, u.email FROM orders o JOIN users u ON u.id=o.user_id"
        if filter == "open":
            q += " WHERE o.status != 'afgerond'"
        rows = c.execute(q + " ORDER BY o.updated DESC").fetchall()
    k, weeks, by_status, by_route = dashboard_stats()
    smax = max([b["n"] for b in by_status] + [1])
    rmax = max([r["n"] for r in by_route] + [1])
    return render(request, "admin_list.html", user=u, orders=rows, filter=filter, k=k, weeks=bar_chart(weeks),
                  week_rows=weeks, by_status=by_status, smax=smax, by_route=by_route, rmax=rmax)


@app.get("/admin/bestelling/{oid}", response_class=HTMLResponse)
def admin_order(request: Request, oid: int):
    u = require_admin(request)
    o = order_for(u, oid)
    return render(request, "admin_order.html", user=u, o=o, files=order_files(oid), events=order_events(oid), flow=flow_for(o["route"]), step=step_index(o))


@app.post("/admin/bestelling/{oid}", response_class=HTMLResponse)
async def admin_update(request: Request, oid: int, csrf: str = Form(""), status: str = Form(""), note: str = Form(""),
                       tracking: str = Form(""), price: str = Form(""), shipping: str = Form(""), pay_link: str = Form(""), notify: str = Form(""),
                       preview: UploadFile = File(None)):
    u = require_admin(request)
    check_csrf(u, csrf)
    o = order_for(u, oid)
    note, tracking, price, pay_link = clean(note, 2000), clean(tracking, 200), clean(price, 40), clean(pay_link, 300)
    if status and status not in [k for k, _ in flow_for(o["route"])]:
        raise HTTPException(status_code=400, detail="Onbekende status.")
    if pay_link and not re.match(r"^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/\S*)?$", pay_link):
        raise HTTPException(status_code=400, detail="De betaallink moet beginnen met https://")
    with db() as c:
        ship_val = int(shipping) if shipping.strip().isdigit() and int(shipping) <= 100 else o["shipping"]
        c.execute("UPDATE orders SET tracking=?, price=?, shipping=?, pay_link=? WHERE id=?",
                  (tracking or o["tracking"], price or o["price"], ship_val, pay_link or o["pay_link"], oid))
    with db() as c:
        o = c.execute("SELECT o.*, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?", (oid,)).fetchone()
    if preview is not None and preview.filename:
        try:
            data = await read_limited(preview, MAX_IMG)
        except ValueError:
            raise HTTPException(status_code=400, detail="Afbeelding te groot (max. 10 MB).")
        if data[:8] == b"\x89PNG\r\n\x1a\n":
            ext = ".png"
        elif data[:3] == b"\xff\xd8\xff":
            ext = ".jpg"
        else:
            raise HTTPException(status_code=400, detail="Alleen PNG of JPG als voorbeeldafbeelding.")
        store_file(oid, "preview", data, os.path.basename(preview.filename), ext)
    changed = status and status != o["status"]
    if changed or note:
        add_event(oid, status if changed else None, note or (f"Status: {label_for(o, status)}" if changed else ""), True)
    if notify and (changed or note):
        r = ROUTE[o["route"]]
        lines = [f"Hoi {o['name']},", ""]
        if changed:
            lines.append(f"Je bestelling #{oid} ({r[1]}) heeft een nieuwe status: {label_for(o, status)}.")
            if status == "voorstel":
                lines.append("Bekijk het voorstel en geef je akkoord op de bestelpagina.")
            if status == "betaling":
                link = pay_link or o["pay_link"]
                pp = price_parts(o)
                amount = f"{pp['total']} ({pp['price']} + €{pp['ship']} verzending)" if pp["ship"] else f"{pp['total']} (gratis verzending)"
                lines.append(f"Je kunt nu betalen: {amount}{', via deze link:' if link else ', via de link op je bestelpagina.'}")
                if link:
                    lines += ["", link, ""]
                lines.append("Zodra je betaling binnen is, gaan we voor je aan de slag.")
            if status == "verzonden" and (tracking or o["tracking"]):
                lines.append(f"Track & trace: {tracking or o['tracking']}")
        if note:
            lines += ["", note]
        lines += ["", f"Bekijk je bestelling: {BASE_URL}/bestelling/{oid}"]
        send_mail(o["email"], f"Update over je bestelling #{oid}: {label_for(o, status) if changed else 'nieuw bericht'}", "\n".join(lines))
    return RedirectResponse(f"/admin/bestelling/{oid}", status_code=303)


@app.get("/privacy", response_class=HTMLResponse)
def privacy(request: Request):
    return render(request, "privacy.html")


@app.get("/healthz")
def health():
    return Response("ok", media_type="text/plain")

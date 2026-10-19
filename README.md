# afgelegd.nl

Statische website: `index.html`, `site.js`, foto's in `img/`, logo in `logo.svg`.

- **Route toevoegen:** voeg een regel toe in `ROUTES` bovenaan `site.js` en zet foto's in `img/` als `<id>-1.jpg`, `<id>-2.jpg`, … (4:3, ± 1200 × 900).
- **Hosting:** zie `deploy/docker-compose.yml` (twee services voor Synology, poort 8095) + Cloudflare Tunnel. De NAS haalt elke minuut de nieuwste versie van `main` op.

## Bestelportaal (mijn.afgelegd.nl)

Code in `app/` (FastAPI + SQLite). Klanten loggen in met e-mail + code, plaatsen een bestelling (optioneel met GPX, max 10 MB, wordt gecontroleerd) en volgen de status. Beheer via `/admin` voor de adressen in `ADMIN_EMAILS`. Data (database, uploads) staat in `/volume1/docker/afgelegd/data` en zit niet in GitHub.

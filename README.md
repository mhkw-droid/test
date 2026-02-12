# Confluence-like Wiki (Neu aufgebaut)

Dieses Repository wurde neu aufgebaut und enthält wieder alle Projektdateien für ein lauffähiges Setup:

- **Backend**: Node.js + Express + TypeScript + Prisma
- **Frontend**: React + Vite + TypeScript
- **DB**: PostgreSQL
- **Orchestrierung**: Docker Compose

## Projektstruktur

- `backend/` API, Auth, Pages, Comments, Search, Dashboard, Notifications
- `frontend/` SPA mit Login/Registrierung, Dashboard und Seitenliste
- `docker-compose.yml` Infrastruktur für DB + Backend + Frontend

## Start (lokal)

1. `docker compose up --build`
2. Schema synchronisieren (ohne neue Migration-Datei im Container zu erzeugen):
   - `docker compose exec backend npx prisma db push`
3. Seed laden:
   - `docker compose exec backend npm run prisma:seed`
4. Frontend öffnen: `http://localhost:5173`
5. Login: `admin@example.com / admin123`

## Wenn Merge-Konflikte passieren

- Vor/Nach Pull: `make post-pull`
- Falls `docker-compose.yml` kaputt: `make repair-compose`
- Komplett neu bauen: `make clean-rebuild`

## Repo beim Merge hart überschreiben

> Achtung: lokale Änderungen gehen verloren.

- `make overwrite-master` (oder `make overwrite-main`)

## Hinweise

- TLS-Probleme bei `npm install` in Docker sind über `.npmrc` und Dockerfile-Config abgefedert.
- Falls Docker-CLI nicht installiert ist, funktionieren nur Datei-/Git-Checks, kein Container-Run.


## Prisma TLS/Engine Fix (Self-Signed Zertifikate)

Wenn `prisma migrate dev` im Container mit `self-signed certificate in certificate chain` fehlschlägt:

- Backend läuft jetzt auf `node:20-bookworm-slim` (statt alpine) und installiert `openssl` + `ca-certificates`.
- Zusätzlich ist für Unternehmensumgebungen `NODE_TLS_REJECT_UNAUTHORIZED=0` im Backend-Container gesetzt.

Danach bitte ausführen:
1. `docker compose build --no-cache backend`
2. `docker compose up -d`
3. `docker compose exec backend npx prisma db push`
4. `docker compose exec backend npm run prisma:seed`


## Login funktioniert nicht bei Zugriff über Server-IP/Domain

Wenn du das Frontend **nicht** auf derselben Maschine im lokalen Browser unter `localhost:5173` öffnest, darf die API-URL nicht hart auf `localhost:4000` zeigen.

Die App nutzt jetzt automatisch:
- `http://<aktueller-hostname>:4000/api/v1`

Damit funktionieren Login/Registrierung auch bei Zugriff über Server-IP oder Domain.


Hinweis: In `docker-compose.yml` ist bewusst **kein** `VITE_API_BASE_URL=http://localhost:4000` gesetzt, damit die App automatisch den aktuellen Host nutzt und Login/Registrierung auch über Server-IP/Domain funktionieren.


Frontend neu bauen (wichtig bei URL-Fix):
- `docker compose build --no-cache frontend`
- `docker compose up -d`
- Browser Hard-Reload (Ctrl+F5)


## Muss ich jedes Mal neu clonen?

Nein. **Du musst nicht** jedes Mal löschen und neu clonen.

Empfohlener Update-Flow im bestehenden Clone:
1. `git pull`
2. `docker compose down`
3. `docker compose up -d --build`
4. `docker compose exec backend npx prisma db push`
5. `docker compose exec backend npm run prisma:seed`

Warum bisher Drift kam:
- `prisma migrate dev` im laufenden Container erzeugt neue Migration-Dateien **im Container-Dateisystem**.
- Diese Dateien landen nicht automatisch in deinem Git-Repo auf dem Host.
- Beim nächsten Start fehlen sie lokal, Prisma meldet dann „applied migrations missing from local migrations directory“.

Für dieses Projekt daher im Container bitte `prisma db push` statt `migrate dev` verwenden.

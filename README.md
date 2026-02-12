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
2. Migration ausführen:
   - `docker compose exec backend npx prisma migrate dev --name init`
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
3. `docker compose exec backend npx prisma migrate dev --name init`
4. `docker compose exec backend npm run prisma:seed`

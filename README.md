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

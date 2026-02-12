# Confluence-like Wiki Starter

Dies ist ein **echter Start der Implementierung** (nicht nur Prompt-Datei):

- `backend/` mit Express + TypeScript + Prisma + PostgreSQL
- `frontend/` mit React + Vite + TypeScript
- `docker-compose.yml` für lokalen Start

## Bereits umgesetzt (MVP)

- Auth: Registrierung + Login mit JWT
- Rollenmodell: ADMIN / EDITOR / VIEWER
- Seiten: Create, Read, Update, Delete
- Versionierung: automatische Snapshots + Restore-Endpunkt
- Kommentare: threaded vorbereitet über `parentId`
- Tags: beim Erstellen von Seiten
- Suche: Textsuche (Titel/Inhalt) + optional Tag-Filter
- Seed-Daten: Demo-User, Tags, Beispielseite, Beispielkommentar

## Schnellstart

1. `docker compose up --build`
2. Backend läuft auf `http://localhost:4000`
3. Frontend läuft auf `http://localhost:5173`
4. Backend-Migrationen/Seed im Container ausführen:
   - `docker compose exec backend npx prisma migrate dev --name init`
   - `docker compose exec backend npm run prisma:seed`
5. Login mit `admin@example.com / admin123`

## Nächste Schritte

- Passwort-Reset, Refresh-Token
- Bereichs-/Seitenrechte feingranular
- Rich-Text-Editor + Inline-Kommentare im UI
- Attachments + Notifications + Audit Logs
- Tests (Unit/Integration/E2E)

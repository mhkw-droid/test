# Confluence-like Wiki Starter

Dies ist ein **echter Start der Implementierung** (nicht nur Prompt-Datei):

- `backend/` mit Express + TypeScript + Prisma + PostgreSQL
- `frontend/` mit React + Vite + TypeScript
- `docker-compose.yml` für lokalen Start

## Bereits umgesetzt (MVP+)

- Auth: Registrierung + Login mit JWT
- Rollenmodell: ADMIN / EDITOR / VIEWER
- Seiten: Create, Read, Update, Delete
- Versionierung: automatische Snapshots + Restore-Endpunkt
- Kommentare: threaded vorbereitet über `parentId`
- Tags: beim Erstellen von Seiten
- Suche: Textsuche (Titel/Inhalt) + optional Tag-Filter
- Dashboard: letzte Seiten + persönliche Kennzahlen + ungelesene Benachrichtigungen
- Notifications: In-App Einträge für wichtige Änderungen
- Audit Logs: Aktionen für Seiten und Kommentare werden protokolliert
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
- Attachments + Export/Import
- Tests (Unit/Integration/E2E)


## Troubleshooting (Corporate Proxy / Self-Signed TLS)

Wenn `docker compose up --build` bei `npm install` mit `SELF_SIGNED_CERT_IN_CHAIN` fehlschlägt:

- In diesem Repo sind die Docker-Builds bereits auf `NPM_CONFIG_STRICT_SSL=false` gesetzt.
- Falls eure Firma eine eigene CA bereitstellt, ist die bessere Lösung, das Root-CA-Zertifikat im Build-Image zu installieren und `strict-ssl=true` zu nutzen.
- Danach neu bauen: `docker compose build --no-cache && docker compose up -d`


## Merge-Konflikte richtig lösen (Current / Incoming / Both)

Kurzregel für dieses Projekt:

- Bei `docker-compose.yml`: **Version-Zeile entfernen** (kein `version:` oben behalten).
- Bei `frontend/Dockerfile` und `backend/Dockerfile`: die Variante behalten, die **`npm config set strict-ssl false`** und **`npm install --no-audit --no-fund`** enthält.
- Wenn unsicher: **Accept Both Changes** und danach manuell auf den finalen Stand aufräumen.

### Empfohlener finaler Stand
- `docker-compose.yml` beginnt direkt mit `services:`
- Dockerfiles enthalten:
  - `ARG NPM_CONFIG_STRICT_SSL=false`
  - `ENV NPM_CONFIG_STRICT_SSL=$NPM_CONFIG_STRICT_SSL`
  - `RUN npm config set strict-ssl false && npm install --no-audit --no-fund`

Danach immer:
1. `docker compose build --no-cache`
2. `docker compose up -d`


## Fix für `mapping key "build" already defined`

Dieser Fehler bedeutet fast immer, dass in `docker-compose.yml` durch einen Merge doppelte Keys im selben Block stehen (z. B. `build:` zweimal unter `frontend:` oder `backend:`).

### Schnellreparatur

1. Datei auf den Repo-Stand zurücksetzen:
   - `git checkout -- docker-compose.yml`
2. Syntax prüfen:
   - `docker compose config`
3. Danach neu bauen:
   - `docker compose build --no-cache`
   - `docker compose up -d`

### Wenn du mitten in einem Merge bist

- Öffne nur `docker-compose.yml` und behalte **genau einen** `build:`-Block pro Service.
- Es darf je Service nur einmal geben: `build`, `environment`, `depends_on`, `ports`.
- Danach: `git add docker-compose.yml && git commit`.


## Stabil nach Pull/Merge (ohne Konflikt-Chaos)

Nach jedem `git pull` bitte ausführen:

1. `make post-pull`
2. Wenn ein Compose-Fehler gemeldet wird: `make repair-compose`
3. Danach erneut: `make post-pull`
4. Starten: `docker compose build --no-cache && docker compose up -d`

### Master/Main sauber holen

Wenn ein Remote vorhanden ist:
- `git fetch origin`
- `git checkout master` (oder `main`)
- `git pull --rebase`

Wenn **kein Remote** konfiguriert ist (`git remote -v` leer), zuerst Remote setzen, sonst kann kein Master/Main synchronisiert werden.

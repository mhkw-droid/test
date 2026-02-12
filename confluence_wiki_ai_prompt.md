# Prompt für eine KI zur Erstellung eines Confluence-ähnlichen Wiki-Systems

## Rolle
Du bist ein **Senior Full-Stack Engineer** und **Software-Architekt**. Entwickle eine produktionsreife, sichere und skalierbare Webanwendung, die in Funktionsumfang und UX an Confluence angelehnt ist.

## Ziel
Erstelle eine vollständige Anwendung mit:
- **Frontend:** React (TypeScript)
- **Backend:** Node.js + Express (TypeScript)
- **Datenbank:** PostgreSQL
- **Caching/Queue (optional, aber vorbereitet):** Redis
- **Deployment:** Docker Compose (Kubernetes-ready Struktur optional)

Arbeite **modular, wartbar, testbar und dokumentiert**. Nutze klare Layer (API, Service, Repository/DAO, Domain-Modelle) und ein sauberes Berechtigungskonzept.

---

## Muss-Anforderungen

### 1) Benutzer- und Zugriffsverwaltung
- Registrierung, Login, Logout, Passwort-Reset
- Rollen: `admin`, `editor`, `viewer`
- Gruppenmanagement (Benutzer können Gruppen angehören)
- Rechte auf **Bereichsebene** und **Seitenebene**
- JWT- oder Session-basierte Authentifizierung (mit Refresh-Token-Strategie)

### 2) Seitenverwaltung
- Seite erstellen, bearbeiten, löschen, verschieben
- Seitenhierarchie (Parent/Child)
- Versionierung mit Historie, Diff-Anzeige und Wiederherstellung
- Templates/Vorlagen
- Draft- und Publish-Workflow

### 3) Inhalte & Zusammenarbeit
- Rich-Text-Editor (WYSIWYG + Markdown)
- Unterstützt Tabellen, Codeblöcke, Bilder, Links, Emojis
- Kommentare (inline + threaded discussions)
- Anhänge mit Upload und Versionshistorie
- Tags/Labels

### 4) Suche
- Volltextsuche über Seiteninhalte und Titel
- Filter: Tags, Autor, Erstellungsdatum, Änderungsdatum, Bereich
- Sortierung und Pagination

### 5) Benachrichtigungen
- In-App Notifications
- E-Mail-Benachrichtigungen bei relevanten Änderungen
- Watch/Follow-Funktion für Seiten/Bereiche

### 6) Dashboard
- Zuletzt bearbeitete Seiten
- Favoriten
- Offene Kommentare/Aufgaben
- Aktivitäten-Feed

### 7) Integrationen & Erweiterbarkeit
- LDAP/Active Directory (abstrahiertes Auth-Interface)
- Webhooks für Ereignisse (z. B. Seite erstellt/aktualisiert)
- Öffentliche REST-API (optional GraphQL als Erweiterung)

### 8) Sicherheit
- Schutz gegen XSS, CSRF, SQL-Injection
- Input-Validierung (z. B. Zod/Joi)
- Rate Limiting, sichere Header (Helmet), CORS-Konfiguration
- Passwort-Hashing (Argon2 oder bcrypt)
- Audit-Logs für sicherheitsrelevante und inhaltliche Änderungen

### 9) Export / Import / Betrieb
- Export: PDF, Markdown, HTML
- Import/Backup/Restore-Funktionen
- Konfiguration über ENV-Variablen
- Docker-Compose Setup für lokale Entwicklung
- Healthchecks, Logging, Fehlerhandling

---

## Technische Leitplanken

### Architektur
- Monorepo oder klar getrennte Ordner (`frontend`, `backend`, `docs`, `infra`)
- Backend-Schichten:
  - `routes/controllers`
  - `services`
  - `repositories`
  - `middlewares`
  - `models/entities`
- Frontend-Schichten:
  - `pages`
  - `components`
  - `features`
  - `services/api`
  - `state` (z. B. Redux Toolkit/Zustand)

### Datenbankmodell (mindestens)
- `users`, `roles`, `groups`, `group_members`
- `spaces`
- `pages`
- `page_versions`
- `comments`
- `attachments`, `attachment_versions`
- `tags`, `page_tags`
- `permissions`
- `notifications`
- `audit_logs`

Liefere SQL-Migrations und Seed-Daten.

### API-Design
- REST-Endpunkte versioniert (`/api/v1/...`)
- Konsistente Response-Struktur
- Fehlercodes und Validierungsfehler standardisiert
- OpenAPI/Swagger-Dokumentation

### Qualität
- Unit- und Integrationstests (Backend)
- Component-/E2E-Tests (Frontend)
- Linting + Formatting (ESLint, Prettier)
- README mit Setup-, Run-, Test- und Deploy-Anleitung

---

## Erwartete Ausgabe
Generiere den kompletten Projektinhalt mit:
1. Vollständigem Backend-Code
2. Vollständigem Frontend-Code
3. Datenbankschema + Migrationen
4. Seed-Daten (mindestens: 3 Benutzerrollen, Demo-Benutzer, Beispielbereiche, Beispielseiten, Tags)
5. Docker-Compose und `.env.example`
6. API-Dokumentation (Swagger/OpenAPI)
7. Architektur- und Betriebsdokumentation

Zusätzlich:
- Kommentiere zentrale Funktionen nachvollziehbar.
- Gib am Ende eine kurze Anleitung: **„Projekt starten in 5 Schritten“**.
- Nenne bewusst getroffene Architekturentscheidungen und mögliche nächste Ausbaustufen.

---

## Ausführungsmodus für die KI
Arbeite in folgender Reihenfolge und liefere jede Phase sauber ab:
1. Architekturentwurf + Verzeichnisstruktur
2. Datenbankschema + Migrationen + Seeds
3. Backend (Auth, RBAC, Pages, Versions, Comments, Search, Attachments, Notifications)
4. Frontend (Auth, Dashboard, Editor, Page Tree, Suche, Kommentare)
5. Security Hardening
6. Tests
7. Dockerisierung + Dokumentation

Wenn Annahmen nötig sind, dokumentiere sie explizit.

---

## Direkt nutzbarer Kurz-Prompt
"Schreibe eine vollständige, produktionsnahe Webanwendung für ein Confluence-ähnliches Wiki mit React (TypeScript), Node.js + Express (TypeScript) und PostgreSQL. Implementiere Authentifizierung, Rollen & Berechtigungen (Admin/Editor/Viewer), Gruppen, Bereichs- und Seitenrechte, Seitenhierarchie, Versionierung mit Restore, Rich-Text-Editor mit Markdown, Kommentare (inline/threaded), Anhänge mit Versionierung, Tags, Volltextsuche mit Filtern, Dashboard, In-App/E-Mail-Benachrichtigungen, Audit-Logs, Export (PDF/MD/HTML), Backup/Restore, REST API + OpenAPI, Docker-Compose, ENV-Konfiguration, Seed-Daten, Tests und Sicherheitsmaßnahmen (XSS/CSRF/Validation/Rate-Limit). Strukturiere den Code modular, dokumentiere zentrale Entscheidungen und liefere Startanleitung." 

# Architektur (aktueller Stand)

## Backend
- `routes`: HTTP-Endpunkte
- `services`: Business-Logik (Auth, Audit, Notification)
- `middleware`: AuthN/AuthZ
- `config`: Prisma + ENV

## Frontend
- `api`: HTTP-Client
- `components`: Wiederverwendbare UI-Teile
- `pages`: Seitencontainer (Home mit Dashboard + Suche)

## Datenmodell (Prisma)
- User, Page, PageVersion, Comment, Tag, PageTag
- Notification für In-App Benachrichtigungen
- AuditLog für Änderungsprotokolle
- Hierarchie über self-reference in `Page`
- Threading über self-reference in `Comment`

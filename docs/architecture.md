# Architektur (aktueller Stand)

## Backend
- `routes`: HTTP-Endpunkte
- `services`: Business-Logik (bisher Auth)
- `middleware`: AuthN/AuthZ
- `config`: Prisma + ENV

## Frontend
- `api`: HTTP-Client
- `components`: Wiederverwendbare UI-Teile
- `pages`: Seitencontainer (Home)

## Datenmodell (Prisma)
- User, Page, PageVersion, Comment, Tag, PageTag
- Hierarchie über self-reference in `Page`
- Threading über self-reference in `Comment`

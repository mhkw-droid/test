#!/usr/bin/env bash
set -euo pipefail

cat > docker-compose.yml <<'YAML'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: wiki
      POSTGRES_PASSWORD: wiki
      POSTGRES_DB: wiki
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      args:
        NPM_CONFIG_STRICT_SSL: "false"
    environment:
      DATABASE_URL: postgresql://wiki:wiki@db:5432/wiki?schema=public
      JWT_SECRET: change-me
      PORT: 4000
    depends_on:
      - db
    ports:
      - "4000:4000"

  frontend:
    build:
      context: ./frontend
      args:
        NPM_CONFIG_STRICT_SSL: "false"
    environment:
      VITE_API_BASE_URL: http://localhost:4000/api/v1
    depends_on:
      - backend
    ports:
      - "5173:5173"

volumes:
  postgres_data:
YAML

echo "docker-compose.yml repaired to canonical project version"

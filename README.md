# Babastudio Pilates

Monorepo dla strony Babastudio / pilates.

## Struktura

- `frontend` - Angular, SCSS, routing, bez SSR na start
- `backend` - Java 21, Spring Boot 4.x, Gradle, PostgreSQL, Flyway, Spring Security
- `infra` - Docker Compose i Caddy na VPS
- `uploads` - lokalne pliki uploadowane na VPS-ie, np. zdjecia kadry

## Zakres MVP

- publiczna strona glowna
- sekcja kadry zarzadzana z panelu admina
- sekcja zajec zarzadzana z panelu admina
- integracja Fitssey przez gotowy widget JS / Web Components
- upload zdjec kadry do lokalnego katalogu `uploads`

## Uruchamianie lokalnie

PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up -d postgres
```

Frontend:

```bash
cd frontend
npm start
```

Backend:

```bash
cd backend
./gradlew bootRun
```

Na Windows:

```powershell
cd backend
.\gradlew.bat bootRun
```

## Infrastruktura

Pliki startowe znajduja sie w `infra`. Docelowo znajda sie tam konfiguracje:

- `docker-compose.yml`
- `Caddyfile`
- `.env.example`

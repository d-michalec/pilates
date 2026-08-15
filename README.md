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

## Status prac

Zrobione:

- landing page z hero zarządzanym z panelu admina
- karuzela zdjęć na landing page oraz upload wielu zdjęć z panelu admina
- kadra widoczna publicznie i zarządzana z panelu admina
- lokalny upload zdjęć do katalogu `uploads`
- miniatury dla zdjęć z karuzeli
- integracja widgetu Fitssey na stronie
- prerender Angulara dla publicznych tras
- formularz kontaktowy z lokalnym zapisem wiadomości
- automatyczne czyszczenie starych wiadomości kontaktowych
- podkładka pod Gmail SMTP dla formularza kontaktowego
- podkładka pod newsletter GetResponse: publiczny formularz, lokalny zapis zgody, endpoint backendu, klient API i status w panelu admina
- eventy: panel dodawania, upload zdjęć, publiczny harmonogram i strona szczegółów pod `/event/:id`

Do zrobienia:

- skonfigurować docelowy email sender dla formularza kontaktowego: konto, app password, SPF/DKIM/DMARC, adres nadawcy i odbiorcy
- założyć i skonfigurować GetResponse: lista/campaign, double opt-in, treść zgód, stopka wypisu, domena nadawcza i SPF/DKIM/DMARC
- uzupełnić sekrety GetResponse na VPS-ie
- po konfiguracji GetResponse przetestować realny zapis z formularza newslettera
- podpiąć docelowe linki zapisów do eventów, np. Fitssey albo zewnętrzny formularz
- zabezpieczyć endpointy admina Spring Security

## Formularz kontaktowy i SMTP

Formularz zapisuje wiadomości w tabeli `contact_messages`. Jeżeli SMTP nie jest skonfigurowane, wiadomość zostaje w bazie ze statusem `NEW`, więc lokalne testowanie działa bez konta pocztowego.
Wiadomości są automatycznie usuwane po `CONTACT_RETENTION_DAYS` dniach, domyślnie po 365 dniach. Cleanup uruchamia się według `CONTACT_CLEANUP_CRON`, domyślnie codziennie o 03:20.

Placeholdery pod Gmail SMTP:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=adres@gmail.com
SMTP_PASSWORD=app_password_z_google
CONTACT_TO_EMAIL=damianmichalec5@gmail.com
MAIL_FROM=adres@gmail.com
CONTACT_RETENTION_DAYS=365
CONTACT_CLEANUP_CRON=0 20 3 * * *
```

## Newsletter i GetResponse

Newsletter zapisuje subskrybentów w tabeli `newsletter_subscriptions`. Jeżeli GetResponse nie jest skonfigurowany, zapis zostaje lokalnie ze statusem `LOCAL_ONLY`. Po ustawieniu klucza API i identyfikatora listy/campaign backend wysyła nowe zapisy do GetResponse przez API.

Panel admina newslettera jest dostępny pod `/admin/newsletter`.

Placeholdery pod GetResponse:

```bash
GETRESPONSE_API_URL=https://api.getresponse.com/v3
GETRESPONSE_API_KEY=api_key_z_getresponse
GETRESPONSE_CAMPAIGN_ID=campaign_id_z_getresponse
GETRESPONSE_ADMIN_URL=https://app.getresponse.com/
NEWSLETTER_CONSENT_TEXT=Wyrażam zgodę na otrzymywanie newslettera BABA Studio i wiem, że mogę wycofać zgodę w każdej chwili.
```

## Infrastruktura

Pliki startowe znajduja sie w `infra`. Docelowo znajda sie tam konfiguracje:

- `docker-compose.yml`
- `Caddyfile`
- `.env.example`

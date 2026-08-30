# Babastudio Pilates

Monorepo dla strony Babastudio / pilates.
Wdrożenie, kopie zapasowe i konfiguracja serwera: **[DEPLOY.md](DEPLOY.md)**.

## Terminy do pilnowania

Rzeczy, które nie zgłoszą się same i o których nikt nie przypomni.

| Kiedy | Co sprawdzić | Co się stanie, jeśli nie |
| --- | --- | --- |
| **około 6 września 2026** | Czy rekord `google._domainkey` nadal jest w strefie DNS domeny `baba-studio.pl` w panelu nazwa.pl | Poczta studia straci podpis DKIM i zacznie po cichu trafiać do spamu odbiorców. Bez komunikatu, bez błędu — wiadomości po prostu przestaną docierać |
| co roku, jeśli kupicie Neue Plak | Odnowienie licencji webfontowej w MyFonts | Font działa dalej, bo pliki leżą na serwerze — ale bez ważnej licencji. Monotype skanuje strony i wysyła wezwania do zapłaty |
| raz na kilka miesięcy | `docker system prune -f` na serwerze | Pamięć podręczna Dockera rośnie z każdą aktualizacją i zapełni dysk |
| raz na jakiś czas | `.\infra\pobierz-kopie.ps1` | Kopie zapasowe zostaną wyłącznie na serwerze, więc nie ochronią przed jego utratą |

**Skąd bierze się termin wrześniowy.** Przy przestawianiu rekordu `A` na adres
VPS-a domena musiała przejść na ręczną konfigurację DNS. Nazwa.pl ostrzega, że ta
zmiana wyłącza DKIM i DMARC, a **po czternastu dniach kasuje rekord z kluczem
publicznym**. Klucz Google jest na razie nietknięty i możliwe, że automatyka go nie
dotyczy — ale to jest dokładnie ten rodzaj awarii, który wychodzi po miesiącu,
gdy ktoś powie, że „maile ze studia lądują w spamie". Jeśli rekord zniknie,
odtwarza się go z panelu Google Workspace w sekcji uwierzytelniania poczty.

## Struktura

- `frontend` - Angular, SCSS, routing, prerender wszystkich tras publicznych do statycznego HTML
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

- dwujęzyczność całej strony, sterowana adresem URL
- regulamin i polityka prywatności, z odnośnikami w stopce i przy formularzach
- rezygnacja z newslettera: token w wiadomości powitalnej, strona wypisu, lista
  zapisanych w panelu z możliwością usunięcia na żądanie RODO
- odbieranie rezygnacji zgłoszonych przez stopkę GetResponse (callback)
- kopie zapasowe: skrypt nocny, odtwarzanie, ściąganie na komputer
- `sitemap.xml` generowany przy budowaniu, dane strukturalne `LocalBusiness`
- poczta wychodząca przez Gmail, sprawdzona na żywym formularzu

Do zrobienia:

- **treść regulaminu** — podstrona `/regulamin` ma same nagłówki i wyświetla przy
  każdym pustym punkcie znacznik „TREŚĆ DO UZUPEŁNIENIA". Bez tego nie da się otworzyć strony
- **wypełnić ofertę w Fitssey** — konto jest puste, więc grafik pokaże pustą siatkę
- **przegląd polityki prywatności przez prawnika**
- **wizytówka Google Business Profile** — dla studia w Łodzi ważniejsza niż cała
  reszta SEO razem wzięta, a weryfikacja adresu trwa tygodniami
- rozstrzygnąć font: kupić licencję Neue Plak Bold albo przejść na darmowy zamiennik
  (patrz sekcja Typografia), potem przenieść pliki na własny hosting
- założyć i skonfigurować GetResponse na koncie studia: lista, klucz API, sekret callbacku
- treści i zdjęcia z panelu: kadra, zajęcia, wydarzenia, landing, sauna, bar, kontakt
- prawdziwe zdjęcie zamiast wygenerowanego `frontend/public/og-image.jpg`

## Typografia

Makieta używa dwóch krojów i robi to konsekwentnie:

- **Instrument Serif** — tekst ciągły, nagłówki, logotyp BABA, dane kontaktowe,
  godziny otwarcia. Darmowy, Google Fonts, licencja bezterminowa.
- **Neue Plak Bold** — wyłącznie wersaliki: etykiety sekcji, nawigacja, przyciski.
  Komercyjny, Monotype. W makiecie osadzona jest **tylko odmiana Bold**, żadna inna.

Stąd zasada w kodzie: krój domyślny jest szeryfowy, a bezszeryfowy dokładamy
jawnie tam, gdzie tekst idzie wersalikami. Panel administracyjny zostaje przy
bezszeryfowym — nie ma go w makiecie, to widok roboczy.

**Neue Plak nie jest dziś nigdzie ładowany.** W projekcie nie ma pliku fontu ani
`@font-face`, więc u wszystkich poza maszyną, na której powstawał projekt, strona
wyświetli się w Arial Black. Do rozstrzygnięcia: licencja webfontowa w MyFonts
(57,99 USD rocznie za jeden styl, model roczny z limitem odsłon) albo darmowy
zamiennik — najbliższe wagą i szerokością są **Space Grotesk** i **Jost\***, oba
na licencji SIL Open Font.

## Formularz kontaktowy i SMTP

Formularz zapisuje wiadomości w tabeli `contact_messages`. Jeżeli SMTP nie jest skonfigurowane, wiadomość zostaje w bazie ze statusem `NEW`, więc lokalne testowanie działa bez konta pocztowego.
Wiadomości są automatycznie usuwane po `CONTACT_RETENTION_DAYS` dniach, domyślnie po 365 dniach. Cleanup uruchamia się według `CONTACT_CLEANUP_CRON`, domyślnie codziennie o 03:20.

Wysyłka idzie przez osobne konto Gmail założone pod stronę, a nie przez skrzynkę
właścicielki — dzięki temu nikt nie musi przekazywać hasła do swojej poczty, a
gdyby plik `.env` kiedyś wyciekł, unieważnia się jedno hasło aplikacji zamiast
zmieniać hasło do skrzynki firmowej.

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=wiadomoscizestrony@gmail.com
SMTP_PASSWORD=haslo_aplikacji_z_google        # 16 znaków, BEZ spacji
MAIL_FROM=wiadomoscizestrony@gmail.com        # musi być tym samym adresem co SMTP_USERNAME
MAIL_FROM_NAME=BABA Studio                    # nazwa widoczna w skrzynce odbiorcy
CONTACT_TO_EMAIL=aleksandrakurasik@baba-studio.pl
CONTACT_RETENTION_DAYS=365
CONTACT_CLEANUP_CRON=0 20 3 * * *
```

`SMTP_PASSWORD` to **hasło aplikacji** z `myaccount.google.com/apppasswords`, nie
hasło do konta — Google odciął logowanie hasłem do konta z aplikacji zewnętrznych.
Wymaga włączonej weryfikacji dwuetapowej na tym koncie. Google wyświetla je
z odstępami, ale wpisuje się je ciągiem.

Backend wypisuje przy starcie, w jakim stanie jest poczta — warto sprawdzić po
wdrożeniu, zamiast zakładać:

```bash
docker compose logs backend | grep -i "Poczta wychodząca"
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

# Wdrożenie BABA Studio

Całość stoi na trzech kontenerach: baza, backend i serwer WWW. Ten ostatni robi
dwie rzeczy naraz — serwuje statyczną stronę i przekazuje zapytania `/api` oraz
`/uploads` do backendu. Dzięki temu wszystko żyje pod jedną domeną i nie ma
zapytań międzydomenowych.

```
przeglądarka → Caddy (web) ─┬→ pliki strony z /srv
                            └→ backend:8080 → postgres:5432
```

## Czego potrzeba na serwerze

VPS z Dockerem i wtyczką compose, **2 vCPU i 4 GB RAM w zupełności wystarczą**.
Otwarte porty 80 i 443.

Same usługi zajmują około 1,7 GB, bo mają ustawione limity pamięci: baza 512 MB,
backend 1 GB, serwer WWW 128 MB. Szczytem obciążenia jest budowanie obrazów, nie
działanie strony — Gradle i kompilacja frontu potrzebują po około 1–1,5 GB.
Dlatego przy pierwszym uruchomieniu na małej maszynie warto zbudować obrazy
pojedynczo, zamiast obu naraz:

```bash
docker compose build backend
docker compose build web
docker compose up -d
```

Dysk 40 GB starcza z zapasem, ale pamięć podręczna Dockera rośnie z każdą
aktualizacją. Raz na kilka miesięcy warto ją wyczyścić:

```bash
docker system prune -f
```

> **Automatyczna kopia zapasowa u dostawcy to nie to samo co kopia bazy.**
> Migawka maszyny robiona przy działającym Postgresie może być niespójna, bo
> łapie pliki w połowie zapisu. Traktuj ją jako zabezpieczenie przed awarią
> sprzętu, a nie przed pomyłką w danych — do tego służy `pg_dump` opisany niżej.

## Kolejność przy pierwszym uruchomieniu

**1. Skieruj domenę na serwer.** Rekord `A` dla `babapilates.pl` (i `www`, jeśli
ma działać) na adres IP serwera. Zrób to **przed** uruchomieniem kontenerów:
Caddy prosi o certyfikat od razu przy starcie, a Let's Encrypt ogranicza liczbę
nieudanych prób. Sprawdź, że propagacja doszła:

```bash
dig +short babapilates.pl
```

**2. Wgraj kod i przygotuj konfigurację.**

```bash
git clone https://github.com/d-michalec/pilates.git
cd pilates/infra
cp .env.example .env
```

Uzupełnij `.env`. Backend odmówi startu, jeśli login albo hasło administratora
zostaną puste lub na domyślnej wartości `admin` — to celowe, żeby dane
z repozytorium nie pojechały na produkcję. Samo `docker compose build` działa bez
pliku `.env`, więc obrazy można zbudować na próbę wcześniej.

**3. Uruchom.**

```bash
docker compose up -d --build
docker compose logs -f
```

Pierwsze budowanie obu obrazów trwa około dziesięciu minut — Gradle i npm
pobierają zależności. Kolejne są znacznie krótsze, bo warstwa z zależnościami
zostaje w pamięci podręcznej i zmiana samego kodu jej nie unieważnia.

Flyway zakłada schemat bazy przy pierwszym starcie backendu — nie trzeba niczego
wykonywać ręcznie.

> **Strony wydarzeń a kolejność budowania.** Front generuje statyczne strony
> wydarzeń, odpytując backend podczas budowania. Przy pierwszym `up --build`
> backend jeszcze nie działa, więc strony wydarzeń powstaną jako renderowane po
> stronie klienta — działają normalnie, ale wyszukiwarka widzi pustą skorupę.
> Po wgraniu wydarzeń z panelu przebuduj sam front, żeby weszły do indeksu:
>
> ```bash
> docker compose up -d --build web
> ```
>
> Warto powtarzać to po każdej większej zmianie treści — na przykład raz na
> miesiąc albo po dodaniu nowych wydarzeń.

**4. Sprawdź, że działa.**

```bash
curl -I https://babapilates.pl                 # 200 i nagłówek strict-transport-security
curl -s https://babapilates.pl/api/settings    # odpowiedź JSON z backendu
curl -sI https://babapilates.pl | grep -i robots   # ma być noindex do dnia premiery
```

Potem zaloguj się na `/admin/login` i wgraj treści.

## Aktualizacja

```bash
cd pilates
git pull
docker compose -f infra/docker-compose.yml up -d --build
```

Nowe migracje bazy wykonują się same przy starcie backendu. Wolumeny zostają
nietknięte, więc zdjęcia i dane nie znikają.

## Kopia zapasowa

Warte zabezpieczenia są dwie rzeczy: baza i wgrane zdjęcia.

```bash
# baza
docker compose exec postgres pg_dump -U babastudio babastudio > kopia-$(date +%F).sql

# zdjęcia
docker run --rm -v babastudio_uploads:/dane -v "$PWD":/kopia alpine \
  tar czf /kopia/uploads-$(date +%F).tar.gz -C /dane .
```

Zanim uznasz kopię za działającą, odtwórz ją raz na czystym środowisku. Kopia,
której nikt nie próbował odtworzyć, jest tylko przypuszczeniem.

## W dniu otwarcia studia

Do tego czasu strona jest celowo niewidoczna dla wyszukiwarek. Żeby ją otworzyć:

1. W `infra/.env` ustaw `ROBOTS_TAG=all`.
2. W `frontend/public/robots.txt` zamień treść na wersję docelową z komentarza.
3. `docker compose up -d --build web`

Osobno, przed premierą, zostaje do zrobienia:

- prawdziwy numer telefonu zamiast `123 456 789` w `core/contact-details.ts`
  (bez niego nie ma sensu wstawiać danych strukturalnych `LocalBusiness`),
- `og:image` i `sitemap.xml`,
- ograniczenie liczby zapytań na `/api/contact` i `/api/newsletter/subscribe`,
- klucz API GetResponse, jeśli newsletter ma faktycznie zbierać adresy.

## Próba generalna bez serwera

Całość da się uruchomić lokalnie, zanim pojawi się VPS. Sprawdza to wszystko poza
certyfikatem i domeną: konfigurację Caddy'ego, przekazywanie zapytań do backendu,
migracje na czystej bazie i odmowę startu przy domyślnym haśle.

```bash
cd infra
cp .env.example .env     # ustaw ADMIN_USERNAME, ADMIN_PASSWORD, SITE_DOMAIN=localhost
docker compose up -d
docker compose logs -f
```

Strona stanie pod `https://localhost` z certyfikatem samopodpisanym, więc
przeglądarka pokaże ostrzeżenie — to normalne i nie oznacza błędu.

Uwaga na porty: jeśli masz uruchomiony backend albo bazę do pracy nad projektem,
zatrzymaj je wcześniej, bo zajmują te same porty.

## Rzeczy, o które łatwo się potknąć

**Certyfikat się nie pobiera.** Prawie zawsze DNS albo zablokowany port 80.
Caddy potrzebuje portu 80 także wtedy, gdy strona działa po HTTPS — tamtędy idzie
potwierdzenie własności domeny. `docker compose logs web` powie dokładnie.

**Baza odrzuca hasło: `password authentication failed for user "babastudio"`.**
Postgres zapisuje hasło w danych przy **pierwszym** uruchomieniu i później zmiana
`POSTGRES_PASSWORD` nic nie zmienia — ta zmienna jest czytana tylko przy
zakładaniu katalogu z danymi. Jeśli wolumen już istnieje, obowiązuje stare hasło.

Masz dwa wyjścia. Albo wpisz w `.env` hasło, którym baza została założona — na
maszynie deweloperskiej to zwykle `babastudio` — albo załóż bazę od nowa,
świadomie tracąc jej zawartość:

```bash
docker compose down
docker volume rm babastudio_postgres-data
docker compose up -d
```

Na świeżym serwerze problem nie wystąpi, bo wolumen powstaje razem z pierwszym
uruchomieniem i przyjmuje hasło z `.env`.

**Backend nie wstaje z komunikatem o haśle administratora.** Brakuje
`ADMIN_USERNAME` albo `ADMIN_PASSWORD` w `infra/.env`, albo któreś zostało na
wartości `admin`. Wartości domyślne są w repozytorium, więc na serwerze muszą być
inne.

**Backend restartuje się w kółko.** Zwykle brak zmiennej wymaganej w `.env` albo
niewykonana migracja. `docker compose logs backend` pokazuje powód w pierwszych
liniach wyjątku.

**Wszyscy dostają komunikat o zbyt wielu zgłoszeniach.** Limit liczy się per adres
odwiedzającego, a ten przychodzi z nagłówka `X-Forwarded-For` ustawianego przez
Caddy. Jeśli backend zostanie wystawiony bezpośrednio, z pominięciem Caddy'ego,
wszystkie zapytania będą wyglądały na jeden adres i limit obejmie wszystkich
naraz. Dlatego usługa `backend` w `docker-compose.yml` celowo nie publikuje portu.

**Wszystkie zdjęcia zwracają 404, choć strona działa.** Baza i pliki to dwie
osobne rzeczy: w bazie są tylko nazwy plików, a same pliki leżą w wolumenie
`uploads`. Jeśli przeniesiesz bazę na nowy serwer bez katalogu ze zdjęciami, każdy
odnośnik będzie wskazywał na plik, którego tam nie ma.

Przenosząc treści na serwer, weź obie rzeczy naraz — zrzut bazy i archiwum
z wolumenu `uploads`, oba opisane w sekcji o kopii zapasowej. Odtworzenie
wolumenu:

```bash
docker run --rm -v babastudio_uploads:/dane -v "$PWD":/kopia alpine \
  tar xzf /kopia/uploads-RRRR-MM-DD.tar.gz -C /dane
```

**Zdjęcia zniknęły po aktualizacji.** Oznacza, że wolumen `uploads` został
usunięty — najczęściej przez `docker compose down -v`. Ta flaga kasuje wolumeny
i przy tym projekcie nie powinna być używana.

**Zmiana w `Caddyfile` nie robi żadnej różnicy.** `docker compose up -d web`
porównuje definicję usługi i obraz — jedno i drugie zostało bez zmian, więc
kontener nie jest ruszany. Caddyfile jest podpięty jako plik, a jego zawartości
Compose nie śledzi. Po każdej edycji:

```bash
docker compose restart web
```

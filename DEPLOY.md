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

### Co jest do stracenia

Rezerwacje, klienci i płatności siedzą w Fitssey i to Fitssey je zabezpiecza.
Po naszej stronie zostają cztery rzeczy, i różnią się one wartością:

| Dane | Gdzie | Da się odtworzyć bez kopii? |
| --- | --- | --- |
| Treść strony | baza | Tak — dzień przeklikiwania w panelu |
| Zdjęcia | wolumen `uploads` | Tak, o ile właścicielka ma oryginały u siebie |
| Wiadomości z formularza | baza | **Nie** |
| Zapisy do newslettera | baza | **Nie** |

Dwie ostatnie pozycje są jedynym powodem, dla którego ta sekcja istnieje.

Najczęstszą przyczyną utraty danych nie jest awaria sprzętu, tylko
`docker compose down -v` wpisane przez zmęczoną osobę podczas aktualizacji.
Przed tym broni każda kopia, nawet leżąca na tym samym dysku.

### Uruchomienie

```bash
cd /root/pilates/infra
chmod +x backup.sh restore.sh
./backup.sh
```

Kopie lądują w `/var/backups/babastudio`, poza katalogiem projektu — żeby nie dało
się ich przypadkiem zacommitować. Starsze niż czternaście dni kasują się same.
Obie wartości da się zmienić zmiennymi `KATALOG_KOPII` i `DNI_PRZECHOWYWANIA`.

Codziennie o trzeciej w nocy, przez crona roota:

```bash
crontab -e
```

```
0 3 * * * cd /root/pilates/infra && ./backup.sh >> /var/log/babastudio-backup.log 2>&1
```

Skrypt kończy się błędem, gdy zrzut bazy nie zawiera ani jednej tabeli albo gdy
archiwum zdjęć jest uszkodzone. To celowe: `pg_dump | gzip` bez zabezpieczenia
melduje sukces także wtedy, gdy `pg_dump` padnie w połowie, bo `gzip` swoją część
wykonał bez zarzutu. Powstaje wtedy poprawne archiwum z uciętą bazą w środku —
gorsze niż brak kopii, bo wygląda na kopię aż do dnia, w którym trzeba jej użyć.

### Kopia poza serwerem

Kopia leżąca wyłącznie na serwerze nie chroni przed utratą samego serwera.
W 2021 spłonęła serwerownia OVH w Strasburgu i część klientów straciła wszystko,
bo ich kopie były w tym samym budynku.

Z Windowsa, z katalogu `infra`:

```powershell
.\pobierz-kopie.ps1
```

Skrypt sam znajduje najnowszą kopię, ściąga zrzut bazy razem z pasującym
archiwum zdjęć i zapisuje je w `%USERPROFILE%\Kopie\babastudio`. Warto puszczać
go po każdej większej zmianie treści.

### Odtworzenie

```bash
./restore.sh /var/backups/babastudio/baza-2026-08-19_0300.sql.gz
```

Archiwum zdjęć z tej samej chwili znajduje się samo, po znaczniku czasu w nazwie.
Skrypt pyta o potwierdzenie, zatrzymuje backend, kasuje schemat i wgrywa zrzut
od nowa — bo wgranie kopii na istniejące tabele zostawiłoby wiersze usunięte już
po jej wykonaniu i dałoby stan, którego nigdy nie było.

> **Odtwórz kopię raz, zanim będzie potrzebna.** Najlepiej lokalnie, na próbnym
> stacku: zrób kopię, skasuj wolumeny, odtwórz i sprawdź, czy treść i zdjęcia
> wracają. Kopia, której nikt nie próbował odtworzyć, jest tylko przypuszczeniem,
> a odtwarzanie wymyślane po raz pierwszy w chwili awarii idzie źle zawsze.

### Dane osobowe

Kopie zawierają imiona, adresy e-mail i numery telefonu osób, które wypełniły
formularz albo zapisały się do newslettera. To dane osobowe i obowiązują je te
same zasady co bazę produkcyjną:

- nie zostawiaj ściągniętych kopii na pulpicie ani w katalogu synchronizowanym
  z chmurą, do której dostęp mają osoby postronne,
- czternastodniowe okno przechowywania jest świadomym ograniczeniem, nie
  przypadkiem — im dłużej trzymamy kopie, tym dłużej żyją w nich dane osób,
  które prosiły o usunięcie,
- gdy ktoś skorzysta z prawa do bycia zapomnianym, usunięcie wiersza z bazy nie
  usuwa go z kopii. Zniknie stamtąd sam po dwóch tygodniach — i to jest powód,
  żeby tego okna nie wydłużać bez potrzeby.

## W dniu otwarcia studia

Do tego czasu strona jest celowo niewidoczna dla wyszukiwarek. Żeby ją otworzyć:

1. W `infra/.env` ustaw `ROBOTS_TAG=all`.
2. W `frontend/public/robots.txt` zamień treść na wersję docelową z komentarza.
3. `docker compose up -d --build web`

Osobno, przed premierą, zostaje do zrobienia:

- prawdziwy numer telefonu zamiast `123 456 789` w `core/contact-details.ts`
  (bez niego nie ma sensu wstawiać danych strukturalnych `LocalBusiness`),
- `og:image` i `sitemap.xml`,
- klucz API GetResponse, jeśli newsletter ma faktycznie zbierać adresy,
- **treść regulaminu.** Podstrona `/regulamin` ma same nagłówki, a każdy pusty
  punkt wyświetla na stronie znacznik „TREŚĆ DO UZUPEŁNIENIA". Treść pisze
  właścicielka albo jej prawnik — te punkty to jej zobowiązania wobec klientek,
- **przegląd polityki prywatności przez prawnika.** Opis jest zgodny z tym, co
  system faktycznie robi z danymi, ale podstawy prawne i sformułowania powinien
  potwierdzić ktoś z uprawnieniami,
- **działający SMTP.** Bez niego nie wyjdzie wiadomość powitalna z odnośnikiem do
  rezygnacji z newslettera, a wtedy jedyną drogą wypisu zostaje prośba mailem.

## Newsletter: dwie listy, które muszą się zgadzać

Adresy żyją w dwóch miejscach naraz — w naszej bazie i na liście w GetResponse.
To nie jest duplikat do usunięcia, tylko konsekwencja podziału ról: my zbieramy
zgody, GetResponse wysyła. Problem w tym, że **rezygnacja może się zdarzyć po
każdej ze stron**, a bez konfiguracji obie listy zaczynają się rozjeżdżać.

| Gdzie ktoś klika | Co się dzieje bez konfiguracji |
| --- | --- |
| Stopka w wiadomości z GetResponse | Znika z ich listy, u nas **zostaje jako zgoda** |
| Nasz odnośnik z wiadomości powitalnej | Znika u nas i przez API u nich — działa |

Pierwszy wiersz zamyka callback. W GetResponse: **Integracje → Callback → Enable
callback**, zaznacz wyłącznie *The latest unsubscribes* i wpisz adres:

```
https://babapilates.pl/api/newsletter/getresponse-callback?secret=TENSEKRET
```

`TENSEKRET` musi być tą samą wartością co `NEWSLETTER_CALLBACK_SECRET` w `.env`.
Wygeneruj ją przez `openssl rand -hex 24`. Bez sekretu endpoint odpowiada 404 —
celowo, bo GetResponse nie podpisuje swoich wywołań i adres bez sekretu byłby
otwartą furtką do wypisywania dowolnych osób.

Dwie rzeczy warte zapamiętania z ich dokumentacji:

- **Nieodebrane wywołanie przepada i nie jest ponawiane**, a limit czasu to cztery
  sekundy. Dlatego nasz endpoint tylko zapisuje do bazy. Jeśli backend akurat nie
  stał, ta rezygnacja nie dotrze nigdy i trzeba ją nanieść ręcznie.
- **Callback obejmuje wyłącznie kliknięcie w stopkę.** Odbicia i zgłoszenia spamu
  idą osobnym zdarzeniem, którego nie odbieramy — takie adresy zostaną u nas jako
  aktywne, choć GetResponse przestanie do nich pisać.

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

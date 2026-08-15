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

VPS z Dockerem i wtyczką compose. Dla tego ruchu wystarczy 2 vCPU i 4 GB RAM —
pamięć zjada głównie budowanie obrazu backendu, samo działanie jest lekkie.
Otwarte porty 80 i 443.

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

Uzupełnij `.env`. Bez `ADMIN_USERNAME`, `ADMIN_PASSWORD` i `CONTACT_TO_EMAIL`
kontenery nie wstaną — to celowe, żeby domyślne `admin/admin` nie pojechało na
produkcję.

**3. Uruchom.**

```bash
docker compose up -d --build
docker compose logs -f
```

Pierwszy build backendu trwa kilka minut, bo Gradle pobiera zależności. Flyway
sam zakłada schemat bazy przy pierwszym starcie — nie trzeba niczego wykonywać
ręcznie.

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

## Rzeczy, o które łatwo się potknąć

**Certyfikat się nie pobiera.** Prawie zawsze DNS albo zablokowany port 80.
Caddy potrzebuje portu 80 także wtedy, gdy strona działa po HTTPS — tamtędy idzie
potwierdzenie własności domeny. `docker compose logs web` powie dokładnie.

**Backend restartuje się w kółko.** Zwykle brak zmiennej wymaganej w `.env` albo
niewykonana migracja. `docker compose logs backend` pokazuje powód w pierwszych
liniach wyjątku.

**Wszyscy dostają komunikat o zbyt wielu zgłoszeniach.** Limit liczy się per adres
odwiedzającego, a ten przychodzi z nagłówka `X-Forwarded-For` ustawianego przez
Caddy. Jeśli backend zostanie wystawiony bezpośrednio, z pominięciem Caddy'ego,
wszystkie zapytania będą wyglądały na jeden adres i limit obejmie wszystkich
naraz. Dlatego usługa `backend` w `docker-compose.yml` celowo nie publikuje portu.

**Zdjęcia zniknęły po aktualizacji.** Oznacza, że wolumen `uploads` został
usunięty — najczęściej przez `docker compose down -v`. Ta flaga kasuje wolumeny
i przy tym projekcie nie powinna być używana.

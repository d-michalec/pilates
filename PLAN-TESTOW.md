# Plan testów — BABA Studio

Dotyczy zmian z sesji z 3 sierpnia 2026: opóźnienie grafiku, hydratacja, SEO wydarzeń,
prerender stron wydarzeń oraz zabezpieczenie panelu admina.

## Przygotowanie

```bash
# 1. Baza
docker compose -f infra/docker-compose.yml up -d postgres

# 2. Backend — MUSI działać, inaczej prerender pominie strony wydarzeń
cd backend
.\gradlew.bat bootRun

# 3. Frontend (dev)
cd frontend
npm start
```

Do testów produkcyjnych zamiast `npm start`:

```bash
cd frontend
npm run build
npx http-server dist/babastudio-frontend/browser -p 4300
```

Legenda: **[DEV]** wystarczy dev server, **[BUILD]** wymaga produkcyjnego builda,
**[API]** test na samym backendzie.

---

## 1. Bezpieczeństwo panelu admina

Najważniejsza część — do tej pory te endpointy były w pełni publiczne.

### 1.1 Endpointy admina odrzucają żądania bez logowania [API]

```bash
curl -i -X GET http://localhost:8080/api/admin/session
```

Oczekiwane: **401**, bez przekierowania (`Location`) i bez formularza logowania w treści.

Powtórz dla zapisu — to jest test właściwej dziury:

```bash
curl -i -X POST http://localhost:8080/api/admin/team -F "fullName=Test" -F "description=Test"
```

Oczekiwane: **401**. Przed zmianą przechodziło i tworzyło rekord.

### 1.2 Poprawne dane logowania przechodzą [API]

```bash
curl -i -u admin:admin http://localhost:8080/api/admin/session
```

Oczekiwane: **200** i `{"username":"admin"}`.

### 1.3 Błędne hasło odrzucone [API]

```bash
curl -i -u admin:zlehaslo http://localhost:8080/api/admin/session
```

Oczekiwane: **401**.

### 1.4 Endpointy publiczne nadal działają bez logowania [API]

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/team
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/events
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/classes
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/landing
```

Oczekiwane: cztery razy **200**. To test na regresję — łatwo przy okazji zabezpieczyć za dużo.

### 1.5 Formularz kontaktowy i newsletter nadal publiczne [API]

```bash
curl -i -X POST http://localhost:8080/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Wiadomosc testowa"}'
```

Oczekiwane: **200/201**, nie 401.

### 1.6 Ostrzeżenie o domyślnym haśle [API]

Uruchom backend bez ustawionego `ADMIN_PASSWORD` i sprawdź log startowy.

Oczekiwane: ostrzeżenie `Panel admina działa na domyślnym haśle "admin"`.

Potem uruchom z własnym hasłem i sprawdź, że ostrzeżenie znika, a stare hasło przestaje działać:

```powershell
$env:ADMIN_PASSWORD="mocne-haslo-testowe"
.\gradlew.bat bootRun
```

```bash
curl -i -u admin:admin http://localhost:8080/api/admin/session          # oczekiwane 401
curl -i -u admin:mocne-haslo-testowe http://localhost:8080/api/admin/session  # oczekiwane 200
```

### 1.7 Guard w panelu [DEV]

| Krok | Oczekiwane |
| --- | --- |
| Wejdź na `/admin/landing` bez logowania | przekierowanie na `/admin/login?powrot=/admin/landing` |
| Zaloguj się poprawnymi danymi | powrót na `/admin/landing` |
| Zaloguj się błędnym hasłem | komunikat „Nieprawidłowa nazwa użytkownika albo hasło", zostajesz na formularzu |
| Odśwież stronę panelu po zalogowaniu | nadal zalogowany (sessionStorage) |
| Zamknij kartę i otwórz `/admin/landing` ponownie | znów formularz logowania |
| Wejdź na `/admin/login` będąc zalogowanym, przejdź na `/admin/kadra` | brak pętli przekierowań |

### 1.8 Zapis z panelu przechodzi z nagłówkiem [DEV]

Zaloguj się i dodaj osobę w `/admin/kadra`. W DevTools → Network sprawdź żądanie `POST /api/admin/team`.

Oczekiwane: nagłówek `Authorization: Basic ...` obecny, odpowiedź **200/201**, osoba widoczna na `/kadra`.

### 1.9 Reakcja na wygasłe dane [DEV]

Zaloguj się do panelu, potem w konsoli przeglądarki:

```js
sessionStorage.removeItem('baba-admin-auth'); location.reload();
```

Oczekiwane: przekierowanie na formularz logowania.

Drugi wariant — podmień dane na błędne i spróbuj zapisać:

```js
sessionStorage.setItem('baba-admin-auth', btoa('admin:zle'));
```

Oczekiwane: backend zwraca 401, panel czyści sesję i odsyła na `/admin/login`.

### 1.10 Nie da się przekierować poza panel [DEV]

Wejdź na `/admin/login?powrot=https://example.com` i zaloguj się.

Oczekiwane: ląduje na `/admin/landing`, **nie** na example.com.

---

## 2. Opóźnienie grafiku

### 2.1 Brak przeładowania aplikacji przy przejściu na grafik [DEV]

Wejdź na `/`, otwórz konsolę i wpisz:

```js
window.__test = 'zyje';
```

Kliknij „Zarezerwuj sesję", a po załadowaniu `/grafik` sprawdź:

```js
window.__test;
```

Oczekiwane: `'zyje'`. Jeśli `undefined`, przeglądarka przeładowała stronę i regresja wróciła.

Powtórz dla pozostałych trzech wejść: pozycja „Grafik" w menu landingu, „Grafik zajęć"
w sekcji kontaktowej oraz „Grafik" i „Zapisz się" we wspólnym menu.

### 2.2 Iframe ładuje się raz, nie dwa [BUILD]

Ten test ma sens **tylko na produkcyjnym buildzie**, bo dev server nie prerenderuje.

DevTools → Network, filtr `fitssey`, wejdź bezpośrednio na `/grafik` i odśwież.

Oczekiwane: **jedno** żądanie do `frontoffice?widget=1`. Dwa oznaczają, że hydratacja przestała działać.

### 2.3 Brak błędów hydratacji [DEV]

Konsola na `/grafik`.

Oczekiwane: komunikat `Angular hydrated N component(s)`, brak `NG0500` i `NG0501`.

Jeśli pojawi się `NG0500` przy stopce lub innym komponencie PrimeNG — dopisz
`host: { ngSkipHydration: 'true' }` do tego komponentu.

### 2.4 Skeleton widoczny przy wolnym łączu [DEV]

DevTools → Network → throttling **Slow 4G**, twarde odświeżenie `/grafik`.

Oczekiwane: widoczny animowany skeleton listy terminów i napis „Ładujemy grafik rezerwacji...",
potem płynne pojawienie się grafiku. Bez skoku układu i bez białej pustej płachty.

### 2.5 Skeleton nie zostaje na zawsze [DEV]

Zablokuj domenę Fitssey (DevTools → Network → Block request domain → `app.fitssey.com`) i odśwież `/grafik`.

Oczekiwane: po około 8 sekundach skeleton znika mimo braku odpowiedzi. Strona nie zawiesza się w stanie ładowania.

### 2.6 Warmup startuje na intencję [DEV]

Na `/` otwórz menu (albo najedź na „Zarezerwuj sesję"), potem w konsoli:

```js
document.getElementById('fitssey-warmup-frame');
```

Oczekiwane: element istnieje. Po przejściu na `/grafik` ten sam kod ma zwrócić `null`,
a na stronie ma być dokładnie jeden iframe:

```js
document.querySelectorAll('iframe').length;   // oczekiwane: 1
```

### 2.7 Warmup pomijany przy oszczędzaniu danych [DEV]

DevTools → Network → throttling **Slow 3G**, przeładuj `/` i otwórz menu.

Oczekiwane: `fitssey-warmup-frame` **nie** powstaje (samo `preconnect` tak).

### 2.8 Pozycja scrolla [DEV]

Przewiń `/` na sam dół, kliknij „Grafik zajęć".

Oczekiwane: `/grafik` otwiera się od góry, nie w połowie strony.

Potem cofnij się strzałką wstecz — oczekiwane: powrót na wcześniejszą pozycję scrolla.

---

## 3. SEO

### 3.1 Tytuły i opisy wszystkich tras [DEV]

W konsoli przeglądarki:

```js
for (const r of ['/', '/pilates', '/grafik', '/kadra', '/wydarzenia', '/faq', '/kontakt']) {
  const html = await fetch(r).then(x => x.text());
  const t = (html.match(/<title>([^<]*)<\/title>/) || [,''])[1];
  const d = (html.match(/<meta name="description" content="([^"]*)"/) || [,''])[1];
  console.log(r, '|', t, '|', d.slice(0, 60));
}
```

Oczekiwane: każda trasa ma **własny** tytuł i **niepusty** opis.
Szczególnie `/wydarzenia` — wcześniej miało domyślne „BABA Studio" i pusty opis.

### 3.2 Treść z API trafia do HTML-a [DEV]

```js
const html = await fetch('/kadra').then(x => x.text());
html.includes('Damian Michalec');   // oczekiwane: true
```

Analogicznie `/pilates` z nazwą zajęć i `/wydarzenia` z tytułem wydarzenia.
To test na to, czy backend odpowiada w trakcie renderowania.

### 3.3 Linki są prawdziwymi linkami [DEV]

```js
[...document.querySelectorAll('a')].filter(a => /grafik/i.test(a.textContent)).map(a => a.getAttribute('href'));
```

Oczekiwane: `/grafik`, nie `null` ani `undefined`. Bez `href` crawler nie przejdzie dalej.

### 3.4 Strony wydarzeń są prerenderowane [BUILD]

Kluczowy test tej zmiany — **wymaga builda z działającym backendem**.

W logu `npm run build` szukaj:

```
[prerender] Generuję N stron wydarzeń z http://localhost:8080.
```

Potem sprawdź liczbę prerenderowanych tras — powinno być **8 zamiast 7** (7 statycznych + 1 wydarzenie).

Na koniec obejrzyj wygenerowany plik:

```powershell
Get-ChildItem -Recurse frontend\dist -Filter index.html | Where-Object { $_.FullName -match 'event' }
```

Oczekiwane: plik istnieje, zawiera tytuł wydarzenia i jego opis, a nie samą pustą skorupę.

### 3.5 Build nie wywala się bez backendu [BUILD]

Zatrzymaj backend i uruchom `npm run build`.

Oczekiwane: build **przechodzi**, w logu ostrzeżenie `Backend ... niedostępny. Pomijam strony wydarzeń.`
Strony wydarzeń się nie generują, ale nic się nie psuje.

> Uwaga: to jest też przypomnienie, że produkcyjny build **musi** mieć wstawiony backend,
> inaczej `/kadra`, `/pilates` i `/wydarzenia` pojadą na produkcję puste.

### 3.6 Wydarzenie dodane po buildzie nadal działa [BUILD]

Po zbudowaniu dodaj nowe wydarzenie z panelu i wejdź na jego `/event/<id>`.

Oczekiwane: strona **działa** (fallback renderowany po stronie klienta), choć nie jest
jeszcze prerenderowana. Wejdzie do indeksu przy następnym buildzie.

---

## 4. Regresje ogólne

| Test | Oczekiwane |
| --- | --- |
| Formularz kontaktowy na `/kontakt` i na landingu | wiadomość zapisana, komunikat sukcesu |
| Newsletter w stopce | zapis przechodzi, komunikat sukcesu |
| Karuzela na landingu | przewija się płynnie w obie strony, bez skoków |
| Menu hamburgerowe na każdej podstronie | otwiera się, zamyka Escape i kliknięciem w tło |
| `/event/:id` z nieistniejącym ID | komunikat błędu, nie biała strona |
| Widok mobilny (DevTools, 375 px) | brak poziomego przewijania na wszystkich trasach |
| Sauna i bar na telefonie | kolejność od góry: etykieta sekcji, zdjęcie, tekst |
| Kadra na telefonie | zdjęcie kwadratowe, nazwisko widoczne bez przewijania |
| Karty „Co przygotowaliśmy" na telefonie | jedna kolumna poniżej 620 px, dwie do 720 px, bez pustych obszarów w kartach |
| Strzałki karuzeli na telefonie | przy krawędziach, wyśrodkowane w pionie, mniejsze niż na desktopie |
| Stopka na telefonie | jedna kolumna także wtedy, gdy nie ma linków do social mediów |
| Konsola na każdej trasie | brak czerwonych błędów |

---

## Znane braki (celowo nie zrobione)

Do zaplanowania w kolejnych partiach — nie testuj, bo tego jeszcze nie ma:

- **Wylogowanie w panelu** — nie ma przycisku. Na razie: zamknięcie karty albo
  `sessionStorage.removeItem('baba-admin-auth')`.
- **Edycja, usuwanie i kolejność** dla zajęć, eventów, kadry i galerii — backend
  wystawia wyłącznie GET i POST.
- **Podstrony `/sauna` i `/bar`** — w menu prowadzą do sekcji „oferta" na landingu.
- **SEO przedpremierowe** — `og:image`, canonical, `robots.txt`, `sitemap.xml`,
  JSON-LD `LocalBusiness` (to ostatnie dopiero po wstawieniu prawdziwego telefonu
  zamiast `123 456 789` na `/kontakt`).
- **Infrastruktura** — `Caddyfile` jest pusty, brak Dockerfile'i, `docker-compose`
  stawia wyłącznie Postgresa.
- **Blokada indeksowania przed premierą** — przy pierwszym deployu potrzebny
  `robots.txt` z `Disallow: /` i `X-Robots-Tag: noindex`.
- **Produkcyjne SMTP i GetResponse** — działają jako podkładki, bez realnych kont.
- **Rate limiting** na `/api/contact` i `/api/newsletter/subscribe`.

## Test automatyczny dwujęzyczności (`e2e/i18n-e2e.js`)

Skrypt przechodzi całą drogę treści: zapis przez API panelu → odczyt przez API
publiczne → wyrenderowany HTML na `/…` i `/en/…` → sprzątanie danych. 39 asercji
obejmujących zajęcia, kadrę, wydarzenia, FAQ, landing, saunę, bar, nawigację i SEO.

```bash
# backend na 8080 i `ng serve` na 4200 muszą działać
node e2e/i18n-e2e.js
```

Kod wyjścia 0 oznacza komplet zaliczonych asercji, 1 — listę błędów na stdout.
Dane logowania biorą się z `ADMIN_USERNAME` / `ADMIN_PASSWORD`, domyślnie `admin`
/ `admin` — tak samo jak w `application.yaml`. Po zmianie hasła trzeba przekazać
je do skryptu.

Co sprawdza poza samym tłumaczeniem:

- **Zachowanie awaryjne** — wpis bez tłumaczenia pokazuje polski tekst na `/en`,
  a nie puste miejsce. Testowane na kadrze, gdzie obok siebie stoją dwie osoby:
  jedna z tłumaczeniem, druga bez.
- **Puste tłumaczenie zapisuje się jako `null`**, a nie jako pusty ciąg — inaczej
  zachowanie awaryjne przestałoby działać.
- **Szczelność drzew językowych** — strona angielska nie linkuje do polskich tras
  i odwrotnie, a przełącznik prowadzi do tej samej podstrony w drugim języku.
- **`lang` i `hreflang`** w wyrenderowanym HTML, czyli w tej wersji, którą czyta robot.

Dane testowe mają prefiks `E2E-TMP` i są kasowane w bloku `finally`, więc zostają
usunięte także po błędzie. Na końcu skrypt niezależnie sprawdza, czy w bazie nie
został żaden rekord z tym prefiksem — gdyby coś zostało, zgłasza to jako błąd.

Sam test został zweryfikowany kontrolą negatywną: uruchomiony przeciw atrapie
z celowo zepsutą dwujęzycznością zapalał dokładnie te asercje, które powinien
(np. brak `hreflang` → 38/39, ignorowanie pól angielskich w HTML → 30/39).

### Co znalazł przy pierwszym uruchomieniu

Kolejność argumentów w `EventResponse.from()` nie odpowiadała deklaracji rekordu:
po cenie szło od razu pole angielskie, z pominięciem `signupUrl`. Wszystkie pola
angielskie były przez to przesunięte o jedną pozycję. Ponieważ są tego samego
typu, kompilator nie miał jak tego zauważyć — po polsku strona wyglądała dobrze,
a po angielsku pokazywała przesunięte treści.

### Pominięcia zamiast fałszywych alarmów

Strony wydarzeń powstają statycznie na podstawie listy pobranej z backendu
w momencie budowania. Wydarzenie utworzone przez test powstaje później, więc nie
ma swojej strony i dostaje pustą skorupę do renderowania w przeglądarce. To
zachowanie zamierzone, dlatego test nie zgłasza go jako błędu, tylko wypisuje
w polu `pominiete`. Jeśli chcesz sprawdzić render także dla nowych wydarzeń,
przebuduj front po ich dodaniu.

# CRUD w panelu admina — co trzeba zrobić

Inwentaryzacja z 3 sierpnia 2026. Stan faktyczny sprawdzony w kontrolerach i encjach,
nie w dokumentacji.

> **Stan na koniec prac: wszystkie cztery moduły domknięte i przetestowane end-to-end.**
> Poniższa inwentaryzacja opisuje punkt wyjścia — zostawiona dla kontekstu.
> Z listy został wyłącznie punkt 4.1, czyli skrzynka wiadomości kontaktowych.

## Stan wyjściowy

Panel potrafił tylko **tworzyć**. Jedyny wyjątek to hero landingu, które miało `PUT`.
Usuwania nie było w żadnym module — raz dodane zajęcia, event albo osoba zostawały na zawsze.

| Moduł | GET | POST | PUT | DELETE | Kolejność |
| --- | :---: | :---: | :---: | :---: | :---: |
| Landing hero | tak | — | **tak** | nie dotyczy | nie dotyczy |
| Galeria landingu | tak | tak | — | ~~brak~~ **zrobione** | ~~endpointu brak~~ **zrobione** |
| Zajęcia pilates | tak | tak | ~~brak~~ **zrobione** | ~~brak~~ **zrobione** | ~~endpointu brak~~ **zrobione** |
| Eventy | tak | tak | ~~brak~~ **zrobione** | ~~brak~~ **zrobione** | po dacie, OK |
| Kadra | tak | tak | ~~brak~~ **zrobione** | ~~brak~~ **zrobione** | ~~brak pola~~ **zrobione (V9)** |
| Newsletter | status | — | — | — | nie dotyczy |

---

## 1. Braki przekrojowe (zrobić przed CRUD-em)

Te trzy rzeczy dotykają wszystkich modułów i taniej je uporządkować teraz niż później.

### 1.1 Kasowanie plików z dysku

`MediaStorageService` potrafi tylko zapisywać. Nie ma metody usuwającej plik, miniaturę
i rekord `media_assets`. Bez tego każde usunięcie encji i każda podmiana zdjęcia zostawia
osierocony plik w `uploads/` — na VPS-ie z ograniczonym dyskiem to kwestia czasu.

Do zrobienia:

- `MediaStorageService.delete(MediaAsset)` — plik, miniatura, rekord
- wywołanie przy usuwaniu encji oraz przy podmianie zdjęcia w edycji
- zadanie sprzątające osierocone pliki (opcjonalne, ale przydatne po migracji)

### 1.2 Kadra nie używa `MediaAsset`

Zajęcia, eventy i galeria trzymają zdjęcia jako relację do `MediaAsset`. **Kadra jako
jedyna trzyma `photoPath`, `photoContentType`, `photoSize` bezpośrednio w encji** —
to pozostałość po `storeLegacyImage`. Skutki:

- brak miniatury dla zdjęć kadry (reszta modułów ją ma)
- inna ścieżka kasowania pliku niż w pozostałych modułach
- `ImageStorageService` istnieje wyłącznie po to i jest dziś jednometodową wydmuszką

Do zrobienia: migracja `V9` przenosząca zdjęcia kadry na `media_assets`, usunięcie
`ImageStorageService`, ujednolicenie kodu.

### 1.3 Kadra nie ma pola kolejności

`PilatesClass` i `LandingGalleryImage` mają `sort_order`. `TeamMember` nie ma — lista
osób wychodzi w kolejności zapisu do bazy. Skoro i tak dotykamy tabeli w punkcie 1.2,
`sort_order` dorzucamy tą samą migracją.

---

## 2. Backend — endpointy do dopisania

### 2.1 Zajęcia pilates

- `PUT /api/admin/classes/{id}` — multipart, te same pola co POST
- `DELETE /api/admin/classes/{id}`
- `PATCH /api/admin/classes/order` — lista ID w docelowej kolejności

### 2.2 Eventy

- `PUT /api/admin/events/{id}`
- `DELETE /api/admin/events/{id}`
- bez zmiany kolejności — eventy sortują się po `eventStartAt` i tak ma zostać

### 2.3 Kadra

- `PUT /api/admin/team/{id}`
- `DELETE /api/admin/team/{id}`
- `PATCH /api/admin/team/order`

### 2.4 Galeria landingu

- `DELETE /api/admin/landing/gallery/{id}`
- `PATCH /api/admin/landing/gallery/order`
- edycja nie jest potrzebna — zdjęcie się podmienia przez usuń plus dodaj

### 2.5 Wspólne dla edycji

Przy `PUT` z multipartem trzeba rozstrzygnąć trzy przypadki zdjęcia:

1. brak pliku w żądaniu → **zostaw obecne**
2. plik w żądaniu → **podmień** i skasuj stary
3. pole opcjonalne do wyczyszczenia (np. `hostImage` eventu) → osobna flaga `removeHostImage=true`

Bez punktu trzeciego nie da się usunąć zdjęcia prowadzącego, jeśli zostało dodane omyłkowo.

### 2.6 Zmiana kolejności — jeden endpoint, nie N

Zamiast `PATCH` na każdym elemencie proponuję jedno żądanie z pełną listą ID
w docelowej kolejności. Powód: przy przeciąganiu zmienia się kilka pozycji naraz,
a seria osobnych żądań potrafi zostawić bazę w stanie pośrednim, jeśli któreś padnie.

---

## 3. Frontend — panel

Każda strona panelu ma dziś formularz dodawania i listę bez akcji. Do zrobienia wszędzie:

- **tryb edycji** — kliknięcie pozycji wypełnia formularz, przycisk zmienia się na „Zapisz zmiany",
  dochodzi „Anuluj"
- **usuwanie z potwierdzeniem** — `p-confirmDialog` z nazwą usuwanego elementu w treści,
  żeby nie dało się skasować nie tego co trzeba
- **zmiana kolejności** — do ustalenia, patrz decyzje niżej
- **podgląd bieżącego zdjęcia** w trybie edycji plus jasna informacja, że pozostawienie
  pustego pola zachowa obecne
- **stany brzegowe** — komunikat przy pustej liście, blokada podwójnego zapisu,
  obsługa błędu 409/404 gdy ktoś usunął element w innej karcie

---

## 4. Braki poza CRUD-em, które wyszły przy okazji

### 4.1 Wiadomości z formularza kontaktowego są niewidoczne

`ContactController` ma wyłącznie `POST`. Wiadomości lądują w tabeli `contact_messages`
i są kasowane po roku, ale **w panelu nie ma gdzie ich przeczytać**. Jeżeli SMTP nie
zadziała — a dziś nie jest skonfigurowany — wiadomość od klientki przepada bez śladu.

Propozycja: `GET /api/admin/contact-messages` z paginacją, widok listy w panelu,
oznaczanie jako przeczytane.

### 4.2 Newsletter tylko do odczytu statusu

Panel pokazuje, czy GetResponse jest podpięty. Nie widać listy zapisanych osób ani
tych ze statusem `LOCAL_ONLY`, które czekają na wysłanie do GetResponse. Warto dodać
listę i eksport CSV.

### 4.3 Brak walidacji po stronie panelu

Formularze polegają na błędach z backendu. Limity długości są znane z kontrolerów
(`title` 180, `description` 1800 itd.) — warto je odbić w formularzu, żeby użytkowniczka
nie traciła wpisanej treści na odrzuconym żądaniu.

---

## 5. Proponowana kolejność

1. ~~**Fundament** — kasowanie plików w `MediaStorageService`, migracja `V9` (kadra na
   `MediaAsset` plus `sort_order`), usunięcie `ImageStorageService`~~ **ZROBIONE**
2. ~~**Kadra** — pełny CRUD od początku do końca, backend i panel~~ **ZROBIONE**.
   Ten moduł jest teraz wzorcem dla pozostałych: `TeamMemberService` pokazuje obsługę
   podmiany zdjęcia, domykanie numeracji po usunięciu i walidację listy kolejności,
   a `admin-team-page` tryb edycji, okno potwierdzenia i strzałki z cofnięciem przy błędzie
3. ~~**Zajęcia** — CRUD plus kolejność, według wzorca z kadry~~ **ZROBIONE i przetestowane
   end-to-end**: dodawanie z automatyczną kolejnością, edycja bez pliku, podmiana zdjęcia
   z kasowaniem starego, `removeImage`, strzałki, usuwanie wraz z plikiem i miniaturą
4. ~~**Eventy** — CRUD bez kolejności, za to z obsługą dwóch zdjęć i flagi czyszczącej~~
   **ZROBIONE i przetestowane end-to-end**: niezależna podmiana obu zdjęć,
   `removeHostImage`, usuwanie kasujące oba pliki wraz z miniaturami. Pola tekstowe
   zebrane w rekord `EventDetails`, który normalizuje puste wartości opcjonalne
5. ~~**Galeria** — usuwanie i kolejność~~ **ZROBIONE i przetestowane end-to-end**.
   Strzałki lewo/prawo zamiast góra/dół, bo karuzela jest pozioma
6. **Skrzynka kontaktowa** — punkt 4.1, osobny moduł

Punkty 2–5 są do siebie na tyle podobne, że po pierwszym idą szybciej.

---

## 6. Decyzje do podjęcia

**Zmiana kolejności — jak?**
**Ustalone: strzałki góra/dół.** Proste, dostępne z klawiatury, działają na telefonie.
Przy obecnej skali w zupełności wystarczą.

**Migracja zdjęć kadry.**
Wymaga przepisania istniejących rekordów do `media_assets` i wygenerowania miniatur.
W bazie jest dziś jedna osoba, więc to najtańszy moment. Później będzie bolało bardziej.

**Usuwanie: trwałe czy z koszem?**
Trwałe jest prostsze. Kosz (`deleted_at`) chroni przed pomyłką, ale komplikuje każde
zapytanie. Przy potwierdzeniu w oknie dialogowym trwałe wydaje się wystarczające.

**Czy skrzynka kontaktowa wchodzi w ten zakres?**
**Ustalone: nie teraz.** Wypada z tej partii, ale zostaje na liście — musi powstać
przed uruchomieniem strony, inaczej wiadomości od klientek będą ginąć bez śladu.

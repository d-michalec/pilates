# Etap 2 — zapisy i sprzedaż z Fitssey do Meta

Plan pracy nad drugą częścią pomiaru kampanii. Pierwsza część (piksel na stronie,
baner zgód) jest wdrożona i działa — ta dotyczy tego, czego piksel zobaczyć nie
może, bo dzieje się w cudzym systemie.

## Dlaczego w ogóle

Grafik i zakupy stoją w ramce na `app.fitssey.com`. Przeglądarka celowo nie
pozwala naszemu skryptowi zajrzeć do ramki z innej domeny, więc piksel nie widzi
ani rezerwacji, ani płatności — czyli dokładnie tego, co w kampanii jest
najważniejsze.

Fitssey potwierdza to od swojej strony: w ustawieniach FrontOffice przy Meta
Pixelu widnieje komunikat, że integracja **nie jest możliwa**, bo Meta wymaga
weryfikacji domeny, a domena należy do Fitssey. Google Analytics obsługują,
Metę nie.

Zostaje jedna droga: nasz serwer dowiaduje się od Fitssey, co się stało,
i przekazuje to Metcie bezpośrednio (Conversions API).

## Co już wiemy na pewno

Ustalone z dokumentacji Fitssey i z panelu, nie z domysłów:

| Rzecz | Ustalenie |
|---|---|
| Adres API | `https://app.fitssey.com/baba/api/v4/public` — `uuid` studia to dosłownie `baba`, sprawdzone w Studio → Twoje studio |
| Uwierzytelnianie | nagłówek `Authorization: Bearer <klucz>`; klucz `meta-capi` istnieje, bez możliwości ograniczenia do odczytu |
| **Kwoty** | **w groszach** — „a positive integer in the smallest currency unit", przykład `"itemPrice": 9500` = 95,00 zł. Pola waluty brak, przyjmujemy PLN |
| Limity zapytań | 10/s (blokada 30 s), 200/5 min (blokada 30 min), 4000/6 h, 10000/24 h — to odcięcia, nie spowolnienia |
| Stronicowanie | `page` i `count`, domyślnie 10, maksymalnie 1000 |
| Znaczniki czasu | ISO 8601 ze strefą, np. `2019-09-01T12:02:35+02:00` |
| `saleDate` | **sama data, bez godziny** — dlatego raport finansowy nie nadaje się jako główne źródło `Purchase` |
| Webhooki | istnieją, obsługują wszystkie trzy potrzebne zdarzenia, **ale nie są udokumentowane ani jednym zdaniem** (`/docs/webhooks` zwraca 404) |

Pola, które raporty zwracają i których potrzebuje Meta do dopasowania:
`guid`, `userGuid`, `userEmailAddress`, `userFirstName`, `userLastName`,
`clientAddressCity`, `itemPrice`, `itemTotalPrice`, `paymentMethod`.

## Architektura

**Webhooki jako źródło główne, nocne sprawdzenie jako siatka bezpieczeństwa.**

Webhook daje zdarzenie w momencie, w którym się dzieje — z prawdziwym czasem,
bez okna czasowego i bez odpytywania. To eliminuje całą klasę błędów ze strefami
czasowymi oraz ryzyko wpadnięcia w blokadę limitów.

Czego webhooki nie dają: pewności dostarczenia. Jeśli nasz serwer akurat nie
działał, zdarzenie przepada. Dlatego raz na dobę job pyta API o wczorajszy dzień
i porównuje z tym, co przyszło. To godzina pracy, a zamyka jedyną dziurę.

Webhook prawdopodobnie przyniesie same identyfikatory, bez maila klientki —
wtedy dane do dopasowania dociągamy pojedynczym zapytaniem do API. Stąd klucz
API jest potrzebny mimo webhooków.

## Trzy fazy, w tej kolejności

### Faza 1 — czarna skrzynka (można robić od zaraz)

Endpoint `POST /api/webhooks/fitssey`, który **nic nie interpretuje**: zapisuje
nagłówki i treść do tabeli i odpowiada 200.

To nie jest proteza, tylko najkrótsza droga do odpowiedzi, których nie ma
w dokumentacji: jak wygląda treść zdarzenia, czy jest w niej mail klientki, jak
przesyłany jest klucz uwierzytelniający (nagłówek? podpis HMAC?), czy zdarzenie
ma własny identyfikator. Jeden prawdziwy webhook powie to lepiej niż mail do
`developers@fitssey.com`, na który i tak czekalibyśmy dzień lub dwa.

Do tego prosty podgląd w panelu administratora: data, typ, kwota, treść.

**Migracja `V19__fitssey_webhooks.sql` jest gotowa i przetestowana** na czystym
Postgresie — razem z deduplikacją (ten sam `guid` i to samo zdarzenie Mety nie
przejdzie dwa razy, ale ten sam `guid` dla różnych zdarzeń już tak).

Dopiero po wdrożeniu tej fazy ma sens testowy zakup — inaczej nie ma co go
nagrać.

### Faza 2 — rozpoznanie treści

Po zobaczeniu prawdziwych webhooków: odczyt typu zdarzenia i identyfikatora,
sprawdzanie podpisu, dociąganie danych klientki z API, normalizacja i hashowanie
SHA-256 zgodnie z wymaganiami Mety.

Normalizacja jest tu nietrywialna i warto o niej pamiętać: `Anna@Gmail.com `
i `anna@gmail.com` dają różne skróty, więc bez sprowadzenia do małych liter
i obcięcia spacji dopasowanie po prostu nie zadziała, a nikt się nie dowie
dlaczego — bo błędu nie widać.

Na tym etapie nadal **nic nie wychodzi do Mety**. Tryb na sucho: tabela zapisuje,
co *by* poszło. Przez kilka dni Ty albo Ola patrzycie na zwykłą listę — data, typ,
kwota — i widzicie, czy karnet kosztował 250 zł czy 25 000.

### Faza 3 — wysyłka

Klient Conversions API, najpierw z `test_event_code` od Tomasza (zdarzenia
lądują w piaskownicy Menedżera zdarzeń, nie w kampanii), potem na żywo.
Do tego alarm mailem, gdy przez dobę nic nie przyszło albo gdy Meta odrzuca —
żeby cisza nie znaczyła „działa".

## Mapowanie zdarzeń

| Webhook Fitssey | Zdarzenie Meta | Uwaga |
|---|---|---|
| `event.client.created` | `CompleteRegistration` | jeden do jednego |
| `event.shopping_cart.payment_status` | `Purchase` | tylko status oznaczający płatność udaną — jakie są, trzeba ustalić |
| `event.client_visit.status` | `Schedule` | strzela przy **każdej** zmianie statusu, także odwołaniu i odhaczeniu obecności — filtrujemy po nowym statusie |
| `event.client_appointment.status` | `Schedule` | gdy w ofercie pojawią się wizyty indywidualne |

Świadomie **nie bierzemy**:

- `event.retail.checkout` — sprzedaż przy ladzie w studiu. Nie przyszła z reklamy,
  więc doliczanie jej zawyżyłoby skuteczność kampanii. Można to kiedyś dodać jako
  osobną konwersję offline, ale to decyzja Oli i Tomasza, nie nasza.
- `client.updated`, `client.deleted`, `contract.terminated`,
  `instalment.suspended/resumed` — bez wartości dla kampanii.

**Pułapka do rozstrzygnięcia:** przy karnecie na raty możemy dostać zarówno
zdarzenie z koszyka, jak i później `client_contract_instalment.processed` przy
każdej racie. Bez rozróżnienia ta sama sprzedaż policzy się kilka razy.

## Atrybucja — ograniczenie, nie błąd

Zdarzenia z serwera idą z `action_source: 'other'`, bo nie mamy przeglądarki
klientki ani jej `client_user_agent` (zdarzenia `website` bez tego Meta odrzuca).
Bez ciasteczek `fbp`/`fbc` dopasowanie opiera się wyłącznie na zahaszowanym
mailu, więc część zakupów nie zostanie przypisana do konkretnej reklamy.

To jest ograniczenie metody i Tomasz musi o nim wiedzieć, zanim zacznie
porównywać liczby z Menedżera z rzeczywistością.

Lepszy wariant, który warto sprawdzić w pierwszej kolejności: jeśli po płatności
operator odsyła klientkę na `baba-studio.pl` z identyfikatorem zamówienia
w adresie, możemy zgłosić `Purchase` prosto z przeglądarki — z pełnym kontekstem
i mocną atrybucją — a wersję serwerową zostawić jako zapasową, z deduplikacją po
`event_id`. Płatności zostały właśnie włączone, więc jeden testowy zakup to
rozstrzygnie.

## Bezpieczeństwo i dane osobowe

- Klucz API Fitssey i token Meta trafiają wyłącznie do `infra/.env` na serwerze,
  tak samo jak hasło SMTP. Nie przechodzą przez repozytorium ani przez czat.
- Endpoint webhooka jest publiczny z natury — musi być, żeby Fitssey mógł do
  niego zadzwonić. Zabezpiecza go klucz uwierzytelniający, którego mechanizm
  poznamy w fazie 1. Do tego czasu endpoint tylko zapisuje i niczego nie wywołuje,
  więc najgorsze, co może zrobić obcy, to zaśmiecić tabelę.
- Treść webhooków zawiera dane osobowe klientek, więc wiersze kasuje job
  sprzątający po 90 dniach — tak samo jak przy wiadomościach z formularza.
- **Wysyłanie Metcie zahaszowanych maili i telefonów to przetwarzanie danych
  osobowych.** Hash nie jest anonimizacją: Meta dopasowuje go do swoich
  użytkowników, na tym polega mechanizm. Potrzebna jest podstawa prawna, wpis
  w polityce prywatności i prawdopodobnie umowa powierzenia. **To blokuje fazę 3
  mocniej niż jakikolwiek kod** i warto załatwić przy okazji regulaminu, który
  i tak jest u prawniczki.

## Otwarte pytania

Odpowiedzi na 1–4 przyniesie faza 1, więc mail do Fitssey jest skrótem, nie
warunkiem startu.

1. Co jest w treści webhooka — dane kontaktowe czy same identyfikatory?
2. Jak przesyłany jest klucz uwierzytelniający i czy to podpis, czy stały sekret?
3. Czy Fitssey ponawia dostarczenie i czy to samo zdarzenie może przyjść dwa razy?
4. Jakie statusy ma `shopping_cart.payment_status` i który oznacza sukces?
5. Czy zwrot generuje osobne zdarzenie, czy zmienia status koszyka?
6. Dokąd wraca klientka po płatności i czy adres niesie identyfikator zamówienia?
7. Czy karnet na raty rodzi podwójne zdarzenie sprzedaży?

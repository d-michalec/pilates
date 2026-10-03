-- ODBIÓR WEBHOOKÓW FITSSEY I WYSYŁKA ZDARZEŃ DO META.
--
-- Jedna tabela, a nie dwie ("odebrane" i "wysłane"), z trzech powodów:
--
--   * deduplikacja i dziennik to w praktyce ta sama potrzeba - żeby wiedzieć,
--     czy dane zdarzenie już przeszło, i tak trzeba je mieć zapisane,
--   * tryb "na sucho" jest wtedy darmowy: wiersz powstaje zawsze, a kolumny
--     wysyłkowe zostają puste, dopóki wysyłania nie włączymy,
--   * podgląd w panelu to zwykły listing jednej tabeli, bez łączeń.
--
-- Kolejność wdrożenia, dla której ta tabela jest zaprojektowana:
--
--   1. Endpoint tylko zapisuje: nagłówki i treść, bez interpretacji. Nie znamy
--      jeszcze formatu webhooków Fitssey ani sposobu przesyłania klucza
--      uwierzytelniającego - ich dokumentacja o tym milczy. Pierwszy prawdziwy
--      webhook odpowie na oba pytania lepiej niż jakikolwiek mail.
--   2. Po rozpoznaniu formatu dochodzi odczyt `event_type` i `external_id`
--      oraz sprawdzanie podpisu.
--   3. Na końcu wysyłka do Meta, najpierw z `test_event_code`.

create table fitssey_webhook_events (
    id uuid primary key,

    received_at timestamp with time zone not null,

    -- Nazwa zdarzenia z treści (np. event.shopping_cart.payment_status).
    -- Dopóki nie znamy formatu, zostaje pusta - i to jest poprawny stan.
    event_type varchar(120),

    -- Identyfikator zdarzenia nadany przez Fitssey. Klucz deduplikacji:
    -- webhooki zwykle działają w trybie "dostarczymy co najmniej raz", więc
    -- przy chwilowym błędzie potrafią przyjść dwa razy. Bez tego Ola miałaby
    -- w raportach podwojoną sprzedaż.
    external_id varchar(200),

    -- Surowe nagłówki i treść. To jest cel pierwszego etapu: zobaczyć, co
    -- Fitssey naprawdę przysyła, zamiast zgadywać z dokumentacji, której nie ma.
    headers text not null,
    payload text not null,

    -- null = jeszcze nie sprawdzamy (nie wiemy jak), true/false = sprawdzone.
    -- Rozróżnienie jest istotne: "nie sprawdzono" to co innego niż "podpis zły".
    signature_ok boolean,

    -- Co z tego zrobiliśmy. Puste w trybie na sucho.
    meta_event_name varchar(60),
    meta_sent_at timestamp with time zone,
    meta_response text,

    -- Kwota, jeśli zdarzenie ją niesie. Trzymana w groszach, tak jak podaje ją
    -- Fitssey ("a positive integer in the smallest currency unit") - przeliczenie
    -- na złotówki robimy dopiero przy wyświetlaniu i przy wysyłce do Meta.
    -- Dzięki temu w podglądzie widać wartość surową i łatwo wyłapać pomyłkę rzędu
    -- wielkości: 25000 zamiast 250 zł rzuca się w oczy.
    value_minor_units bigint,

    error text
);

-- Deduplikacja. Warunkowy, bo w pierwszym etapie `external_id` będzie pusty -
-- a wtedy ograniczenie nie może blokować zapisu kolejnych wierszy.
-- Para z nazwą zdarzenia, bo jeden webhook może w przyszłości rodzić więcej
-- niż jedno zdarzenie Mety.
create unique index ux_fitssey_webhook_dedup
    on fitssey_webhook_events (external_id, meta_event_name)
    where external_id is not null;

-- Podgląd w panelu zawsze sortuje od najnowszych.
create index ix_fitssey_webhook_received_at
    on fitssey_webhook_events (received_at desc);

-- Szukanie po typie przy diagnozowaniu ("pokaż same płatności").
create index ix_fitssey_webhook_event_type
    on fitssey_webhook_events (event_type)
    where event_type is not null;

comment on table fitssey_webhook_events is
    'Surowe webhooki z Fitssey i ślad tego, co z nich poszło do Meta. '
    'Treść zawiera dane osobowe klientek, więc wiersze kasuje job sprzątający '
    'po 90 dniach - patrz app.fitssey.webhook.cleanup-cron.';

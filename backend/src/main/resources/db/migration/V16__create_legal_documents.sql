-- REGULAMIN I POLITYKA PRYWATNOŚCI - z kodu do bazy.
--
-- Do tej pory treść obu dokumentów siedziała w pliku frontendu
-- (core/legal-documents.ts). Powód był dobry: dokument prawny musi dać się
-- odtworzyć w wersji, na którą zgadzała się osoba zapisana rok temu, a historia
-- gita robi to za darmo. Baza z jednym wierszem "wersja bieżąca" tego nie umie.
--
-- Dlatego przy przenoszeniu do panelu zostaje jedno i drugie:
--   * `legal_documents` + `legal_sections` trzymają wersję bieżącą, edytowalną
--     z panelu administratora,
--   * `legal_document_revisions` zapisuje pełny stan dokumentu przy każdym
--     zapisie, więc historia zmian nie ginie,
--   * treść startowa stoi w tej migracji, czyli w gicie - to jest punkt zerowy
--     tej historii.
--
-- Sekcja ma jeden blok tekstu na język, a nie osobne tablice akapitów
-- i punktów: akapity rozdziela pusta linia, a wiersz zaczynający się od "- "
-- jest punktem listy. Ta sama umowa obowiązuje już w opisach sauny, baru
-- i kadry, a w panelu oznacza jedno pole tekstowe na sekcję zamiast
-- rozbudowanego edytora.

create table legal_documents (
    id uuid primary key,
    doc_key varchar(60) not null unique,
    title varchar(200) not null,
    title_en varchar(200),
    intro text,
    intro_en text,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table legal_sections (
    id uuid primary key,
    document_id uuid not null references legal_documents (id) on delete cascade,
    sort_order integer not null,
    heading varchar(300),
    heading_en varchar(300),
    body text not null,
    body_en text,
    -- Sekcja czeka na treść od właścicielki - strona pokazuje przy niej
    -- widoczny znacznik, żeby nie dało się opublikować pustych zasad.
    needs_content boolean not null default false,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_legal_sections_document on legal_sections (document_id, sort_order);

create table legal_document_revisions (
    id uuid primary key,
    doc_key varchar(60) not null,
    -- Pełny stan dokumentu w chwili zapisu, serializowany do JSON-a. Trzymamy
    -- jako text, a nie jsonb: nigdy tego nie przeszukujemy, a mapowanie jsonb
    -- w JPA wymagałoby własnego typu.
    snapshot text not null,
    created_at timestamp with time zone not null
);

create index idx_legal_revisions_key on legal_document_revisions (doc_key, created_at desc);

/*
 * Kształt migawki stoi w widoku, a nie w dwóch miejscach.
 *
 * Korzysta z niego i ta migracja (wiersz startowy historii), i zapis z panelu
 * (LegalDocumentRevisionRepository.zapiszMigawke) - gdyby każde budowało JSON
 * po swojemu, po latach czytania historii okazałoby się, że wiersze z różnych
 * okresów mają różne klucze.
 *
 * Nazwy pól są celowo takie, jak w rekordzie LegalDocumentResponse w Javie:
 * odczytana migawka ma wyglądać jak odpowiedź API z tamtego dnia.
 */
create view legal_document_snapshots as
select
    d.doc_key,
    json_build_object(
        'docKey', d.doc_key,
        'title', d.title,
        'titleEn', d.title_en,
        'intro', d.intro,
        'introEn', d.intro_en,
        'updatedAt', d.updated_at,
        'sections', coalesce((
            select json_agg(json_build_object(
                'heading', s.heading,
                'headingEn', s.heading_en,
                'body', s.body,
                'bodyEn', s.body_en,
                'needsContent', s.needs_content,
                'sortOrder', s.sort_order
            ) order by s.sort_order)
            from legal_sections s where s.document_id = d.id
        ), '[]'::json)
    )::text as snapshot
from legal_documents d;

-- TREŚĆ STARTOWA - przepisana jeden do jednego z core/legal-documents.ts.
-- Sekcje regulaminu oznaczone `needs_content` są nadal szkieletem i czekają
-- na treść od właścicielki albo jej prawnika.
--
-- Puste tłumaczenie zapisujemy jako NULL, a nie jako pusty tekst - tak samo
-- robi ścieżka zapisu z panelu, więc sekcja nie zmienia reprezentacji przy
-- pierwszej edycji.

-- Regulamin
insert into legal_documents (id, doc_key, title, title_en, intro, intro_en, created_at, updated_at)
values (gen_random_uuid(), 'regulamin', 'Regulamin', 'Terms and conditions', 'Regulamin opisuje zasady korzystania ze studia: zapisy, odwoływanie zajęć, spóźnienia i sprawy bezpieczeństwa. Warto go przeczytać przed pierwszą wizytą.', 'These terms describe how the studio works: bookings, cancellations, late arrivals and safety. It is worth reading before your first visit.', now(), now());

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 0, 'Postanowienia ogólne', 'General provisions', 'Studio prowadzi BABA Studio z siedzibą pod adresem ul. Polskiej Organizacji Wojskowej 25, 90-248 Łódź.', 'The studio is operated by BABA Studio, ul. Polskiej Organizacji Wojskowej 25, 90-248 Łódź, Poland.', true, now(), now()
from legal_documents d where d.doc_key = 'regulamin';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 1, 'Zapisy na zajęcia', 'Booking classes', '', null, true, now(), now()
from legal_documents d where d.doc_key = 'regulamin';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 2, 'Odwoływanie i przenoszenie rezerwacji', 'Cancelling and moving bookings', '', null, true, now(), now()
from legal_documents d where d.doc_key = 'regulamin';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 3, 'Spóźnienia i nieobecności', 'Late arrivals and no-shows', '', null, true, now(), now()
from legal_documents d where d.doc_key = 'regulamin';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 4, 'Karnety i płatności', 'Passes and payments', '', null, true, now(), now()
from legal_documents d where d.doc_key = 'regulamin';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 5, 'Bezpieczeństwo i przeciwwskazania zdrowotne', 'Safety and health contraindications', '', null, true, now(), now()
from legal_documents d where d.doc_key = 'regulamin';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 6, 'Zasady obowiązujące w studiu', 'Studio rules', '', null, true, now(), now()
from legal_documents d where d.doc_key = 'regulamin';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 7, 'Reklamacje', 'Complaints', '', null, true, now(), now()
from legal_documents d where d.doc_key = 'regulamin';

-- Polityka prywatności
insert into legal_documents (id, doc_key, title, title_en, intro, intro_en, created_at, updated_at)
values (gen_random_uuid(), 'polityka-prywatnosci', 'Polityka prywatności', 'Privacy policy', 'Ten dokument opisuje, jakie dane zbieramy za pośrednictwem strony baba-studio.pl, po co je zbieramy, komu je powierzamy i jak długo je przechowujemy. Staraliśmy się napisać go zrozumiale, bez zasłaniania się formułkami.', 'This document explains what data we collect through baba-studio.pl, why we collect it, who we share it with and how long we keep it. We have tried to write it plainly, without hiding behind legal formulas.', now(), now());

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 0, 'Kto odpowiada za Twoje dane', 'Who is responsible for your data', 'Administratorem danych jest BABA Studio, ul. Polskiej Organizacji Wojskowej 25, 90-248 Łódź. W sprawach dotyczących danych osobowych napisz na aleksandrakurasik@baba-studio.pl.', 'The data controller is BABA Studio, ul. Polskiej Organizacji Wojskowej 25, 90-248 Łódź, Poland. For any matter concerning personal data write to aleksandrakurasik@baba-studio.pl.', true, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 1, 'Formularz kontaktowy', 'Contact form', 'Wypełniając formularz na stronie Kontakt, podajesz imię, adres e-mail i treść wiadomości. Numer telefonu i temat są nieobowiązkowe. Używamy tych danych wyłącznie po to, żeby odpowiedzieć na Twoją wiadomość.

Wiadomość trafia do dwóch miejsc naraz: na naszą skrzynkę pocztową oraz do bazy strony, gdzie widzi ją osoba zalogowana do panelu. Po roku od wysłania wiadomość kasuje się automatycznie. Możesz też poprosić o usunięcie jej wcześniej.', 'When you fill in the form on the Contact page you provide your name, email address and a message. Phone number and subject are optional. We use this data only to reply to you.

Your message goes to two places at once: our mailbox and the site database, where it is visible to a logged-in administrator. Messages are deleted automatically one year after they are sent. You can also ask us to delete yours sooner.', false, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 2, 'Newsletter', 'Newsletter', 'Zapisując się do newslettera, podajesz adres e-mail i opcjonalnie imię. Zapisujemy również treść zgody, którą zaznaczyłaś, oraz datę - to nasz dowód na to, na co dokładnie się zgodziłaś.

Adresy przekazujemy do serwisu GetResponse, który wysyła za nas wiadomości. Zaraz po zapisie dostaniesz od nas wiadomość powitalną z odnośnikiem do rezygnacji - dzięki temu masz go od pierwszego dnia, także wtedy, gdyby ktoś zapisał Twój adres bez Twojej wiedzy.

Zgodę możesz wycofać w każdej chwili odnośnikiem z wiadomości albo pisząc na aleksandrakurasik@baba-studio.pl. Po rezygnacji zapis zostaje u nas jeszcze przez rok - jest wtedy wyłącznie zapisem tego, że zgoda istniała i kiedy została wycofana - po czym kasuje się sam. Wycofanie zgody nie wpływa na to, co wysłaliśmy wcześniej.', 'When you subscribe to the newsletter you provide an email address and optionally your name. We also store the wording of the consent you ticked and its date - this is our record of what exactly you agreed to.

Addresses are passed to GetResponse, which sends the messages on our behalf. Right after signing up you will receive a welcome message from us containing an unsubscribe link - so you have it from day one, including in case someone entered your address without your knowledge.

You can withdraw consent at any time using the link in any message or by writing to aleksandrakurasik@baba-studio.pl. After you unsubscribe, the record stays with us for one year - purely as evidence that consent existed and when it was withdrawn - and then deletes itself. Withdrawing consent does not affect messages sent before.', false, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 3, 'Zapisy na zajęcia', 'Class bookings', 'Grafik i zapisy obsługuje zewnętrzny system Fitssey, osadzony na podstronie Grafik. Dane, które podajesz przy zakładaniu konta i rezerwacji, trafiają bezpośrednio do Fitssey - nie przechodzą przez tę stronę i nie mamy do nich dostępu z jej poziomu. Obowiązuje tam polityka prywatności Fitssey.', 'The schedule and bookings are handled by Fitssey, an external system embedded on the Schedule page. Data you enter when creating an account or booking a class goes directly to Fitssey - it does not pass through this website. Fitssey’s own privacy policy applies there.', false, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 4, 'Bezpieczeństwo i adresy IP', 'Security and IP addresses', 'Żeby formularz kontaktowy i zapis do newslettera nie stały się narzędziem do rozsyłania spamu, ograniczamy liczbę zgłoszeń z jednego adresu IP. Adres jest w tym celu trzymany wyłącznie w pamięci serwera przez kilkanaście minut i nie trafia do bazy ani do żadnego pliku.', 'To stop the contact form and newsletter signup from being abused for spam, we limit how many submissions can come from one IP address. The address is held in server memory for a few minutes only and is never written to the database or any file.', false, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 5, 'Komu powierzamy dane', 'Who we share data with', 'Poza nami dostęp do części danych mają podmioty, bez których strona nie mogłaby działać:

- OVH - firma hostingowa, na której serwerze stoi strona i baza danych.
- GetResponse - obsługa wysyłki newslettera. Trafiają tam wyłącznie adresy osób zapisanych.
- Dostawca poczty studia - przez niego przechodzą wiadomości z formularza kontaktowego.
- Fitssey - system zapisów na zajęcia, z własną polityką prywatności.', 'Besides us, the following parties have access to some of the data, as the site could not work without them:

- OVH - the hosting provider whose server runs the site and its database.
- GetResponse - newsletter delivery. Only the addresses of subscribers are sent there.
- The studio’s email provider - contact form messages pass through it.
- Fitssey - the class booking system, with its own privacy policy.', false, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 6, 'Kopie zapasowe', 'Backups', 'Codziennie robimy kopię zapasową bazy. Kopie przechowujemy przez czternaście dni, po czym kasują się same. Oznacza to, że po usunięciu Twoich danych z bazy mogą one jeszcze przez ten czas istnieć w kopii - to techniczna konieczność, a nie sposób na obejście Twojego wniosku.', 'We back up the database daily. Backups are kept for fourteen days and then deleted automatically. This means that after your data is removed from the database it may still exist in a backup for that period - a technical necessity, not a way of working around your request.', false, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 7, 'Twoje prawa', 'Your rights', 'W każdej chwili możesz napisać na aleksandrakurasik@baba-studio.pl i poprosić o dostęp do swoich danych, ich poprawienie, usunięcie lub ograniczenie przetwarzania. Możesz też wycofać zgodę i wnieść sprzeciw. Jeśli uznasz, że postępujemy niewłaściwie, przysługuje Ci skarga do Prezesa Urzędu Ochrony Danych Osobowych.', 'You can write to aleksandrakurasik@baba-studio.pl at any time to request access to your data, its correction, deletion or restriction of processing. You may also withdraw consent and object to processing. If you believe we are handling your data improperly, you may lodge a complaint with the Polish Data Protection Authority.', false, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

insert into legal_sections (id, document_id, sort_order, heading, heading_en, body, body_en, needs_content, created_at, updated_at)
select gen_random_uuid(), d.id, 8, 'Pliki cookie', 'Cookies', 'Sama strona nie zapisuje w Twojej przeglądarce plików służących do śledzenia ani do reklam. Osadzony grafik Fitssey korzysta z własnych plików, niezbędnych do jego działania - opisuje je polityka prywatności Fitssey.', 'The website itself does not store tracking or advertising cookies in your browser. The embedded Fitssey schedule uses its own cookies, required for it to work - these are described in Fitssey’s privacy policy.', true, now(), now()
from legal_documents d where d.doc_key = 'polityka-prywatnosci';

-- Pierwszy wiersz historii zmian: stan zaraz po tej migracji.
insert into legal_document_revisions (id, doc_key, snapshot, created_at)
select gen_random_uuid(), doc_key, snapshot, now()
from legal_document_snapshots;

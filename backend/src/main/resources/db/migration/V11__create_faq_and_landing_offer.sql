-- FAQ przenosimy z zaszytej listy w komponencie Angulara do bazy, żeby dało się nim
-- zarządzać z panelu. Dotychczasowe pytania przepisujemy, aby nic nie zginęło.

create table faq_entries (
    id uuid primary key,
    question varchar(400) not null,
    answer text not null,
    sort_order integer not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_faq_entries_sort_order on faq_entries (sort_order);

insert into faq_entries (id, question, answer, sort_order, created_at, updated_at)
values
    (gen_random_uuid(), 'Czy potrzebuję wcześniejszego doświadczenia, żeby zacząć?', 'Nie. Na zajęciach dla osób początkujących spokojnie przechodzimy przez podstawy, oddech i ustawienie ciała. Jeśli nie wiesz, od czego zacząć, napisz do nas.', 0, now(), now()),
    (gen_random_uuid(), 'Jak zapisać się na zajęcia?', 'Najwygodniej zrobisz to przez grafik online. Wybierz termin, zajęcia i zarezerwuj miejsce zgodnie z instrukcjami w systemie.', 1, now(), now()),
    (gen_random_uuid(), 'Co zabrać ze sobą na zajęcia?', 'Wystarczy wygodny strój, w którym możesz swobodnie się poruszać. Maty i potrzebne akcesoria są dostępne na miejscu.', 2, now(), now()),
    (gen_random_uuid(), 'Czy mogę odwołać rezerwację?', 'Tak, odwołanie rezerwacji odbywa się zgodnie z zasadami widocznymi przy zapisie w grafiku. Dzięki temu miejsce może trafić do kolejnej osoby.', 3, now(), now()),
    (gen_random_uuid(), 'Czy oferujecie zajęcia indywidualne?', 'Tak, w sprawie zajęć indywidualnych najlepiej skontaktować się z nami mailowo albo przez formularz kontaktowy.', 4, now(), now()),
    (gen_random_uuid(), 'Jakie są korzyści z pilatesu?', 'Pilates pomaga budować stabilność, siłę, świadomość ciała i lepszą jakość ruchu. Pracujemy uważnie, bez presji i z dużą dbałością o technikę.', 5, now(), now()),
    (gen_random_uuid(), 'Czy mogę przyjść, jeśli jestem w ciąży?', 'Przed udziałem skonsultuj się z lekarzem i napisz do nas. Dobierzemy bezpieczną formę ruchu albo zaproponujemy zajęcia indywidualne.', 6, now(), now()),
    (gen_random_uuid(), 'Czy sauna jest darmowa?', 'Szczegóły korzystania z sauny i aktualne zasady będą widoczne na stronie sauny oraz w grafiku rezerwacji.', 7, now(), now()),
    (gen_random_uuid(), 'Czy mogę przyjść z mężem?', 'Tak, BABA jest otwarta na osoby, które chcą praktykować świadomy ruch i zadbać o regenerację. Wybierzcie zajęcia dopasowane do Waszego poziomu.', 8, now(), now());

-- Sekcja "Co przygotowaliśmy" ma w makiecie zdjęcie w tle. Trzymamy je w osobnej
-- tabeli jednowierszowej, tak jak sauna_page i bar_page, żeby nie mieszać z hero.
create table landing_offer (
    id uuid primary key,
    image_alt varchar(180) not null,
    image_id uuid references media_assets (id),
    updated_at timestamp with time zone not null
);

insert into landing_offer (id, image_alt, updated_at)
values (gen_random_uuid(), 'Zajęcia w BABA Studio', now());

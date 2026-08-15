-- Strony sauny i baru według makiety oraz globalne ustawienia serwisu.
-- Obie strony mają dokładnie jeden rekord treści, więc trzymamy je jako tabele
-- jednowierszowe, tak jak landing_hero.

create table sauna_page (
    id uuid primary key,
    description text not null,
    cta_label varchar(80) not null,
    cta_url varchar(255) not null,
    image_alt varchar(180) not null,
    image_id uuid references media_assets (id),
    updated_at timestamp with time zone not null
);

-- Plan tygodniowy: jeden wiersz to jedna godzina seansu w danym dniu.
-- Widok publiczny scala dni o identycznym zestawie godzin, tak jak w makiecie
-- ("poniedziałek, środa, piątek: 17:00, 18:00, 19:00").
create table sauna_sessions (
    id uuid primary key,
    day_of_week smallint not null,
    session_time time not null,
    created_at timestamp with time zone not null,
    constraint chk_sauna_sessions_day check (day_of_week between 1 and 7),
    constraint uq_sauna_sessions_day_time unique (day_of_week, session_time)
);

create index idx_sauna_sessions_day_time on sauna_sessions (day_of_week, session_time);

create table bar_page (
    id uuid primary key,
    description text not null,
    image_alt varchar(180) not null,
    image_id uuid references media_assets (id),
    updated_at timestamp with time zone not null
);

-- Wiersz na każdy dzień tygodnia. Dzień zamknięty ma puste godziny, dlatego
-- warunek wymaga ich wyłącznie wtedy, gdy lokal jest otwarty.
create table bar_opening_hours (
    id uuid primary key,
    day_of_week smallint not null,
    opens_at time,
    closes_at time,
    closed boolean not null default false,
    updated_at timestamp with time zone not null,
    constraint chk_bar_hours_day check (day_of_week between 1 and 7),
    constraint uq_bar_hours_day unique (day_of_week),
    constraint chk_bar_hours_filled check (closed or (opens_at is not null and closes_at is not null))
);

-- Linki do social mediów są puste do momentu uzupełnienia w panelu; front ukrywa
-- ikony, dopóki adres nie zostanie podany.
create table site_settings (
    id uuid primary key,
    instagram_url varchar(500),
    facebook_url varchar(500),
    updated_at timestamp with time zone not null
);

insert into sauna_page (id, description, cta_label, cta_url, image_alt, updated_at)
values (
    gen_random_uuid(),
    'Sauna w BABA to miejsce na regenerację po treningu albo osobny rytuał wyciszenia. Opis uzupełnisz w panelu administracyjnym.',
    'Zarezerwuj seans',
    '/grafik',
    'Sauna w BABA Studio',
    now()
);

insert into bar_page (id, description, image_alt, updated_at)
values (
    gen_random_uuid(),
    'Kawa, napary i rzeczy, które dobrze domykają wizytę w studiu. Opis uzupełnisz w panelu administracyjnym.',
    'Bar w BABA Studio',
    now()
);

insert into site_settings (id, updated_at) values (gen_random_uuid(), now());

-- Godziny startowe odwzorowują makietę: w tygodniu 7-21, w weekend 9-21.
insert into bar_opening_hours (id, day_of_week, opens_at, closes_at, closed, updated_at)
select
    gen_random_uuid(),
    day,
    case when day <= 5 then time '07:00' else time '09:00' end,
    time '21:00',
    false,
    now()
from generate_series(1, 7) as day;

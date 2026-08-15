-- Wersje angielskie treści redagowanych z panelu. Kolumny obok siebie zamiast osobnej
-- tabeli tłumaczeń: przy dwóch językach jest to prostsze w zapytaniach i nie wymaga
-- joinów. Puste pole oznacza brak tłumaczenia - wtedy front dostaje wersję polską.
--
-- Świadomie NIE tłumaczymy imion i nazwisk (team_members.full_name, events.host_name),
-- bo to nazwy własne.

alter table landing_hero
    add column title_en varchar(120),
    add column eyebrow_en varchar(120),
    add column description_en text,
    add column cta_label_en varchar(80),
    add column image_alt_en varchar(180);

alter table landing_offer
    add column image_alt_en varchar(180);

alter table pilates_classes
    add column title_en varchar(180),
    add column level_label_en varchar(120),
    add column description_en text;

alter table events
    add column title_en varchar(220),
    add column short_description_en text,
    add column description_en text,
    add column host_description_en text,
    add column location_en varchar(255),
    add column price_en varchar(80);

alter table team_members
    add column description_en text;

alter table sauna_page
    add column description_en text,
    add column cta_label_en varchar(80),
    add column image_alt_en varchar(180);

alter table bar_page
    add column description_en text,
    add column image_alt_en varchar(180);

alter table faq_entries
    add column question_en varchar(400),
    add column answer_en text;

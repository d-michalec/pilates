-- Zdjęcie na stronie kontaktu. Tabela jednowierszowa, tak samo jak sekcja oferty
-- na landingu: treść tej strony jest stała, wymienne jest tylko zdjęcie.
create table contact_page (
    id uuid primary key,
    image_alt varchar(180) not null,
    image_alt_en varchar(180),
    image_id uuid references media_assets (id),
    updated_at timestamp with time zone not null
);

insert into contact_page (id, image_alt, updated_at)
values (gen_random_uuid(), 'Kontakt z BABA Studio', now());

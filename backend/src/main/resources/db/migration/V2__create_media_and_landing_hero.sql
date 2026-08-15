create table media_assets (
    id uuid primary key,
    category varchar(80) not null,
    original_file_name varchar(255) not null,
    stored_file_name varchar(255) not null,
    relative_path varchar(500) not null,
    content_type varchar(80) not null,
    size_bytes bigint not null,
    created_at timestamp with time zone not null
);

create index idx_media_assets_category_created_at
    on media_assets (category, created_at desc);

create table landing_hero (
    id uuid primary key,
    title varchar(120) not null,
    eyebrow varchar(120) not null,
    description text not null,
    cta_label varchar(80) not null,
    cta_url varchar(255) not null,
    image_alt varchar(180) not null,
    hero_image_id uuid references media_assets(id),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

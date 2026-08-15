create table pilates_classes (
    id uuid primary key,
    title varchar(180) not null,
    level_label varchar(120) not null,
    description text not null,
    signup_url varchar(500),
    sort_order integer not null default 0,
    image_id uuid references media_assets(id),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create index idx_pilates_classes_sort on pilates_classes(sort_order, created_at);

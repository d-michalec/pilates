create table landing_gallery_images (
    id uuid primary key,
    image_id uuid not null references media_assets(id),
    sort_order integer not null,
    created_at timestamp with time zone not null
);

create index idx_landing_gallery_images_sort_order
    on landing_gallery_images (sort_order, created_at);

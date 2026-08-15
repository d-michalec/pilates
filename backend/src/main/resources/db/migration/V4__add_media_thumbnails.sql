alter table media_assets
    add column thumbnail_relative_path varchar(500),
    add column thumbnail_content_type varchar(80),
    add column thumbnail_size_bytes bigint;

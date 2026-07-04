create table team_members (
    id uuid primary key,
    full_name varchar(160) not null,
    description text not null,
    photo_path varchar(255) not null,
    photo_content_type varchar(80) not null,
    photo_size bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

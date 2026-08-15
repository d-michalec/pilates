create table events (
    id uuid primary key,
    title varchar(220) not null,
    host_name varchar(160) not null,
    short_description text not null,
    description text not null,
    host_description text,
    event_start_at timestamp not null,
    duration_minutes integer,
    location varchar(255),
    capacity integer,
    price varchar(80),
    signup_url varchar(500),
    image_id uuid not null references media_assets (id),
    host_image_id uuid references media_assets (id),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_events_event_start_at on events (event_start_at);
create index idx_events_created_at on events (created_at desc);

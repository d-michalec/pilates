create table contact_messages (
    id uuid primary key,
    name varchar(120) not null,
    email varchar(255) not null,
    phone varchar(60),
    subject varchar(160),
    message text not null,
    status varchar(20) not null,
    failure_reason text,
    created_at timestamp with time zone not null,
    sent_at timestamp with time zone
);

create index idx_contact_messages_created_at on contact_messages (created_at desc);

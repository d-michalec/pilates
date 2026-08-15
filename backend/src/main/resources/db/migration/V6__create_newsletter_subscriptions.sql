create table newsletter_subscriptions (
    id uuid primary key,
    email varchar(255) not null,
    name varchar(128),
    consent_accepted boolean not null,
    consent_text text not null,
    status varchar(30) not null,
    getresponse_contact_id varchar(80),
    failure_reason text,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    synced_at timestamp with time zone
);

create unique index ux_newsletter_subscriptions_email on newsletter_subscriptions (email);
create index idx_newsletter_subscriptions_status on newsletter_subscriptions (status);
create index idx_newsletter_subscriptions_created_at on newsletter_subscriptions (created_at desc);

-- Znacznik "obsłużone" dla wiadomości z formularza kontaktowego.
--
-- Kolumna status mówi o czymś innym: czy udało się wysłać powiadomienie e-mail.
-- Wiadomość może być dostarczona, a mimo to nieodpisana - i odwrotnie, wysyłka
-- mogła zawieść, a właścicielka i tak zobaczyła zgłoszenie w panelu.
alter table contact_messages
    add column handled_at timestamp with time zone;

-- Skrzynka pokazuje najpierw nieobsłużone, potem najnowsze.
create index idx_contact_messages_handled_created
    on contact_messages (handled_at, created_at desc);

-- Wypisanie się z newslettera.
--
-- Do tej pory zapisy leżały w bazie bezterminowo i jedyną drogą rezygnacji był
-- odnośnik w wiadomości z GetResponse. Przy niewypełnionym kluczu API oznaczało
-- to, że adresy zbierają się u nas i nie ma z nich żadnego wyjścia.

alter table newsletter_subscriptions
    add column unsubscribe_token uuid,
    add column unsubscribed_at timestamp with time zone;

-- Istniejące zapisy też muszą dostać token, inaczej te osoby zostałyby bez
-- możliwości rezygnacji - czyli dokładnie w sytuacji, którą naprawiamy.
update newsletter_subscriptions
set unsubscribe_token = gen_random_uuid()
where unsubscribe_token is null;

alter table newsletter_subscriptions
    alter column unsubscribe_token set not null;

-- Token jest jedynym uwierzytelnieniem przy wypisie, więc musi być niepowtarzalny.
create unique index ux_newsletter_subscriptions_unsubscribe_token
    on newsletter_subscriptions (unsubscribe_token);

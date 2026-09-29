-- POLITYKA PRYWATNOŚCI: SEKCJA O PLIKACH COOKIE.
--
-- Do tej pory ta sekcja mówiła, że strona nie zapisuje plików służących do
-- śledzenia ani do reklam. Było to prawdą i było świadomą decyzją - dlatego
-- strona nie miała banera zgód.
--
-- Wraz z pikselem Meta przestaje być prawdą, a dokument prawny studia mówiący
-- nieprawdę o tym, co strona robi, jest gorszy niż brak dokumentu. Stąd ta
-- migracja: podmienia treść sekcji w wersji bieżącej.
--
-- Czego migracja NIE robi:
--   * nie rusza rewizji (legal_document_revisions) - to zapis tego, jak
--     dokument wyglądał w dniu, w którym ktoś się na niego zgodził,
--   * nie zdejmuje znacznika `needs_content`. Tekst jest propozycją i czeka na
--     przeczytanie przez właścicielkę; znacznik zdejmie ona sama w panelu,
--     kiedy treść zatwierdzi.

update legal_sections s
set body = $tekst_pl$Strona zapisuje w Twojej przeglądarce dwa rodzaje plików.

Niezbędne. Pamiętają wybrany język i Twoją decyzję w sprawie plików cookie. Bez nich strona nie zadziała poprawnie, więc nie pytamy o nie o zgodę. Osadzony grafik Fitssey korzysta dodatkowo z własnych plików, potrzebnych mu do działania - opisuje je polityka prywatności Fitssey.

Marketingowe. To piksel Meta, czyli narzędzie pomiarowe Facebooka i Instagrama. Pozwala nam sprawdzić, które reklamy przyprowadzają do studia nowe osoby, i skierować reklamę do kogoś, kto już odwiedził stronę. Ładujemy go wyłącznie wtedy, gdy wyrazisz na to zgodę w banerze - zanim jej udzielisz, Twoja przeglądarka w ogóle nie łączy się z serwerami Meta. Dane zebrane przez piksel trafiają do Meta Platforms Ireland Limited, która przetwarza je jako odrębny administrator, na zasadach opisanych w jej własnej polityce.

Zgodę możesz wycofać w każdej chwili odnośnikiem "Ustawienia prywatności" w stopce strony. Po wycofaniu przestajemy wysyłać cokolwiek do Meta i kasujemy pliki, które piksel zdążył założyć. Wycofanie nie wpływa na to, co zostało przekazane wcześniej.$tekst_pl$,
    body_en = $tekst_en$The website stores two kinds of files in your browser.

Necessary. They remember your language and your decision about cookies. The site will not work properly without them, so we do not ask for consent to use them. The embedded Fitssey schedule additionally uses its own files, which it needs in order to work - these are described in Fitssey's own privacy policy.

Marketing. This is the Meta pixel, the measurement tool behind Facebook and Instagram. It lets us see which ads bring new people to the studio, and show our ads to someone who has already visited the site. We load it only if you agree to it in the banner - before you do, your browser does not contact Meta servers at all. Data collected by the pixel goes to Meta Platforms Ireland Limited, which processes it as a separate controller under its own policy.

You can withdraw your consent at any time using the "Privacy settings" link in the footer. Once you withdraw it we stop sending anything to Meta and delete the files the pixel has created. Withdrawal does not affect what was sent before.$tekst_en$,
    updated_at = now()
from legal_documents d
where s.document_id = d.id
  and d.doc_key = 'polityka-prywatnosci'
  and s.heading = 'Pliki cookie';

-- ZMIANA ADRESU KONTAKTOWEGO: aleksandrakurasik@baba-studio.pl -> kontakt@baba-studio.pl
--
-- Treść dokumentów prawnych żyje w bazie i jest edytowalna z panelu, więc samo
-- poprawienie migracji V16 nic by nie dało - ona już się na produkcji wykonała.
-- Stąd osobna migracja, która podmienia adres w wersji bieżącej.
--
-- Rewizji (legal_document_revisions) świadomie nie ruszamy: to zapis tego, jak
-- dokument wyglądał w dniu, w którym ktoś się na niego zgodził. Poprawianie
-- historii odebrałoby jej jedyny sens.

update legal_sections
set body = replace(body, 'aleksandrakurasik@baba-studio.pl', 'kontakt@baba-studio.pl'),
    body_en = replace(body_en, 'aleksandrakurasik@baba-studio.pl', 'kontakt@baba-studio.pl')
where body like '%aleksandrakurasik@baba-studio.pl%'
   or body_en like '%aleksandrakurasik@baba-studio.pl%';

update legal_documents
set intro = replace(intro, 'aleksandrakurasik@baba-studio.pl', 'kontakt@baba-studio.pl'),
    intro_en = replace(intro_en, 'aleksandrakurasik@baba-studio.pl', 'kontakt@baba-studio.pl')
where intro like '%aleksandrakurasik@baba-studio.pl%'
   or intro_en like '%aleksandrakurasik@baba-studio.pl%';

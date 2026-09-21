package pl.babastudiobe.legal;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface LegalDocumentRevisionRepository extends JpaRepository<LegalDocumentRevision, UUID> {

	/**
	 * Odkłada w historii aktualny stan dokumentu.
	 *
	 * Migawkę buduje baza, widokiem `legal_document_snapshots` - tym samym,
	 * z którego korzysta wiersz startowy w migracji V16. Dzięki temu kształt
	 * JSON-a jest zdefiniowany raz: gdyby budowały go osobno migracja i kod
	 * Javy, po latach czytania historii okazałoby się, że wiersze z różnych
	 * okresów mają różne klucze.
	 *
	 * Przy okazji nie potrzebujemy tutaj Jacksona. Spring Boot 4 przeszedł na
	 * Jacksona 3, gdzie `ObjectMapper` przeniósł się do `tools.jackson` i stał
	 * się niemutowalnym `JsonMapper` - a to jedyne miejsce w projekcie, które
	 * serializowałoby cokolwiek z ręki.
	 *
	 * WAŻNE: wywołanie wymaga, żeby zmiany dokumentu były już w bazie - zapytanie
	 * czyta tabele, nie kontekst trwałości. Serwis robi przed nim `flush`.
	 */
	@Modifying
	@Query(value = """
			insert into legal_document_revisions (id, doc_key, snapshot, created_at)
			select gen_random_uuid(), doc_key, snapshot, now()
			from legal_document_snapshots
			where doc_key = :docKey
			""", nativeQuery = true)
	void zapiszMigawke(@Param("docKey") String docKey);
}

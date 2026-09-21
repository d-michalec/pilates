package pl.babastudiobe.legal;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Pełny stan dokumentu w chwili zapisu.
 *
 * Dokument prawny musi dać się odtworzyć w wersji, na którą zgadzała się osoba
 * zapisana rok temu - sama tabela z wersją bieżącą tego nie umie. Pierwszy
 * wiersz zakłada migracja V16, każdy zapis z panelu dokłada następny.
 *
 * Wiersze wstawia zapytanie natywne przez widok `legal_document_snapshots`
 * (patrz LegalDocumentRevisionRepository), więc to mapowanie służy tylko do
 * odczytu - stąd brak konstruktora do zapisu i brak metod zmieniających.
 */
@Entity
@Table(name = "legal_document_revisions")
class LegalDocumentRevision {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "doc_key", nullable = false, length = 60)
	private String docKey;

	@Column(nullable = false, columnDefinition = "text")
	private String snapshot;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	protected LegalDocumentRevision() {
	}

	UUID getId() {
		return id;
	}

	OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}

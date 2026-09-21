package pl.babastudiobe.legal;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Dokument prawny: regulamin albo polityka prywatności. Rozpoznajemy je po
 * `docKey`, nie po identyfikatorze - adres podstrony i trasa w panelu operują
 * na kluczu, a nie na UUID-zie z bazy.
 */
@Entity
@Table(name = "legal_documents")
class LegalDocument {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "doc_key", nullable = false, length = 60, unique = true)
	private String docKey;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(name = "title_en", length = 200)
	private String titleEn;

	@Column(columnDefinition = "text")
	private String intro;

	@Column(name = "intro_en", columnDefinition = "text")
	private String introEn;

	/**
	 * Sekcje należą do dokumentu i bez niego nie mają sensu, więc kaskada razem
	 * z `orphanRemoval`: zapis dokumentu zapisuje sekcje, a sekcja usunięta
	 * z listy znika też z bazy. Dzięki temu panel może przysłać cały dokument
	 * naraz, bez osobnych operacji na pojedynczych sekcjach.
	 */
	@OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("sortOrder asc")
	private List<LegalSection> sections = new ArrayList<>();

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected LegalDocument() {
	}

	@PrePersist
	void prePersist() {
		OffsetDateTime now = OffsetDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = OffsetDateTime.now();
	}

	/**
	 * Podmienia nagłówek dokumentu i całą listę sekcji.
	 *
	 * Sekcje są odtwarzane od zera, a nie doklejane: panel edytuje dokument jako
	 * całość, więc dopasowywanie istniejących wierszy do przysłanych wymagałoby
	 * identyfikatorów w formularzu i niczego by nie dało - historię zmian trzyma
	 * osobna tabela rewizji.
	 */
	void update(String title, String titleEn, String intro, String introEn, List<LegalSection> noweSekcje) {
		/*
		 * Datę zmiany ustawiamy tutaj, a nie zostawiamy `@PreUpdate`. Przy edycji
		 * samych sekcji żadne pole tego wiersza się nie zmienia, więc Hibernate
		 * nie wysyła dla niego UPDATE-u i `@PreUpdate` w ogóle się nie wykonuje -
		 * a to jest najczęstszy przypadek przy dokumencie prawnym. Bez tego
		 * `updated_at` zostawał na starej wartości, choć treść się zmieniła.
		 *
		 * Ustawienie jej przed zbudowaniem odpowiedzi ma drugi skutek: rekord
		 * odpowiedzi i zapis w historii dostają datę bieżącego zapisu, a nie
		 * poprzedniego.
		 */
		this.updatedAt = OffsetDateTime.now();
		this.title = title;
		this.titleEn = titleEn;
		this.intro = intro;
		this.introEn = introEn;

		this.sections.clear();

		for (int pozycja = 0; pozycja < noweSekcje.size(); pozycja++) {
			LegalSection sekcja = noweSekcje.get(pozycja);
			sekcja.attachTo(this, pozycja);
			this.sections.add(sekcja);
		}
	}

	UUID getId() {
		return id;
	}

	String getDocKey() {
		return docKey;
	}

	String getTitle() {
		return title;
	}

	String getTitleEn() {
		return titleEn;
	}

	String getIntro() {
		return intro;
	}

	String getIntroEn() {
		return introEn;
	}

	/** Kolejność z `@OrderBy` obowiązuje po wczytaniu z bazy; po zapisie sortujemy sami. */
	List<LegalSection> getSections() {
		return sections.stream()
				.sorted(Comparator.comparing(LegalSection::getSortOrder))
				.toList();
	}

	OffsetDateTime getUpdatedAt() {
		return updatedAt;
	}
}

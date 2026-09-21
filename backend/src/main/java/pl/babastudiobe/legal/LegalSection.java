package pl.babastudiobe.legal;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Sekcja dokumentu prawnego.
 *
 * Treść to jeden blok tekstu na język, a nie osobne tablice akapitów i punktów:
 * pusta linia rozdziela akapity, a wiersz zaczynający się od "- " jest punktem
 * listy. Ta sama umowa obowiązuje w opisach sauny, baru i kadry, a w panelu
 * oznacza jedno pole tekstowe na sekcję.
 */
@Entity
@Table(name = "legal_sections")
class LegalSection {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne
	@JoinColumn(name = "document_id", nullable = false)
	private LegalDocument document;

	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder;

	@Column(length = 300)
	private String heading;

	@Column(name = "heading_en", length = 300)
	private String headingEn;

	@Column(nullable = false, columnDefinition = "text")
	private String body;

	@Column(name = "body_en", columnDefinition = "text")
	private String bodyEn;

	@Column(name = "needs_content", nullable = false)
	private boolean needsContent;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected LegalSection() {
	}

	LegalSection(String heading, String headingEn, String body, String bodyEn, boolean needsContent) {
		this.heading = heading;
		this.headingEn = headingEn;
		this.body = body;
		this.bodyEn = bodyEn;
		this.needsContent = needsContent;
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

	void attachTo(LegalDocument document, int sortOrder) {
		this.document = document;
		this.sortOrder = sortOrder;
	}

	Integer getSortOrder() {
		return sortOrder;
	}

	String getHeading() {
		return heading;
	}

	String getHeadingEn() {
		return headingEn;
	}

	String getBody() {
		return body;
	}

	String getBodyEn() {
		return bodyEn;
	}

	boolean isNeedsContent() {
		return needsContent;
	}
}

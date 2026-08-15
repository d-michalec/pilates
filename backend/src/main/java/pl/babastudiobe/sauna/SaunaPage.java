package pl.babastudiobe.sauna;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import pl.babastudiobe.media.MediaAsset;

/** Treść strony sauny. Tabela jednowierszowa, tak jak landing_hero. */
@Entity
@Table(name = "sauna_page")
class SaunaPage {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(name = "cta_label", nullable = false, length = 80)
	private String ctaLabel;

	@Column(name = "cta_url", nullable = false, length = 255)
	private String ctaUrl;

	@Column(name = "image_alt", nullable = false, length = 180)
	private String imageAlt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "image_id")
	private MediaAsset image;


	@Column(name = "description_en", columnDefinition = "text")
	private String descriptionEn;

	@Column(name = "cta_label_en", length = 80)
	private String ctaLabelEn;

	@Column(name = "image_alt_en", length = 180)
	private String imageAltEn;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected SaunaPage() {
	}

	@PrePersist
	@PreUpdate
	void touch() {
		this.updatedAt = OffsetDateTime.now();
	}

	void updateDetails(
			String description,
			String ctaLabel,
			String ctaUrl,
			String imageAlt,
			String descriptionEn,
			String ctaLabelEn,
			String imageAltEn
	) {
		this.description = description;
		this.ctaLabel = ctaLabel;
		this.ctaUrl = ctaUrl;
		this.imageAlt = imageAlt;
		this.descriptionEn = descriptionEn;
		this.ctaLabelEn = ctaLabelEn;
		this.imageAltEn = imageAltEn;
	}

	/** Zwraca poprzednie zdjęcie, żeby wywołujący mógł posprzątać plik po podmianie. */
	MediaAsset replaceImage(MediaAsset newImage) {
		MediaAsset previousImage = this.image;
		this.image = newImage;
		return previousImage;
	}

	UUID getId() {
		return id;
	}

	String getDescription() {
		return description;
	}

	String getCtaLabel() {
		return ctaLabel;
	}

	String getCtaUrl() {
		return ctaUrl;
	}

	String getImageAlt() {
		return imageAlt;
	}

	MediaAsset getImage() {
		return image;
	}

	String getDescriptionEn() {
		return descriptionEn;
	}

	String getCtaLabelEn() {
		return ctaLabelEn;
	}

	String getImageAltEn() {
		return imageAltEn;
	}
}

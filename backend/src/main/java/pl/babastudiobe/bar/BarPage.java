package pl.babastudiobe.bar;

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

/** Treść strony baru. Tabela jednowierszowa, tak jak sauna_page i landing_hero. */
@Entity
@Table(name = "bar_page")
class BarPage {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(name = "image_alt", nullable = false, length = 180)
	private String imageAlt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "image_id")
	private MediaAsset image;


	@Column(name = "description_en", columnDefinition = "text")
	private String descriptionEn;

	@Column(name = "image_alt_en", length = 180)
	private String imageAltEn;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected BarPage() {
	}

	@PrePersist
	@PreUpdate
	void touch() {
		this.updatedAt = OffsetDateTime.now();
	}

	void updateDetails(String description, String imageAlt, String descriptionEn, String imageAltEn) {
		this.description = description;
		this.imageAlt = imageAlt;
		this.descriptionEn = descriptionEn;
		this.imageAltEn = imageAltEn;
	}

	/** Zwraca poprzednie zdjęcie, żeby wywołujący mógł posprzątać plik po podmianie. */
	MediaAsset replaceImage(MediaAsset newImage) {
		MediaAsset previousImage = this.image;
		this.image = newImage;
		return previousImage;
	}

	String getDescription() {
		return description;
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

	String getImageAltEn() {
		return imageAltEn;
	}
}

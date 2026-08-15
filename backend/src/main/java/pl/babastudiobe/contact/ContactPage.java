package pl.babastudiobe.contact;

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

/**
 * Zdjęcie na stronie kontaktu. Tabela jednowierszowa - reszta treści tej strony
 * jest stała i siedzi w kodzie, wymienne jest tylko zdjęcie i jego opis.
 */
@Entity
@Table(name = "contact_page")
class ContactPage {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "image_alt", nullable = false, length = 180)
	private String imageAlt;

	@Column(name = "image_alt_en", length = 180)
	private String imageAltEn;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "image_id")
	private MediaAsset image;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected ContactPage() {
	}

	@PrePersist
	@PreUpdate
	void touch() {
		this.updatedAt = OffsetDateTime.now();
	}

	void updateImageAlt(String imageAlt, String imageAltEn) {
		this.imageAlt = imageAlt;
		this.imageAltEn = imageAltEn;
	}

	/** Zwraca poprzednie zdjęcie, żeby wywołujący mógł posprzątać plik po podmianie. */
	MediaAsset replaceImage(MediaAsset newImage) {
		MediaAsset previousImage = this.image;
		this.image = newImage;
		return previousImage;
	}

	String getImageAlt() {
		return imageAlt;
	}

	String getImageAltEn() {
		return imageAltEn;
	}

	MediaAsset getImage() {
		return image;
	}
}

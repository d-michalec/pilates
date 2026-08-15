package pl.babastudiobe.landing;

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

/** Zdjęcie w tle sekcji "Co przygotowaliśmy". Tabela jednowierszowa. */
@Entity
@Table(name = "landing_offer")
class LandingOffer {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "image_alt", nullable = false, length = 180)
	private String imageAlt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "image_id")
	private MediaAsset image;


	@Column(name = "image_alt_en", length = 180)
	private String imageAltEn;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected LandingOffer() {
	}

	@PrePersist
	@PreUpdate
	void touch() {
		this.updatedAt = OffsetDateTime.now();
	}

	void updateImageAlt(String imageAlt) {
		this.imageAlt = imageAlt;
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

	MediaAsset getImage() {
		return image;
	}

	String getImageAltEn() {
		return imageAltEn;
	}
}

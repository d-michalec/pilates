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
import jakarta.persistence.Table;

import pl.babastudiobe.media.MediaAsset;

@Entity
@Table(name = "landing_gallery_images")
class LandingGalleryImage {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "image_id", nullable = false)
	private MediaAsset image;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	protected LandingGalleryImage() {
	}

	LandingGalleryImage(MediaAsset image, int sortOrder) {
		this.image = image;
		this.sortOrder = sortOrder;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = OffsetDateTime.now();
	}

	void assignSortOrder(int sortOrder) {
		this.sortOrder = sortOrder;
	}

	UUID getId() {
		return id;
	}

	MediaAsset getImage() {
		return image;
	}

	int getSortOrder() {
		return sortOrder;
	}
}

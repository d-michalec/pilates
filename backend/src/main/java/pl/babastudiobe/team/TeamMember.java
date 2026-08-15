package pl.babastudiobe.team;

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

@Entity
@Table(name = "team_members")
class TeamMember {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "full_name", nullable = false, length = 160)
	private String fullName;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "image_id", nullable = false)
	private MediaAsset image;


	@Column(name = "description_en", columnDefinition = "text")
	private String descriptionEn;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected TeamMember() {
	}

	TeamMember(String fullName, String description, String descriptionEn, Integer sortOrder, MediaAsset image) {
		this.fullName = fullName;
		this.description = description;
		this.descriptionEn = descriptionEn;
		this.sortOrder = sortOrder;
		this.image = image;
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

	void updateDetails(String fullName, String description, String descriptionEn) {
		this.fullName = fullName;
		this.description = description;
		this.descriptionEn = descriptionEn;
	}

	/** Zwraca poprzednie zdjęcie, żeby wywołujący mógł posprzątać plik po podmianie. */
	MediaAsset replaceImage(MediaAsset newImage) {
		MediaAsset previousImage = this.image;
		this.image = newImage;
		return previousImage;
	}

	void assignSortOrder(int sortOrder) {
		this.sortOrder = sortOrder;
	}

	UUID getId() {
		return id;
	}

	String getFullName() {
		return fullName;
	}

	String getDescription() {
		return description;
	}

	Integer getSortOrder() {
		return sortOrder;
	}

	MediaAsset getImage() {
		return image;
	}

	OffsetDateTime getCreatedAt() {
		return createdAt;
	}

	OffsetDateTime getUpdatedAt() {
		return updatedAt;
	}

	String getDescriptionEn() {
		return descriptionEn;
	}
}

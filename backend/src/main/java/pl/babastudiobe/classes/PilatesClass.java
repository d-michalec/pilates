package pl.babastudiobe.classes;

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
@Table(name = "pilates_classes")
class PilatesClass {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 180)
	private String title;

	@Column(name = "level_label", nullable = false, length = 120)
	private String levelLabel;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(name = "signup_url", length = 500)
	private String signupUrl;

	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "image_id")
	private MediaAsset image;


	@Column(name = "title_en", length = 180)
	private String titleEn;

	@Column(name = "level_label_en", length = 120)
	private String levelLabelEn;

	@Column(name = "description_en", columnDefinition = "text")
	private String descriptionEn;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected PilatesClass() {
	}

	PilatesClass(String title, String levelLabel, String description, String signupUrl, Integer sortOrder, MediaAsset image) {
		this.title = title;
		this.levelLabel = levelLabel;
		this.description = description;
		this.signupUrl = signupUrl;
		this.sortOrder = sortOrder == null ? 0 : sortOrder;
		this.image = image;
	}

	void updateDetails(
			String title,
			String levelLabel,
			String description,
			String signupUrl,
			String titleEn,
			String levelLabelEn,
			String descriptionEn
	) {
		this.title = title;
		this.levelLabel = levelLabel;
		this.description = description;
		this.signupUrl = signupUrl;
		this.titleEn = titleEn;
		this.levelLabelEn = levelLabelEn;
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

	UUID getId() {
		return id;
	}

	String getTitle() {
		return title;
	}

	String getLevelLabel() {
		return levelLabel;
	}

	String getDescription() {
		return description;
	}

	String getSignupUrl() {
		return signupUrl;
	}

	Integer getSortOrder() {
		return sortOrder;
	}

	MediaAsset getImage() {
		return image;
	}

	String getTitleEn() {
		return titleEn;
	}

	String getLevelLabelEn() {
		return levelLabelEn;
	}

	String getDescriptionEn() {
		return descriptionEn;
	}
}

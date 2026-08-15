package pl.babastudiobe.event;

import java.time.LocalDateTime;
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
@Table(name = "events")
class Event {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 220)
	private String title;

	@Column(name = "host_name", nullable = false, length = 160)
	private String hostName;

	@Column(name = "short_description", nullable = false, columnDefinition = "text")
	private String shortDescription;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(name = "host_description", columnDefinition = "text")
	private String hostDescription;

	@Column(name = "event_start_at", nullable = false)
	private LocalDateTime eventStartAt;

	@Column(name = "duration_minutes")
	private Integer durationMinutes;

	@Column(length = 255)
	private String location;

	private Integer capacity;

	@Column(length = 80)
	private String price;

	@Column(name = "signup_url", length = 500)
	private String signupUrl;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "image_id", nullable = false)
	private MediaAsset image;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "host_image_id")
	private MediaAsset hostImage;


	@Column(name = "title_en", length = 220)
	private String titleEn;

	@Column(name = "short_description_en", columnDefinition = "text")
	private String shortDescriptionEn;

	@Column(name = "description_en", columnDefinition = "text")
	private String descriptionEn;

	@Column(name = "host_description_en", columnDefinition = "text")
	private String hostDescriptionEn;

	@Column(name = "location_en", length = 255)
	private String locationEn;

	@Column(name = "price_en", length = 80)
	private String priceEn;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected Event() {
	}

	Event(
			String title,
			String hostName,
			String shortDescription,
			String description,
			String hostDescription,
			LocalDateTime eventStartAt,
			Integer durationMinutes,
			String location,
			Integer capacity,
			String price,
			String signupUrl,
			String titleEn,
			String shortDescriptionEn,
			String descriptionEn,
			String hostDescriptionEn,
			String locationEn,
			String priceEn,
			MediaAsset image,
			MediaAsset hostImage
	) {
		this.title = title;
		this.hostName = hostName;
		this.shortDescription = shortDescription;
		this.description = description;
		this.hostDescription = hostDescription;
		this.eventStartAt = eventStartAt;
		this.durationMinutes = durationMinutes;
		this.location = location;
		this.capacity = capacity;
		this.price = price;
		this.signupUrl = signupUrl;
		this.titleEn = titleEn;
		this.shortDescriptionEn = shortDescriptionEn;
		this.descriptionEn = descriptionEn;
		this.hostDescriptionEn = hostDescriptionEn;
		this.locationEn = locationEn;
		this.priceEn = priceEn;
		this.image = image;
		this.hostImage = hostImage;
	}

	void updateDetails(
			String title,
			String hostName,
			String shortDescription,
			String description,
			String hostDescription,
			LocalDateTime eventStartAt,
			Integer durationMinutes,
			String location,
			Integer capacity,
			String price,
			String signupUrl,
			String titleEn,
			String shortDescriptionEn,
			String descriptionEn,
			String hostDescriptionEn,
			String locationEn,
			String priceEn
	) {
		this.title = title;
		this.hostName = hostName;
		this.shortDescription = shortDescription;
		this.description = description;
		this.hostDescription = hostDescription;
		this.eventStartAt = eventStartAt;
		this.durationMinutes = durationMinutes;
		this.location = location;
		this.capacity = capacity;
		this.price = price;
		this.signupUrl = signupUrl;
		this.titleEn = titleEn;
		this.shortDescriptionEn = shortDescriptionEn;
		this.descriptionEn = descriptionEn;
		this.hostDescriptionEn = hostDescriptionEn;
		this.locationEn = locationEn;
		this.priceEn = priceEn;
	}

	/** Zwraca poprzednie zdjęcie, żeby wywołujący mógł posprzątać plik po podmianie. */
	MediaAsset replaceImage(MediaAsset newImage) {
		MediaAsset previousImage = this.image;
		this.image = newImage;
		return previousImage;
	}

	MediaAsset replaceHostImage(MediaAsset newHostImage) {
		MediaAsset previousHostImage = this.hostImage;
		this.hostImage = newHostImage;
		return previousHostImage;
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

	String getHostName() {
		return hostName;
	}

	String getShortDescription() {
		return shortDescription;
	}

	String getDescription() {
		return description;
	}

	String getHostDescription() {
		return hostDescription;
	}

	LocalDateTime getEventStartAt() {
		return eventStartAt;
	}

	Integer getDurationMinutes() {
		return durationMinutes;
	}

	String getLocation() {
		return location;
	}

	Integer getCapacity() {
		return capacity;
	}

	String getPrice() {
		return price;
	}

	String getSignupUrl() {
		return signupUrl;
	}

	MediaAsset getImage() {
		return image;
	}

	MediaAsset getHostImage() {
		return hostImage;
	}

	String getTitleEn() {
		return titleEn;
	}

	String getShortDescriptionEn() {
		return shortDescriptionEn;
	}

	String getDescriptionEn() {
		return descriptionEn;
	}

	String getHostDescriptionEn() {
		return hostDescriptionEn;
	}

	String getLocationEn() {
		return locationEn;
	}

	String getPriceEn() {
		return priceEn;
	}
}

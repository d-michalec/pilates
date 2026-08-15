package pl.babastudiobe.landing;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import pl.babastudiobe.media.MediaAsset;

@Entity
@Table(name = "landing_hero")
class LandingHero {

	static final UUID DEFAULT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

	@Id
	private UUID id;

	@Column(nullable = false, length = 120)
	private String title;

	@Column(nullable = false, length = 120)
	private String eyebrow;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(name = "cta_label", nullable = false, length = 80)
	private String ctaLabel;

	@Column(name = "cta_url", nullable = false)
	private String ctaUrl;

	@Column(name = "image_alt", nullable = false, length = 180)
	private String imageAlt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "hero_image_id")
	private MediaAsset heroImage;


	@Column(name = "title_en", length = 120)
	private String titleEn;

	@Column(name = "eyebrow_en", length = 120)
	private String eyebrowEn;

	@Column(name = "description_en", columnDefinition = "text")
	private String descriptionEn;

	@Column(name = "cta_label_en", length = 80)
	private String ctaLabelEn;

	@Column(name = "image_alt_en", length = 180)
	private String imageAltEn;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected LandingHero() {
	}

	private LandingHero(UUID id) {
		this.id = id;
	}

	static LandingHero defaults() {
		LandingHero hero = new LandingHero(DEFAULT_ID);
		hero.update(
				"BABA",
				"Pilates studio",
				"Kameralne studio pilatesu, regeneracji i kobiecej energii. Spotkajmy się na macie, przy oddechu i w dobrym tempie.",
				"Zarezerwuj sesję",
				"/grafik",
				"Sala pilates w Babastudio",
				null,
				null,
				null,
				null,
				null,
				null
		);
		return hero;
	}

	void update(
			String title,
			String eyebrow,
			String description,
			String ctaLabel,
			String ctaUrl,
			String imageAlt,
			String titleEn,
			String eyebrowEn,
			String descriptionEn,
			String ctaLabelEn,
			String imageAltEn,
			MediaAsset heroImage
	) {
		this.titleEn = titleEn;
		this.eyebrowEn = eyebrowEn;
		this.descriptionEn = descriptionEn;
		this.ctaLabelEn = ctaLabelEn;
		this.imageAltEn = imageAltEn;
		this.title = title;
		this.eyebrow = eyebrow;
		this.description = description;
		this.ctaLabel = ctaLabel;
		this.ctaUrl = ctaUrl;
		this.imageAlt = imageAlt;
		if (heroImage != null) {
			this.heroImage = heroImage;
		}
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

	String getEyebrow() {
		return eyebrow;
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

	MediaAsset getHeroImage() {
		return heroImage;
	}

	String getTitleEn() {
		return titleEn;
	}

	String getEyebrowEn() {
		return eyebrowEn;
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

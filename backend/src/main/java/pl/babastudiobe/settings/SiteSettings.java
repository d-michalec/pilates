package pl.babastudiobe.settings;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Ustawienia obowiązujące w całym serwisie. Na razie wyłącznie linki do social mediów -
 * puste, dopóki właścicielka ich nie uzupełni, i wtedy front nie pokazuje ikon.
 */
@Entity
@Table(name = "site_settings")
class SiteSettings {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "instagram_url", length = 500)
	private String instagramUrl;

	@Column(name = "facebook_url", length = 500)
	private String facebookUrl;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected SiteSettings() {
	}

	@PrePersist
	@PreUpdate
	void touch() {
		this.updatedAt = OffsetDateTime.now();
	}

	void update(String instagramUrl, String facebookUrl) {
		this.instagramUrl = instagramUrl;
		this.facebookUrl = facebookUrl;
	}

	String getInstagramUrl() {
		return instagramUrl;
	}

	String getFacebookUrl() {
		return facebookUrl;
	}
}

package pl.babastudiobe.team;

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

	@Column(name = "photo_path", nullable = false)
	private String photoPath;

	@Column(name = "photo_content_type", nullable = false, length = 80)
	private String photoContentType;

	@Column(name = "photo_size", nullable = false)
	private long photoSize;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected TeamMember() {
	}

	TeamMember(String fullName, String description, String photoPath, String photoContentType, long photoSize) {
		this.fullName = fullName;
		this.description = description;
		this.photoPath = photoPath;
		this.photoContentType = photoContentType;
		this.photoSize = photoSize;
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

	String getFullName() {
		return fullName;
	}

	String getDescription() {
		return description;
	}

	String getPhotoPath() {
		return photoPath;
	}

	String getPhotoContentType() {
		return photoContentType;
	}

	long getPhotoSize() {
		return photoSize;
	}

	OffsetDateTime getCreatedAt() {
		return createdAt;
	}

	OffsetDateTime getUpdatedAt() {
		return updatedAt;
	}
}

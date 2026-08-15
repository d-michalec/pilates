package pl.babastudiobe.media;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "media_assets")
public class MediaAsset {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 80)
	private String category;

	@Column(name = "original_file_name", nullable = false, length = 255)
	private String originalFileName;

	@Column(name = "stored_file_name", nullable = false, length = 255)
	private String storedFileName;

	@Column(name = "relative_path", nullable = false, length = 500)
	private String relativePath;

	@Column(name = "thumbnail_relative_path", length = 500)
	private String thumbnailRelativePath;

	@Column(name = "content_type", nullable = false, length = 80)
	private String contentType;

	@Column(name = "thumbnail_content_type", length = 80)
	private String thumbnailContentType;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	@Column(name = "thumbnail_size_bytes")
	private Long thumbnailSizeBytes;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	protected MediaAsset() {
	}

	MediaAsset(
			String category,
			String originalFileName,
			String storedFileName,
			String relativePath,
			String contentType,
			long sizeBytes,
			String thumbnailRelativePath,
			String thumbnailContentType,
			Long thumbnailSizeBytes
	) {
		this.category = category;
		this.originalFileName = originalFileName;
		this.storedFileName = storedFileName;
		this.relativePath = relativePath;
		this.contentType = contentType;
		this.sizeBytes = sizeBytes;
		this.thumbnailRelativePath = thumbnailRelativePath;
		this.thumbnailContentType = thumbnailContentType;
		this.thumbnailSizeBytes = thumbnailSizeBytes;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = OffsetDateTime.now();
	}

	public UUID getId() {
		return id;
	}

	public String getCategory() {
		return category;
	}

	public String getOriginalFileName() {
		return originalFileName;
	}

	public String getStoredFileName() {
		return storedFileName;
	}

	public String getRelativePath() {
		return relativePath;
	}

	public String getThumbnailRelativePath() {
		return thumbnailRelativePath;
	}

	public String getContentType() {
		return contentType;
	}

	public String getThumbnailContentType() {
		return thumbnailContentType;
	}

	public long getSizeBytes() {
		return sizeBytes;
	}

	public Long getThumbnailSizeBytes() {
		return thumbnailSizeBytes;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}

	void assignThumbnail(String thumbnailRelativePath, String thumbnailContentType, Long thumbnailSizeBytes) {
		this.thumbnailRelativePath = thumbnailRelativePath;
		this.thumbnailContentType = thumbnailContentType;
		this.thumbnailSizeBytes = thumbnailSizeBytes;
	}
}

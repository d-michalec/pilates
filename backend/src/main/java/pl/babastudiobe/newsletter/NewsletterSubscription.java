package pl.babastudiobe.newsletter;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "newsletter_subscriptions")
class NewsletterSubscription {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 255)
	private String email;

	@Column(length = 128)
	private String name;

	@Column(name = "consent_accepted", nullable = false)
	private boolean consentAccepted;

	@Column(name = "consent_text", nullable = false, columnDefinition = "text")
	private String consentText;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private NewsletterSubscriptionStatus status;

	@Column(name = "getresponse_contact_id", length = 80)
	private String getResponseContactId;

	@Column(name = "failure_reason", columnDefinition = "text")
	private String failureReason;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	@Column(name = "synced_at")
	private OffsetDateTime syncedAt;

	protected NewsletterSubscription() {
	}

	NewsletterSubscription(String email, String name, boolean consentAccepted, String consentText) {
		this.email = email;
		this.name = name;
		this.consentAccepted = consentAccepted;
		this.consentText = consentText;
		this.status = NewsletterSubscriptionStatus.LOCAL_ONLY;
	}

	@PrePersist
	void prePersist() {
		OffsetDateTime now = OffsetDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
		if (this.status == null) {
			this.status = NewsletterSubscriptionStatus.LOCAL_ONLY;
		}
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = OffsetDateTime.now();
	}

	void refresh(String name, boolean consentAccepted, String consentText) {
		this.name = name;
		this.consentAccepted = consentAccepted;
		this.consentText = consentText;
	}

	void markLocalOnly() {
		this.status = NewsletterSubscriptionStatus.LOCAL_ONLY;
		this.failureReason = null;
		this.syncedAt = null;
	}

	void markGetResponseAccepted(String contactId) {
		this.status = NewsletterSubscriptionStatus.GETRESPONSE_ACCEPTED;
		this.getResponseContactId = contactId;
		this.failureReason = null;
		this.syncedAt = OffsetDateTime.now();
	}

	void markFailed(String failureReason) {
		this.status = NewsletterSubscriptionStatus.FAILED;
		this.failureReason = failureReason;
	}

	UUID getId() {
		return id;
	}

	String getEmail() {
		return email;
	}

	String getName() {
		return name;
	}

	NewsletterSubscriptionStatus getStatus() {
		return status;
	}

	String getFailureReason() {
		return failureReason;
	}
}

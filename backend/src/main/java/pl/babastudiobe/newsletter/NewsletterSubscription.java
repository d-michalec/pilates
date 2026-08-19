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

	/**
	 * Jedyne uwierzytelnienie przy wypisie. Losowy UUID, nie da się go zgadnąć ani
	 * wyliczyć z adresu - dzięki temu odnośnik w wiadomości nie pozwala nikomu
	 * wypisać cudzego adresu, a my nie musimy prosić o hasło do czegoś, co hasła
	 * nie ma.
	 */
	@Column(name = "unsubscribe_token", nullable = false)
	private UUID unsubscribeToken;

	@Column(name = "unsubscribed_at")
	private OffsetDateTime unsubscribedAt;

	protected NewsletterSubscription() {
	}

	NewsletterSubscription(String email, String name, boolean consentAccepted, String consentText) {
		this.email = email;
		this.name = name;
		this.consentAccepted = consentAccepted;
		this.consentText = consentText;
		this.status = NewsletterSubscriptionStatus.LOCAL_ONLY;
		this.unsubscribeToken = UUID.randomUUID();
	}

	@PrePersist
	void prePersist() {
		OffsetDateTime now = OffsetDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
		if (this.status == null) {
			this.status = NewsletterSubscriptionStatus.LOCAL_ONLY;
		}
		if (this.unsubscribeToken == null) {
			this.unsubscribeToken = UUID.randomUUID();
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
		// Ktoś, kto zapisuje się ponownie po rezygnacji, przestaje być wypisany.
		// Bez tego zostałby ze statusem UNSUBSCRIBED i datą rezygnacji, a jego
		// nowa zgoda nie miałaby żadnego odzwierciedlenia.
		this.unsubscribedAt = null;
	}

	void markUnsubscribed() {
		this.status = NewsletterSubscriptionStatus.UNSUBSCRIBED;
		this.unsubscribedAt = OffsetDateTime.now();
		this.failureReason = null;
	}

	/**
	 * Rezygnacja u nas się udała, ale nie udało się usunąć kontaktu w GetResponse.
	 * Zapisujemy powód, bo inaczej ta osoba dalej dostawałaby wiadomości, a nikt by
	 * się o tym nie dowiedział - u nas w bazie wyglądałaby na wypisaną.
	 */
	void markUnsubscribeSyncFailed(String failureReason) {
		this.failureReason = failureReason;
	}

	boolean isUnsubscribed() {
		return this.status == NewsletterSubscriptionStatus.UNSUBSCRIBED;
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

	void markGetResponseRejected(String powod) {
		this.status = NewsletterSubscriptionStatus.GETRESPONSE_REJECTED;
		this.failureReason = powod;
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

	UUID getUnsubscribeToken() {
		return unsubscribeToken;
	}

	String getGetResponseContactId() {
		return getResponseContactId;
	}
}

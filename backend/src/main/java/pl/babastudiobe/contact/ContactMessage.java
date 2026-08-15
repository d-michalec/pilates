package pl.babastudiobe.contact;

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
import jakarta.persistence.Table;

@Entity
@Table(name = "contact_messages")
class ContactMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 255)
	private String email;

	@Column(length = 60)
	private String phone;

	@Column(length = 160)
	private String subject;

	@Column(nullable = false, columnDefinition = "text")
	private String message;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ContactMessageStatus status;

	@Column(name = "failure_reason", columnDefinition = "text")
	private String failureReason;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "sent_at")
	private OffsetDateTime sentAt;

	protected ContactMessage() {
	}

	ContactMessage(String name, String email, String phone, String subject, String message) {
		this.name = name;
		this.email = email;
		this.phone = phone;
		this.subject = subject;
		this.message = message;
		this.status = ContactMessageStatus.NEW;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = OffsetDateTime.now();
		if (this.status == null) {
			this.status = ContactMessageStatus.NEW;
		}
	}

	void markSent() {
		this.status = ContactMessageStatus.SENT;
		this.sentAt = OffsetDateTime.now();
		this.failureReason = null;
	}

	void markFailed(String failureReason) {
		this.status = ContactMessageStatus.FAILED;
		this.failureReason = failureReason;
	}

	UUID getId() {
		return id;
	}

	String getName() {
		return name;
	}

	String getEmail() {
		return email;
	}

	String getPhone() {
		return phone;
	}

	String getSubject() {
		return subject;
	}

	String getMessage() {
		return message;
	}

	ContactMessageStatus getStatus() {
		return status;
	}

	OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}

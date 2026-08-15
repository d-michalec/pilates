package pl.babastudiobe.bar;

import java.time.LocalTime;
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
 * Godziny otwarcia kawiarni dla jednego dnia tygodnia, gdzie 1 to poniedziałek.
 * Dzień zamknięty ma puste godziny - pilnuje tego warunek w bazie.
 */
@Entity
@Table(name = "bar_opening_hours")
class BarOpeningHours {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "day_of_week", nullable = false)
	private short dayOfWeek;

	@Column(name = "opens_at")
	private LocalTime opensAt;

	@Column(name = "closes_at")
	private LocalTime closesAt;

	@Column(nullable = false)
	private boolean closed;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected BarOpeningHours() {
	}

	@PrePersist
	@PreUpdate
	void touch() {
		this.updatedAt = OffsetDateTime.now();
	}

	void update(LocalTime opensAt, LocalTime closesAt, boolean closed) {
		this.closed = closed;
		// Zamknięty dzień nie może mieć godzin, inaczej baza odrzuci zapis.
		this.opensAt = closed ? null : opensAt;
		this.closesAt = closed ? null : closesAt;
	}

	short getDayOfWeek() {
		return dayOfWeek;
	}

	LocalTime getOpensAt() {
		return opensAt;
	}

	LocalTime getClosesAt() {
		return closesAt;
	}

	boolean isClosed() {
		return closed;
	}
}

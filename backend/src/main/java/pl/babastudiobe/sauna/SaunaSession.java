package pl.babastudiobe.sauna;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Jedna godzina seansu w danym dniu tygodnia. Plan powtarza się co tydzień, więc
 * nie trzymamy konkretnych dat - dzień to liczba 1-7, gdzie 1 to poniedziałek.
 */
@Entity
@Table(name = "sauna_sessions")
class SaunaSession {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "day_of_week", nullable = false)
	private short dayOfWeek;

	@Column(name = "session_time", nullable = false)
	private LocalTime sessionTime;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	protected SaunaSession() {
	}

	SaunaSession(short dayOfWeek, LocalTime sessionTime) {
		this.dayOfWeek = dayOfWeek;
		this.sessionTime = sessionTime;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = OffsetDateTime.now();
	}

	UUID getId() {
		return id;
	}

	short getDayOfWeek() {
		return dayOfWeek;
	}

	LocalTime getSessionTime() {
		return sessionTime;
	}
}

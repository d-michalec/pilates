package pl.babastudiobe.newsletter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Pojedynczy zapis widziany z panelu.
 *
 * Świadomie nie wystawiamy tokenu rezygnacji. Panel nie ma z niego żadnego pożytku,
 * a token jest jedynym uwierzytelnieniem przy wypisie - im mniej miejsc, w których
 * się pojawia, tym lepiej.
 */
record NewsletterSubscriptionResponse(
		UUID id,
		String email,
		String name,
		NewsletterSubscriptionStatus status,
		String failureReason,
		OffsetDateTime createdAt,
		OffsetDateTime unsubscribedAt
) {

	static NewsletterSubscriptionResponse from(NewsletterSubscription subscription) {
		return new NewsletterSubscriptionResponse(
				subscription.getId(),
				subscription.getEmail(),
				subscription.getName(),
				subscription.getStatus(),
				subscription.getFailureReason(),
				subscription.getCreatedAt(),
				subscription.getUnsubscribedAt()
		);
	}
}

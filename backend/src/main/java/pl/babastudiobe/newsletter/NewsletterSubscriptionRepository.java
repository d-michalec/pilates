package pl.babastudiobe.newsletter;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface NewsletterSubscriptionRepository extends JpaRepository<NewsletterSubscription, UUID> {

	Optional<NewsletterSubscription> findByEmail(String email);

	Optional<NewsletterSubscription> findByUnsubscribeToken(UUID unsubscribeToken);

	long countByStatus(NewsletterSubscriptionStatus status);

	Optional<NewsletterSubscription> findTopByStatusOrderByUpdatedAtDesc(NewsletterSubscriptionStatus status);

	long deleteByStatusAndUnsubscribedAtBefore(NewsletterSubscriptionStatus status, OffsetDateTime unsubscribedBefore);
}

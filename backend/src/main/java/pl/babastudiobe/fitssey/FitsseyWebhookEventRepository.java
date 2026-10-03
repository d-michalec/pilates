package pl.babastudiobe.fitssey;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

interface FitsseyWebhookEventRepository extends JpaRepository<FitsseyWebhookEvent, UUID> {

	/** Podgląd w panelu zawsze od najnowszych. */
	List<FitsseyWebhookEvent> findAllByOrderByReceivedAtDesc(Pageable strona);

	long deleteByReceivedAtBefore(OffsetDateTime receivedBefore);
}

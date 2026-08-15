package pl.babastudiobe.contact;

import java.time.OffsetDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
class ContactMessageCleanupJob {

	private static final Logger LOGGER = LoggerFactory.getLogger(ContactMessageCleanupJob.class);

	private final ContactMessageRepository repository;
	private final int retentionDays;

	ContactMessageCleanupJob(
			ContactMessageRepository repository,
			@Value("${app.contact.retention-days:365}") int retentionDays
	) {
		this.repository = repository;
		this.retentionDays = retentionDays;
	}

	@Transactional
	@Scheduled(cron = "${app.contact.cleanup-cron:0 20 3 * * *}")
	void deleteOldContactMessages() {
		if (retentionDays <= 0) {
			return;
		}

		OffsetDateTime createdBefore = OffsetDateTime.now().minusDays(retentionDays);
		long deletedMessages = repository.deleteByCreatedAtBefore(createdBefore);
		if (deletedMessages > 0) {
			LOGGER.info("Deleted {} contact messages older than {} days.", deletedMessages, retentionDays);
		}
	}
}

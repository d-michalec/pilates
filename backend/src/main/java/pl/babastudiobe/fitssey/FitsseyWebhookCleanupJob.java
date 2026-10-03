package pl.babastudiobe.fitssey;

import java.time.OffsetDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Surowe webhooki zawierają dane osobowe klientek - w zależności od tego, co
 * Fitssey przysyła, mogą to być adresy e-mail, telefony i nazwiska. Trzymanie
 * ich bez końca byłoby gromadzeniem danych bez celu, więc po ustalonym czasie
 * wiersze znikają.
 *
 * Domyślne 90 dni to kompromis: dość długo, żeby dało się zdiagnozować błąd
 * zgłoszony po kilku tygodniach, i dość krótko, żeby baza nie stała się cichym
 * archiwum klientek studia.
 */
@Component
class FitsseyWebhookCleanupJob {

	private static final Logger LOGGER = LoggerFactory.getLogger(FitsseyWebhookCleanupJob.class);

	private final FitsseyWebhookEventRepository repository;
	private final int retentionDays;

	FitsseyWebhookCleanupJob(
			FitsseyWebhookEventRepository repository,
			@Value("${app.fitssey.retention-days:90}") int retentionDays
	) {
		this.repository = repository;
		this.retentionDays = retentionDays;
	}

	@Transactional
	@Scheduled(cron = "${app.fitssey.cleanup-cron:0 50 3 * * *}")
	void usunStareWebhooki() {
		if (retentionDays <= 0) {
			return;
		}

		OffsetDateTime starszeNiz = OffsetDateTime.now().minusDays(retentionDays);
		long usunietych = repository.deleteByReceivedAtBefore(starszeNiz);

		if (usunietych > 0) {
			LOGGER.info("Usunięto {} webhooków Fitssey starszych niż {} dni.", usunietych, retentionDays);
		}
	}
}

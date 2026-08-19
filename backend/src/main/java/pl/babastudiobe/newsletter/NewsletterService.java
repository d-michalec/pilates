package pl.babastudiobe.newsletter;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;

@Service
class NewsletterService {

	private static final Logger LOGGER = LoggerFactory.getLogger(NewsletterService.class);

	private static final int MAX_FAILURE_REASON_LENGTH = 1000;

	private final NewsletterSubscriptionRepository repository;
	private final GetResponseNewsletterClient getResponseClient;
	private final NewsletterMailer mailer;
	private final String consentText;
	private final int unsubscribedRetentionDays;

	NewsletterService(
			NewsletterSubscriptionRepository repository,
			GetResponseNewsletterClient getResponseClient,
			NewsletterMailer mailer,
			@Value("${app.newsletter.consent-text:Wyrażam zgodę na otrzymywanie newslettera BABA Studio i wiem, że mogę wycofać zgodę w każdej chwili.}") String consentText,
			@Value("${app.newsletter.unsubscribed-retention-days:365}") int unsubscribedRetentionDays
	) {
		this.repository = repository;
		this.getResponseClient = getResponseClient;
		this.mailer = mailer;
		this.consentText = consentText;
		this.unsubscribedRetentionDays = unsubscribedRetentionDays;
	}

	@Transactional
	NewsletterSubscribeResponse subscribe(NewsletterSubscribeRequest request) {
		if (StringUtils.hasText(request.website())) {
			return NewsletterSubscribeResponse.acceptedBotRequest();
		}

		String email = request.email().trim().toLowerCase(Locale.ROOT);
		String name = trimToNull(request.name());
		NewsletterSubscription subscription = repository
				.findByEmail(email)
				.map(existingSubscription -> {
					existingSubscription.refresh(name, request.consentAccepted(), consentText);
					return existingSubscription;
				})
				.orElseGet(() -> new NewsletterSubscription(email, name, request.consentAccepted(), consentText));

		if (!getResponseClient.isConfigured()) {
			subscription.markLocalOnly();
			NewsletterSubscription zapisana = repository.save(subscription);
			mailer.sendWelcome(zapisana);
			return NewsletterSubscribeResponse.from(zapisana);
		}

		try {
			getResponseClient.subscribe(subscription);
			subscription.markGetResponseAccepted(null);
		}
		catch (RestClientException exception) {
			subscription.markFailed(truncate(exception.getMessage()));
		}

		NewsletterSubscription zapisana = repository.save(subscription);
		// Wysyłka idzie jeszcze wewnątrz transakcji. Świadomy kompromis: przy tym ruchu
		// jedna wiadomość na zapis nie utrzyma transakcji długo, a wyniesienie jej poza
		// commit wymagałoby zdarzeń transakcyjnych, czyli maszynerii nieproporcjonalnej
		// do problemu. Gdyby SMTP zaczął się zacinać, to jest pierwsze miejsce do zmiany.
		// Mailer połyka własne błędy, więc nieudana wysyłka nie wywraca zapisu.
		mailer.sendWelcome(zapisana);
		return NewsletterSubscribeResponse.from(zapisana);
	}

	/**
	 * Wypisanie z newslettera na podstawie tokenu z odnośnika.
	 *
	 * Nieznany token traktujemy tak samo jak udany wypis. Inna odpowiedź zamieniłaby
	 * ten adres w narzędzie do sprawdzania, czy dany token istnieje, a osobie, która
	 * kliknęła stary odnośnik po ponownym zapisie, pokazywałaby błąd zamiast
	 * spokojnego potwierdzenia. Cel jest ten sam: ten adres nie dostaje wiadomości.
	 */
	@Transactional
	void unsubscribe(UUID token) {
		NewsletterSubscription subscription = repository.findByUnsubscribeToken(token).orElse(null);
		if (subscription == null || subscription.isUnsubscribed()) {
			return;
		}

		if (getResponseClient.isConfigured()) {
			try {
				getResponseClient.unsubscribe(subscription);
			}
			catch (RestClientException exception) {
				// Rezygnację zapisujemy niezależnie od tego, czy GetResponse odpowiedział.
				// Odwrotna kolejność oznaczałaby, że awaria cudzego serwisu blokuje komuś
				// wycofanie zgody - a to jego prawo, nie nasza uprzejmość. Powód zapisujemy,
				// żeby dało się to potem posprzątać ręcznie w panelu GetResponse.
				LOGGER.warn("Nie udało się usunąć kontaktu w GetResponse: {}", exception.getMessage());
				subscription.markUnsubscribed();
				subscription.markUnsubscribeSyncFailed(truncate(exception.getMessage()));
				repository.save(subscription);
				return;
			}
		}

		subscription.markUnsubscribed();
		repository.save(subscription);
	}

	/**
	 * Rezygnacja zgłoszona przez GetResponse - ktoś kliknął stopkę w wiadomości.
	 *
	 * W przeciwieństwie do wypisu z naszego odnośnika nie wołamy tu GetResponse z
	 * powrotem: kontakt jest już po tamtej stronie usunięty, a dokumentacja daje na
	 * odpowiedź cztery sekundy i nie ponawia nieodebranych wywołań. Zapytanie do
	 * cudzego API zmieściłoby się w tym oknie tylko przy dobrej pogodzie.
	 *
	 * Nieznany adres pomijamy po cichu. To normalny stan, a nie błąd: na liście w
	 * GetResponse mogą być kontakty dodane ręcznie albo zaimportowane, które nigdy
	 * nie przeszły przez formularz na stronie.
	 */
	@Transactional
	void markUnsubscribedFromGetResponse(String email) {
		String znormalizowany = email.trim().toLowerCase(Locale.ROOT);
		repository.findByEmail(znormalizowany).ifPresent(subscription -> {
			if (subscription.isUnsubscribed()) {
				return;
			}
			subscription.markUnsubscribed();
			repository.save(subscription);
			LOGGER.info("Rezygnacja zgłoszona przez GetResponse została zapisana.");
		});
	}

	/**
	 * Kasuje stare rezygnacje. Sam wiersz jest dowodem na to, że zgoda kiedyś była i
	 * kiedy została wycofana, więc nie znika od razu - ale trzymanie go w
	 * nieskończoność byłoby przechowywaniem adresu osoby, która wyraźnie poprosiła,
	 * żeby jej nie pisać.
	 */
	@Scheduled(cron = "${app.newsletter.cleanup-cron:0 40 3 * * *}")
	@Transactional
	void deleteOldUnsubscriptions() {
		if (unsubscribedRetentionDays <= 0) {
			return;
		}

		OffsetDateTime unsubscribedBefore = OffsetDateTime.now().minusDays(unsubscribedRetentionDays);
		long deleted = repository.deleteByStatusAndUnsubscribedAtBefore(
				NewsletterSubscriptionStatus.UNSUBSCRIBED, unsubscribedBefore);
		if (deleted > 0) {
			LOGGER.info("Deleted {} newsletter unsubscriptions older than {} days.", deleted, unsubscribedRetentionDays);
		}
	}

	@Transactional(readOnly = true)
	NewsletterAdminStatusResponse adminStatus() {
		return new NewsletterAdminStatusResponse(
				getResponseClient.isConfigured(),
				getResponseClient.adminUrl(),
				repository.count(),
				repository.countByStatus(NewsletterSubscriptionStatus.LOCAL_ONLY),
				repository.countByStatus(NewsletterSubscriptionStatus.GETRESPONSE_ACCEPTED),
				repository.countByStatus(NewsletterSubscriptionStatus.FAILED),
				repository
						.findTopByStatusOrderByUpdatedAtDesc(NewsletterSubscriptionStatus.FAILED)
						.map(NewsletterSubscription::getFailureReason)
						.orElse(null)
		);
	}

	private String trimToNull(String value) {
		if (!StringUtils.hasText(value)) {
			return null;
		}
		return value.trim();
	}

	private String truncate(String value) {
		if (!StringUtils.hasText(value)) {
			return "Nie udało się zapisać kontaktu w GetResponse.";
		}
		return value.length() <= MAX_FAILURE_REASON_LENGTH ? value : value.substring(0, MAX_FAILURE_REASON_LENGTH);
	}
}

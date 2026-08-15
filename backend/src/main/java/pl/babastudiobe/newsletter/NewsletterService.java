package pl.babastudiobe.newsletter;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;

@Service
class NewsletterService {

	private static final int MAX_FAILURE_REASON_LENGTH = 1000;

	private final NewsletterSubscriptionRepository repository;
	private final GetResponseNewsletterClient getResponseClient;
	private final String consentText;

	NewsletterService(
			NewsletterSubscriptionRepository repository,
			GetResponseNewsletterClient getResponseClient,
			@Value("${app.newsletter.consent-text:Wyrażam zgodę na otrzymywanie newslettera BABA Studio i wiem, że mogę wycofać zgodę w każdej chwili.}") String consentText
	) {
		this.repository = repository;
		this.getResponseClient = getResponseClient;
		this.consentText = consentText;
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
			return NewsletterSubscribeResponse.from(repository.save(subscription));
		}

		try {
			getResponseClient.subscribe(subscription);
			subscription.markGetResponseAccepted(null);
		}
		catch (RestClientException exception) {
			subscription.markFailed(truncate(exception.getMessage()));
		}

		return NewsletterSubscribeResponse.from(repository.save(subscription));
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

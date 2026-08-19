package pl.babastudiobe.newsletter;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Component
class GetResponseNewsletterClient {

	private final RestClient restClient;
	private final String apiKey;
	private final String campaignId;
	private final String adminUrl;

	GetResponseNewsletterClient(
			@Value("${app.newsletter.getresponse.api-url:https://api.getresponse.com/v3}") String apiUrl,
			@Value("${app.newsletter.getresponse.api-key:}") String apiKey,
			@Value("${app.newsletter.getresponse.campaign-id:}") String campaignId,
			@Value("${app.newsletter.getresponse.admin-url:https://app.getresponse.com/}") String adminUrl
	) {
		this.restClient = RestClient.builder()
				.baseUrl(apiUrl)
				.defaultHeader("X-Auth-Token", "api-key " + apiKey)
				.build();
		this.apiKey = apiKey;
		this.campaignId = campaignId;
		this.adminUrl = adminUrl;
	}

	boolean isConfigured() {
		return StringUtils.hasText(apiKey) && StringUtils.hasText(campaignId);
	}

	String adminUrl() {
		return adminUrl;
	}

	void subscribe(NewsletterSubscription subscription) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("email", subscription.getEmail());
		payload.put("campaign", Map.of("campaignId", campaignId));
		if (StringUtils.hasText(subscription.getName())) {
			payload.put("name", subscription.getName());
		}

		restClient
				.post()
				.uri("/contacts")
				.contentType(MediaType.APPLICATION_JSON)
				.body(payload)
				.retrieve()
				.toBodilessEntity();
	}

	/**
	 * Usuwa kontakt z listy wysyłkowej.
	 *
	 * Identyfikator kontaktu zwykle nie jest nam znany: dodawanie kontaktu w
	 * GetResponse jest operacją odroczoną i odpowiedź nie zawiera jego danych.
	 * Dlatego najpierw szukamy po adresie. Gdy kontaktu tam nie ma, uznajemy to za
	 * powodzenie - cel, czyli brak adresu na liście, jest osiągnięty.
	 */
	void unsubscribe(NewsletterSubscription subscription) {
		String contactId = StringUtils.hasText(subscription.getGetResponseContactId())
				? subscription.getGetResponseContactId()
				: findContactId(subscription.getEmail());

		if (contactId == null) {
			return;
		}

		restClient
				.delete()
				.uri("/contacts/{contactId}", contactId)
				.retrieve()
				.toBodilessEntity();
	}

	private String findContactId(String email) {
		// Nawiasy kwadratowe w nazwie parametru to składnia GetResponse, nie nasza
		// pomyłka. Spring zakoduje je jako %5B i %5D - API to przyjmuje, ale gdyby
		// wyszukiwanie kiedyś przestało zwracać wyniki, to jest pierwsze miejsce
		// do sprawdzenia.
		List<Map<String, Object>> contacts = restClient
				.get()
				.uri(uriBuilder -> uriBuilder
						.path("/contacts")
						.queryParam("query[email]", email)
						.queryParam("query[campaignId]", campaignId)
						.build())
				.retrieve()
				.body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
				});

		if (contacts == null || contacts.isEmpty()) {
			return null;
		}

		Object contactId = contacts.get(0).get("contactId");
		return contactId == null ? null : String.valueOf(contactId);
	}
}

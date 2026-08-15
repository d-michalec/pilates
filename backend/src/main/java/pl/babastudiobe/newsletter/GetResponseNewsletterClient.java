package pl.babastudiobe.newsletter;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
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
}

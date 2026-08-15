package pl.babastudiobe.newsletter;

import java.util.UUID;

record NewsletterSubscribeResponse(UUID id, String status) {

	static NewsletterSubscribeResponse acceptedBotRequest() {
		return new NewsletterSubscribeResponse(null, "ACCEPTED");
	}

	static NewsletterSubscribeResponse from(NewsletterSubscription subscription) {
		return new NewsletterSubscribeResponse(subscription.getId(), subscription.getStatus().name());
	}
}

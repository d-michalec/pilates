package pl.babastudiobe.newsletter;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

record NewsletterUnsubscribeRequest(
		@NotNull(message = "Brak identyfikatora rezygnacji.")
		UUID token
) {
}

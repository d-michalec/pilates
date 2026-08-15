package pl.babastudiobe.newsletter;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record NewsletterSubscribeRequest(
		@NotBlank(message = "Podaj adres e-mail.")
		@Email(message = "Podaj poprawny adres e-mail.")
		@Size(max = 255, message = "Adres e-mail może mieć maksymalnie 255 znaków.")
		String email,

		@Size(max = 128, message = "Imię może mieć maksymalnie 128 znaków.")
		String name,

		@AssertTrue(message = "Zaakceptuj zgodę na zapis do newslettera.")
		boolean consentAccepted,

		@Size(max = 120)
		String website
) {
}

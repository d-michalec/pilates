package pl.babastudiobe.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record ContactRequest(
		@NotBlank(message = "Podaj imię i nazwisko.")
		@Size(max = 120, message = "Imię i nazwisko może mieć maksymalnie 120 znaków.")
		String name,

		@NotBlank(message = "Podaj adres e-mail.")
		@Email(message = "Podaj poprawny adres e-mail.")
		@Size(max = 255, message = "Adres e-mail może mieć maksymalnie 255 znaków.")
		String email,

		@Size(max = 60, message = "Telefon może mieć maksymalnie 60 znaków.")
		String phone,

		@Size(max = 160, message = "Temat może mieć maksymalnie 160 znaków.")
		String subject,

		@NotBlank(message = "Wpisz wiadomość.")
		@Size(max = 3000, message = "Wiadomość może mieć maksymalnie 3000 znaków.")
		String message,

		@Size(max = 120)
		String website
) {
}

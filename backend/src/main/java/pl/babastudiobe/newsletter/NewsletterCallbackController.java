package pl.babastudiobe.newsletter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Odbiera powiadomienia z GetResponse o rezygnacjach.
 *
 * Po co to jest: stopka z rezygnacją w wiadomościach GetResponse aktualizuje ich
 * listę, ale o naszej bazie nic nie wie. Bez tego endpointu nasz wiersz w
 * nieskończoność twierdziłby, że zgoda obowiązuje - a to my jesteśmy
 * administratorem danych i to nasz zapis musi odpowiadać rzeczywistości.
 *
 * Trzy rzeczy, które kształtują ten kod, wynikają wprost z dokumentacji GetResponse:
 *
 * 1. Wywołanie przychodzi jako zwykłe żądanie z parametrami w adresie, bez treści
 *    JSON. Nazwy parametrów są wrażliwe na wielkość liter.
 *
 * 2. Limit czasu to cztery sekundy, a nieodebrane wywołania PRZEPADAJĄ i nie są
 *    ponawiane. Dlatego tutaj dzieje się wyłącznie zapis do bazy - żadnych zapytań
 *    do cudzych serwisów ani wysyłki poczty.
 *
 * 3. GetResponse nie podpisuje wywołań ani nie uwierzytelnia się w żaden sposób.
 *    Każdy, kto zna adres, mógłby wypisywać dowolne osoby. Dlatego w adresie siedzi
 *    sekret - jedyne miejsce, w którym da się go umieścić, skoro konfiguracja
 *    przyjmuje sam adres i nic więcej.
 */
@RestController
class NewsletterCallbackController {

	private static final Logger LOGGER = LoggerFactory.getLogger(NewsletterCallbackController.class);

	private final NewsletterService newsletterService;
	private final String secret;

	NewsletterCallbackController(
			NewsletterService newsletterService,
			@Value("${app.newsletter.callback-secret:}") String secret
	) {
		this.newsletterService = newsletterService;
		this.secret = secret;
	}

	/**
	 * Przyjmujemy obie metody, bo panel GetResponse mówi o "post notifications",
	 * a przykład w dokumentacji pokazuje adres z parametrami w query. Parametry
	 * czytamy z adresu, więc obie drogi działają tak samo.
	 */
	@RequestMapping(
			value = "/api/newsletter/getresponse-callback",
			method = { RequestMethod.GET, RequestMethod.POST }
	)
	ResponseEntity<Void> callback(
			@RequestParam(name = "secret", required = false) String podanySekret,
			@RequestParam(name = "action", required = false) String action,
			@RequestParam(name = "contact_email", required = false) String contactEmail
	) {
		// Brak skonfigurowanego sekretu oznacza, że nikt tego jeszcze nie podpiął.
		// Endpoint musi wtedy udawać, że nie istnieje - inaczej stałby się otwartą
		// furtką do wypisywania dowolnych adresów.
		if (!StringUtils.hasText(secret) || !secret.equals(podanySekret)) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}

		// Jeden adres obsługuje wszystkie zaznaczone rodzaje zdarzeń, więc trafiają
		// tu również otwarcia i kliknięcia, jeśli ktoś je kiedyś zaznaczy. Cudze
		// zdarzenia kwitujemy dwusetką i nic z nimi nie robimy - odpowiedź błędem
		// niczego by nie naprawiła, a GetResponse i tak nie ponawia wywołań.
		if (!"unsubscribe".equalsIgnoreCase(action)) {
			return ResponseEntity.ok().build();
		}

		if (!StringUtils.hasText(contactEmail)) {
			LOGGER.warn("Callback rezygnacji bez adresu e-mail - pomijam.");
			return ResponseEntity.ok().build();
		}

		newsletterService.markUnsubscribedFromGetResponse(contactEmail);
		return ResponseEntity.ok().build();
	}
}

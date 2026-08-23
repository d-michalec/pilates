package pl.babastudiobe.newsletter;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
class NewsletterController {

	private final NewsletterService newsletterService;

	NewsletterController(NewsletterService newsletterService) {
		this.newsletterService = newsletterService;
	}

	@PostMapping("/newsletter/subscribe")
	ResponseEntity<NewsletterSubscribeResponse> subscribe(@Valid @RequestBody NewsletterSubscribeRequest request) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(newsletterService.subscribe(request));
	}

	/**
	 * Wypis metodą POST, a nie GET-em prosto z odnośnika w wiadomości.
	 *
	 * Skanery bezpieczeństwa w poczcie i podglądy odnośników odwiedzają adresy z
	 * wiadomości same, bez udziału odbiorcy. Gdyby samo wejście na adres kasowało
	 * zapis, część osób wypisywałaby się bez swojej wiedzy. Odnośnik prowadzi więc
	 * na stronę z przyciskiem, a dopiero przycisk wysyła to żądanie.
	 */
	@PostMapping("/newsletter/unsubscribe")
	ResponseEntity<Void> unsubscribe(@Valid @RequestBody NewsletterUnsubscribeRequest request) {
		newsletterService.unsubscribe(request.token());
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/admin/newsletter/status")
	NewsletterAdminStatusResponse adminStatus() {
		return newsletterService.adminStatus();
	}

	@GetMapping("/admin/newsletter/subscriptions")
	List<NewsletterSubscriptionResponse> subscriptions() {
		return newsletterService.list();
	}

	/**
	 * Trwałe usunięcie zapisu. Obsługuje żądanie "proszę usunąć moje dane", które
	 * jest czymś innym niż rezygnacja z wysyłki - po rezygnacji wiersz zostaje jako
	 * zapis udzielonej kiedyś zgody, tutaj znika.
	 */
	@DeleteMapping("/admin/newsletter/subscriptions/{id}")
	ResponseEntity<Void> deleteSubscription(@PathVariable UUID id) {
		newsletterService.delete(id);
		return ResponseEntity.noContent().build();
	}
}

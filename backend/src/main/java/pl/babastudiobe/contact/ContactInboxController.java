package pl.babastudiobe.contact;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Skrzynka dostępna wyłącznie z panelu. Ścieżka zaczyna się od /api/admin, więc
 * obejmuje ją reguła wymagająca zalogowania w SecurityConfig.
 */
@RestController
@RequestMapping("/api/admin/contact-messages")
class ContactInboxController {

	private final ContactInboxService contactInboxService;

	ContactInboxController(ContactInboxService contactInboxService) {
		this.contactInboxService = contactInboxService;
	}

	@GetMapping
	ContactInboxService.ContactInboxResponse list() {
		return contactInboxService.list();
	}

	/**
	 * Oznaczenie działa w obie strony, dlatego wartość przychodzi parametrem, a nie
	 * jest domyślnie ustawiana na "obsłużone" - odznaczenie pomyłki musi być możliwe.
	 */
	@PatchMapping("/{id}/handled")
	ContactInboxService.ContactMessageResponse setHandled(
			@PathVariable UUID id,
			@RequestParam boolean handled
	) {
		return contactInboxService.setHandled(id, handled);
	}

	@DeleteMapping("/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		contactInboxService.delete(id);
		return ResponseEntity.noContent().build();
	}
}

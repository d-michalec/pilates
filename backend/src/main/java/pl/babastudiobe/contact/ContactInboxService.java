package pl.babastudiobe.contact;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Skrzynka wiadomości z formularza kontaktowego.
 *
 * Wiadomości i tak lecą e-mailem, ale poczta bywa zawodna: trafia do spamu albo
 * wysyłka się nie udaje. Zapis w bazie jest źródłem prawdy, a ten serwis pozwala
 * właścicielce przejrzeć zgłoszenia i odznaczyć załatwione.
 */
@Service
class ContactInboxService {

	private final ContactMessageRepository repository;

	ContactInboxService(ContactMessageRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	ContactInboxResponse list() {
		List<ContactMessageResponse> wiadomosci = repository.findForInbox().stream()
				.map(ContactInboxService::toResponse)
				.toList();

		return new ContactInboxResponse(wiadomosci, repository.countByHandledAtIsNull());
	}

	@Transactional
	ContactMessageResponse setHandled(UUID id, boolean handled) {
		ContactMessage message = repository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie ma wiadomości o tym identyfikatorze."));

		message.setHandled(handled);
		return toResponse(repository.save(message));
	}

	/**
	 * Kasowanie pojedynczej wiadomości. Zadanie sprzątające i tak usuwa zgłoszenia
	 * po roku, ale bez tej operacji spam albo wpis testowy zostawałby w skrzynce
	 * przez cały ten czas i zaciemniał listę.
	 */
	@Transactional
	void delete(UUID id) {
		if (!repository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie ma wiadomości o tym identyfikatorze.");
		}

		repository.deleteById(id);
	}

	private static ContactMessageResponse toResponse(ContactMessage message) {
		return new ContactMessageResponse(
				message.getId(),
				message.getName(),
				message.getEmail(),
				message.getPhone(),
				message.getSubject(),
				message.getMessage(),
				message.getStatus(),
				message.getFailureReason(),
				message.getCreatedAt(),
				message.getSentAt(),
				message.getHandledAt(),
				message.isHandled());
	}

	record ContactMessageResponse(
			UUID id,
			String name,
			String email,
			String phone,
			String subject,
			String message,
			ContactMessageStatus status,
			String failureReason,
			OffsetDateTime createdAt,
			OffsetDateTime sentAt,
			OffsetDateTime handledAt,
			boolean handled
	) {
	}

	/** Licznik nieobsłużonych jedzie razem z listą, żeby panel nie pytał dwa razy. */
	record ContactInboxResponse(List<ContactMessageResponse> messages, long unhandledCount) {
	}
}

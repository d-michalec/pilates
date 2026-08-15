package pl.babastudiobe.contact;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
class ContactController {

	private final ContactService contactService;

	ContactController(ContactService contactService) {
		this.contactService = contactService;
	}

	@PostMapping
	ResponseEntity<ContactResponse> create(@Valid @RequestBody ContactRequest request) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ContactResponse.from(contactService.create(request)));
	}
}

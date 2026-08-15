package pl.babastudiobe.contact;

import java.util.UUID;

record ContactResponse(UUID id, String status) {

	static ContactResponse from(ContactMessage message) {
		return new ContactResponse(message.getId(), message.getStatus().name());
	}
}

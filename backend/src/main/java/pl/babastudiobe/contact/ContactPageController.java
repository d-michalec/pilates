package pl.babastudiobe.contact;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Treść strony kontaktu, czyli w praktyce samo zdjęcie. Osobny kontroler od
 * ContactController, bo ten drugi obsługuje wiadomości z formularza - to dwie
 * różne sprawy, które łączy tylko nazwa strony.
 */
@RestController
@RequestMapping("/api")
class ContactPageController {

	private final ContactPageService contactPageService;

	ContactPageController(ContactPageService contactPageService) {
		this.contactPageService = contactPageService;
	}

	@GetMapping("/contact-page")
	ContactPageService.ContactPageResponse get() {
		return contactPageService.get();
	}

	/** Zdjęcie jest opcjonalne, więc usunięcie wymaga jawnej flagi removeImage. */
	@PutMapping(path = "/admin/contact-page", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ContactPageService.ContactPageResponse update(
			@RequestParam @NotBlank @Size(max = 180) String imageAlt,
			@RequestParam(required = false) @Size(max = 180) String imageAltEn,
			@RequestParam(required = false, defaultValue = "false") boolean removeImage,
			@RequestParam(required = false) MultipartFile image
	) {
		return contactPageService.update(imageAlt, imageAltEn, removeImage, image);
	}
}

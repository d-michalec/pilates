package pl.babastudiobe.contact;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaAssetResponse;
import pl.babastudiobe.media.MediaStorageService;

@Service
class ContactPageService {

	private static final String MEDIA_CATEGORY = "contact-page";

	private final ContactPageRepository repository;
	private final MediaStorageService mediaStorageService;

	ContactPageService(ContactPageRepository repository, MediaStorageService mediaStorageService) {
		this.repository = repository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	ContactPageResponse get() {
		return toResponse(findOrThrow());
	}

	@Transactional
	ContactPageResponse update(String imageAlt, String imageAltEn, boolean removeImage, MultipartFile image) {
		ContactPage page = findOrThrow();
		page.updateImageAlt(imageAlt.trim(), trimToNull(imageAltEn));

		// Zdjęcie jest opcjonalne, więc obok podmiany potrzebna jest jawna flaga czyszczenia.
		if (image != null && !image.isEmpty()) {
			mediaStorageService.delete(page.replaceImage(mediaStorageService.storeImage(MEDIA_CATEGORY, image)));
		}
		else if (removeImage) {
			mediaStorageService.delete(page.replaceImage(null));
		}

		return toResponse(repository.save(page));
	}

	/** Puste tłumaczenie zapisujemy jako brak wartości, żeby front wrócił do polskiego tekstu. */
	private String trimToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}

		return value.trim();
	}

	private ContactPageResponse toResponse(ContactPage page) {
		return new ContactPageResponse(
				page.getImageAlt(),
				page.getImageAltEn(),
				page.getImage() == null ? null : MediaAssetResponse.from(page.getImage()));
	}

	private ContactPage findOrThrow() {
		return repository.findAll().stream()
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.INTERNAL_SERVER_ERROR,
						"Brak rekordu strony kontaktu. Sprawdź, czy migracja V13 została wykonana."));
	}

	record ContactPageResponse(String imageAlt, String imageAltEn, MediaAssetResponse image) {
	}
}

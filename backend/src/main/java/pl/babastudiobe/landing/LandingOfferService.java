package pl.babastudiobe.landing;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaAssetResponse;
import pl.babastudiobe.media.MediaStorageService;

@Service
class LandingOfferService {

	private static final String MEDIA_CATEGORY = "landing-offer";

	private final LandingOfferRepository repository;
	private final MediaStorageService mediaStorageService;

	LandingOfferService(LandingOfferRepository repository, MediaStorageService mediaStorageService) {
		this.repository = repository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	LandingOfferResponse get() {
		LandingOffer offer = findOrThrow();
		return toResponse(offer);
	}

	@Transactional
	LandingOfferResponse update(String imageAlt, boolean removeImage, MultipartFile image) {
		LandingOffer offer = findOrThrow();
		offer.updateImageAlt(imageAlt.trim());

		// Tło jest opcjonalne, więc obok podmiany potrzebna jest jawna flaga czyszczenia.
		if (image != null && !image.isEmpty()) {
			mediaStorageService.delete(offer.replaceImage(mediaStorageService.storeImage(MEDIA_CATEGORY, image)));
		}
		else if (removeImage) {
			mediaStorageService.delete(offer.replaceImage(null));
		}

		return toResponse(repository.save(offer));
	}

	private LandingOfferResponse toResponse(LandingOffer offer) {
		return new LandingOfferResponse(
				offer.getImageAlt(),
				offer.getImage() == null ? null : MediaAssetResponse.from(offer.getImage()));
	}

	private LandingOffer findOrThrow() {
		return repository.findAll().stream()
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.INTERNAL_SERVER_ERROR,
						"Brak rekordu sekcji oferty. Sprawdź, czy migracja V11 została wykonana."));
	}

	record LandingOfferResponse(String imageAlt, MediaAssetResponse image) {
	}
}

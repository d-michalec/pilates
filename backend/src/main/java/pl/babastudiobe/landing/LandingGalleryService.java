package pl.babastudiobe.landing;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaStorageService;
import pl.babastudiobe.storage.StorageException;

@Service
class LandingGalleryService {

	private final LandingGalleryImageRepository repository;
	private final MediaStorageService mediaStorageService;

	LandingGalleryService(LandingGalleryImageRepository repository, MediaStorageService mediaStorageService) {
		this.repository = repository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	List<LandingGalleryImageResponse> list() {
		return repository.findAllByOrderBySortOrderAscCreatedAtAsc().stream()
				.map(LandingGalleryImageResponse::from)
				.toList();
	}

	@Transactional
	List<LandingGalleryImageResponse> upload(List<MultipartFile> images) {
		if (images == null || images.isEmpty()) {
			throw new StorageException("Dodaj przynajmniej jedno zdjęcie.");
		}

		int sortOrder = repository.findMaxSortOrder() + 1;
		List<LandingGalleryImage> galleryImages = new ArrayList<>();
		for (MultipartFile image : images) {
			if (image == null || image.isEmpty()) {
				continue;
			}

			MediaAsset asset = mediaStorageService.storeImage("landing-gallery", image);
			galleryImages.add(new LandingGalleryImage(asset, sortOrder++));
		}

		if (galleryImages.isEmpty()) {
			throw new StorageException("Dodaj przynajmniej jedno zdjęcie.");
		}

		return repository.saveAll(galleryImages).stream()
				.map(LandingGalleryImageResponse::from)
				.toList();
	}

	@Transactional
	void delete(UUID id) {
		LandingGalleryImage galleryImage = repository.findById(id).orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"Nie znaleziono zdjęcia o podanym identyfikatorze."));
		MediaAsset asset = galleryImage.getImage();

		repository.delete(galleryImage);
		repository.flush();
		mediaStorageService.delete(asset);

		normalizeSortOrder();
	}

	/**
	 * Przyjmujemy pełną listę identyfikatorów w docelowej kolejności zamiast serii
	 * pojedynczych zmian - nieudane żądanie nie zostawia wtedy dwóch zdjęć z tym samym
	 * numerem porządkowym, co w karuzeli objawiałoby się losową kolejnością.
	 */
	@Transactional
	List<LandingGalleryImageResponse> reorder(List<UUID> orderedIds) {
		List<LandingGalleryImage> galleryImages = repository.findAll();
		List<UUID> currentIds = galleryImages.stream().map(LandingGalleryImage::getId).toList();

		if (orderedIds.size() != galleryImages.size() || !orderedIds.containsAll(currentIds)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Lista kolejności musi zawierać dokładnie te same zdjęcia co baza.");
		}

		for (LandingGalleryImage galleryImage : galleryImages) {
			galleryImage.assignSortOrder(orderedIds.indexOf(galleryImage.getId()));
		}

		repository.saveAll(galleryImages);
		return list();
	}

	/** Po usunięciu zostają dziury w numeracji - domykamy je, żeby nie rosły w nieskończoność. */
	private void normalizeSortOrder() {
		List<LandingGalleryImage> galleryImages = repository.findAllByOrderBySortOrderAscCreatedAtAsc();

		for (int position = 0; position < galleryImages.size(); position++) {
			galleryImages.get(position).assignSortOrder(position);
		}

		repository.saveAll(galleryImages);
	}
}

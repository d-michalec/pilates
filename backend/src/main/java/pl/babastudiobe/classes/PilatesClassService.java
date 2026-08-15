package pl.babastudiobe.classes;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaStorageService;

@Service
class PilatesClassService {

	private static final String MEDIA_CATEGORY = "pilates-classes";

	private final PilatesClassRepository repository;
	private final MediaStorageService mediaStorageService;

	PilatesClassService(PilatesClassRepository repository, MediaStorageService mediaStorageService) {
		this.repository = repository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	List<PilatesClassResponse> list() {
		return repository.findAllByOrderBySortOrderAscCreatedAtAsc().stream()
				.map(PilatesClassResponse::from)
				.toList();
	}

	@Transactional
	PilatesClassResponse create(
			String title,
			String levelLabel,
			String description,
			String signupUrl,
			String titleEn,
			String levelLabelEn,
			String descriptionEn,
			MultipartFile image
	) {
		PilatesClass pilatesClass = new PilatesClass(
				title.trim(),
				levelLabel.trim(),
				description.trim(),
				trimToNull(signupUrl),
				nextSortOrder(),
				storeIfPresent(image)
		);
		pilatesClass.updateDetails(
				title.trim(),
				levelLabel.trim(),
				description.trim(),
				trimToNull(signupUrl),
				trimToNull(titleEn),
				trimToNull(levelLabelEn),
				trimToNull(descriptionEn));

		return PilatesClassResponse.from(repository.save(pilatesClass));
	}

	/**
	 * Zdjęcie zajęć jest opcjonalne, więc obsługujemy trzy przypadki: brak pliku zostawia
	 * obecne, plik podmienia, a flaga removeImage czyści je całkowicie.
	 */
	@Transactional
	PilatesClassResponse update(
			UUID id,
			String title,
			String levelLabel,
			String description,
			String signupUrl,
			String titleEn,
			String levelLabelEn,
			String descriptionEn,
			boolean removeImage,
			MultipartFile image
	) {
		PilatesClass pilatesClass = findOrThrow(id);
		pilatesClass.updateDetails(
				title.trim(),
				levelLabel.trim(),
				description.trim(),
				trimToNull(signupUrl),
				trimToNull(titleEn),
				trimToNull(levelLabelEn),
				trimToNull(descriptionEn));

		MediaAsset newImage = storeIfPresent(image);
		if (newImage != null) {
			mediaStorageService.delete(pilatesClass.replaceImage(newImage));
		}
		else if (removeImage) {
			mediaStorageService.delete(pilatesClass.replaceImage(null));
		}

		return PilatesClassResponse.from(repository.save(pilatesClass));
	}

	@Transactional
	void delete(UUID id) {
		PilatesClass pilatesClass = findOrThrow(id);
		MediaAsset image = pilatesClass.getImage();

		repository.delete(pilatesClass);
		repository.flush();
		mediaStorageService.delete(image);

		normalizeSortOrder();
	}

	/**
	 * Przyjmujemy pełną listę identyfikatorów w docelowej kolejności zamiast serii
	 * pojedynczych zmian - nieudane żądanie nie zostawia wtedy dwóch zajęć z tym samym
	 * numerem porządkowym.
	 */
	@Transactional
	List<PilatesClassResponse> reorder(List<UUID> orderedIds) {
		List<PilatesClass> classes = repository.findAll();
		List<UUID> currentIds = classes.stream().map(PilatesClass::getId).toList();

		if (orderedIds.size() != classes.size() || !orderedIds.containsAll(currentIds)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Lista kolejności musi zawierać dokładnie te same zajęcia co baza.");
		}

		for (PilatesClass pilatesClass : classes) {
			pilatesClass.assignSortOrder(orderedIds.indexOf(pilatesClass.getId()));
		}

		repository.saveAll(classes);
		return list();
	}

	private PilatesClass findOrThrow(UUID id) {
		return repository.findById(id).orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"Nie znaleziono zajęć o podanym identyfikatorze."));
	}

	private MediaAsset storeIfPresent(MultipartFile image) {
		return image == null || image.isEmpty() ? null : mediaStorageService.storeImage(MEDIA_CATEGORY, image);
	}

	private int nextSortOrder() {
		return repository.findAll().stream()
				.map(PilatesClass::getSortOrder)
				.filter(Objects::nonNull)
				.max(Comparator.naturalOrder())
				.map(highest -> highest + 1)
				.orElse(0);
	}

	/** Po usunięciu zostają dziury w numeracji - domykamy je, żeby nie rosły w nieskończoność. */
	private void normalizeSortOrder() {
		List<PilatesClass> classes = repository.findAllByOrderBySortOrderAscCreatedAtAsc();

		for (int position = 0; position < classes.size(); position++) {
			classes.get(position).assignSortOrder(position);
		}

		repository.saveAll(classes);
	}

	private String trimToNull(String value) {
		if (!StringUtils.hasText(value)) {
			return null;
		}

		return value.trim();
	}
}

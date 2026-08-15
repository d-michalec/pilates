package pl.babastudiobe.event;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaStorageService;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
class EventService {

	private static final String EVENT_MEDIA_CATEGORY = "events";
	private static final String HOST_MEDIA_CATEGORY = "event-hosts";

	private final EventRepository repository;
	private final MediaStorageService mediaStorageService;

	EventService(EventRepository repository, MediaStorageService mediaStorageService) {
		this.repository = repository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	List<EventResponse> list() {
		return repository.findAllByOrderByEventStartAtAscCreatedAtAsc().stream()
				.map(EventResponse::card)
				.toList();
	}

	@Transactional(readOnly = true)
	EventResponse get(UUID id) {
		return repository.findById(id)
				.map(EventResponse::detail)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Nie znaleziono wydarzenia."));
	}

	@Transactional
	EventResponse create(EventDetails details, MultipartFile image, MultipartFile hostImage) {
		EventDetails normalized = details.normalized();
		Event event = new Event(
				normalized.title(),
				normalized.hostName(),
				normalized.shortDescription(),
				normalized.description(),
				normalized.hostDescription(),
				normalized.eventStartAt(),
				normalized.durationMinutes(),
				normalized.location(),
				normalized.capacity(),
				normalized.price(),
				normalized.signupUrl(),
				normalized.titleEn(),
				normalized.shortDescriptionEn(),
				normalized.descriptionEn(),
				normalized.hostDescriptionEn(),
				normalized.locationEn(),
				normalized.priceEn(),
				mediaStorageService.storeImage(EVENT_MEDIA_CATEGORY, image),
				storeIfPresent(HOST_MEDIA_CATEGORY, hostImage)
		);

		return EventResponse.detail(repository.save(event));
	}

	/**
	 * Zdjęcie wydarzenia jest obowiązkowe, więc można je tylko podmienić. Zdjęcie
	 * prowadzącego jest opcjonalne i dlatego ma dodatkowo flagę czyszczącą - bez niej
	 * omyłkowo dodane zdjęcie zostałoby w bazie na zawsze.
	 */
	@Transactional
	EventResponse update(
			UUID id,
			EventDetails details,
			boolean removeHostImage,
			MultipartFile image,
			MultipartFile hostImage
	) {
		Event event = findOrThrow(id);
		EventDetails normalized = details.normalized();

		event.updateDetails(
				normalized.title(),
				normalized.hostName(),
				normalized.shortDescription(),
				normalized.description(),
				normalized.hostDescription(),
				normalized.eventStartAt(),
				normalized.durationMinutes(),
				normalized.location(),
				normalized.capacity(),
				normalized.price(),
				normalized.signupUrl(),
				normalized.titleEn(),
				normalized.shortDescriptionEn(),
				normalized.descriptionEn(),
				normalized.hostDescriptionEn(),
				normalized.locationEn(),
				normalized.priceEn()
		);

		MediaAsset newImage = storeIfPresent(EVENT_MEDIA_CATEGORY, image);
		if (newImage != null) {
			mediaStorageService.delete(event.replaceImage(newImage));
		}

		MediaAsset newHostImage = storeIfPresent(HOST_MEDIA_CATEGORY, hostImage);
		if (newHostImage != null) {
			mediaStorageService.delete(event.replaceHostImage(newHostImage));
		}
		else if (removeHostImage) {
			mediaStorageService.delete(event.replaceHostImage(null));
		}

		return EventResponse.detail(repository.save(event));
	}

	@Transactional
	void delete(UUID id) {
		Event event = findOrThrow(id);
		MediaAsset image = event.getImage();
		MediaAsset hostImage = event.getHostImage();

		repository.delete(event);
		repository.flush();

		mediaStorageService.delete(image);
		mediaStorageService.delete(hostImage);
	}

	private Event findOrThrow(UUID id) {
		return repository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Nie znaleziono wydarzenia."));
	}

	private MediaAsset storeIfPresent(String category, MultipartFile file) {
		return file == null || file.isEmpty() ? null : mediaStorageService.storeImage(category, file);
	}
}

package pl.babastudiobe.bar;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pl.babastudiobe.bar.BarResponse.BarDayResponse;
import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaAssetResponse;
import pl.babastudiobe.media.MediaStorageService;

@Service
class BarService {

	private static final String MEDIA_CATEGORY = "bar";
	private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

	private final BarPageRepository pageRepository;
	private final BarOpeningHoursRepository hoursRepository;
	private final MediaStorageService mediaStorageService;

	BarService(
			BarPageRepository pageRepository,
			BarOpeningHoursRepository hoursRepository,
			MediaStorageService mediaStorageService
	) {
		this.pageRepository = pageRepository;
		this.hoursRepository = hoursRepository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	BarResponse get() {
		BarPage page = findPageOrThrow();

		return new BarResponse(
				page.getDescription(),
				page.getImageAlt(),
				page.getDescriptionEn(),
				page.getImageAltEn(),
				page.getImage() == null ? null : MediaAssetResponse.from(page.getImage()),
				openingHours()
		);
	}

	@Transactional
	BarResponse update(String description, String imageAlt, String descriptionEn, String imageAltEn, MultipartFile image) {
		BarPage page = findPageOrThrow();
		page.updateDetails(description.trim(), imageAlt.trim(), trimToNull(descriptionEn), trimToNull(imageAltEn));

		// Brak pliku oznacza zachowanie dotychczasowego zdjęcia.
		if (image != null && !image.isEmpty()) {
			MediaAsset previousImage = page.replaceImage(mediaStorageService.storeImage(MEDIA_CATEGORY, image));
			mediaStorageService.delete(previousImage);
		}

		pageRepository.save(page);
		return get();
	}

	/**
	 * Przyjmujemy wszystkie siedem dni w jednym żądaniu. Aktualizacja dzień po dniu
	 * mogłaby zostawić tabelę w stanie pośrednim, gdyby któreś żądanie padło.
	 */
	@Transactional
	BarResponse updateOpeningHours(List<BarDayRequest> days) {
		if (days == null || days.size() != 7) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj godziny dla wszystkich siedmiu dni.");
		}

		for (BarDayRequest day : days) {
			if (day.dayOfWeek() < 1 || day.dayOfWeek() > 7) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dzień tygodnia musi być liczbą od 1 do 7.");
			}

			if (!day.closed() && (day.opensAt() == null || day.closesAt() == null)) {
				throw new ResponseStatusException(
						HttpStatus.BAD_REQUEST,
						"Dzień otwarty musi mieć podaną godzinę otwarcia i zamknięcia.");
			}

			if (!day.closed() && !day.closesAt().isAfter(day.opensAt())) {
				throw new ResponseStatusException(
						HttpStatus.BAD_REQUEST,
						"Godzina zamknięcia musi być późniejsza niż godzina otwarcia.");
			}

			BarOpeningHours hours = hoursRepository.findByDayOfWeek(day.dayOfWeek())
					.orElseThrow(() -> new ResponseStatusException(
							HttpStatus.NOT_FOUND,
							"Brak wiersza dla dnia " + day.dayOfWeek() + ". Sprawdź migrację V10."));

			hours.update(day.opensAt(), day.closesAt(), day.closed());
			hoursRepository.save(hours);
		}

		return get();
	}

	/** Puste tłumaczenie zapisujemy jako null, żeby front miał jeden warunek. */
	private String trimToNull(String value) {
		return StringUtils.hasText(value) ? value.trim() : null;
	}

	private List<BarDayResponse> openingHours() {
		return hoursRepository.findAllByOrderByDayOfWeekAsc().stream()
				.map(hours -> new BarDayResponse(
						hours.getDayOfWeek(),
						hours.getOpensAt() == null ? null : hours.getOpensAt().format(TIME_FORMAT),
						hours.getClosesAt() == null ? null : hours.getClosesAt().format(TIME_FORMAT),
						hours.isClosed()))
				.toList();
	}

	private BarPage findPageOrThrow() {
		return pageRepository.findAll().stream()
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.INTERNAL_SERVER_ERROR,
						"Brak rekordu treści baru. Sprawdź, czy migracja V10 została wykonana."));
	}
}

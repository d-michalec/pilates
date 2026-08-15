package pl.babastudiobe.sauna;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaAssetResponse;
import pl.babastudiobe.media.MediaStorageService;
import pl.babastudiobe.sauna.SaunaResponse.SaunaSessionGroup;
import pl.babastudiobe.sauna.SaunaResponse.SaunaSessionItem;

@Service
class SaunaService {

	private static final String MEDIA_CATEGORY = "sauna";
	private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

	private final SaunaPageRepository pageRepository;
	private final SaunaSessionRepository sessionRepository;
	private final MediaStorageService mediaStorageService;

	SaunaService(
			SaunaPageRepository pageRepository,
			SaunaSessionRepository sessionRepository,
			MediaStorageService mediaStorageService
	) {
		this.pageRepository = pageRepository;
		this.sessionRepository = sessionRepository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	SaunaResponse get() {
		SaunaPage page = findPageOrThrow();

		return new SaunaResponse(
				page.getDescription(),
				page.getCtaLabel(),
				page.getCtaUrl(),
				page.getImageAlt(),
				page.getDescriptionEn(),
				page.getCtaLabelEn(),
				page.getImageAltEn(),
				page.getImage() == null ? null : MediaAssetResponse.from(page.getImage()),
				groupedSessions()
		);
	}

	@Transactional
	SaunaResponse update(
			String description,
			String ctaLabel,
			String ctaUrl,
			String imageAlt,
			String descriptionEn,
			String ctaLabelEn,
			String imageAltEn,
			MultipartFile image
	) {
		SaunaPage page = findPageOrThrow();
		page.updateDetails(
				description.trim(),
				ctaLabel.trim(),
				ctaUrl.trim(),
				imageAlt.trim(),
				trimToNull(descriptionEn),
				trimToNull(ctaLabelEn),
				trimToNull(imageAltEn));

		// Brak pliku oznacza zachowanie dotychczasowego zdjęcia.
		if (image != null && !image.isEmpty()) {
			MediaAsset previousImage = page.replaceImage(mediaStorageService.storeImage(MEDIA_CATEGORY, image));
			mediaStorageService.delete(previousImage);
		}

		pageRepository.save(page);
		return get();
	}

	@Transactional(readOnly = true)
	List<SaunaSessionItem> listSessions() {
		return sessionRepository.findAllByOrderByDayOfWeekAscSessionTimeAsc().stream()
				.map(session -> new SaunaSessionItem(
						session.getId(),
						session.getDayOfWeek(),
						session.getSessionTime().format(TIME_FORMAT)))
				.toList();
	}

	@Transactional
	List<SaunaSessionItem> addSession(short dayOfWeek, LocalTime time) {
		if (dayOfWeek < 1 || dayOfWeek > 7) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dzień tygodnia musi być liczbą od 1 do 7.");
		}

		// Ten sam seans dwa razy w tym samym dniu nie ma sensu, a baza i tak by go odrzuciła.
		if (sessionRepository.existsByDayOfWeekAndSessionTime(dayOfWeek, time)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ten seans jest już w planie.");
		}

		sessionRepository.save(new SaunaSession(dayOfWeek, time));
		return listSessions();
	}

	@Transactional
	void deleteSession(UUID id) {
		SaunaSession session = sessionRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"Nie znaleziono seansu o podanym identyfikatorze."));

		sessionRepository.delete(session);
	}

	/**
	 * Scala dni mające dokładnie ten sam zestaw godzin. Kluczem jest lista godzin,
	 * więc dni trafiają do wspólnej grupy niezależnie od kolejności dodawania.
	 */
	private List<SaunaSessionGroup> groupedSessions() {
		Map<Short, List<String>> timesByDay = new LinkedHashMap<>();
		for (SaunaSession session : sessionRepository.findAllByOrderByDayOfWeekAscSessionTimeAsc()) {
			timesByDay
					.computeIfAbsent(session.getDayOfWeek(), day -> new ArrayList<>())
					.add(session.getSessionTime().format(TIME_FORMAT));
		}

		Map<List<String>, List<Short>> daysByTimes = new LinkedHashMap<>();
		timesByDay.forEach((day, times) -> daysByTimes.computeIfAbsent(times, key -> new ArrayList<>()).add(day));

		return daysByTimes.entrySet().stream()
				.map(entry -> new SaunaSessionGroup(entry.getValue(), entry.getKey()))
				.toList();
	}

	/** Puste tłumaczenie zapisujemy jako null, żeby front miał jeden warunek. */
	private String trimToNull(String value) {
		return StringUtils.hasText(value) ? value.trim() : null;
	}

	private SaunaPage findPageOrThrow() {
		return pageRepository.findAll().stream()
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.INTERNAL_SERVER_ERROR,
						"Brak rekordu treści sauny. Sprawdź, czy migracja V10 została wykonana."));
	}
}

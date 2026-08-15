package pl.babastudiobe.event;

import java.time.LocalDateTime;

import org.springframework.util.StringUtils;

/**
 * Wydarzenie ma jedenaście pól tekstowych, więc przekazywanie ich pojedynczo przez
 * warstwy kończyło się metodami o czternastu argumentach. Rekord zbiera je w całość
 * i od razu normalizuje - puste pola opcjonalne trafiają do bazy jako null, a nie
 * jako pusty ciąg znaków.
 */
record EventDetails(
		String title,
		String hostName,
		String shortDescription,
		String description,
		String hostDescription,
		LocalDateTime eventStartAt,
		Integer durationMinutes,
		String location,
		Integer capacity,
		String price,
		String signupUrl,
		String titleEn,
		String shortDescriptionEn,
		String descriptionEn,
		String hostDescriptionEn,
		String locationEn,
		String priceEn
) {

	EventDetails normalized() {
		return new EventDetails(
				title.trim(),
				hostName.trim(),
				shortDescription.trim(),
				description.trim(),
				trimToNull(hostDescription),
				eventStartAt,
				durationMinutes,
				trimToNull(location),
				capacity,
				trimToNull(price),
				trimToNull(signupUrl),
				trimToNull(titleEn),
				trimToNull(shortDescriptionEn),
				trimToNull(descriptionEn),
				trimToNull(hostDescriptionEn),
				trimToNull(locationEn),
				trimToNull(priceEn)
		);
	}

	private static String trimToNull(String value) {
		if (!StringUtils.hasText(value)) {
			return null;
		}

		return value.trim();
	}
}

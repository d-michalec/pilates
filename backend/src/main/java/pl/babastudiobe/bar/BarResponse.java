package pl.babastudiobe.bar;

import java.util.List;

import pl.babastudiobe.media.MediaAssetResponse;

/**
 * Treść strony baru wraz z godzinami otwarcia. Godziny zwracamy jako siedem osobnych
 * dni - scalanie sąsiednich dni o tych samych godzinach w zakres typu
 * "poniedziałek-piątek" jest formatowaniem, więc robi je front.
 */
record BarResponse(
		String description,
		String imageAlt,
		String descriptionEn,
		String imageAltEn,
		MediaAssetResponse image,
		List<BarDayResponse> openingHours
) {

	record BarDayResponse(short dayOfWeek, String opensAt, String closesAt, boolean closed) {
	}
}

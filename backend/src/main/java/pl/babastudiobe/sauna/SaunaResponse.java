package pl.babastudiobe.sauna;

import java.util.List;
import java.util.UUID;

import pl.babastudiobe.media.MediaAssetResponse;

/**
 * Treść strony sauny wraz z planem seansów pogrupowanym po identycznym zestawie
 * godzin. Grupowanie robimy na backendzie, bo jest to reguła danych, a nie wygląd -
 * front dokłada tylko nazwy dni i ewentualne zwinięcie ich w zakres.
 */
record SaunaResponse(
		String description,
		String ctaLabel,
		String ctaUrl,
		String imageAlt,
		String descriptionEn,
		String ctaLabelEn,
		String imageAltEn,
		MediaAssetResponse image,
		List<SaunaSessionGroup> sessionGroups
) {

	/** Dni o dokładnie tym samym zestawie godzin, np. poniedziałek, środa i piątek. */
	record SaunaSessionGroup(List<Short> dayNumbers, List<String> times) {
	}

	/** Płaska pozycja dla panelu: pojedynczy wpis dzień plus godzina. */
	record SaunaSessionItem(UUID id, short dayOfWeek, String time) {
	}
}

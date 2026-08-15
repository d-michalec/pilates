package pl.babastudiobe.config;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Prosty licznik zapytań w stałym oknie czasowym, trzymany w pamięci procesu.
 *
 * Świadomie bez dodatkowej biblioteki i bez Redisa: strona stoi na jednej
 * maszynie, a ruch to kilka zgłoszeń dziennie. Gdyby kiedyś działała w kilku
 * kopiach, każda liczyłaby osobno - wtedy trzeba będzie przenieść licznik do
 * wspólnego magazynu.
 *
 * Okno stałe, nie przesuwne. Można je obejść, wysyłając porcję zapytań na styku
 * dwóch okien, ale przy tym zastosowaniu chodzi o zatrzymanie skryptu zalewającego
 * formularz, a nie o dokładne rozliczanie limitu.
 */
@Component
class RateLimiter {

	private record Okno(long poczatekMs, AtomicInteger licznik) {
	}

	private final Map<String, Okno> okna = new ConcurrentHashMap<>();

	/**
	 * Zwraca true, jeśli zapytanie mieści się w limicie.
	 *
	 * @param klucz identyfikator dzwoniącego wraz z nazwą zasobu, na przykład "kontakt:1.2.3.4"
	 */
	boolean pozwol(String klucz, int limit, Duration okno) {
		long teraz = System.currentTimeMillis();
		long dlugoscOkna = okno.toMillis();

		Okno biezace = okna.compute(klucz, (pominiety, obecne) -> {
			if (obecne == null || teraz - obecne.poczatekMs() >= dlugoscOkna) {
				return new Okno(teraz, new AtomicInteger(0));
			}

			return obecne;
		});

		return biezace.licznik().incrementAndGet() <= limit;
	}

	/**
	 * Sprząta wpisy starsze niż godzina. Bez tego mapa rosłaby w nieskończoność -
	 * każdy nowy adres zostawiałby po sobie wpis na zawsze, co jest samo w sobie
	 * sposobem na wyczerpanie pamięci.
	 */
	@Scheduled(fixedDelay = 3_600_000)
	void posprzataj() {
		long granica = System.currentTimeMillis() - 3_600_000;
		okna.entrySet().removeIf(wpis -> wpis.getValue().poczatekMs() < granica);
	}
}

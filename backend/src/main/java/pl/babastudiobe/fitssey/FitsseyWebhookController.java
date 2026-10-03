package pl.babastudiobe.fitssey;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * ODBIORNIK WEBHOOKÓW FITSSEY - PIERWSZA FAZA: NAGRYWANIE.
 *
 * Fitssey potrafi wołać nas przy zapisie klientki, zmianie statusu wizyty
 * i zmianie statusu płatności. To są dokładnie te trzy rzeczy, których piksel
 * na stronie zobaczyć nie może, bo dzieją się w ramce na cudzej domenie.
 *
 * Problem: webhooki nie są udokumentowane. Adres /docs/webhooks zwraca
 * czterysta cztery, a dokumentacja API o nich milczy. Nie wiemy więc, jak
 * wygląda treść zdarzenia, czy zawiera adres e-mail klientki, ani w jaki sposób
 * przesyłany jest "Klucz uwierzytelniający" z formularza w panelu Fitssey.
 *
 * Dlatego ten kontroler na razie NICZEGO NIE INTERPRETUJE. Zapisuje nagłówki
 * i treść, odpowiada dwusetką i tyle. Jedno prawdziwe wywołanie - wystarczy
 * jeden testowy zakup - odpowie na te pytania pewniej niż mail do ich wsparcia,
 * na który czekalibyśmy dzień lub dwa. Mapowanie na zdarzenia Mety dokładamy
 * dopiero wtedy, gdy wiemy, co faktycznie przychodzi.
 *
 * ZABEZPIECZENIE. Adres musi być publiczny, bo Fitssey ma do niego zadzwonić.
 * Formularz webhooka przyjmuje sam adres, więc jedyne miejsce, w które możemy
 * wpisać własny sekret, to ścieżka - tak samo jak przy callbacku GetResponse
 * (patrz NewsletterCallbackController). Bez skonfigurowanego sekretu endpoint
 * udaje, że nie istnieje.
 *
 * Klucz Fitssey sprawdzamy osobno i w sposób celowo luźny: szukamy go wszędzie,
 * w nagłówkach i w treści, i zapisujemy, czy się znalazł. To jest mechanizm
 * rozpoznania, nie ochrony - dzięki niemu dowiemy się, którym nagłówkiem go
 * przesyłają, zamiast zgadywać. Odrzucanie wywołań bez niego włączymy w drugiej
 * fazie, gdy będziemy znali mechanizm.
 */
@RestController
class FitsseyWebhookController {

	private static final Logger LOGGER = LoggerFactory.getLogger(FitsseyWebhookController.class);

	/**
	 * Powyżej tego rozmiaru treść przycinamy. Zdarzenia Fitssey są małe, a adres
	 * jest publiczny - bez ograniczenia ktoś mógłby zapychać bazę jednym żądaniem.
	 */
	private static final int MAKS_DLUGOSC_TRESCI = 64 * 1024;

	private final FitsseyWebhookService service;
	private final String sekretAdresu;

	FitsseyWebhookController(
			FitsseyWebhookService service,
			@Value("${app.fitssey.webhook-secret:}") String sekretAdresu
	) {
		this.service = service;
		this.sekretAdresu = sekretAdresu;
	}

	/**
	 * Zawsze odpowiadamy dwusetką, także gdy treść jest dla nas niezrozumiała.
	 *
	 * Webhooki zwykle ponawiają wywołanie po odpowiedzi innej niż 2xx, a my na
	 * tym etapie i tak tylko nagrywamy - odpowiedź błędem wywołałaby lawinę
	 * powtórzeń i nie naprawiłaby niczego.
	 */
	@PostMapping("/api/webhooks/fitssey/{sekret}")
	ResponseEntity<Void> odbierz(
			@PathVariable String sekret,
			@RequestBody(required = false) String tresc,
			HttpServletRequest zadanie
	) {
		if (!StringUtils.hasText(sekretAdresu) || !sekretAdresu.equals(sekret)) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}

		try {
			service.zapisz(naglowki(zadanie), przytnij(tresc));
		}
		catch (RuntimeException wyjatek) {
			// Nawet nieudany zapis kwitujemy dwusetką - Fitssey nic nie poradzi
			// na nasz błąd, a ponawianie tylko zasypałoby logi.
			LOGGER.error("Nie udało się zapisać webhooka z Fitssey.", wyjatek);
		}

		return ResponseEntity.ok().build();
	}

	/** Podgląd dla panelu: co przyszło i co z tym zrobiliśmy. */
	@GetMapping("/api/admin/fitssey/webhooks")
	List<WebhookResponse> lista(@RequestParam(defaultValue = "50") int limit) {
		return service.ostatnie(Math.clamp(limit, 1, 500));
	}

	private String naglowki(HttpServletRequest zadanie) {
		List<String> linie = new ArrayList<>();
		linie.add("%s %s".formatted(zadanie.getMethod(), zadanie.getRequestURI()));

		for (String nazwa : Collections.list(zadanie.getHeaderNames())) {
			for (String wartosc : Collections.list(zadanie.getHeaders(nazwa))) {
				linie.add("%s: %s".formatted(nazwa, wartosc));
			}
		}

		return String.join("\n", linie);
	}

	private String przytnij(String tresc) {
		if (tresc == null) {
			return "";
		}

		if (tresc.length() <= MAKS_DLUGOSC_TRESCI) {
			return tresc;
		}

		return tresc.substring(0, MAKS_DLUGOSC_TRESCI) + "\n[...treść przycięta przy zapisie...]";
	}

	/**
	 * Podgląd pojedynczego wywołania. Zawiera pełną treść, więc trafia wyłącznie
	 * do panelu - a ten siedzi za /api/admin.
	 */
	record WebhookResponse(
			UUID id,
			OffsetDateTime receivedAt,
			String eventType,
			String externalId,
			Boolean signatureOk,
			Long valueMinorUnits,
			String metaEventName,
			OffsetDateTime metaSentAt,
			String error,
			String headers,
			String payload
	) {

		static WebhookResponse from(FitsseyWebhookEvent zdarzenie) {
			return new WebhookResponse(
					zdarzenie.getId(),
					zdarzenie.getReceivedAt(),
					zdarzenie.getEventType(),
					zdarzenie.getExternalId(),
					zdarzenie.getSignatureOk(),
					zdarzenie.getValueMinorUnits(),
					zdarzenie.getMetaEventName(),
					zdarzenie.getMetaSentAt(),
					zdarzenie.getError(),
					zdarzenie.getHeaders(),
					zdarzenie.getPayload());
		}
	}

	@Service
	static class FitsseyWebhookService {

		/**
		 * PODPOWIEDZI ODCZYTYWANE Z TREŚCI - ŚWIADOMIE WYRAŻENIAMI REGULARNYMI,
		 * A NIE PARSEREM JSON.
		 *
		 * Dwa powody. Po pierwsze, projekt celowo nie używa Jacksona z ręki -
		 * Spring Boot 4 przeszedł na Jacksona 3, gdzie ObjectMapper przeniósł się
		 * do tools.jackson, i jedyne miejsce, które mogłoby go potrzebować,
		 * rozwiązaliśmy inaczej (patrz LegalDocumentRevisionRepository).
		 *
		 * Po drugie, i ważniejsze: na tym etapie NIE ZNAMY formatu zdarzeń
		 * Fitssey. Nie wiemy nawet, czy treść będzie JSON-em. Parser dawałby
		 * złudzenie, że coś rozumiemy; wyszukiwanie wzorca jest uczciwsze -
		 * to jest zgadywanka, która ma sprawić, żeby lista w panelu była
		 * czytelna od razu, zamiast pokazywać same daty. Gdy poznamy prawdziwy
		 * format, zostanie z tego jedno właściwe pole.
		 */
		private static final List<String> POLA_TYPU = List.of("event", "eventType", "event_type", "type", "name");
		private static final List<String> POLA_IDENTYFIKATORA = List.of("guid", "eventGuid", "eventId", "event_id", "id", "uuid");
		private static final List<String> POLA_KWOTY = List.of("itemTotalPrice", "totalPrice", "itemPrice", "amount", "price", "value");

		private static final List<Pattern> WZORCE_TYPU = wzorceTekstowe(POLA_TYPU);
		private static final List<Pattern> WZORCE_IDENTYFIKATORA = wzorceTekstowe(POLA_IDENTYFIKATORA);
		private static final List<Pattern> WZORCE_KWOTY = wzorceLiczbowe(POLA_KWOTY);

		private final FitsseyWebhookEventRepository repository;
		private final String kluczFitssey;

		FitsseyWebhookService(
				FitsseyWebhookEventRepository repository,
				@Value("${app.fitssey.webhook-auth-key:}") String kluczFitssey
		) {
			this.repository = repository;
			this.kluczFitssey = kluczFitssey;
		}

		@Transactional
		void zapisz(String naglowki, String tresc) {
			FitsseyWebhookEvent zdarzenie = new FitsseyWebhookEvent(
					zamaskujKlucz(naglowki),
					zamaskujKlucz(tresc),
					pierwszeDopasowanie(tresc, WZORCE_TYPU, 120),
					pierwszeDopasowanie(tresc, WZORCE_IDENTYFIKATORA, 200),
					czyKluczObecny(naglowki, tresc),
					pierwszaKwota(tresc));

			repository.save(zdarzenie);

			LOGGER.info(
					"Webhook z Fitssey: typ={}, identyfikator={}, klucz={}",
					zdarzenie.getEventType(),
					zdarzenie.getExternalId(),
					zdarzenie.getSignatureOk());
		}

		@Transactional(readOnly = true)
		List<WebhookResponse> ostatnie(int limit) {
			return repository.findAllByOrderByReceivedAtDesc(PageRequest.of(0, limit)).stream()
					.map(WebhookResponse::from)
					.toList();
		}

		private static List<Pattern> wzorceTekstowe(List<String> nazwy) {
			return nazwy.stream()
					.map(nazwa -> Pattern.compile("\"" + Pattern.quote(nazwa) + "\"\\s*:\\s*\"([^\"]{1,400})\""))
					.toList();
		}

		/**
		 * Kwotę bierzemy wyłącznie, gdy jest liczbą całkowitą - stąd negatywne
		 * sprawdzenie na kropkę po cyfrach. Fitssey podaje grosze, więc wartość
		 * z częścią dziesiętną znaczyłaby, że coś jest inaczej niż w ich
		 * dokumentacji. Wolimy wtedy puste pole w podglądzie niż cichą pomyłkę
		 * rzędu wielkości - 9500 to 95 zł, ale 95.00 odczytane jako 95 groszy
		 * byłoby błędem, którego nikt by nie zauważył.
		 */
		private static List<Pattern> wzorceLiczbowe(List<String> nazwy) {
			return nazwy.stream()
					.map(nazwa -> Pattern.compile("\"" + Pattern.quote(nazwa) + "\"\\s*:\\s*(\\d{1,15})(?![\\d.])"))
					.toList();
		}

		private String pierwszeDopasowanie(String tresc, List<Pattern> wzorce, int maksDlugosc) {
			if (!StringUtils.hasText(tresc)) {
				return null;
			}

			for (Pattern wzorzec : wzorce) {
				Matcher dopasowanie = wzorzec.matcher(tresc);

				if (dopasowanie.find()) {
					String wartosc = dopasowanie.group(1);
					return wartosc.length() > maksDlugosc ? wartosc.substring(0, maksDlugosc) : wartosc;
				}
			}

			return null;
		}

		private Long pierwszaKwota(String tresc) {
			if (!StringUtils.hasText(tresc)) {
				return null;
			}

			for (Pattern wzorzec : WZORCE_KWOTY) {
				Matcher dopasowanie = wzorzec.matcher(tresc);

				if (dopasowanie.find()) {
					try {
						return Long.parseLong(dopasowanie.group(1));
					}
					catch (NumberFormatException wyjatek) {
						return null;
					}
				}
			}

			return null;
		}

		/**
		 * `null` gdy nie mamy czego szukać. Patrz komentarz przy polu signatureOk:
		 * "nie sprawdzaliśmy" to co innego niż "nie znaleziono".
		 */
		private Boolean czyKluczObecny(String naglowki, String tresc) {
			if (!StringUtils.hasText(kluczFitssey)) {
				return null;
			}

			return (naglowki != null && naglowki.contains(kluczFitssey))
					|| (tresc != null && tresc.contains(kluczFitssey));
		}

		/**
		 * Klucza nie przechowujemy w bazie, nawet we własnej. Podmieniamy go na
		 * znacznik, który zostawia widoczne miejsce jego wystąpienia - a o to
		 * w pierwszej fazie chodzi: chcemy wiedzieć, KTÓRY nagłówek go niesie,
		 * a nie jaką ma wartość, bo tę i tak mamy w konfiguracji.
		 */
		private String zamaskujKlucz(String tekst) {
			if (tekst == null || !StringUtils.hasText(kluczFitssey)) {
				return tekst == null ? "" : tekst;
			}

			return tekst.replace(kluczFitssey, "***KLUCZ-FITSSEY***");
		}
	}
}

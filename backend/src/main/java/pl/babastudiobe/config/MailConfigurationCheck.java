package pl.babastudiobe.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Wypisuje przy starcie, czy poczta wychodząca jest skonfigurowana.
 *
 * Brak poczty jest stanem dopuszczalnym i celowo nie przerywa uruchomienia - na
 * maszynie deweloperskiej SMTP zwykle nie istnieje, a formularz ma tam działać.
 * Problem w tym, że ten stan nie daje po sobie znać: strona odpowiada
 * potwierdzeniem, wiadomość ląduje w bazie, panel ją pokazuje i wszystko wygląda
 * poprawnie. Jedyną różnicą jest to, że nikt nie dostaje powiadomienia - a to widać
 * dopiero wtedy, gdy ktoś napisze z pytaniem o zajęcia i nie doczeka się odpowiedzi.
 *
 * Dlatego stan poczty pojawia się w logu startowym. Po wdrożeniu wystarczy zajrzeć
 * w "docker compose logs backend", zamiast zgadywać.
 */
@Component
class MailConfigurationCheck {

	private static final Logger LOGGER = LoggerFactory.getLogger(MailConfigurationCheck.class);

	private final String host;
	private final String username;
	private final String password;
	private final String from;
	private final String to;

	MailConfigurationCheck(
			@Value("${spring.mail.host:}") String host,
			@Value("${spring.mail.username:}") String username,
			@Value("${spring.mail.password:}") String password,
			@Value("${app.contact.from-email:}") String from,
			@Value("${app.contact.to-email:}") String to
	) {
		this.host = host;
		this.username = username;
		this.password = password;
		this.from = from;
		this.to = to;
	}

	@EventListener(ApplicationReadyEvent.class)
	void wypiszStanPoczty() {
		if (!StringUtils.hasText(host)) {
			LOGGER.warn("Poczta wychodząca WYŁĄCZONA: brak SMTP_HOST. Wiadomości z formularza "
					+ "zapiszą się do bazy i będą widoczne w panelu, ale nikt nie dostanie powiadomienia. "
					+ "Nie wyjdzie też wiadomość powitalna newslettera, więc odnośnik do rezygnacji "
					+ "nie dotrze do zapisanych osób.");
			return;
		}

		// Host bez hasła to najczęstszy stan pośredni: ktoś uzupełnił połowę pliku
		// .env i uznał sprawę za zamkniętą. Wysyłka będzie się wtedy wywracać przy
		// każdej próbie, a jedynym śladem zostanie wpis w kolumnie failure_reason.
		if (!StringUtils.hasText(password)) {
			LOGGER.error("Poczta wychodząca NIEKOMPLETNA: SMTP_HOST ustawiony na {}, ale SMTP_PASSWORD jest puste. "
					+ "Każda próba wysyłki się nie powiedzie.", host);
			return;
		}

		String nadawca = StringUtils.hasText(from) ? from : username;

		if (!StringUtils.hasText(to)) {
			LOGGER.warn("Poczta działa, ale CONTACT_TO_EMAIL jest puste - powiadomienia o wiadomościach "
					+ "z formularza nie mają dokąd trafić. Zgłoszenia będą widoczne wyłącznie w panelu.");
		}

		// Gmail odrzuca wysyłkę, gdy nadawca nie jest kontem, na które się logujemy,
		// ani jego potwierdzonym aliasem. Nie umiemy tego sprawdzić przed pierwszą
		// próbą, ale możemy zwrócić uwagę, że te dwa adresy się różnią.
		if (StringUtils.hasText(username) && StringUtils.hasText(from) && !username.equalsIgnoreCase(from)) {
			LOGGER.warn("Nadawca ({}) różni się od konta SMTP ({}). Przy Gmailu zadziała to tylko wtedy, "
					+ "gdy nadawca jest potwierdzonym aliasem w ustawieniach \"Wyślij jako\".", from, username);
		}

		LOGGER.info("Poczta wychodząca skonfigurowana: serwer {}, nadawca {}, powiadomienia na {}.",
				host, nadawca, StringUtils.hasText(to) ? to : "(brak)");
	}
}

package pl.babastudiobe.newsletter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Wiadomość powitalna po zapisie do newslettera.
 *
 * Ta wiadomość istnieje z dwóch powodów, z których drugi jest ważniejszy.
 *
 * Po pierwsze, tylko tędy token wypisu może dotrzeć do zapisanej osoby. Bez niej
 * odnośnik do rezygnacji nie miałby jak trafić do nikogo i cały mechanizm byłby
 * martwy.
 *
 * Po drugie, formularz w stopce przyjmuje dowolny adres bez sprawdzania, czy należy
 * do osoby, która go wpisała. Bez wiadomości powitalnej można cudzym adresem zapisać
 * kogoś do newslettera, a ta osoba dowiaduje się o tym dopiero przy pierwszej wysyłce
 * i nie ma jak tego cofnąć. Wiadomość wysłana od razu daje jej odnośnik do rezygnacji,
 * zanim cokolwiek innego przyjdzie.
 */
@Component
class NewsletterMailer {

	private static final Logger LOGGER = LoggerFactory.getLogger(NewsletterMailer.class);

	private final ObjectProvider<JavaMailSender> mailSenderProvider;
	private final String mailHost;
	private final String mailUsername;
	private final String fromEmail;
	private final String siteUrl;

	NewsletterMailer(
			ObjectProvider<JavaMailSender> mailSenderProvider,
			@Value("${spring.mail.host:}") String mailHost,
			@Value("${spring.mail.username:}") String mailUsername,
			@Value("${app.contact.from-email:}") String fromEmail,
			@Value("${app.site-url:https://baba-studio.pl}") String siteUrl
	) {
		this.mailSenderProvider = mailSenderProvider;
		this.mailHost = mailHost;
		this.mailUsername = mailUsername;
		this.fromEmail = fromEmail;
		this.siteUrl = siteUrl;
	}

	void sendWelcome(NewsletterSubscription subscription) {
		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		String resolvedFrom = StringUtils.hasText(fromEmail) ? fromEmail : mailUsername;

		// Brak konfiguracji poczty nie może przerwać zapisu. Na maszynie deweloperskiej
		// SMTP zwykle nie jest ustawiony, a formularz ma tam działać normalnie.
		if (mailSender == null || !StringUtils.hasText(mailHost) || !StringUtils.hasText(resolvedFrom)) {
			LOGGER.debug("Poczta nie jest skonfigurowana - pomijam wiadomość powitalną.");
			return;
		}

		try {
			mailSender.send(toMail(subscription, resolvedFrom));
		}
		catch (RuntimeException exception) {
			// Zapis już jest w bazie i ma ważność. Nieudana wysyłka powitania nie może go
			// unieważnić - najwyżej ta osoba nie dostanie odnośnika do rezygnacji od razu.
			LOGGER.warn("Nie udało się wysłać wiadomości powitalnej: {}", exception.getMessage());
		}
	}

	private SimpleMailMessage toMail(NewsletterSubscription subscription, String resolvedFrom) {
		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(subscription.getEmail());
		message.setFrom(resolvedFrom);
		message.setSubject("Zapis do newslettera BABA Studio");
		message.setText("""
				Cześć%s!

				Twój adres został zapisany do newslettera BABA Studio. Będziemy pisać
				o nowych zajęciach, warsztatach i wydarzeniach w studiu.

				Jeśli to nie Ty się zapisywałaś albo zmienisz zdanie, możesz zrezygnować
				w każdej chwili - wystarczy otworzyć ten odnośnik:

				%s

				Do zobaczenia na macie,
				BABA Studio
				%s
				""".formatted(
				StringUtils.hasText(subscription.getName()) ? ", " + subscription.getName() : "",
				unsubscribeUrl(subscription),
				siteUrl
		));
		return message;
	}

	private String unsubscribeUrl(NewsletterSubscription subscription) {
		return "%s/newsletter/wypisz?token=%s".formatted(
				siteUrl.replaceAll("/+$", ""),
				subscription.getUnsubscribeToken()
		);
	}
}

package pl.babastudiobe.contact;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
class ContactService {

	private static final int MAX_FAILURE_REASON_LENGTH = 1000;

	private final ContactMessageRepository repository;
	private final ObjectProvider<JavaMailSender> mailSenderProvider;
	private final String mailHost;
	private final String mailUsername;
	private final String toEmail;
	private final String fromEmail;

	ContactService(
			ContactMessageRepository repository,
			ObjectProvider<JavaMailSender> mailSenderProvider,
			@Value("${spring.mail.host:}") String mailHost,
			@Value("${spring.mail.username:}") String mailUsername,
			@Value("${app.contact.to-email:}") String toEmail,
			@Value("${app.contact.from-email:}") String fromEmail
	) {
		this.repository = repository;
		this.mailSenderProvider = mailSenderProvider;
		this.mailHost = mailHost;
		this.mailUsername = mailUsername;
		this.toEmail = toEmail;
		this.fromEmail = fromEmail;
	}

	ContactMessage create(ContactRequest request) {
		ContactMessage contactMessage = repository.save(new ContactMessage(
				request.name().trim(),
				request.email().trim(),
				trimToNull(request.phone()),
				trimToNull(request.subject()),
				request.message().trim()
		));

		if (StringUtils.hasText(request.website())) {
			return contactMessage;
		}

		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		String resolvedFromEmail = StringUtils.hasText(fromEmail) ? fromEmail : mailUsername;
		if (mailSender == null || !StringUtils.hasText(mailHost) || !StringUtils.hasText(toEmail)
				|| !StringUtils.hasText(resolvedFromEmail)) {
			return contactMessage;
		}

		try {
			mailSender.send(toMail(contactMessage, resolvedFromEmail));
			contactMessage.markSent();
		}
		catch (RuntimeException exception) {
			contactMessage.markFailed(truncate(exception.getMessage()));
		}

		return repository.save(contactMessage);
	}

	private SimpleMailMessage toMail(ContactMessage contactMessage, String resolvedFromEmail) {
		SimpleMailMessage mailMessage = new SimpleMailMessage();
		mailMessage.setTo(toEmail);
		mailMessage.setFrom(resolvedFromEmail);
		mailMessage.setReplyTo(contactMessage.getEmail());
		mailMessage.setSubject(subject(contactMessage));
		mailMessage.setText("""
				Nowa wiadomość z formularza kontaktowego BABA Studio

				Imię i nazwisko: %s
				E-mail: %s
				Telefon: %s
				Temat: %s

				Wiadomość:
				%s
				""".formatted(
				contactMessage.getName(),
				contactMessage.getEmail(),
				valueOrDash(contactMessage.getPhone()),
				valueOrDash(contactMessage.getSubject()),
				contactMessage.getMessage()
		));
		return mailMessage;
	}

	private String subject(ContactMessage contactMessage) {
		String requestSubject = contactMessage.getSubject();
		if (StringUtils.hasText(requestSubject)) {
			return "BABA Studio: " + requestSubject;
		}
		return "BABA Studio: nowa wiadomość z formularza";
	}

	private String trimToNull(String value) {
		if (!StringUtils.hasText(value)) {
			return null;
		}
		return value.trim();
	}

	private String valueOrDash(String value) {
		return StringUtils.hasText(value) ? value : "-";
	}

	private String truncate(String value) {
		if (!StringUtils.hasText(value)) {
			return "Nie udało się wysłać wiadomości e-mail.";
		}
		return value.length() <= MAX_FAILURE_REASON_LENGTH ? value : value.substring(0, MAX_FAILURE_REASON_LENGTH);
	}
}

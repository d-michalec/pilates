package pl.babastudiobe.config;

import java.io.UnsupportedEncodingException;

import jakarta.mail.internet.MimeUtility;

import org.springframework.util.StringUtils;

/**
 * Składa pole nadawcy z adresu i nazwy wyświetlanej.
 *
 * Bez nazwy odbiorca widzi w skrzynce goły adres - przy koncie założonym pod wysyłkę
 * ze strony wygląda to jak poczta od przypadkowej osoby. Sama nazwa nie wpływa na
 * dostarczalność, ale wpływa na to, czy ktoś wiadomość otworzy.
 *
 * Adres zostaje nietknięty: Google wymaga, żeby zgadzał się z kontem, na które się
 * logujemy, a nazwa wyświetlana jest dowolna i nie bierze udziału w tym sprawdzeniu.
 */
public final class MailFrom {

	private MailFrom() {
	}

	public static String format(String adres, String nazwa) {
		if (!StringUtils.hasText(nazwa)) {
			return adres;
		}

		// Nagłówki poczty są z założenia siedmiobitowe. Polskie znaki w nazwie
		// trzeba zakodować, inaczej część programów pocztowych pokaże krzaki
		// zamiast nazwy - albo odrzuci nagłówek jako niepoprawny.
		String zakodowana;
		try {
			zakodowana = MimeUtility.encodeText(nazwa, "UTF-8", "B");
		}
		catch (UnsupportedEncodingException wyjatek) {
			// UTF-8 jest obowiązkowe w każdej maszynie wirtualnej Javy, więc to się
			// nie zdarzy. Gdyby jednak - lepiej wysłać z samym adresem niż nie wysłać.
			return adres;
		}

		return "%s <%s>".formatted(zakodowana, adres);
	}
}

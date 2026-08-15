package pl.babastudiobe.config;

import java.io.IOException;
import java.time.Duration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Ogranicza liczbę zgłoszeń z formularza kontaktowego i zapisów do newslettera.
 *
 * Oba adresy są publiczne i zapisują do bazy, a jedyną dotychczasową ochroną było
 * ukryte pole na boty. Bez limitu wystarczy prosty skrypt, żeby zasypać skrzynkę
 * właścicielki i listę adresów.
 */
@Component
class RateLimitFilter extends OncePerRequestFilter {

	private static final String SCIEZKA_KONTAKT = "/api/contact";
	private static final String SCIEZKA_NEWSLETTER = "/api/newsletter/subscribe";

	private final RateLimiter rateLimiter;
	private final int limitZapytan;
	private final Duration okno;

	RateLimitFilter(
			RateLimiter rateLimiter,
			@Value("${app.rate-limit.max-requests:5}") int limitZapytan,
			@Value("${app.rate-limit.window-minutes:10}") int oknoMinut
	) {
		this.rateLimiter = rateLimiter;
		this.limitZapytan = limitZapytan;
		this.okno = Duration.ofMinutes(oknoMinut);
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if (!HttpMethod.POST.matches(request.getMethod())) {
			return true;
		}

		String sciezka = request.getRequestURI();
		return !SCIEZKA_KONTAKT.equals(sciezka) && !SCIEZKA_NEWSLETTER.equals(sciezka);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {

		String klucz = request.getRequestURI() + ":" + request.getRemoteAddr();

		if (rateLimiter.pozwol(klucz, limitZapytan, okno)) {
			chain.doFilter(request, response);
			return;
		}

		// Komunikat po polsku, bo trafia wprost do formularza na stronie.
		response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");
		response.getWriter().write(
				"{\"message\":\"Wysłano już kilka wiadomości z tego miejsca. Spróbuj ponownie za kilkanaście minut.\"}");
	}
}

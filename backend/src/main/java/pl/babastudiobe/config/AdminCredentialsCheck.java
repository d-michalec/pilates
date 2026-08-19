package pl.babastudiobe.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Nie pozwala wystartować z domyślnym loginem administratora.
 *
 * Wartości admin/admin siedzą w application.yaml, bo lokalna praca nad projektem
 * ma działać bez konfigurowania czegokolwiek. Na serwerze te same wartości byłyby
 * furtką dla każdego, kto widział to repozytorium.
 *
 * Sprawdzenie jest tutaj, a nie w docker-compose.yml, bo Compose podstawia zmienne
 * przy wczytywaniu całego pliku - wymóg zapisany tam blokował także "docker compose
 * build", które żadnych haseł nie potrzebuje. Tu bariera stoi na drodze do
 * uruchomienia i obejmuje również uruchomienie jara wprost, bez Dockera.
 */
@Component
class AdminCredentialsCheck {

	private static final String DOMYSLNA_WARTOSC = "admin";

	AdminCredentialsCheck(
			@Value("${app.admin.username:}") String username,
			@Value("${app.admin.password:}") String password,
			@Value("${app.require-strong-admin:false}") boolean wymagajSilnych
	) {
		if (!wymagajSilnych) {
			return;
		}

		if (username.isBlank() || password.isBlank()) {
			throw new IllegalStateException(
					"Brak loginu lub hasła administratora. Ustaw ADMIN_USERNAME i ADMIN_PASSWORD w pliku infra/.env.");
		}

		if (DOMYSLNA_WARTOSC.equals(username) || DOMYSLNA_WARTOSC.equals(password)) {
			throw new IllegalStateException(
					"Login i hasło administratora nie mogą zostać na wartości domyślnej \"admin\". "
							+ "Zmień ADMIN_USERNAME i ADMIN_PASSWORD w pliku infra/.env.");
		}
	}
}

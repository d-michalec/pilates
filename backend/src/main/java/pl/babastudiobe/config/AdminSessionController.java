package pl.babastudiobe.config;

import java.security.Principal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lekki endpoint do sprawdzenia danych logowania. Panel woła go przy próbie logowania
 * i przy wejściu na chronioną trasę - jest tani, bo nie dotyka bazy.
 */
@RestController
@RequestMapping("/api/admin")
class AdminSessionController {

	@GetMapping("/session")
	AdminSessionResponse session(Principal principal) {
		return new AdminSessionResponse(principal.getName());
	}

	record AdminSessionResponse(String username) {
	}
}

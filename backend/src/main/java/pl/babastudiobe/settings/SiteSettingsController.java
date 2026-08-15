package pl.babastudiobe.settings;

import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Validated
@RestController
@RequestMapping("/api")
class SiteSettingsController {

	private final SiteSettingsService service;

	SiteSettingsController(SiteSettingsService service) {
		this.service = service;
	}

	@GetMapping("/settings")
	SiteSettingsResponse get() {
		return service.get();
	}

	@PutMapping("/admin/settings")
	SiteSettingsResponse update(@RequestBody SiteSettingsRequest request) {
		return service.update(request);
	}

	record SiteSettingsRequest(
			@Size(max = 500) String instagramUrl,
			@Size(max = 500) String facebookUrl
	) {
	}

	record SiteSettingsResponse(String instagramUrl, String facebookUrl) {
	}

	@Service
	static class SiteSettingsService {

		private final SiteSettingsRepository repository;

		SiteSettingsService(SiteSettingsRepository repository) {
			this.repository = repository;
		}

		@Transactional(readOnly = true)
		SiteSettingsResponse get() {
			SiteSettings settings = findOrThrow();
			return new SiteSettingsResponse(settings.getInstagramUrl(), settings.getFacebookUrl());
		}

		@Transactional
		SiteSettingsResponse update(SiteSettingsRequest request) {
			SiteSettings settings = findOrThrow();
			settings.update(normalizeUrl(request.instagramUrl()), normalizeUrl(request.facebookUrl()));
			repository.save(settings);

			return new SiteSettingsResponse(settings.getInstagramUrl(), settings.getFacebookUrl());
		}

		/**
		 * Puste pole zapisujemy jako null, żeby front miał jeden warunek na ukrycie ikony.
		 * Odrzucamy adresy inne niż http i https - inaczej dałoby się wstawić javascript:.
		 */
		private String normalizeUrl(String url) {
			if (!StringUtils.hasText(url)) {
				return null;
			}

			String trimmed = url.trim();
			if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
				throw new ResponseStatusException(
						HttpStatus.BAD_REQUEST,
						"Adres musi zaczynać się od https:// albo http://.");
			}

			return trimmed;
		}

		private SiteSettings findOrThrow() {
			return repository.findAll().stream()
					.findFirst()
					.orElseThrow(() -> new ResponseStatusException(
							HttpStatus.INTERNAL_SERVER_ERROR,
							"Brak rekordu ustawień. Sprawdź, czy migracja V10 została wykonana."));
		}
	}
}

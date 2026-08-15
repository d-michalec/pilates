package pl.babastudiobe.sauna;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import pl.babastudiobe.sauna.SaunaResponse.SaunaSessionItem;

@Validated
@RestController
@RequestMapping("/api")
class SaunaController {

	private final SaunaService saunaService;

	SaunaController(SaunaService saunaService) {
		this.saunaService = saunaService;
	}

	@GetMapping("/sauna")
	SaunaResponse get() {
		return saunaService.get();
	}

	@PutMapping(path = "/admin/sauna", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	SaunaResponse update(
			@RequestParam @NotBlank @Size(max = 4000) String description,
			@RequestParam @NotBlank @Size(max = 80) String ctaLabel,
			@RequestParam @NotBlank @Size(max = 255) String ctaUrl,
			@RequestParam @NotBlank @Size(max = 180) String imageAlt,
			@RequestParam(required = false) @Size(max = 4000) String descriptionEn,
			@RequestParam(required = false) @Size(max = 80) String ctaLabelEn,
			@RequestParam(required = false) @Size(max = 180) String imageAltEn,
			@RequestParam(required = false) MultipartFile image
	) {
		return saunaService.update(description, ctaLabel, ctaUrl, imageAlt, descriptionEn, ctaLabelEn, imageAltEn, image);
	}

	@GetMapping("/admin/sauna/sessions")
	List<SaunaSessionItem> listSessions() {
		return saunaService.listSessions();
	}

	@PostMapping("/admin/sauna/sessions")
	List<SaunaSessionItem> addSession(
			@RequestParam @NotNull @Min(1) @Max(7) Short dayOfWeek,
			@RequestParam @NotNull @DateTimeFormat(pattern = "HH:mm") LocalTime time
	) {
		return saunaService.addSession(dayOfWeek, time);
	}

	@DeleteMapping("/admin/sauna/sessions/{id}")
	ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
		saunaService.deleteSession(id);
		return ResponseEntity.noContent().build();
	}
}

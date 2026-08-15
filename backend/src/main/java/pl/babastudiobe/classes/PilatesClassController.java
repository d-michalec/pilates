package pl.babastudiobe.classes;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api")
class PilatesClassController {

	private final PilatesClassService pilatesClassService;

	PilatesClassController(PilatesClassService pilatesClassService) {
		this.pilatesClassService = pilatesClassService;
	}

	@GetMapping("/classes")
	List<PilatesClassResponse> list() {
		return pilatesClassService.list();
	}

	/** Kolejność nadajemy automatycznie - zmienia się ją strzałkami na liście w panelu. */
	@PostMapping(path = "/admin/classes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ResponseEntity<PilatesClassResponse> create(
			@RequestParam @NotBlank @Size(max = 180) String title,
			@RequestParam @NotBlank @Size(max = 120) String levelLabel,
			@RequestParam @NotBlank @Size(max = 1800) String description,
			@RequestParam(required = false) @Size(max = 500) String signupUrl,
			@RequestParam(required = false) @Size(max = 180) String titleEn,
			@RequestParam(required = false) @Size(max = 120) String levelLabelEn,
			@RequestParam(required = false) @Size(max = 1800) String descriptionEn,
			@RequestParam(required = false) MultipartFile image
	) {
		PilatesClassResponse created = pilatesClassService.create(
				title, levelLabel, description, signupUrl, titleEn, levelLabelEn, descriptionEn, image);
		return ResponseEntity
				.created(URI.create("/api/classes/" + created.id()))
				.body(created);
	}

	/**
	 * Brak pliku zachowuje dotychczasowe zdjęcie. Do jego skasowania służy removeImage,
	 * bo zdjęcie zajęć jest opcjonalne.
	 */
	@PutMapping(path = "/admin/classes/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	PilatesClassResponse update(
			@PathVariable UUID id,
			@RequestParam @NotBlank @Size(max = 180) String title,
			@RequestParam @NotBlank @Size(max = 120) String levelLabel,
			@RequestParam @NotBlank @Size(max = 1800) String description,
			@RequestParam(required = false) @Size(max = 500) String signupUrl,
			@RequestParam(required = false) @Size(max = 180) String titleEn,
			@RequestParam(required = false) @Size(max = 120) String levelLabelEn,
			@RequestParam(required = false) @Size(max = 1800) String descriptionEn,
			@RequestParam(required = false, defaultValue = "false") boolean removeImage,
			@RequestParam(required = false) MultipartFile image
	) {
		return pilatesClassService.update(
				id, title, levelLabel, description, signupUrl, titleEn, levelLabelEn, descriptionEn, removeImage, image);
	}

	@DeleteMapping("/admin/classes/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		pilatesClassService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/admin/classes/order")
	List<PilatesClassResponse> reorder(@RequestBody @NotEmpty List<UUID> orderedIds) {
		return pilatesClassService.reorder(orderedIds);
	}
}

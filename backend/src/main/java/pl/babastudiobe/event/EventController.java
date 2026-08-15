package pl.babastudiobe.event;

import java.net.URI;
import java.time.LocalDateTime;
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

@Validated
@RestController
@RequestMapping("/api")
class EventController {

	private final EventService eventService;

	EventController(EventService eventService) {
		this.eventService = eventService;
	}

	@GetMapping("/events")
	List<EventResponse> list() {
		return eventService.list();
	}

	@GetMapping("/events/{id}")
	EventResponse get(@PathVariable UUID id) {
		return eventService.get(id);
	}

	@PostMapping(path = "/admin/events", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ResponseEntity<EventResponse> create(
			@RequestParam @NotBlank @Size(max = 220) String title,
			@RequestParam @NotBlank @Size(max = 160) String hostName,
			@RequestParam @NotBlank @Size(max = 600) String shortDescription,
			@RequestParam @NotBlank @Size(max = 6000) String description,
			@RequestParam(required = false) @Size(max = 3000) String hostDescription,
			@RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime eventStartAt,
			@RequestParam(required = false) @Min(1) @Max(1440) Integer durationMinutes,
			@RequestParam(required = false) @Size(max = 255) String location,
			@RequestParam(required = false) @Min(1) @Max(100000) Integer capacity,
			@RequestParam(required = false) @Size(max = 80) String price,
			@RequestParam(required = false) @Size(max = 500) String signupUrl,
			@RequestParam(required = false) @Size(max = 220) String titleEn,
			@RequestParam(required = false) @Size(max = 600) String shortDescriptionEn,
			@RequestParam(required = false) @Size(max = 6000) String descriptionEn,
			@RequestParam(required = false) @Size(max = 3000) String hostDescriptionEn,
			@RequestParam(required = false) @Size(max = 255) String locationEn,
			@RequestParam(required = false) @Size(max = 80) String priceEn,
			@RequestParam MultipartFile image,
			@RequestParam(required = false) MultipartFile hostImage
	) {
		EventDetails details = new EventDetails(
				title, hostName, shortDescription, description, hostDescription,
				eventStartAt, durationMinutes, location, capacity, price, signupUrl,
				titleEn, shortDescriptionEn, descriptionEn, hostDescriptionEn, locationEn, priceEn);

		EventResponse created = eventService.create(details, image, hostImage);
		return ResponseEntity
				.created(URI.create("/api/events/" + created.id()))
				.body(created);
	}

	/**
	 * Brak pliku zachowuje dotychczasowe zdjęcie. Zdjęcie wydarzenia jest obowiązkowe,
	 * więc da się je tylko podmienić; zdjęcie prowadzącego można skasować flagą
	 * removeHostImage.
	 */
	@PutMapping(path = "/admin/events/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	EventResponse update(
			@PathVariable UUID id,
			@RequestParam @NotBlank @Size(max = 220) String title,
			@RequestParam @NotBlank @Size(max = 160) String hostName,
			@RequestParam @NotBlank @Size(max = 600) String shortDescription,
			@RequestParam @NotBlank @Size(max = 6000) String description,
			@RequestParam(required = false) @Size(max = 3000) String hostDescription,
			@RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime eventStartAt,
			@RequestParam(required = false) @Min(1) @Max(1440) Integer durationMinutes,
			@RequestParam(required = false) @Size(max = 255) String location,
			@RequestParam(required = false) @Min(1) @Max(100000) Integer capacity,
			@RequestParam(required = false) @Size(max = 80) String price,
			@RequestParam(required = false) @Size(max = 500) String signupUrl,
			@RequestParam(required = false) @Size(max = 220) String titleEn,
			@RequestParam(required = false) @Size(max = 600) String shortDescriptionEn,
			@RequestParam(required = false) @Size(max = 6000) String descriptionEn,
			@RequestParam(required = false) @Size(max = 3000) String hostDescriptionEn,
			@RequestParam(required = false) @Size(max = 255) String locationEn,
			@RequestParam(required = false) @Size(max = 80) String priceEn,
			@RequestParam(required = false, defaultValue = "false") boolean removeHostImage,
			@RequestParam(required = false) MultipartFile image,
			@RequestParam(required = false) MultipartFile hostImage
	) {
		EventDetails details = new EventDetails(
				title, hostName, shortDescription, description, hostDescription,
				eventStartAt, durationMinutes, location, capacity, price, signupUrl,
				titleEn, shortDescriptionEn, descriptionEn, hostDescriptionEn, locationEn, priceEn);

		return eventService.update(id, details, removeHostImage, image, hostImage);
	}

	@DeleteMapping("/admin/events/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		eventService.delete(id);
		return ResponseEntity.noContent().build();
	}
}

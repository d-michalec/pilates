package pl.babastudiobe.landing;

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
class LandingController {

	private final LandingService landingService;
	private final LandingGalleryService landingGalleryService;
	private final LandingOfferService landingOfferService;

	LandingController(
			LandingService landingService,
			LandingGalleryService landingGalleryService,
			LandingOfferService landingOfferService
	) {
		this.landingService = landingService;
		this.landingGalleryService = landingGalleryService;
		this.landingOfferService = landingOfferService;
	}

	@GetMapping("/landing")
	LandingHeroResponse getLanding() {
		return landingService.getHero();
	}

	@GetMapping("/landing/gallery")
	List<LandingGalleryImageResponse> getGallery() {
		return landingGalleryService.list();
	}

	@PutMapping(path = "/admin/landing/hero", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	LandingHeroResponse updateHero(
			@RequestParam @NotBlank @Size(max = 120) String title,
			@RequestParam @NotBlank @Size(max = 80) String ctaLabel,
			@RequestParam @NotBlank @Size(max = 255) String ctaUrl,
			@RequestParam @NotBlank @Size(max = 180) String imageAlt,
			@RequestParam(required = false) @Size(max = 120) String titleEn,
			@RequestParam(required = false) @Size(max = 4000) String descriptionEn,
			@RequestParam(required = false) @Size(max = 80) String ctaLabelEn,
			@RequestParam(required = false) @Size(max = 180) String imageAltEn,
			@RequestParam(required = false) MultipartFile heroImage
	) {
		return landingService.updateHero(
				title, ctaLabel, ctaUrl, imageAlt, titleEn, descriptionEn, ctaLabelEn, imageAltEn, heroImage);
	}

	@PostMapping(path = "/admin/landing/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	List<LandingGalleryImageResponse> uploadGallery(@RequestParam("images") List<MultipartFile> images) {
		return landingGalleryService.upload(images);
	}

	/** Galeria nie ma edycji - zdjęcie podmienia się przez usunięcie i dodanie nowego. */
	@DeleteMapping("/admin/landing/gallery/{id}")
	ResponseEntity<Void> deleteGalleryImage(@PathVariable UUID id) {
		landingGalleryService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/landing/offer")
	LandingOfferService.LandingOfferResponse getOffer() {
		return landingOfferService.get();
	}

	/** Tło sekcji jest opcjonalne, więc usunięcie wymaga jawnej flagi removeImage. */
	@PutMapping(path = "/admin/landing/offer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	LandingOfferService.LandingOfferResponse updateOffer(
			@RequestParam @NotBlank @Size(max = 180) String imageAlt,
			@RequestParam(required = false, defaultValue = "false") boolean removeImage,
			@RequestParam(required = false) MultipartFile image
	) {
		return landingOfferService.update(imageAlt, removeImage, image);
	}

	@PatchMapping("/admin/landing/gallery/order")
	List<LandingGalleryImageResponse> reorderGallery(@RequestBody @NotEmpty List<UUID> orderedIds) {
		return landingGalleryService.reorder(orderedIds);
	}
}

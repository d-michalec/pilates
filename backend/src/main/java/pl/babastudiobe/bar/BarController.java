package pl.babastudiobe.bar;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api")
class BarController {

	private final BarService barService;

	BarController(BarService barService) {
		this.barService = barService;
	}

	@GetMapping("/bar")
	BarResponse get() {
		return barService.get();
	}

	@PutMapping(path = "/admin/bar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	BarResponse update(
			@RequestParam @NotBlank @Size(max = 4000) String description,
			@RequestParam @NotBlank @Size(max = 180) String imageAlt,
			@RequestParam(required = false) @Size(max = 4000) String descriptionEn,
			@RequestParam(required = false) @Size(max = 180) String imageAltEn,
			@RequestParam(required = false) MultipartFile image
	) {
		return barService.update(description, imageAlt, descriptionEn, imageAltEn, image);
	}

	@PutMapping("/admin/bar/hours")
	BarResponse updateOpeningHours(@RequestBody @NotEmpty List<BarDayRequest> days) {
		return barService.updateOpeningHours(days);
	}
}

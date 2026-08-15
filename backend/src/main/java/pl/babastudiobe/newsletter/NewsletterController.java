package pl.babastudiobe.newsletter;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
class NewsletterController {

	private final NewsletterService newsletterService;

	NewsletterController(NewsletterService newsletterService) {
		this.newsletterService = newsletterService;
	}

	@PostMapping("/newsletter/subscribe")
	ResponseEntity<NewsletterSubscribeResponse> subscribe(@Valid @RequestBody NewsletterSubscribeRequest request) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(newsletterService.subscribe(request));
	}

	@GetMapping("/admin/newsletter/status")
	NewsletterAdminStatusResponse adminStatus() {
		return newsletterService.adminStatus();
	}
}

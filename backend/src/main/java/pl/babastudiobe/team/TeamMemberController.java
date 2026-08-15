package pl.babastudiobe.team;

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
class TeamMemberController {

	private final TeamMemberService teamMemberService;

	TeamMemberController(TeamMemberService teamMemberService) {
		this.teamMemberService = teamMemberService;
	}

	@GetMapping("/team")
	List<TeamMemberResponse> list() {
		return teamMemberService.list();
	}

	@PostMapping(path = "/admin/team", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ResponseEntity<TeamMemberResponse> create(
			@RequestParam @NotBlank @Size(max = 160) String fullName,
			@RequestParam @NotBlank @Size(max = 4000) String description,
			@RequestParam(required = false) @Size(max = 4000) String descriptionEn,
			@RequestParam MultipartFile photo
	) {
		TeamMemberResponse created = teamMemberService.create(fullName, description, descriptionEn, photo);
		return ResponseEntity
				.created(URI.create("/api/team/" + created.id()))
				.body(created);
	}

	/** Brak pliku w żądaniu oznacza zachowanie dotychczasowego zdjęcia. */
	@PutMapping(path = "/admin/team/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	TeamMemberResponse update(
			@PathVariable UUID id,
			@RequestParam @NotBlank @Size(max = 160) String fullName,
			@RequestParam @NotBlank @Size(max = 4000) String description,
			@RequestParam(required = false) @Size(max = 4000) String descriptionEn,
			@RequestParam(required = false) MultipartFile photo
	) {
		return teamMemberService.update(id, fullName, description, descriptionEn, photo);
	}

	@DeleteMapping("/admin/team/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		teamMemberService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/admin/team/order")
	List<TeamMemberResponse> reorder(@RequestBody @NotEmpty List<UUID> orderedIds) {
		return teamMemberService.reorder(orderedIds);
	}
}

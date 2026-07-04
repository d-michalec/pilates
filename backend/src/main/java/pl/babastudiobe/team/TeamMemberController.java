package pl.babastudiobe.team;

import java.net.URI;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
			@RequestParam MultipartFile photo
	) {
		TeamMemberResponse created = teamMemberService.create(fullName, description, photo);
		return ResponseEntity
				.created(URI.create("/api/team/" + created.id()))
				.body(created);
	}
}

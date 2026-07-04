package pl.babastudiobe.team;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import pl.babastudiobe.storage.ImageStorageService;
import pl.babastudiobe.storage.StoredFile;

@Service
class TeamMemberService {

	private final TeamMemberRepository repository;
	private final ImageStorageService imageStorageService;

	TeamMemberService(TeamMemberRepository repository, ImageStorageService imageStorageService) {
		this.repository = repository;
		this.imageStorageService = imageStorageService;
	}

	@Transactional(readOnly = true)
	List<TeamMemberResponse> list() {
		return repository.findAll().stream()
				.sorted(Comparator.comparing(TeamMember::getCreatedAt).reversed())
				.map(TeamMemberResponse::from)
				.toList();
	}

	@Transactional
	TeamMemberResponse create(String fullName, String description, MultipartFile photo) {
		StoredFile storedFile = imageStorageService.storeTeamPhoto(photo);
		TeamMember member = new TeamMember(
				fullName.trim(),
				description.trim(),
				storedFile.path(),
				storedFile.contentType(),
				storedFile.size()
		);

		return TeamMemberResponse.from(repository.save(member));
	}
}

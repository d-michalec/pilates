package pl.babastudiobe.team;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaStorageService;

@Service
class TeamMemberService {

	private static final String MEDIA_CATEGORY = "team";

	private final TeamMemberRepository repository;
	private final MediaStorageService mediaStorageService;

	TeamMemberService(TeamMemberRepository repository, MediaStorageService mediaStorageService) {
		this.repository = repository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	List<TeamMemberResponse> list() {
		return sortedMembers().stream()
				.map(TeamMemberResponse::from)
				.toList();
	}

	@Transactional
	TeamMemberResponse create(String fullName, String description, String descriptionEn, MultipartFile photo) {
		MediaAsset image = mediaStorageService.storeImage(MEDIA_CATEGORY, photo);
		TeamMember member = new TeamMember(
				fullName.trim(), description.trim(), trimToNull(descriptionEn), nextSortOrder(), image);

		return TeamMemberResponse.from(repository.save(member));
	}

	@Transactional
	TeamMemberResponse update(UUID id, String fullName, String description, String descriptionEn, MultipartFile photo) {
		TeamMember member = findOrThrow(id);
		member.updateDetails(fullName.trim(), description.trim(), trimToNull(descriptionEn));

		// Puste pole pliku oznacza "zostaw obecne zdjęcie", a nie "usuń".
		if (photo != null && !photo.isEmpty()) {
			MediaAsset previousImage = member.replaceImage(mediaStorageService.storeImage(MEDIA_CATEGORY, photo));
			mediaStorageService.delete(previousImage);
		}

		return TeamMemberResponse.from(repository.save(member));
	}

	@Transactional
	void delete(UUID id) {
		TeamMember member = findOrThrow(id);
		MediaAsset image = member.getImage();

		repository.delete(member);
		repository.flush();
		mediaStorageService.delete(image);

		normalizeSortOrder();
	}

	/**
	 * Przyjmujemy pełną listę identyfikatorów w docelowej kolejności zamiast serii
	 * pojedynczych zmian - dzięki temu nieudane żądanie nie zostawia listy w stanie
	 * pośrednim, w którym dwie osoby mają ten sam numer porządkowy.
	 */
	@Transactional
	List<TeamMemberResponse> reorder(List<UUID> orderedIds) {
		List<TeamMember> members = repository.findAll();
		List<UUID> currentIds = members.stream().map(TeamMember::getId).toList();

		if (orderedIds.size() != members.size() || !orderedIds.containsAll(currentIds)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Lista kolejności musi zawierać dokładnie te same osoby co baza.");
		}

		for (TeamMember member : members) {
			member.assignSortOrder(orderedIds.indexOf(member.getId()));
		}

		repository.saveAll(members);
		return list();
	}

	/** Puste tłumaczenie zapisujemy jako null, żeby front miał jeden warunek. */
	private String trimToNull(String value) {
		return StringUtils.hasText(value) ? value.trim() : null;
	}

	private TeamMember findOrThrow(UUID id) {
		return repository.findById(id).orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"Nie znaleziono osoby o podanym identyfikatorze."));
	}

	private List<TeamMember> sortedMembers() {
		List<TeamMember> members = new ArrayList<>(repository.findAll());
		members.sort(Comparator
				.comparing(TeamMember::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder()))
				.thenComparing(TeamMember::getCreatedAt, Comparator.reverseOrder()));

		return members;
	}

	private int nextSortOrder() {
		return repository.findAll().stream()
				.map(TeamMember::getSortOrder)
				.filter(Objects::nonNull)
				.max(Comparator.naturalOrder())
				.map(highest -> highest + 1)
				.orElse(0);
	}

	/** Po usunięciu zostają dziury w numeracji - domykamy je, żeby nie rosły w nieskończoność. */
	private void normalizeSortOrder() {
		List<TeamMember> members = sortedMembers();

		for (int position = 0; position < members.size(); position++) {
			members.get(position).assignSortOrder(position);
		}

		repository.saveAll(members);
	}
}

package pl.babastudiobe.team;

import java.time.OffsetDateTime;
import java.util.UUID;

record TeamMemberResponse(
		UUID id,
		String fullName,
		String description,
		String photoUrl,
		String photoContentType,
		long photoSize,
		OffsetDateTime createdAt,
		OffsetDateTime updatedAt
) {

	static TeamMemberResponse from(TeamMember member) {
		return new TeamMemberResponse(
				member.getId(),
				member.getFullName(),
				member.getDescription(),
				"/uploads/" + member.getPhotoPath(),
				member.getPhotoContentType(),
				member.getPhotoSize(),
				member.getCreatedAt(),
				member.getUpdatedAt()
		);
	}
}

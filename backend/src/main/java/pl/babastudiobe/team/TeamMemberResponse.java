package pl.babastudiobe.team;

import java.time.OffsetDateTime;
import java.util.UUID;

import pl.babastudiobe.media.MediaAssetResponse;

record TeamMemberResponse(
		UUID id,
		String fullName,
		String description,
		String descriptionEn,
		Integer sortOrder,
		MediaAssetResponse image,
		OffsetDateTime createdAt,
		OffsetDateTime updatedAt
) {

	static TeamMemberResponse from(TeamMember member) {
		return new TeamMemberResponse(
				member.getId(),
				member.getFullName(),
				member.getDescription(),
				member.getDescriptionEn(),
				member.getSortOrder(),
				MediaAssetResponse.optimized(member.getImage()),
				member.getCreatedAt(),
				member.getUpdatedAt()
		);
	}
}

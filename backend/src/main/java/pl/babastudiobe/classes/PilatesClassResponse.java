package pl.babastudiobe.classes;

import java.util.UUID;

import pl.babastudiobe.media.MediaAssetResponse;

record PilatesClassResponse(
		UUID id,
		String title,
		String levelLabel,
		String description,
		String signupUrl,
		String titleEn,
		String levelLabelEn,
		String descriptionEn,
		Integer sortOrder,
		MediaAssetResponse image
) {

	static PilatesClassResponse from(PilatesClass pilatesClass) {
		return new PilatesClassResponse(
				pilatesClass.getId(),
				pilatesClass.getTitle(),
				pilatesClass.getLevelLabel(),
				pilatesClass.getDescription(),
				pilatesClass.getSignupUrl(),
				pilatesClass.getTitleEn(),
				pilatesClass.getLevelLabelEn(),
				pilatesClass.getDescriptionEn(),
				pilatesClass.getSortOrder(),
				pilatesClass.getImage() == null ? null : MediaAssetResponse.optimized(pilatesClass.getImage())
		);
	}
}

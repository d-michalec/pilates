package pl.babastudiobe.landing;

import java.util.UUID;

import pl.babastudiobe.media.MediaAssetResponse;

record LandingGalleryImageResponse(
		UUID id,
		int sortOrder,
		MediaAssetResponse image
) {

	static LandingGalleryImageResponse from(LandingGalleryImage galleryImage) {
		return new LandingGalleryImageResponse(
				galleryImage.getId(),
				galleryImage.getSortOrder(),
				MediaAssetResponse.optimized(galleryImage.getImage())
		);
	}
}

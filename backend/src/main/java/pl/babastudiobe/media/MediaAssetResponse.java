package pl.babastudiobe.media;

import java.util.UUID;

public record MediaAssetResponse(
		UUID id,
		String category,
		String originalFileName,
		String url,
		String thumbnailUrl,
		String contentType,
		long sizeBytes,
		String thumbnailContentType,
		Long thumbnailSizeBytes
) {

	public static MediaAssetResponse from(MediaAsset asset) {
		return from(asset, false);
	}

	public static MediaAssetResponse optimized(MediaAsset asset) {
		return from(asset, true);
	}

	private static MediaAssetResponse from(MediaAsset asset, boolean useThumbnailAsPrimaryUrl) {
		String thumbnailUrl = asset.getThumbnailRelativePath() == null
				? null
				: "/uploads/" + asset.getThumbnailRelativePath();
		String originalUrl = "/uploads/" + asset.getRelativePath();

		return new MediaAssetResponse(
				asset.getId(),
				asset.getCategory(),
				asset.getOriginalFileName(),
				useThumbnailAsPrimaryUrl && thumbnailUrl != null ? thumbnailUrl : originalUrl,
				thumbnailUrl,
				asset.getContentType(),
				asset.getSizeBytes(),
				asset.getThumbnailContentType(),
				asset.getThumbnailSizeBytes()
		);
	}
}

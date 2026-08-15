package pl.babastudiobe.landing;

import java.util.UUID;

import pl.babastudiobe.media.MediaAssetResponse;

record LandingHeroResponse(
		UUID id,
		String title,
		String eyebrow,
		String description,
		String ctaLabel,
		String ctaUrl,
		String imageAlt,
		String titleEn,
		String eyebrowEn,
		String descriptionEn,
		String ctaLabelEn,
		String imageAltEn,
		MediaAssetResponse heroImage
) {

	static LandingHeroResponse from(LandingHero hero) {
		return new LandingHeroResponse(
				hero.getId(),
				hero.getTitle(),
				hero.getEyebrow(),
				hero.getDescription(),
				hero.getCtaLabel(),
				hero.getCtaUrl(),
				hero.getImageAlt(),
				hero.getTitleEn(),
				hero.getEyebrowEn(),
				hero.getDescriptionEn(),
				hero.getCtaLabelEn(),
				hero.getImageAltEn(),
				hero.getHeroImage() == null ? null : MediaAssetResponse.from(hero.getHeroImage())
		);
	}
}

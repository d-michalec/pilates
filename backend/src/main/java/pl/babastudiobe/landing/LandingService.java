package pl.babastudiobe.landing;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import pl.babastudiobe.media.MediaAsset;
import pl.babastudiobe.media.MediaStorageService;

@Service
class LandingService {

	private final LandingHeroRepository repository;
	private final MediaStorageService mediaStorageService;

	LandingService(LandingHeroRepository repository, MediaStorageService mediaStorageService) {
		this.repository = repository;
		this.mediaStorageService = mediaStorageService;
	}

	@Transactional(readOnly = true)
	LandingHeroResponse getHero() {
		return repository.findById(LandingHero.DEFAULT_ID)
				.map(LandingHeroResponse::from)
				.orElseGet(() -> LandingHeroResponse.from(LandingHero.defaults()));
	}

	@Transactional
	LandingHeroResponse updateHero(
			String title,
			String ctaLabel,
			String ctaUrl,
			String imageAlt,
			String titleEn,
			String descriptionEn,
			String ctaLabelEn,
			String imageAltEn,
			MultipartFile heroImage
	) {
		LandingHero hero = repository.findById(LandingHero.DEFAULT_ID).orElseGet(LandingHero::defaults);
		MediaAsset asset = null;
		if (heroImage != null && !heroImage.isEmpty()) {
			asset = mediaStorageService.storeImage("landing-hero", heroImage);
		}

		hero.update(
				title.trim(),
				hero.getEyebrow(),
				hero.getDescription(),
				ctaLabel.trim(),
				ctaUrl.trim(),
				imageAlt.trim(),
				trimToNull(titleEn),
				hero.getEyebrowEn(),
				trimToNull(descriptionEn),
				trimToNull(ctaLabelEn),
				trimToNull(imageAltEn),
				asset
		);

		return LandingHeroResponse.from(repository.save(hero));
	}

	/** Puste tłumaczenie zapisujemy jako null, żeby front miał jeden warunek. */
	private String trimToNull(String value) {
		return StringUtils.hasText(value) ? value.trim() : null;
	}
}

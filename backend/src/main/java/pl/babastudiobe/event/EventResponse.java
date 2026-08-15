package pl.babastudiobe.event;

import java.time.LocalDateTime;
import java.util.UUID;

import pl.babastudiobe.media.MediaAssetResponse;

record EventResponse(
		UUID id,
		String title,
		String hostName,
		String shortDescription,
		String description,
		String hostDescription,
		LocalDateTime eventStartAt,
		Integer durationMinutes,
		String location,
		Integer capacity,
		String price,
		String signupUrl,
		String titleEn,
		String shortDescriptionEn,
		String descriptionEn,
		String hostDescriptionEn,
		String locationEn,
		String priceEn,
		MediaAssetResponse image,
		MediaAssetResponse hostImage
) {

	static EventResponse card(Event event) {
		return from(event, true);
	}

	static EventResponse detail(Event event) {
		return from(event, false);
	}

	private static EventResponse from(Event event, boolean optimizedImage) {
		return new EventResponse(
				event.getId(),
				event.getTitle(),
				event.getHostName(),
				event.getShortDescription(),
				event.getDescription(),
				event.getHostDescription(),
				event.getEventStartAt(),
				event.getDurationMinutes(),
				event.getLocation(),
				event.getCapacity(),
				event.getPrice(),
				event.getTitleEn(),
				event.getShortDescriptionEn(),
				event.getDescriptionEn(),
				event.getHostDescriptionEn(),
				event.getLocationEn(),
				event.getPriceEn(),
				event.getSignupUrl(),
				optimizedImage ? MediaAssetResponse.optimized(event.getImage()) : MediaAssetResponse.from(event.getImage()),
				event.getHostImage() == null ? null : MediaAssetResponse.from(event.getHostImage())
		);
	}
}

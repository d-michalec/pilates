package pl.babastudiobe.landing;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface LandingGalleryImageRepository extends JpaRepository<LandingGalleryImage, UUID> {

	List<LandingGalleryImage> findAllByOrderBySortOrderAscCreatedAtAsc();

	@Query("select coalesce(max(image.sortOrder), -1) from LandingGalleryImage image")
	int findMaxSortOrder();
}

package pl.babastudiobe.faq;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repozytorium musi być typem na poziomie pliku - Spring Data nie tworzy beanów
 * dla interfejsów zagnieżdżonych w innej klasie.
 */
interface FaqRepository extends JpaRepository<FaqEntry, UUID> {

	List<FaqEntry> findAllByOrderBySortOrderAscCreatedAtAsc();
}

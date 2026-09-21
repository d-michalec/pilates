package pl.babastudiobe.legal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repozytorium musi być typem na poziomie pliku - Spring Data nie tworzy beanów
 * dla interfejsów zagnieżdżonych w innej klasie.
 */
interface LegalDocumentRepository extends JpaRepository<LegalDocument, UUID> {

	Optional<LegalDocument> findByDocKey(String docKey);

	List<LegalDocument> findAllByOrderByDocKeyAsc();
}

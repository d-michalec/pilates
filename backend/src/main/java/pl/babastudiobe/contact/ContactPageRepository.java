package pl.babastudiobe.contact;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repozytorium musi być typem na poziomie pliku - Spring Data nie tworzy beanów
 * dla interfejsów zagnieżdżonych w innej klasie.
 */
interface ContactPageRepository extends JpaRepository<ContactPage, UUID> {
}

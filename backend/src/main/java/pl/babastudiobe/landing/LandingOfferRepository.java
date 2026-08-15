package pl.babastudiobe.landing;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repozytorium musi być typem na poziomie pliku - Spring Data nie tworzy beanów
 * dla interfejsów zagnieżdżonych w innej klasie.
 */
interface LandingOfferRepository extends JpaRepository<LandingOffer, UUID> {
}

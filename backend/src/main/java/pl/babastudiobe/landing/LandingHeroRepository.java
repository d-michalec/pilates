package pl.babastudiobe.landing;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface LandingHeroRepository extends JpaRepository<LandingHero, UUID> {
}

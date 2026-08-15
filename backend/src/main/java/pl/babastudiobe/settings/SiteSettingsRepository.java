package pl.babastudiobe.settings;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface SiteSettingsRepository extends JpaRepository<SiteSettings, UUID> {
}

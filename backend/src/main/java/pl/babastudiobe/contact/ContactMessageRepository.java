package pl.babastudiobe.contact;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {

	long deleteByCreatedAtBefore(OffsetDateTime createdBefore);
}

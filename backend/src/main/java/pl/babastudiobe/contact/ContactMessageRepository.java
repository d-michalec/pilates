package pl.babastudiobe.contact;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {

	long deleteByCreatedAtBefore(OffsetDateTime createdBefore);

	/**
	 * Skrzynka pokazuje najpierw nieobsłużone, w obu grupach od najnowszych.
	 *
	 * Kolejność zapisana wprost, bo nazwa metody wyprowadzana przez Spring Data
	 * dałaby sortowanie rosnąco po handled_at, a PostgreSQL umieszcza wtedy wartości
	 * puste na końcu - czyli dokładnie odwrotnie, niż potrzeba.
	 */
	@Query("select m from ContactMessage m order by case when m.handledAt is null then 0 else 1 end, m.createdAt desc")
	List<ContactMessage> findForInbox();

	long countByHandledAtIsNull();
}

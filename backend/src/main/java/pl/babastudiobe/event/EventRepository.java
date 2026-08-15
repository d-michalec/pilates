package pl.babastudiobe.event;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface EventRepository extends JpaRepository<Event, UUID> {

	List<Event> findAllByOrderByEventStartAtAscCreatedAtAsc();
}

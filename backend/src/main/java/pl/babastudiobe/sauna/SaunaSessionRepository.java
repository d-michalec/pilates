package pl.babastudiobe.sauna;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface SaunaSessionRepository extends JpaRepository<SaunaSession, UUID> {

	List<SaunaSession> findAllByOrderByDayOfWeekAscSessionTimeAsc();

	boolean existsByDayOfWeekAndSessionTime(short dayOfWeek, LocalTime sessionTime);
}

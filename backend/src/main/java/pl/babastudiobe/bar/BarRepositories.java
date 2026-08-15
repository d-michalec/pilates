package pl.babastudiobe.bar;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface BarPageRepository extends JpaRepository<BarPage, UUID> {
}

interface BarOpeningHoursRepository extends JpaRepository<BarOpeningHours, UUID> {

	List<BarOpeningHours> findAllByOrderByDayOfWeekAsc();

	Optional<BarOpeningHours> findByDayOfWeek(short dayOfWeek);
}

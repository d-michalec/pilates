package pl.babastudiobe.classes;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface PilatesClassRepository extends JpaRepository<PilatesClass, UUID> {

	List<PilatesClass> findAllByOrderBySortOrderAscCreatedAtAsc();
}

package pl.babastudiobe.team;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
}

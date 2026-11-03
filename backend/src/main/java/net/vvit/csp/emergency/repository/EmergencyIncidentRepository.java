package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.EmergencyIncident;
import net.vvit.csp.emergency.model.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyIncidentRepository extends JpaRepository<EmergencyIncident, String> {
    List<EmergencyIncident> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<EmergencyIncident> findByStatusOrderByCreatedAtDesc(IncidentStatus status);
    List<EmergencyIncident> findAllByOrderByCreatedAtDesc();
}

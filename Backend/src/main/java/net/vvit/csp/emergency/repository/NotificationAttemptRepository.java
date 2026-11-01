package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.NotificationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationAttemptRepository extends JpaRepository<NotificationAttempt, Long> {
    List<NotificationAttempt> findByIncidentIdOrderByAttemptedAtAsc(String incidentId);
}

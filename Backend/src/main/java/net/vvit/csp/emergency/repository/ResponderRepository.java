package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.Responder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResponderRepository extends JpaRepository<Responder, Long> {
    Optional<Responder> findByUserId(Long userId);
    List<Responder> findByIsAvailableTrue();

    @Query(value = "SELECT r.*, " +
            "(6371 * acos(cos(radians(?1)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(?2)) + sin(radians(?1)) * sin(radians(r.latitude)))) AS distance " +
            "FROM responders r WHERE r.is_available = true AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL ORDER BY distance ASC", nativeQuery = true)
    List<Responder> findNearbyAvailableResponders(double latitude, double longitude);
}

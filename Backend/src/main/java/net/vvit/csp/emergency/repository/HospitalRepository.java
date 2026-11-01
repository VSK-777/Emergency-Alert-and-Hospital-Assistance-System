package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    List<Hospital> findByIsActiveTrue();

    // Haversine formula to find nearby hospitals sorted by distance in KM
    @Query(value = "SELECT h.*, " +
            "(6371 * acos(cos(radians(?1)) * cos(radians(h.latitude)) * cos(radians(h.longitude) - radians(?2)) + sin(radians(?1)) * sin(radians(h.latitude)))) AS distance " +
            "FROM hospitals h WHERE h.is_active = true ORDER BY distance ASC", nativeQuery = true)
    List<Hospital> findNearbyHospitals(double latitude, double longitude);
}

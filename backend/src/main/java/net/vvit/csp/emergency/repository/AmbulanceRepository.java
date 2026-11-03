package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.Ambulance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AmbulanceRepository extends JpaRepository<Ambulance, Long> {
    List<Ambulance> findByHospitalId(Long hospitalId);
    List<Ambulance> findByStatus(String status);
}

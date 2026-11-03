package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.HardwareTelemetry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HardwareTelemetryRepository extends JpaRepository<HardwareTelemetry, Long> {

    List<HardwareTelemetry> findByDeviceIdentifierOrderByCreatedAtDesc(String deviceIdentifier, Pageable pageable);

    Optional<HardwareTelemetry> findFirstByDeviceIdentifierOrderByCreatedAtDesc(String deviceIdentifier);
}

package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<UserDevice, Long> {
    List<UserDevice> findByUserId(Long userId);
    Optional<UserDevice> findByDeviceIdentifier(String deviceIdentifier);
}

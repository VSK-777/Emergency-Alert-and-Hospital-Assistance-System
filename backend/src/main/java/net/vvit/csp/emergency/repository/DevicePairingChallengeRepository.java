package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.DevicePairingChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DevicePairingChallengeRepository extends JpaRepository<DevicePairingChallenge, Long> {
    Optional<DevicePairingChallenge> findByChallengeCode(String challengeCode);
    Optional<DevicePairingChallenge> findByChallengeCodeAndIsConsumedFalseAndExpiresAtAfter(
            String challengeCode, LocalDateTime now);
    List<DevicePairingChallenge> findByUserIdAndIsConsumedFalse(Long userId);
}

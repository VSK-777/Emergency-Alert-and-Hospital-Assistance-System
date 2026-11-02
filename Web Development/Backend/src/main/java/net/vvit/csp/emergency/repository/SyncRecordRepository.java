package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.SyncRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SyncRecordRepository extends JpaRepository<SyncRecord, Long> {
    Optional<SyncRecord> findByIdempotencyKey(String idempotencyKey);
    boolean existsByIdempotencyKey(String idempotencyKey);
}

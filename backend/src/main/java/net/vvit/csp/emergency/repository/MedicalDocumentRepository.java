package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.MedicalDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {
    List<MedicalDocument> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<MedicalDocument> findByIncidentIdOrderByCreatedAtDesc(String incidentId);
    Optional<MedicalDocument> findByIdAndUserId(Long id, Long userId);
    Optional<MedicalDocument> findByStorageKey(String storageKey);
}

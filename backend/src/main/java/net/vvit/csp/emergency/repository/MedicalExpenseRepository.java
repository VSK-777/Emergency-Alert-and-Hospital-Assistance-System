package net.vvit.csp.emergency.repository;

import net.vvit.csp.emergency.model.MedicalExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalExpenseRepository extends JpaRepository<MedicalExpense, Long> {
    List<MedicalExpense> findByIncidentId(String incidentId);
    List<MedicalExpense> findByUserIdOrderByCreatedAtDesc(Long userId);
}

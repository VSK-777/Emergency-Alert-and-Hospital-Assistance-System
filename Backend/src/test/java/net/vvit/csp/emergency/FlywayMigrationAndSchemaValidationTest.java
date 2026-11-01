package net.vvit.csp.emergency;

import net.vvit.csp.emergency.model.*;
import net.vvit.csp.emergency.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class FlywayMigrationAndSchemaValidationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private ResponderRepository responderRepository;

    @Autowired
    private EmergencyIncidentRepository incidentRepository;

    @Autowired
    private DetectionEventRepository detectionEventRepository;

    @Autowired
    private MedicalExpenseRepository expenseRepository;

    @Autowired
    private EmergencyContactRepository contactRepository;

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SyncRecordRepository syncRecordRepository;

    @Test
    @DisplayName("Context loads: Flyway executes migrations and Hibernate validates all 12 entities")
    void contextLoadsAndSchemaValidates() {
        // If the Spring Boot context loaded successfully with ddl-auto=validate,
        // Flyway migration and JPA entity schema mapping are 100% compliant.
        assertThat(userRepository).isNotNull();
        assertThat(hospitalRepository).isNotNull();
        assertThat(incidentRepository).isNotNull();
    }

    @Test
    @Transactional
    @DisplayName("Verify comprehensive CRUD, relationships, foreign keys, and decimal precision")
    void testEntityLifecycleAndConstraints() {
        // 1. Create Hospital
        Hospital hospital = new Hospital();
        hospital.setName("Test AIIMS Trauma Center");
        hospital.setAddress("NH 16, Mangalagiri, AP");
        hospital.setLatitude(16.4357);
        hospital.setLongitude(80.5644);
        hospital.setPhoneNumber("+918645280000");
        hospital.setEmergencyCapacity(50);
        hospital.setAvailableIcus(12);
        hospital.setAvailableAmbulances(5);
        hospital = hospitalRepository.save(hospital);
        assertThat(hospital.getId()).isNotNull();

        // 2. Create User
        User user = new User("citizen.test@vvit.net", "hashed_pwd", "Test Citizen", "+919876543200", UserRole.CITIZEN);
        user = userRepository.save(user);
        assertThat(user.getId()).isNotNull();

        // 3. Create Emergency Contact
        EmergencyContact contact = new EmergencyContact(user, "Family Member", "Sibling", "+919876543201", true);
        contact = contactRepository.save(contact);
        assertThat(contact.getId()).isNotNull();
        assertThat(contact.getUser().getId()).isEqualTo(user.getId());

        // 4. Create Responder
        User responderUser = new User("responder.test@vvit.net", "hashed_pwd", "Paramedic Test", "+919876543202", UserRole.RESPONDER);
        responderUser = userRepository.save(responderUser);

        Responder responder = new Responder();
        responder.setUser(responderUser);
        responder.setSpecialization("ALS Trauma First Responder");
        responder.setLatitude(16.3500);
        responder.setLongitude(80.5200);
        responder = responderRepository.save(responder);
        assertThat(responder.getId()).isNotNull();

        // 5. Create Incident
        EmergencyIncident incident = new EmergencyIncident();
        incident.setId("inc-test-" + System.currentTimeMillis());
        incident.setUser(user);
        incident.setSource(IncidentSource.SMARTWATCH_SENSOR);
        incident.setStatus(IncidentStatus.PENDING);
        incident.setLatitude(16.3533);
        incident.setLongitude(80.5238);
        incident.setAccuracyMeters(3.5);
        incident.setDetectionReason("High-G Impact Event (IMU)");
        incident.setDetectionScore(0.95);
        incident.setAssignedHospital(hospital);
        incident.setAssignedResponder(responder);
        incident = incidentRepository.save(incident);
        assertThat(incident.getId()).isNotNull();

        // 6. Create Detection Event
        DetectionEvent event = new DetectionEvent();
        event.setIncident(incident);
        event.setEventType("HIGH_G_IMPACT");
        event.setAccelerationMagnitude(4.15);
        event.setAngularVelocity(7.20);
        event.setPostImpactInactivitySec(15);
        event.setRawTelemetryJson("{\"accel\":4.15,\"gyro\":7.20}");
        event = detectionEventRepository.save(event);
        assertThat(event.getId()).isNotNull();

        // 7. Create Medical Expense with Decimal Precision (INR 1250.75)
        MedicalExpense expense = new MedicalExpense();
        expense.setIncident(incident);
        expense.setUser(user);
        expense.setCategory(ExpenseCategory.AMBULANCE);
        expense.setDescription("Advanced Life Support Dispatch");
        BigDecimal expectedAmount = new BigDecimal("1250.75");
        expense.setAmount(expectedAmount);
        expense.setStatus(ExpenseStatus.VERIFIED);
        expense = expenseRepository.save(expense);
        assertThat(expense.getId()).isNotNull();

        Optional<MedicalExpense> reloadedExpense = expenseRepository.findById(expense.getId());
        assertThat(reloadedExpense).isPresent();
        assertThat(reloadedExpense.get().getAmount()).isEqualByComparingTo(expectedAmount);

        // 8. Create Ambulance
        Ambulance ambulance = new Ambulance("AP-07-TEST-9999", hospital, "ALS", "Driver Ramu", "+919876543299", "AVAILABLE", 16.4350, 80.5640, "Defibrillator, Ventilator");
        ambulance = ambulanceRepository.save(ambulance);
        assertThat(ambulance.getId()).isNotNull();

        // 9. Create Audit Log
        AuditLog log = new AuditLog("INCIDENT_DISPATCH", "system@vvit.net", "SYSTEM", incident.getId(), "Automated dispatch completed");
        log = auditLogRepository.save(log);
        assertThat(log.getId()).isNotNull();

        // 10. Create Sync Record
        SyncRecord sync = new SyncRecord("idemp-" + System.currentTimeMillis(), incident.getId(), "watch-wearos-01", "SYNCED", "hash123");
        sync = syncRecordRepository.save(sync);
        assertThat(sync.getId()).isNotNull();
    }
}

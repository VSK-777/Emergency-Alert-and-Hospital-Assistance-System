package net.vvit.csp.emergency.config;

import net.vvit.csp.emergency.model.*;
import net.vvit.csp.emergency.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepo;
    private final HospitalRepository hospitalRepo;
    private final ResponderRepository responderRepo;
    private final EmergencyContactRepository contactRepo;
    private final EmergencyIncidentRepository incidentRepo;
    private final DetectionEventRepository detectionEventRepo;
    private final MedicalExpenseRepository expenseRepo;
    private final DeviceRepository deviceRepo;
    private final AmbulanceRepository ambulanceRepo;
    private final AuditLogRepository auditLogRepo;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepo,
                           HospitalRepository hospitalRepo,
                           ResponderRepository responderRepo,
                           EmergencyContactRepository contactRepo,
                           EmergencyIncidentRepository incidentRepo,
                           DetectionEventRepository detectionEventRepo,
                           MedicalExpenseRepository expenseRepo,
                           DeviceRepository deviceRepo,
                           AmbulanceRepository ambulanceRepo,
                           AuditLogRepository auditLogRepo,
                           PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.hospitalRepo = hospitalRepo;
        this.responderRepo = responderRepo;
        this.contactRepo = contactRepo;
        this.incidentRepo = incidentRepo;
        this.detectionEventRepo = detectionEventRepo;
        this.expenseRepo = expenseRepo;
        this.deviceRepo = deviceRepo;
        this.ambulanceRepo = ambulanceRepo;
        this.auditLogRepo = auditLogRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Enforce exact registration details and removal of unverified medical info for patient.vsk@vvit.net
        userRepo.findByEmail("patient.vsk@vvit.net").ifPresent(user -> {
            boolean changed = false;
            if (!"Sai Krishna".equals(user.getFullName())) { user.setFullName("Sai Krishna"); changed = true; }
            if (!"+919490500730".equals(user.getPhoneNumber()) && !"9490500730".equals(user.getPhoneNumber())) {
                user.setPhoneNumber("9490500730");
                changed = true;
            }
            if (user.getBloodGroup() != null) { user.setBloodGroup(null); changed = true; }
            if (user.getAllergies() != null) { user.setAllergies(null); changed = true; }
            if (user.getMedicalConditions() != null) { user.setMedicalConditions(null); changed = true; }
            if (changed) {
                userRepo.save(user);
                log.info("Synchronized exact registration details for user {}: Sai Krishna, 9490500730", user.getEmail());
            }

            // Remove any unverified emergency contacts associated with this user
            java.util.List<EmergencyContact> contacts = contactRepo.findByUserId(user.getId());
            if (!contacts.isEmpty()) {
                contactRepo.deleteAll(contacts);
                log.info("Removed {} unverified emergency contacts for user {}", contacts.size(), user.getEmail());
            }

            // Resolve any seed incidents so citizen active queue is clean
            java.util.List<EmergencyIncident> userIncidents = incidentRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
            for (EmergencyIncident inc : userIncidents) {
                if (inc.getId().startsWith("inc-seed") && inc.getStatus() != IncidentStatus.RESOLVED && inc.getStatus() != IncidentStatus.CANCELLED) {
                    inc.setStatus(IncidentStatus.RESOLVED);
                    incidentRepo.save(inc);
                    log.info("Marked seed incident {} as RESOLVED for user {}", inc.getId(), user.getEmail());
                }
            }
        });

        // Ensure registered citizen account vajjhasaikrishna@gmail.com is present with exact registration details
        userRepo.findByEmail("vajjhasaikrishna@gmail.com").ifPresentOrElse(user -> {
            boolean changed = false;
            if (!"Sai Krishna".equals(user.getFullName())) { user.setFullName("Sai Krishna"); changed = true; }
            if (!"9490500730".equals(user.getPhoneNumber()) && !"+919490500730".equals(user.getPhoneNumber())) {
                user.setPhoneNumber("9490500730");
                changed = true;
            }
            if (user.getBloodGroup() != null) { user.setBloodGroup(null); changed = true; }
            if (user.getAllergies() != null) { user.setAllergies(null); changed = true; }
            if (user.getMedicalConditions() != null) { user.setMedicalConditions(null); changed = true; }
            if (changed) {
                userRepo.save(user);
                log.info("Synchronized exact registration details for user {}: Sai Krishna, 9490500730", user.getEmail());
            }
        }, () -> {
            User citizen = new User("vajjhasaikrishna@gmail.com", passwordEncoder.encode("Password@123"), "Sai Krishna", "9490500730", UserRole.CITIZEN);
            userRepo.save(citizen);
            log.info("Seeded registered citizen account: vajjhasaikrishna@gmail.com");
        });

        if (userRepo.count() > 0) {
            log.info("Database already contains data, checking supplemental seed records...");
            seedSupplementalRecordsIfMissing();
            return;
        }

        log.info("Seeding initial development and demonstration data for VVIT Batch 8 CSP...");

        String encodedPassword = passwordEncoder.encode("Password@123");

        // 1. Seed Users (strictly with user-provided registration details)
        User patient = new User("patient.vsk@vvit.net", encodedPassword, "Sai Krishna", "+919490500730", UserRole.CITIZEN);
        patient.setBloodGroup(null);
        patient.setAllergies(null);
        patient.setMedicalConditions(null);
        patient = userRepo.save(patient);

        User patient2 = new User("lakshmi.narayana@vvit.net", encodedPassword, "G. Lakshmi Narayana (Faculty Guide)", "+919876543299", UserRole.CITIZEN);
        patient2.setBloodGroup("B+");
        patient2.setMedicalConditions("Hypertension (Managed)");
        userRepo.save(patient2);

        User responderUser = new User("responder@vvit.net", encodedPassword, "Ramesh Kumar T (NSS Volunteer)", "+919876543211", UserRole.RESPONDER);
        responderUser.setBloodGroup("B+");
        responderUser = userRepo.save(responderUser);

        User responderUser2 = new User("volunteer.priya@vvit.net", encodedPassword, "Priya S (Red Cross Volunteer)", "+919876543215", UserRole.RESPONDER);
        responderUser2.setBloodGroup("A+");
        responderUser2 = userRepo.save(responderUser2);

        User hospitalAdmin = new User("hospital.admin@aiims.edu.in", encodedPassword, "AIIMS Mangalagiri Emergency Admin", "+918645280000", UserRole.HOSPITAL_STAFF);
        userRepo.save(hospitalAdmin);

        User systemAdmin = new User("admin@vvit.net", encodedPassword, "CSP System Administrator", "+919876543212", UserRole.ADMIN);
        userRepo.save(systemAdmin);

        // 2. Emergency Contacts: Kept clean with zero unverified/assumed contacts.
        // Users can add verified personal emergency contacts voluntary through the UI.

        // 3. Seed Hospitals around VVIT Nambur / Guntur / Mangalagiri
        Hospital h1 = new Hospital();
        h1.setName("AIIMS Mangalagiri");
        h1.setAddress("NH 16, Mangalagiri, Guntur District, AP 522503");
        h1.setLatitude(16.4357);
        h1.setLongitude(80.5644);
        h1.setPhoneNumber("+918645280000");
        h1.setEmergencyCapacity(50);
        h1.setAvailableIcus(15);
        h1.setAvailableAmbulances(6);
        h1 = hospitalRepo.save(h1);

        hospitalAdmin.setHospitalId(h1.getId());
        userRepo.save(hospitalAdmin);

        Hospital h2 = new Hospital();
        h2.setName("Manipal Hospital Vijayawada");
        h2.setAddress("Near Kanuru, Tadepalli, Guntur Dist, AP");
        h2.setLatitude(16.4862);
        h2.setLongitude(80.6124);
        h2.setPhoneNumber("+918662499999");
        h2.setEmergencyCapacity(35);
        h2.setAvailableIcus(8);
        h2.setAvailableAmbulances(4);
        h2 = hospitalRepo.save(h2);

        Hospital h3 = new Hospital();
        h3.setName("Government General Hospital (GGH) Guntur");
        h3.setAddress("Sambasiva Pet, Guntur, AP 522001");
        h3.setLatitude(16.3067);
        h3.setLongitude(80.4365);
        h3.setPhoneNumber("+918632220000");
        h3.setEmergencyCapacity(60);
        h3.setAvailableIcus(20);
        h3.setAvailableAmbulances(8);
        h3 = hospitalRepo.save(h3);

        Hospital h4 = new Hospital();
        h4.setName("NRI General Hospital & Medical College");
        h4.setAddress("Chinakakani, Mangalagiri, AP 522503");
        h4.setLatitude(16.4172);
        h4.setLongitude(80.5512);
        h4.setPhoneNumber("+918645230101");
        h4.setEmergencyCapacity(40);
        h4.setAvailableIcus(10);
        h4.setAvailableAmbulances(5);
        h4 = hospitalRepo.save(h4);

        // 4. Seed Responders
        Responder resp = new Responder();
        resp.setUser(responderUser);
        resp.setSpecialization("Certified Emergency First Responder");
        resp.setOrganization("VVIT NSS Unit");
        resp.setVerificationStatus("VERIFIED");
        resp.setCertificateDetails("CPR Certified (Red Cross), Advanced First Aid");
        resp.setSkills("CPR, Bleeding Control, Defibrillator, Immobilization");
        resp.setIsAvailable(true);
        resp.setLatitude(16.3520);
        resp.setLongitude(80.5240);
        resp.setLastActiveAt(LocalDateTime.now());
        resp = responderRepo.save(resp);

        Responder resp2 = new Responder();
        resp2.setUser(responderUser2);
        resp2.setSpecialization("Youth Red Cross Medical Volunteer");
        resp2.setOrganization("Youth Red Cross");
        resp2.setVerificationStatus("VERIFIED");
        resp2.setCertificateDetails("BLS Certified, Triage Specialist");
        resp2.setSkills("BLS, First Aid, Triage Support, Oxygen Admin");
        resp2.setIsAvailable(true);
        resp2.setLatitude(16.3585);
        resp2.setLongitude(80.5310);
        resp2.setLastActiveAt(LocalDateTime.now());
        responderRepo.save(resp2);

        // 5. Seed Sample Incident
        EmergencyIncident incident = new EmergencyIncident();
        incident.setId("inc-seed-001");
        incident.setUser(patient);
        incident.setSource(IncidentSource.SMARTWATCH_SENSOR);
        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setHospitalAcknowledgement("ACKNOWLEDGED");
        incident.setHospitalPreparationStatus("PREPARATION_STARTED");
        incident.setResponderAcceptanceStatus("ACCEPTED");
        incident.setLatitude(16.3533);
        incident.setLongitude(80.5238);
        incident.setAccuracyMeters(4.5);
        incident.setLocationTimestamp(LocalDateTime.now());
        incident.setDetectionReason("High Impact Fall with Post-Impact Inactivity");
        incident.setDetectionScore(0.92);
        incident.setAssignedHospital(h1);
        incident.setAssignedResponder(resp);
        incident = incidentRepo.save(incident);

        DetectionEvent event = new DetectionEvent();
        event.setIncident(incident);
        event.setEventType("FALL_IMPACT");
        event.setAccelerationMagnitude(3.42);
        event.setAngularVelocity(6.15);
        event.setPostImpactInactivitySec(12);
        event.setRawTelemetryJson("{\"accel_peak_g\": 3.42, \"gyro_dps\": 352, \"stillness_duration_s\": 12}");
        detectionEventRepo.save(event);

        MedicalExpense exp1 = new MedicalExpense();
        exp1.setIncident(incident);
        exp1.setUser(patient);
        exp1.setCategory(ExpenseCategory.AMBULANCE);
        exp1.setDescription("Emergency Rapid Response Ambulance Transit to AIIMS");
        exp1.setAmount(new BigDecimal("1200.00"));
        exp1.setStatus(ExpenseStatus.VERIFIED);
        expenseRepo.save(exp1);

        // 6. Seed Smartwatch Device
        UserDevice watch = new UserDevice();
        watch.setUser(patient);
        watch.setDeviceType(DeviceType.SMARTWATCH);
        watch.setDeviceIdentifier("VVIT-WEAROS-ROUND-5554");
        watch.setFcmToken("fcm-wearos-round-token-vvit-001");
        watch.setIsActive(true);
        watch.setLastSyncedAt(LocalDateTime.now().minusMinutes(2));
        deviceRepo.save(watch);

        // 7. Seed Ambulances
        ambulanceRepo.save(new Ambulance("AP 16 TE 1081", h1, "ALS", "S. K. Naidu", "+919440123456", "ASSIGNED", 16.3530, 80.5235, "Ventilator, Defibrillator, ECG Monitor, Oxygen"));
        ambulanceRepo.save(new Ambulance("AP 16 TE 1082", h1, "BLS", "K. Rama Rao", "+919440123457", "AVAILABLE", 16.4360, 80.5650, "First Aid Kit, Oxygen, Stretcher"));
        ambulanceRepo.save(new Ambulance("AP 16 TE 1083", h2, "ALS", "P. Venkatesh", "+919440123458", "AVAILABLE", 16.4865, 80.6130, "Advanced Life Support Unit, Defibrillator, Syringe Pump"));
        ambulanceRepo.save(new Ambulance("AP 16 TE 1084", h3, "ALS", "M. Suresh", "+919440123459", "AVAILABLE", 16.3070, 80.4370, "Ventilator, Suction Unit, Stretcher"));

        // 8. Seed Audit Logs
        auditLogRepo.save(new AuditLog("SYSTEM_BOOT", "admin@vvit.net", "ADMIN", null, "Emergency Coordination System initialized successfully"));
        auditLogRepo.save(new AuditLog("INCIDENT_DISPATCH", "system@vvit.net", "SYSTEM", incident.getId(), "Smartwatch fall detection automatically dispatched to AIIMS Mangalagiri"));

        log.info("Development seeding completed successfully.");
    }

    private void seedSupplementalRecordsIfMissing() {
        if (ambulanceRepo.count() == 0 && hospitalRepo.count() > 0) {
            Hospital h1 = hospitalRepo.findAll().get(0);
            ambulanceRepo.save(new Ambulance("AP 16 TE 1081", h1, "ALS", "S. K. Naidu", "+919440123456", "AVAILABLE", 16.3530, 80.5235, "Ventilator, Defibrillator, ECG Monitor, Oxygen"));
            ambulanceRepo.save(new Ambulance("AP 16 TE 1082", h1, "BLS", "K. Rama Rao", "+919440123457", "AVAILABLE", 16.4360, 80.5650, "First Aid Kit, Oxygen, Stretcher"));
        }
        if (auditLogRepo.count() == 0) {
            auditLogRepo.save(new AuditLog("SYSTEM_BOOT", "admin@vvit.net", "ADMIN", null, "Emergency Coordination System active"));
        }
        if (deviceRepo.count() == 0 && userRepo.count() > 0) {
            User patient = userRepo.findByEmail("patient.vsk@vvit.net").orElse(userRepo.findAll().get(0));
            UserDevice watch = new UserDevice();
            watch.setUser(patient);
            watch.setDeviceType(DeviceType.SMARTWATCH);
            watch.setDeviceIdentifier("VVIT-WEAROS-ROUND-5554");
            watch.setFcmToken("fcm-wearos-round-token-vvit-001");
            watch.setIsActive(true);
            watch.setLastSyncedAt(LocalDateTime.now());
            deviceRepo.save(watch);
        }
    }
}

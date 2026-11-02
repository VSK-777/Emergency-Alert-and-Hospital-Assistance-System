package net.vvit.csp.emergency;

import net.vvit.csp.emergency.dto.*;
import net.vvit.csp.emergency.model.IncidentSource;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.UserRepository;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.EmergencyService;
import net.vvit.csp.emergency.service.HospitalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class EmergencyWorkflowIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private EmergencyService emergencyService;

    @Autowired
    private HospitalService hospitalService;

    @Test
    @Transactional
    @DisplayName("Verify end-to-end citizen registration, incident triggering, and hospital triage")
    void testEndToEndEmergencyWorkflow() {
        // 1. Citizen Registration
        RegisterRequest reg = new RegisterRequest();
        String uniqueEmail = "integration.user." + System.currentTimeMillis() + "@vvit.net";
        reg.setEmail(uniqueEmail);
        reg.setPassword("Password@123");
        reg.setFullName("Integration Test Citizen");
        reg.setPhoneNumber("+919876543999");
        reg.setRole(UserRole.CITIZEN);

        AuthResponse authRes = authService.register(reg);
        assertThat(authRes.getToken()).isNotBlank();
        assertThat(authRes.getEmail()).isEqualTo(uniqueEmail);

        // 2. Query Nearby Hospitals
        List<HospitalDto> hospitals = hospitalService.getNearbyHospitals(16.3533, 80.5238);
        assertThat(hospitals).isNotNull();

        // 3. Trigger Emergency Incident (Simulating Smartwatch / Mobile SOS dispatch)
        IncidentCreateRequest incReq = new IncidentCreateRequest();
        incReq.setIdempotencyKey("idemp-" + System.currentTimeMillis());
        incReq.setSource(IncidentSource.MOBILE_MANUAL_SOS);
        incReq.setLatitude(16.3533);
        incReq.setLongitude(80.5238);
        incReq.setAccuracyMeters(5.0);
        incReq.setDetectionReason("Emergency Panic SOS Dispatch");

        User registeredUser = userRepository.findByEmail(authRes.getEmail()).orElse(null);
        IncidentResponse incResponse = emergencyService.createIncident(incReq, registeredUser);

        assertThat(incResponse.getId()).isNotBlank();
        assertThat(incResponse.getStatus()).isNotNull();

        // 4. Verify Active Incidents List contains the created incident
        List<IncidentResponse> activeIncidents = emergencyService.listActiveIncidents();
        boolean found = activeIncidents.stream().anyMatch(i -> i.getId().equals(incResponse.getId()));
        assertThat(found).isTrue();
    }
}

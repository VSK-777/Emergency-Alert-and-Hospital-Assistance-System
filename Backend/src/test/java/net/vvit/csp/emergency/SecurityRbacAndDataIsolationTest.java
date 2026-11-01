package net.vvit.csp.emergency;

import com.fasterxml.jackson.databind.ObjectMapper;
import net.vvit.csp.emergency.model.EmergencyIncident;
import net.vvit.csp.emergency.model.IncidentSource;
import net.vvit.csp.emergency.model.IncidentStatus;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.EmergencyIncidentRepository;
import net.vvit.csp.emergency.repository.UserRepository;
import net.vvit.csp.emergency.security.JwtService;
import net.vvit.csp.emergency.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityRbacAndDataIsolationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmergencyIncidentRepository incidentRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User citizenA;
    private User citizenB;
    private User responderUser;
    private User adminUser;

    private String tokenCitizenA;
    private String tokenCitizenB;
    private String tokenResponder;
    private String tokenAdmin;

    private EmergencyIncident incidentA;
    private EmergencyIncident incidentB;

    @BeforeEach
    void setUp() {
        incidentRepository.deleteAll();
        userRepository.deleteAll();

        citizenA = createUser("citizenA." + System.currentTimeMillis() + "@test.net", "Citizen Alice", UserRole.CITIZEN);
        citizenB = createUser("citizenB." + System.currentTimeMillis() + "@test.net", "Citizen Bob", UserRole.CITIZEN);
        responderUser = createUser("responder." + System.currentTimeMillis() + "@test.net", "Officer Ray", UserRole.RESPONDER);
        adminUser = createUser("admin." + System.currentTimeMillis() + "@test.net", "Super Admin", UserRole.ADMIN);

        tokenCitizenA = generateToken(citizenA);
        tokenCitizenB = generateToken(citizenB);
        tokenResponder = generateToken(responderUser);
        tokenAdmin = generateToken(adminUser);

        incidentA = createIncident(citizenA, "INC-A-" + System.currentTimeMillis());
        incidentB = createIncident(citizenB, "INC-B-" + System.currentTimeMillis());
    }

    private User createUser(String email, String name, UserRole role) {
        User u = new User();
        u.setEmail(email);
        u.setFullName(name);
        u.setPasswordHash(passwordEncoder.encode("Password@123"));
        u.setPhoneNumber("+9198765" + (int)(Math.random() * 89999 + 10000));
        u.setRole(role);
        u.setIsActive(true);
        return userRepository.save(u);
    }

    private EmergencyIncident createIncident(User user, String incidentId) {
        EmergencyIncident inc = new EmergencyIncident();
        inc.setId(incidentId);
        inc.setUser(user);
        inc.setSource(IncidentSource.MOBILE_MANUAL_SOS);
        inc.setStatus(IncidentStatus.PENDING);
        inc.setLatitude(16.3533);
        inc.setLongitude(80.5238);
        inc.setAccuracyMeters(10.0);
        inc.setDetectionReason("Test incident for isolation verification");
        inc.setCreatedAt(LocalDateTime.now());
        return incidentRepository.save(inc);
    }

    private String generateToken(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        return jwtService.generateToken(principal, user.getId(), user.getRole().name());
    }

    @Test
    @DisplayName("Unauthenticated request to active emergencies returns 401 or 403")
    void unauthenticatedActiveEmergenciesReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/emergencies/active"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Citizen cannot access all emergencies endpoint (returns 403 Forbidden)")
    void citizenCannotAccessAllEmergencies() throws Exception {
        mockMvc.perform(get("/api/v1/emergencies/all")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCitizenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Citizen cannot access Admin stats endpoint (returns 403 Forbidden)")
    void citizenCannotAccessAdminStats() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCitizenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can successfully access Admin stats endpoint (returns 200 OK)")
    void adminCanAccessAdminStats() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Citizen A viewing their own incident returns 200 OK")
    void citizenCanViewOwnIncident() throws Exception {
        mockMvc.perform(get("/api/v1/emergencies/" + incidentA.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCitizenA))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Citizen A viewing Citizen B's incident returns 403 Forbidden (Data Isolation)")
    void citizenCannotViewOtherCitizenIncident() throws Exception {
        mockMvc.perform(get("/api/v1/emergencies/" + incidentB.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCitizenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Citizen A viewing Citizen B's incident expenses returns 403 Forbidden")
    void citizenCannotViewOtherCitizenExpenses() throws Exception {
        mockMvc.perform(get("/api/v1/medical-expenses/incident/" + incidentB.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCitizenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Citizen calling responder nearby emergencies returns 403 Forbidden")
    void citizenCannotAccessResponderEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/responders/nearby-emergencies")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCitizenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Responder can successfully access responder nearby emergencies (200 OK)")
    void responderCanAccessNearbyEmergencies() throws Exception {
        mockMvc.perform(get("/api/v1/responders/nearby-emergencies")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenResponder))
                .andExpect(status().isOk());
    }
}

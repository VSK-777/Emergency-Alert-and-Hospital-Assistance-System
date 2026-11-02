package net.vvit.csp.emergency;

import com.fasterxml.jackson.databind.ObjectMapper;
import net.vvit.csp.emergency.dto.DeviceEnrollmentRequest;
import net.vvit.csp.emergency.dto.IncidentCreateRequest;
import net.vvit.csp.emergency.model.DeviceType;
import net.vvit.csp.emergency.model.IncidentSource;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserDevice;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.DeviceRepository;
import net.vvit.csp.emergency.repository.EmergencyIncidentRepository;
import net.vvit.csp.emergency.repository.UserRepository;
import net.vvit.csp.emergency.security.EmergencyRateLimiter;
import net.vvit.csp.emergency.security.JwtService;
import net.vvit.csp.emergency.security.UserPrincipal;
import net.vvit.csp.emergency.service.DeviceAuthService;
import net.vvit.csp.emergency.service.StreamTicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EmergencySecurityAndStreamTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private EmergencyIncidentRepository incidentRepository;

    @Autowired
    private StreamTicketService streamTicketService;

    @Autowired
    private DeviceAuthService deviceAuthService;

    @Autowired
    private EmergencyRateLimiter emergencyRateLimiter;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        emergencyRateLimiter.reset();
        deviceRepository.deleteAll();
        incidentRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setEmail("stream.test." + System.currentTimeMillis() + "@vvit.net");
        testUser.setFullName("Stream Test User");
        testUser.setPasswordHash(passwordEncoder.encode("TestPass@123"));
        testUser.setPhoneNumber("+919988776655");
        testUser.setRole(UserRole.CITIZEN);
        testUser.setIsActive(true);
        testUser = userRepository.save(testUser);

        UserPrincipal principal = new UserPrincipal(testUser);
        jwtToken = jwtService.generateToken(principal, testUser.getId(), testUser.getRole().name());
    }

    @Test
    @DisplayName("Stream ticket generation, authentication, and single-use invalidation")
    void testStreamTicketLifecycle() throws Exception {
        // 1. Issue Ticket via API
        String responseBody = mockMvc.perform(post("/api/v1/emergencies/stream-ticket")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticket").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String ticket = objectMapper.readTree(responseBody).get("ticket").asText();
        assertThat(ticket).startsWith("st_");

        // 2. Consume ticket via stream connection
        mockMvc.perform(get("/api/v1/emergencies/stream")
                        .param("ticket", ticket))
                .andExpect(status().isOk());

        // 3. Second attempt with the same ticket should fail because it was consumed (single-use)
        mockMvc.perform(get("/api/v1/emergencies/stream")
                        .param("ticket", ticket))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Unauthenticated SSE stream connection returns 401 Unauthorized")
    void testUnauthenticatedSseStreamFails() throws Exception {
        mockMvc.perform(get("/api/v1/emergencies/stream"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Wear OS device enrollment, token generation, and secure authentication")
    void testDeviceEnrollmentAndAuthentication() throws Exception {
        String deviceId = "WEARABLE-SAMSUNG-WATCH6-" + System.currentTimeMillis();
        DeviceEnrollmentRequest request = new DeviceEnrollmentRequest();
        request.setDeviceIdentifier(deviceId);
        request.setDeviceType(DeviceType.SMARTWATCH);
        request.setFcmToken("fcm-push-token-sample");

        String enrollmentJson = mockMvc.perform(post("/api/v1/devices/enroll")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deviceIdentifier").value(deviceId))
                .andExpect(jsonPath("$.deviceToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String rawDeviceToken = objectMapper.readTree(enrollmentJson).get("deviceToken").asText();
        assertThat(rawDeviceToken).startsWith("dvt_");

        // Verify valid authentication with raw token
        Optional<UserDevice> authenticated = deviceAuthService.authenticateDevice(deviceId, rawDeviceToken);
        assertThat(authenticated).isPresent();
        assertThat(authenticated.get().getDeviceIdentifier()).isEqualTo(deviceId);

        // Verify authentication failure with bad token
        Optional<UserDevice> invalid = deviceAuthService.authenticateDevice(deviceId, "dvt_invalid_spoofed_token");
        assertThat(invalid).isEmpty();
    }

    @Test
    @DisplayName("Emergency creation enforces IP rate limiting (returns 429 when threshold exceeded)")
    void testEmergencyCreationRateLimiting() throws Exception {
        String testIp = "192.168.10.50";

        // Perform 10 valid requests
        for (int i = 0; i < 10; i++) {
            IncidentCreateRequest req = new IncidentCreateRequest();
            req.setSource(IncidentSource.MOBILE_MANUAL_SOS);
            req.setLatitude(16.3533);
            req.setLongitude(80.5238);
            req.setDetectionReason("Emergency Stress Call #" + i);

            mockMvc.perform(post("/api/v1/emergencies")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                            .with(request -> {
                                request.setRemoteAddr(testIp);
                                return request;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated());
        }

        // 11th request from same IP within the sliding window must be rejected with 429 Too Many Requests
        IncidentCreateRequest blockedReq = new IncidentCreateRequest();
        blockedReq.setSource(IncidentSource.MOBILE_MANUAL_SOS);
        blockedReq.setLatitude(16.3533);
        blockedReq.setLongitude(80.5238);
        blockedReq.setDetectionReason("Spam emergency beyond rate limit");

        mockMvc.perform(post("/api/v1/emergencies")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                        .with(request -> {
                            request.setRemoteAddr(testIp);
                            return request;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockedReq)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("Duplicate emergency requests with identical idempotency keys return existing incident")
    void testIdempotencyDeduplication() throws Exception {
        String idempotencyKey = "idemp-key-" + System.currentTimeMillis();

        IncidentCreateRequest req = new IncidentCreateRequest();
        req.setIdempotencyKey(idempotencyKey);
        req.setSource(IncidentSource.SMARTWATCH_SENSOR);
        req.setLatitude(16.4862);
        req.setLongitude(80.6124);
        req.setDetectionReason("Sudden High Impact Fall Detected");

        String res1 = mockMvc.perform(post("/api/v1/emergencies")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id1 = objectMapper.readTree(res1).get("id").asText();

        // Send duplicate request
        String res2 = mockMvc.perform(post("/api/v1/emergencies")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString();

        String id2 = objectMapper.readTree(res2).get("id").asText();
        assertThat(id1).isEqualTo(id2);
    }
}

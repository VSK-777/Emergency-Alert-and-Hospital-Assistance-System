package net.vvit.csp.emergency;

import com.fasterxml.jackson.databind.ObjectMapper;
import net.vvit.csp.emergency.dto.*;
import net.vvit.csp.emergency.model.IncidentSource;
import net.vvit.csp.emergency.model.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class EmergencyBackendApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() {
        assertNotNull(mockMvc);
    }

    @Test
    void testUserRegistrationAndLogin() throws Exception {
        String testEmail = "testuser." + UUID.randomUUID() + "@vvit.net";
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setEmail(testEmail);
        registerReq.setPassword("Password@123");
        registerReq.setFullName("Test User VVIT");
        registerReq.setPhoneNumber("+919999988888");
        registerReq.setRole(UserRole.CITIZEN);
        registerReq.setBloodGroup("A+");

        // Register
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email", is(testEmail)))
                .andReturn();

        // Login with same credentials
        AuthRequest authReq = new AuthRequest(testEmail, "Password@123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void testIncidentCreationAndIdempotency() throws Exception {
        // Authenticate
        AuthRequest authReq = new AuthRequest("patient.vsk@vvit.net", "Password@123");
        MvcResult authResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authReq)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse authRes = objectMapper.readValue(authResult.getResponse().getContentAsString(), AuthResponse.class);
        String token = authRes.getToken();

        String idempotencyKey = "key-" + UUID.randomUUID();
        String incidentId = "inc-" + UUID.randomUUID();

        IncidentCreateRequest req = new IncidentCreateRequest();
        req.setId(incidentId);
        req.setIdempotencyKey(idempotencyKey);
        req.setLatitude(16.3533);
        req.setLongitude(80.5238);
        req.setAccuracyMeters(3.2);
        req.setSource(IncidentSource.SMARTWATCH_AUTO);
        req.setDetectionReason("High Impact Fall Detected");
        req.setDetectionScore(0.95);

        // 1st submission: must succeed and create
        mockMvc.perform(post("/api/v1/emergencies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(incidentId)))
                .andExpect(jsonPath("$.assignedHospitalId").isNotEmpty());

        // 2nd submission with duplicate idempotency key: must be idempotent and return existing incident
        mockMvc.perform(post("/api/v1/emergencies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.id", is(incidentId)));
    }

    @Test
    void testOfflineBatchSync() throws Exception {
        // Login
        AuthRequest authReq = new AuthRequest("patient.vsk@vvit.net", "Password@123");
        MvcResult authResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authReq)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readValue(authResult.getResponse().getContentAsString(), AuthResponse.class).getToken();

        String inc1 = "sync-inc-" + UUID.randomUUID();
        String inc2 = "sync-inc-" + UUID.randomUUID();

        IncidentCreateRequest req1 = new IncidentCreateRequest();
        req1.setId(inc1);
        req1.setIdempotencyKey("sync-key-1-" + inc1);
        req1.setLatitude(16.3500);
        req1.setLongitude(80.5200);
        req1.setSource(IncidentSource.SMARTWATCH_AUTO);
        req1.setDetectionReason("Simulated Sudden Impact");

        IncidentCreateRequest req2 = new IncidentCreateRequest();
        req2.setId(inc2);
        req2.setIdempotencyKey("sync-key-2-" + inc2);
        req2.setLatitude(16.3510);
        req2.setLongitude(80.5210);
        req2.setSource(IncidentSource.MOBILE_SOS);
        req2.setDetectionReason("User SOS button pressed");

        SyncBatchRequest batchReq = new SyncBatchRequest();
        batchReq.setDeviceId("WEAR_OS_SIMULATOR_01");
        batchReq.setIncidents(List.of(req1, req2));

        // First sync
        mockMvc.perform(post("/api/v1/sync")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.syncedIncidentIds", hasSize(2)))
                .andExpect(jsonPath("$.duplicateIgnoredIds", hasSize(0)));

        // Duplicate sync replay
        mockMvc.perform(post("/api/v1/sync")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.syncedIncidentIds", hasSize(0)))
                .andExpect(jsonPath("$.duplicateIgnoredIds", hasSize(2)));
    }

    @Test
    void testAiTriageRuleBasedFallback() throws Exception {
        AuthRequest authReq = new AuthRequest("patient.vsk@vvit.net", "Password@123");
        String token = objectMapper.readValue(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authReq)))
                .andReturn().getResponse().getContentAsString(), AuthResponse.class).getToken();

        AiSummaryRequest req = new AiSummaryRequest();
        req.setQuery("Motorcycle rider fell on highway, unresponsive with head injury");
        req.setEmergencyType("ROAD_ACCIDENT_FALL");

        mockMvc.perform(post("/api/v1/ai/triage")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.triageLevel", is("CRITICAL")))
                .andExpect(jsonPath("$.immediateActionSteps", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.hospitalPrepRecommendations", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void testNearbyHospitals() throws Exception {
        AuthRequest authReq = new AuthRequest("patient.vsk@vvit.net", "Password@123");
        String token = objectMapper.readValue(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authReq)))
                .andReturn().getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Coordinates for VVIT Nambur
        mockMvc.perform(get("/api/v1/hospitals?latitude=16.3533&longitude=80.5238")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$[0].distanceKm").isNumber());
    }
}

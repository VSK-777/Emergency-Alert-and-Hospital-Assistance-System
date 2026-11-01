package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.IncidentCreateRequest;
import net.vvit.csp.emergency.dto.IncidentResponse;
import net.vvit.csp.emergency.dto.IncidentStatusUpdateRequest;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.EmergencyService;
import net.vvit.csp.emergency.service.LiveEmergencyBroadcastService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/emergencies")
@Tag(name = "Emergencies", description = "Emergency incident creation, status lifecycle, and retrieval")
public class EmergencyController {

    private final EmergencyService emergencyService;
    private final AuthService authService;
    private final LiveEmergencyBroadcastService broadcastService;

    public EmergencyController(EmergencyService emergencyService, AuthService authService, LiveEmergencyBroadcastService broadcastService) {
        this.emergencyService = emergencyService;
        this.authService = authService;
        this.broadcastService = broadcastService;
    }

    @GetMapping("/stream")
    @Operation(summary = "Subscribe to live real-time emergency alert dispatch stream (SSE for Web & Phone)")
    public SseEmitter streamEmergencyAlerts() {
        return broadcastService.registerClient();
    }

    @GetMapping("/active")
    @Operation(summary = "List active and pending emergency incidents (for live notification polling)")
    public ResponseEntity<List<IncidentResponse>> getActiveIncidents() {
        return ResponseEntity.ok(emergencyService.listActiveIncidents());
    }

    @PostMapping
    @Operation(summary = "Create or trigger an emergency incident (from Smartwatch, Mobile SOS, or manual)")
    public ResponseEntity<IncidentResponse> createIncident(@Valid @RequestBody IncidentCreateRequest request) {
        User user = null;
        try {
            user = authService.getCurrentAuthenticatedUser();
        } catch (Exception ignored) {
            // Permit anonymous SOS creation when emergency occurs without active auth session
        }
        IncidentResponse response = emergencyService.createIncident(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get emergency incident details by ID")
    public ResponseEntity<IncidentResponse> getIncident(@PathVariable String id) {
        return ResponseEntity.ok(emergencyService.getIncident(id));
    }

    @GetMapping
    @Operation(summary = "List all emergency incidents for the authenticated user")
    public ResponseEntity<List<IncidentResponse>> getMyIncidents() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(emergencyService.listUserIncidents(user.getId()));
    }

    @GetMapping("/all")
    @Operation(summary = "List all emergency incidents (hospital staff, responders, administrators)")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents() {
        return ResponseEntity.ok(emergencyService.listAllIncidents());
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update incident status, assign hospital, or assign responder")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody IncidentStatusUpdateRequest request
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(emergencyService.updateStatus(id, request, user));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an emergency incident (false alarm cancellation)")
    public ResponseEntity<IncidentResponse> cancelIncident(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(emergencyService.cancelIncident(id, user));
    }
}

package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.IncidentCreateRequest;
import net.vvit.csp.emergency.dto.IncidentResponse;
import net.vvit.csp.emergency.dto.IncidentStatusUpdateRequest;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.security.JwtService;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.EmergencyService;
import net.vvit.csp.emergency.service.LiveEmergencyBroadcastService;
import net.vvit.csp.emergency.service.StreamTicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/emergencies")
@Tag(name = "Emergencies", description = "Emergency incident creation, status lifecycle, and retrieval")
public class EmergencyController {

    private final EmergencyService emergencyService;
    private final AuthService authService;
    private final LiveEmergencyBroadcastService broadcastService;
    private final StreamTicketService streamTicketService;
    private final JwtService jwtService;

    public EmergencyController(EmergencyService emergencyService,
                               AuthService authService,
                               LiveEmergencyBroadcastService broadcastService,
                               StreamTicketService streamTicketService,
                               JwtService jwtService) {
        this.emergencyService = emergencyService;
        this.authService = authService;
        this.broadcastService = broadcastService;
        this.streamTicketService = streamTicketService;
        this.jwtService = jwtService;
    }

    @PostMapping("/stream-ticket")
    @Operation(summary = "Generate a short-lived single-use ticket for SSE streaming (solves browser EventSource header limitation)")
    public ResponseEntity<Map<String, Object>> generateStreamTicket() {
        User user = authService.getCurrentAuthenticatedUser();
        String ticket = streamTicketService.issueTicket(user);
        return ResponseEntity.ok(Map.of(
                "ticket", ticket,
                "expiresInSeconds", 60,
                "userId", user.getId(),
                "role", user.getRole().name()
        ));
    }

    @GetMapping("/stream")
    @Operation(summary = "Subscribe to live real-time emergency alert dispatch stream (Authenticated via ticket, token parameter, or Bearer header)")
    public SseEmitter streamEmergencyAlerts(
            @RequestParam(required = false) String ticket,
            @RequestParam(required = false) String token,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = null;
        UserRole userRole = null;

        // 1. Authenticate via short-lived stream ticket (preferred for browser EventSource)
        if (ticket != null && !ticket.isBlank()) {
            var validTicket = streamTicketService.consumeTicket(ticket);
            if (validTicket.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired SSE stream ticket.");
            }
            userId = validTicket.get().userId();
            userRole = validTicket.get().userRole();
        } else {
            // 2. Authenticate via Bearer header or token query parameter
            String jwt = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            } else if (token != null && !token.isBlank()) {
                jwt = token;
            }

            if (jwt != null) {
                try {
                    String username = jwtService.extractUsername(jwt);
                    if (username != null) {
                        User user = authService.getUserByEmail(username);
                        userId = user.getId();
                        userRole = user.getRole();
                    }
                } catch (Exception ex) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication credentials for SSE stream.");
                }
            }
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required for SSE stream. Provide a valid ticket or token.");
        }

        return broadcastService.registerClient(userId, userRole);
    }

    @GetMapping("/active")
    @Operation(summary = "List active and pending emergency incidents (Authenticated with role-based and patient isolation)")
    public ResponseEntity<List<IncidentResponse>> getActiveIncidents() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(emergencyService.listActiveIncidentsForUser(user));
    }

    @PostMapping
    @Operation(summary = "Create or trigger an emergency incident (from Smartwatch, Mobile SOS, or manual, protected by rate limiting and device auth)")
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody IncidentCreateRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId,
            @RequestHeader(value = "X-Device-Token", required = false) String headerDeviceToken,
            HttpServletRequest httpRequest
    ) {
        User user = null;
        try {
            user = authService.getCurrentAuthenticatedUser();
        } catch (Exception ignored) {
            // Allows unauthenticated emergency alerts (e.g. unconscious victim crash detection)
        }

        String clientIp = extractClientIp(httpRequest);
        IncidentResponse response = emergencyService.createIncident(request, user, clientIp, headerDeviceId, headerDeviceToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get emergency incident details by ID (Patient and hospital isolation enforced)")
    public ResponseEntity<IncidentResponse> getIncident(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(emergencyService.getIncident(id, user));
    }

    @GetMapping
    @Operation(summary = "List all emergency incidents for the authenticated user")
    public ResponseEntity<List<IncidentResponse>> getMyIncidents() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(emergencyService.listUserIncidents(user.getId()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_STAFF', 'RESPONDER')")
    @Operation(summary = "List all emergency incidents (Restricted to hospital staff, responders, administrators)")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents() {
        return ResponseEntity.ok(emergencyService.listAllIncidents());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_STAFF', 'RESPONDER')")
    @Operation(summary = "Update incident status, assign hospital, or assign responder")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody IncidentStatusUpdateRequest request
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(emergencyService.updateStatus(id, request, user));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an emergency incident (false alarm cancellation, ownership checked)")
    public ResponseEntity<IncidentResponse> cancelIncident(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(emergencyService.cancelIncident(id, user));
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "UNKNOWN";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}

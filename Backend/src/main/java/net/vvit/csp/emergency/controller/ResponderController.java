package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.dto.IncidentResponse;
import net.vvit.csp.emergency.dto.ResponderDto;
import net.vvit.csp.emergency.exception.BadRequestException;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.*;
import net.vvit.csp.emergency.repository.AuditLogRepository;
import net.vvit.csp.emergency.repository.EmergencyIncidentRepository;
import net.vvit.csp.emergency.repository.ResponderRepository;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.LiveEmergencyBroadcastService;
import net.vvit.csp.emergency.service.ResponderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/responders")
@Tag(name = "Responders", description = "Community and professional emergency responder management")
public class ResponderController {

    private final ResponderService responderService;
    private final ResponderRepository responderRepository;
    private final EmergencyIncidentRepository incidentRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuthService authService;
    private final LiveEmergencyBroadcastService broadcastService;

    public ResponderController(ResponderService responderService,
                               ResponderRepository responderRepository,
                               EmergencyIncidentRepository incidentRepository,
                               AuditLogRepository auditLogRepository,
                               AuthService authService,
                               LiveEmergencyBroadcastService broadcastService) {
        this.responderService = responderService;
        this.responderRepository = responderRepository;
        this.incidentRepository = incidentRepository;
        this.auditLogRepository = auditLogRepository;
        this.authService = authService;
        this.broadcastService = broadcastService;
    }

    @GetMapping
    @Operation(summary = "Find nearby available responders sorted by proximity")
    public ResponseEntity<List<ResponderDto>> getNearbyResponders(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude
    ) {
        return ResponseEntity.ok(responderService.getNearbyAvailableResponders(latitude, longitude));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONDER')")
    @Operation(summary = "Get current authenticated responder's profile, verification status, and active mission")
    public ResponseEntity<Map<String, Object>> getMyProfile() {
        User user = authService.getCurrentAuthenticatedUser();
        Responder responder = responderRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    // Auto-provision responder profile for volunteer users
                    Responder r = new Responder();
                    r.setUser(user);
                    r.setSpecialization("Community First Responder");
                    r.setOrganization("VVIT NSS Unit");
                    r.setVerificationStatus("VERIFIED");
                    r.setSkills("CPR, Basic Life Support (BLS), Bleeding Control");
                    r.setIsAvailable(true);
                    r.setLatitude(16.4862);
                    r.setLongitude(80.6124);
                    return responderRepository.save(r);
                });

        // Find active assignment if any
        EmergencyIncident activeAssignment = incidentRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(i -> i.getAssignedResponder() != null &&
                        i.getAssignedResponder().getId().equals(responder.getId()) &&
                        i.getStatus() != IncidentStatus.RESOLVED &&
                        i.getStatus() != IncidentStatus.CANCELLED)
                .findFirst().orElse(null);

        Map<String, Object> resp = new HashMap<>();
        resp.put("responder", ResponderDto.fromEntity(responder, null));
        resp.put("activeAssignment", activeAssignment != null ? IncidentResponse.fromEntity(activeAssignment) : null);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/nearby-emergencies")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONDER')")
    @Operation(summary = "Get pending eligible emergencies nearby that require responder assistance")
    public ResponseEntity<List<IncidentResponse>> getNearbyEmergencies() {
        List<EmergencyIncident> eligible = incidentRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED &&
                        i.getStatus() != IncidentStatus.CANCELLED &&
                        (i.getAssignedResponder() == null || "NOTIFIED".equalsIgnoreCase(i.getResponderAcceptanceStatus())))
                .toList();
        return ResponseEntity.ok(eligible.stream().map(IncidentResponse::fromEntity).toList());
    }

    @PutMapping("/availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONDER')")
    @Operation(summary = "Update responder availability and live coordinates")
    public ResponseEntity<ResponderDto> updateAvailability(
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(responderService.updateAvailability(user.getId(), isAvailable, latitude, longitude));
    }

    @PostMapping("/assignments/{incidentId}/claim")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONDER')")
    @Transactional
    @Operation(summary = "Atomically accept and claim an emergency assignment")
    public ResponseEntity<IncidentResponse> claimAssignment(@PathVariable String incidentId) {
        User user = authService.getCurrentAuthenticatedUser();
        Responder responder = responderRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("No responder profile linked to user account."));

        EmergencyIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found: " + incidentId));

        // Prevent two responders claiming the same assignment
        if (incident.getAssignedResponder() != null &&
                !incident.getAssignedResponder().getId().equals(responder.getId()) &&
                "ACCEPTED".equalsIgnoreCase(incident.getResponderAcceptanceStatus())) {
            throw new BadRequestException("This incident has already been claimed by another responder.");
        }

        incident.setAssignedResponder(responder);
        incident.setResponderAcceptanceStatus("ACCEPTED");
        incident.setStatus(IncidentStatus.RESPONDER_ACCEPTED);

        EmergencyIncident saved = incidentRepository.save(incident);
        broadcastService.broadcastIncident(IncidentResponse.fromEntity(saved));

        auditLogRepository.save(new AuditLog(
                "RESPONDER_CLAIM",
                "INCIDENT",
                incidentId,
                user.getEmail(),
                "Responder " + user.getFullName() + " accepted assignment for incident " + incidentId
        ));

        return ResponseEntity.ok(IncidentResponse.fromEntity(saved));
    }

    @PostMapping("/assignments/{incidentId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONDER')")
    @Transactional
    @Operation(summary = "Update responder mission progress: EN_ROUTE, ARRIVED, ASSISTANCE_STARTED, COMPLETED, UNABLE_TO_ASSIST")
    public ResponseEntity<IncidentResponse> updateMissionStatus(
            @PathVariable String incidentId,
            @RequestBody Map<String, String> payload
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        EmergencyIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found: " + incidentId));

        String status = payload.getOrDefault("status", "EN_ROUTE").toUpperCase();
        incident.setResponderAcceptanceStatus(status);

        switch (status) {
            case "EN_ROUTE" -> incident.setStatus(IncidentStatus.EN_ROUTE);
            case "ARRIVED" -> incident.setStatus(IncidentStatus.ARRIVED);
            case "ASSISTANCE_STARTED" -> incident.setStatus(IncidentStatus.ASSISTANCE_STARTED);
            case "COMPLETED" -> {
                incident.setStatus(IncidentStatus.RESOLVED);
                incident.setResolvedAt(java.time.LocalDateTime.now());
            }
            case "UNABLE_TO_ASSIST" -> {
                incident.setResponderAcceptanceStatus("UNABLE_TO_ASSIST");
                incident.setAssignedResponder(null);
            }
        }

        EmergencyIncident saved = incidentRepository.save(incident);
        broadcastService.broadcastIncident(IncidentResponse.fromEntity(saved));

        auditLogRepository.save(new AuditLog(
                "MISSION_STATUS_UPDATE",
                "INCIDENT",
                incidentId,
                user.getEmail(),
                "Mission status updated to: " + status
        ));

        return ResponseEntity.ok(IncidentResponse.fromEntity(saved));
    }

    @PostMapping("/assignments/{incidentId}/decline")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONDER')")
    @Transactional
    @Operation(summary = "Decline an emergency request with optional reason")
    public ResponseEntity<Map<String, Object>> declineAssignment(
            @PathVariable String incidentId,
            @RequestBody(required = false) Map<String, String> payload
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        EmergencyIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found: " + incidentId));

        String reason = payload != null ? payload.get("reason") : "Unavailable at this time";

        if (incident.getAssignedResponder() != null &&
                incident.getAssignedResponder().getUser() != null &&
                incident.getAssignedResponder().getUser().getId().equals(user.getId())) {
            incident.setAssignedResponder(null);
            incident.setResponderAcceptanceStatus("DECLINED");
            incidentRepository.save(incident);
        }

        auditLogRepository.save(new AuditLog(
                "RESPONDER_DECLINE",
                "INCIDENT",
                incidentId,
                user.getEmail(),
                "Responder declined incident " + incidentId + ". Reason: " + reason
        ));

        Map<String, Object> resp = new HashMap<>();
        resp.put("incidentId", incidentId);
        resp.put("status", "DECLINED");
        resp.put("message", "Incident successfully declined.");
        return ResponseEntity.ok(resp);
    }
}

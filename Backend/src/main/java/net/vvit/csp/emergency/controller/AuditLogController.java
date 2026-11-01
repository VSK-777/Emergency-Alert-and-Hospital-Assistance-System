package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.model.AuditLog;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.repository.AuditLogRepository;
import net.vvit.csp.emergency.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Logs", description = "Immutable regulatory emergency action history and dispatch trail")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final AuthService authService;

    public AuditLogController(AuditLogRepository auditLogRepository, AuthService authService) {
        this.auditLogRepository = auditLogRepository;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get list of all audit trail events")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@RequestParam(required = false) String incidentId) {
        if (incidentId != null && !incidentId.isBlank()) {
            return ResponseEntity.ok(auditLogRepository.findByIncidentIdOrderByCreatedAtDesc(incidentId));
        }
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    @Operation(summary = "Create an audit trail entry")
    public ResponseEntity<AuditLog> createAuditLog(@RequestBody Map<String, String> payload) {
        String action = payload.getOrDefault("action", "SYSTEM_EVENT");
        String incidentId = payload.get("incidentId");
        String details = payload.getOrDefault("details", "");

        String actorEmail = "SYSTEM";
        String actorRole = "ANONYMOUS";
        try {
            User user = authService.getCurrentAuthenticatedUser();
            actorEmail = user.getEmail();
            actorRole = user.getRole().name();
        } catch (Exception ignored) {}

        AuditLog log = new AuditLog(action, actorEmail, actorRole, incidentId, details);
        return ResponseEntity.status(HttpStatus.CREATED).body(auditLogRepository.save(log));
    }
}

package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.exception.BadRequestException;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.*;
import net.vvit.csp.emergency.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "System Administration", description = "System-wide metrics, governance, user and partner verification")
public class AdminController {

    private final UserRepository userRepo;
    private final HospitalRepository hospitalRepo;
    private final AmbulanceRepository ambulanceRepo;
    private final ResponderRepository responderRepo;
    private final DeviceRepository deviceRepo;
    private final EmergencyIncidentRepository incidentRepo;
    private final AuditLogRepository auditLogRepo;

    public AdminController(UserRepository userRepo,
                           HospitalRepository hospitalRepo,
                           AmbulanceRepository ambulanceRepo,
                           ResponderRepository responderRepo,
                           DeviceRepository deviceRepo,
                           EmergencyIncidentRepository incidentRepo,
                           AuditLogRepository auditLogRepo) {
        this.userRepo = userRepo;
        this.hospitalRepo = hospitalRepo;
        this.ambulanceRepo = ambulanceRepo;
        this.responderRepo = responderRepo;
        this.deviceRepo = deviceRepo;
        this.incidentRepo = incidentRepo;
        this.auditLogRepo = auditLogRepo;
    }

    @GetMapping("/stats")
    @Operation(summary = "Get system-wide live operational statistics and dashboard counters")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalUsers = userRepo.count();
        long totalPatients = userRepo.findByRole(UserRole.CITIZEN).size();
        long totalHospitals = hospitalRepo.count();
        long totalHospitalStaff = userRepo.findByRole(UserRole.HOSPITAL_STAFF).size();
        long totalAmbulances = ambulanceRepo.count();
        long totalResponders = responderRepo.count();
        long availableResponders = responderRepo.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsAvailable()))
                .count();
        long registeredDevices = deviceRepo.count();

        long activeEmergencies = incidentRepo.findAll().stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.CANCELLED)
                .count();
        long pendingEmergencies = incidentRepo.findAll().stream()
                .filter(i -> i.getStatus() == IncidentStatus.PENDING)
                .count();
        long resolvedEmergencies = incidentRepo.findAll().stream()
                .filter(i -> i.getStatus() == IncidentStatus.RESOLVED)
                .count();
        long pendingHospitalAcks = incidentRepo.findAll().stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED &&
                        i.getStatus() != IncidentStatus.CANCELLED &&
                        (i.getHospitalAcknowledgement() == null || "PENDING".equalsIgnoreCase(i.getHospitalAcknowledgement())))
                .count();

        stats.put("totalUsers", totalUsers);
        stats.put("totalPatients", totalPatients);
        stats.put("totalHospitals", totalHospitals);
        stats.put("totalHospitalStaff", totalHospitalStaff);
        stats.put("totalAmbulances", totalAmbulances);
        stats.put("totalResponders", totalResponders);
        stats.put("availableResponders", availableResponders);
        stats.put("registeredDevices", registeredDevices);
        stats.put("activeEmergencies", activeEmergencies);
        stats.put("pendingEmergencies", pendingEmergencies);
        stats.put("resolvedEmergencies", resolvedEmergencies);
        stats.put("pendingHospitalAcknowledgements", pendingHospitalAcks);
        stats.put("failedNotifications", 0);
        stats.put("pendingSynchronizations", 0);

        return ResponseEntity.ok(stats);
    }

    @PutMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate or deactivate a user account")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam Boolean active
    ) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setIsActive(active);
        userRepo.save(user);

        auditLogRepo.save(new AuditLog(
                "USER_STATUS_CHANGE",
                "USER",
                user.getId().toString(),
                user.getEmail(),
                "Account active state changed to: " + active
        ));

        Map<String, Object> resp = new HashMap<>();
        resp.put("userId", user.getId());
        resp.put("email", user.getEmail());
        resp.put("isActive", user.getIsActive());
        resp.put("message", "User account status successfully updated.");
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Change a user's role (Administrator governance)")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable Long id,
            @RequestParam UserRole role
    ) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setRole(role);
        userRepo.save(user);

        auditLogRepo.save(new AuditLog(
                "USER_ROLE_CHANGE",
                "USER",
                user.getId().toString(),
                user.getEmail(),
                "Assigned role changed to: " + role
        ));

        Map<String, Object> resp = new HashMap<>();
        resp.put("userId", user.getId());
        resp.put("role", user.getRole());
        resp.put("message", "User role successfully updated.");
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/responders/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve or reject a volunteer responder's certification and profile")
    public ResponseEntity<Map<String, Object>> verifyResponder(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        Responder responder = responderRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Responder not found: " + id));
        responder.setVerificationStatus(status.toUpperCase());
        responderRepo.save(responder);

        auditLogRepo.save(new AuditLog(
                "RESPONDER_VERIFICATION",
                "RESPONDER",
                responder.getId().toString(),
                responder.getUser() != null ? responder.getUser().getEmail() : null,
                "Responder verification set to: " + status
        ));

        Map<String, Object> resp = new HashMap<>();
        resp.put("responderId", responder.getId());
        resp.put("verificationStatus", responder.getVerificationStatus());
        resp.put("message", "Responder verification updated successfully.");
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/hospitals/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verify or suspend a partner hospital account")
    public ResponseEntity<Map<String, Object>> verifyHospital(
            @PathVariable Long id,
            @RequestParam Boolean active
    ) {
        Hospital hospital = hospitalRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + id));
        hospital.setIsActive(active);
        hospitalRepo.save(hospital);

        auditLogRepo.save(new AuditLog(
                "HOSPITAL_VERIFICATION",
                "HOSPITAL",
                hospital.getId().toString(),
                hospital.getName(),
                "Hospital active state set to: " + active
        ));

        Map<String, Object> resp = new HashMap<>();
        resp.put("hospitalId", hospital.getId());
        resp.put("isActive", hospital.getIsActive());
        resp.put("message", "Hospital verification status updated.");
        return ResponseEntity.ok(resp);
    }
}

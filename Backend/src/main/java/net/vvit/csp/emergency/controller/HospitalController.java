package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.dto.HospitalDto;
import net.vvit.csp.emergency.dto.IncidentResponse;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.AuditLog;
import net.vvit.csp.emergency.model.EmergencyIncident;
import net.vvit.csp.emergency.model.Hospital;
import net.vvit.csp.emergency.model.IncidentStatus;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.repository.AuditLogRepository;
import net.vvit.csp.emergency.repository.EmergencyIncidentRepository;
import net.vvit.csp.emergency.repository.HospitalRepository;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.HospitalService;
import net.vvit.csp.emergency.service.LiveEmergencyBroadcastService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hospitals")
@Tag(name = "Hospitals", description = "Hospital directory, coordinates, emergency capacity, and bed status")
public class HospitalController {

    private final HospitalService hospitalService;
    private final HospitalRepository hospitalRepository;
    private final EmergencyIncidentRepository incidentRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuthService authService;
    private final LiveEmergencyBroadcastService broadcastService;

    public HospitalController(HospitalService hospitalService,
                              HospitalRepository hospitalRepository,
                              EmergencyIncidentRepository incidentRepository,
                              AuditLogRepository auditLogRepository,
                              AuthService authService,
                              LiveEmergencyBroadcastService broadcastService) {
        this.hospitalService = hospitalService;
        this.hospitalRepository = hospitalRepository;
        this.incidentRepository = incidentRepository;
        this.auditLogRepository = auditLogRepository;
        this.authService = authService;
        this.broadcastService = broadcastService;
    }

    @GetMapping
    @Operation(summary = "Find nearby active hospitals sorted by distance from coordinates")
    public ResponseEntity<List<HospitalDto>> getNearbyHospitals(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude
    ) {
        return ResponseEntity.ok(hospitalService.getNearbyHospitals(latitude, longitude));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_STAFF')")
    @Operation(summary = "Get the assigned hospital for the currently authenticated hospital staff")
    public ResponseEntity<HospitalDto> getMyHospital() {
        User user = authService.getCurrentAuthenticatedUser();
        Hospital hospital = null;
        if (user.getHospitalId() != null) {
            hospital = hospitalRepository.findById(user.getHospitalId()).orElse(null);
        }
        if (hospital == null) {
            // Default to primary teaching hospital (AIIMS Mangalagiri)
            hospital = hospitalRepository.findByIsActiveTrue().stream().findFirst().orElse(null);
        }
        if (hospital == null) {
            throw new ResourceNotFoundException("No hospital assigned or found.");
        }
        return ResponseEntity.ok(HospitalDto.fromEntity(hospital, null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get hospital details by ID")
    public ResponseEntity<HospitalDto> getHospitalById(@PathVariable Long id) {
        Hospital hospital = hospitalService.getHospitalById(id);
        return ResponseEntity.ok(HospitalDto.fromEntity(hospital, null));
    }

    @GetMapping("/{id}/emergencies")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_STAFF')")
    @Operation(summary = "Get all incoming and active emergencies assigned to this hospital")
    public ResponseEntity<List<IncidentResponse>> getHospitalEmergencies(@PathVariable Long id) {
        List<EmergencyIncident> incidents = incidentRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(i -> i.getAssignedHospital() != null && i.getAssignedHospital().getId().equals(id))
                .toList();
        return ResponseEntity.ok(incidents.stream().map(IncidentResponse::fromEntity).toList());
    }

    @PostMapping("/{id}/emergencies/{incidentId}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_STAFF')")
    @Operation(summary = "Hospital staff acknowledgement: ACKNOWLEDGE, ACCEPT, or DECLINE with reason")
    public ResponseEntity<IncidentResponse> acknowledgeIncident(
            @PathVariable Long id,
            @PathVariable String incidentId,
            @RequestBody Map<String, String> payload
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        EmergencyIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));

        String action = payload.getOrDefault("action", "ACKNOWLEDGE").toUpperCase();
        String declineReason = payload.get("reason");

        incident.setHospitalAcknowledgement(action);

        if ("DECLINE".equalsIgnoreCase(action)) {
            incident.setHospitalDeclineReason(declineReason != null ? declineReason : "Capacity or resource constraints");
            incident.setStatus(IncidentStatus.HOSPITAL_DECLINED);
        } else if ("ACCEPT".equalsIgnoreCase(action)) {
            incident.setStatus(IncidentStatus.HOSPITAL_ACCEPTED);
            incident.setHospitalPreparationStatus("PREPARATION_STARTED");
        } else {
            incident.setStatus(IncidentStatus.HOSPITAL_ACKNOWLEDGED);
        }

        EmergencyIncident saved = incidentRepository.save(incident);
        broadcastService.broadcastIncident(IncidentResponse.fromEntity(saved));

        auditLogRepository.save(new AuditLog(
                "HOSPITAL_ACTION",
                "HOSPITAL",
                id.toString(),
                user.getEmail(),
                "Hospital action on incident " + incidentId + ": " + action + (declineReason != null ? " Reason: " + declineReason : "")
        ));

        return ResponseEntity.ok(IncidentResponse.fromEntity(saved));
    }

    @PostMapping("/{id}/emergencies/{incidentId}/preparation")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_STAFF')")
    @Operation(summary = "Update patient preparation status: PREPARATION_STARTED, PATIENT_EXPECTED, PATIENT_ARRIVED, PATIENT_ADMITTED")
    public ResponseEntity<IncidentResponse> updatePreparation(
            @PathVariable Long id,
            @PathVariable String incidentId,
            @RequestBody Map<String, String> payload
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        EmergencyIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));

        String prepStatus = payload.getOrDefault("status", "PREPARATION_STARTED").toUpperCase();
        incident.setHospitalPreparationStatus(prepStatus);

        if ("PATIENT_ARRIVED".equalsIgnoreCase(prepStatus)) {
            incident.setStatus(IncidentStatus.ARRIVED);
        } else if ("PATIENT_ADMITTED".equalsIgnoreCase(prepStatus)) {
            incident.setStatus(IncidentStatus.PATIENT_ADMITTED);
        }

        EmergencyIncident saved = incidentRepository.save(incident);
        broadcastService.broadcastIncident(IncidentResponse.fromEntity(saved));

        auditLogRepository.save(new AuditLog(
                "PATIENT_PREPARATION",
                "HOSPITAL",
                id.toString(),
                user.getEmail(),
                "Preparation status for incident " + incidentId + " updated to: " + prepStatus
        ));

        return ResponseEntity.ok(IncidentResponse.fromEntity(saved));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register new partner hospital in the network")
    public ResponseEntity<Hospital> createHospital(@RequestBody Hospital hospital) {
        hospital.setIsActive(true);
        Hospital saved = hospitalRepository.save(hospital);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_STAFF')")
    @Operation(summary = "Update hospital capacity, ICU availability, or ambulances")
    public ResponseEntity<Hospital> updateHospital(@PathVariable Long id, @RequestBody Hospital updateData) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with ID: " + id));

        if (updateData.getName() != null) hospital.setName(updateData.getName());
        if (updateData.getAddress() != null) hospital.setAddress(updateData.getAddress());
        if (updateData.getPhoneNumber() != null) hospital.setPhoneNumber(updateData.getPhoneNumber());
        if (updateData.getEmergencyCapacity() != null) hospital.setEmergencyCapacity(updateData.getEmergencyCapacity());
        if (updateData.getAvailableIcus() != null) hospital.setAvailableIcus(updateData.getAvailableIcus());
        if (updateData.getAvailableAmbulances() != null) hospital.setAvailableAmbulances(updateData.getAvailableAmbulances());
        if (updateData.getIsActive() != null) hospital.setIsActive(updateData.getIsActive());

        Hospital saved = hospitalRepository.save(hospital);
        return ResponseEntity.ok(saved);
    }
}

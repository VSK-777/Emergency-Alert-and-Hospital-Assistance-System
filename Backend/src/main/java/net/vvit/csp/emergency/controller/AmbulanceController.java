package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.Ambulance;
import net.vvit.csp.emergency.model.AuditLog;
import net.vvit.csp.emergency.model.Hospital;
import net.vvit.csp.emergency.repository.AmbulanceRepository;
import net.vvit.csp.emergency.repository.AuditLogRepository;
import net.vvit.csp.emergency.repository.HospitalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ambulances")
@Tag(name = "Ambulances", description = "Ambulance fleet tracking, dispatch status lifecycle, and GPS telemetry")
public class AmbulanceController {

    private final AmbulanceRepository ambulanceRepository;
    private final HospitalRepository hospitalRepository;
    private final AuditLogRepository auditLogRepository;

    public AmbulanceController(AmbulanceRepository ambulanceRepository,
                               HospitalRepository hospitalRepository,
                               AuditLogRepository auditLogRepository) {
        this.ambulanceRepository = ambulanceRepository;
        this.hospitalRepository = hospitalRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    @Operation(summary = "List all ambulances with optional hospitalId or status filter")
    public ResponseEntity<List<Ambulance>> getAmbulances(
            @RequestParam(required = false) Long hospitalId,
            @RequestParam(required = false) String status
    ) {
        if (hospitalId != null) {
            return ResponseEntity.ok(ambulanceRepository.findByHospitalId(hospitalId));
        }
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(ambulanceRepository.findByStatus(status));
        }
        return ResponseEntity.ok(ambulanceRepository.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get ambulance details by ID")
    public ResponseEntity<Ambulance> getAmbulanceById(@PathVariable Long id) {
        Ambulance ambulance = ambulanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ambulance not found with ID: " + id));
        return ResponseEntity.ok(ambulance);
    }

    @PostMapping
    @Operation(summary = "Register new ambulance in fleet")
    public ResponseEntity<Ambulance> createAmbulance(@RequestBody Map<String, Object> payload) {
        Ambulance amb = new Ambulance();
        amb.setVehicleNumber((String) payload.get("vehicleNumber"));
        amb.setVehicleType((String) payload.getOrDefault("vehicleType", "ALS"));
        amb.setDriverName((String) payload.get("driverName"));
        amb.setDriverPhone((String) payload.get("driverPhone"));
        amb.setStatus((String) payload.getOrDefault("status", "AVAILABLE"));
        amb.setEquipment((String) payload.getOrDefault("equipment", "Defibrillator, Ventilator, Oxygen"));

        if (payload.get("hospitalId") != null) {
            Long hId = Long.valueOf(payload.get("hospitalId").toString());
            Hospital h = hospitalRepository.findById(hId).orElse(null);
            amb.setHospital(h);
        }

        if (payload.get("latitude") != null && payload.get("longitude") != null) {
            amb.setLatitude(Double.valueOf(payload.get("latitude").toString()));
            amb.setLongitude(Double.valueOf(payload.get("longitude").toString()));
        }

        amb.setUpdatedAt(LocalDateTime.now());
        Ambulance saved = ambulanceRepository.save(amb);
        auditLogRepository.save(new AuditLog("AMBULANCE_REGISTERED", "SYSTEM", "ADMIN", null, "Registered ambulance: " + saved.getVehicleNumber()));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update ambulance status and assigned incident ID")
    public ResponseEntity<Ambulance> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String incidentId
    ) {
        Ambulance ambulance = ambulanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ambulance not found with ID: " + id));

        ambulance.setStatus(status);
        if (incidentId != null) {
            ambulance.setAssignedIncidentId(incidentId);
        } else if ("AVAILABLE".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
            ambulance.setAssignedIncidentId(null);
        }
        ambulance.setUpdatedAt(LocalDateTime.now());
        Ambulance updated = ambulanceRepository.save(ambulance);

        auditLogRepository.save(new AuditLog("AMBULANCE_STATUS_UPDATED", "SYSTEM", "STAFF", incidentId,
                "Ambulance " + ambulance.getVehicleNumber() + " status changed to " + status));

        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/location")
    @Operation(summary = "Update ambulance live GPS coordinates")
    public ResponseEntity<Ambulance> updateLocation(
            @PathVariable Long id,
            @RequestParam Double latitude,
            @RequestParam Double longitude
    ) {
        Ambulance ambulance = ambulanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ambulance not found with ID: " + id));

        ambulance.setLatitude(latitude);
        ambulance.setLongitude(longitude);
        ambulance.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(ambulanceRepository.save(ambulance));
    }
}

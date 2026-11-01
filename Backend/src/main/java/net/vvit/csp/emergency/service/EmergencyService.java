package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.DetectionEventDto;
import net.vvit.csp.emergency.dto.IncidentCreateRequest;
import net.vvit.csp.emergency.dto.IncidentResponse;
import net.vvit.csp.emergency.dto.IncidentStatusUpdateRequest;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.*;
import net.vvit.csp.emergency.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class EmergencyService {

    private final EmergencyIncidentRepository incidentRepo;
    private final DetectionEventRepository detectionEventRepo;
    private final HospitalRepository hospitalRepo;
    private final ResponderRepository responderRepo;
    private final SyncRecordRepository syncRecordRepo;
    private final NotificationService notificationService;
    private final LiveEmergencyBroadcastService broadcastService;

    public EmergencyService(EmergencyIncidentRepository incidentRepo,
                            DetectionEventRepository detectionEventRepo,
                            HospitalRepository hospitalRepo,
                            ResponderRepository responderRepo,
                            SyncRecordRepository syncRecordRepo,
                            NotificationService notificationService,
                            LiveEmergencyBroadcastService broadcastService) {
        this.incidentRepo = incidentRepo;
        this.detectionEventRepo = detectionEventRepo;
        this.hospitalRepo = hospitalRepo;
        this.responderRepo = responderRepo;
        this.syncRecordRepo = syncRecordRepo;
        this.notificationService = notificationService;
        this.broadcastService = broadcastService;
    }

    @Transactional
    public IncidentResponse createIncident(IncidentCreateRequest request, User user) {
        // 1. Idempotency Check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<SyncRecord> existingSync = syncRecordRepo.findByIdempotencyKey(request.getIdempotencyKey());
            if (existingSync.isPresent()) {
                EmergencyIncident existingIncident = incidentRepo.findById(existingSync.get().getIncidentId()).orElse(null);
                if (existingIncident != null) {
                    return IncidentResponse.fromEntity(existingIncident);
                }
            }
        }

        // 2. Client ID check
        String incidentId = (request.getId() != null && !request.getId().isBlank())
                ? request.getId()
                : UUID.randomUUID().toString();

        if (incidentRepo.existsById(incidentId)) {
            return IncidentResponse.fromEntity(incidentRepo.findById(incidentId).get());
        }

        EmergencyIncident incident = new EmergencyIncident();
        incident.setId(incidentId);
        incident.setUser(user);
        incident.setSource(request.getSource() != null ? request.getSource() : IncidentSource.MOBILE_SOS);
        incident.setStatus(IncidentStatus.PENDING);
        incident.setLatitude(request.getLatitude());
        incident.setLongitude(request.getLongitude());
        incident.setAccuracyMeters(request.getAccuracyMeters());
        incident.setLocationTimestamp(LocalDateTime.now());
        incident.setDetectionReason(request.getDetectionReason() != null ? request.getDetectionReason() : "SOS triggered");
        incident.setDetectionScore(request.getDetectionScore() != null ? request.getDetectionScore() : 1.0);

        // 3. Auto-assign nearest active hospital
        List<Hospital> activeHospitals = hospitalRepo.findByIsActiveTrue();
        if (!activeHospitals.isEmpty()) {
            Hospital nearest = activeHospitals.stream().min((h1, h2) -> {
                double d1 = HospitalService.calculateDistance(request.getLatitude(), request.getLongitude(), h1.getLatitude(), h1.getLongitude());
                double d2 = HospitalService.calculateDistance(request.getLatitude(), request.getLongitude(), h2.getLatitude(), h2.getLongitude());
                return Double.compare(d1, d2);
            }).orElse(null);
            incident.setAssignedHospital(nearest);
        }

        EmergencyIncident saved = incidentRepo.save(incident);

        // 4. Save detection event if included (e.g. from Smartwatch)
        if (request.getDetectionEvent() != null) {
            DetectionEventDto eventDto = request.getDetectionEvent();
            DetectionEvent event = new DetectionEvent();
            event.setIncident(saved);
            event.setEventType(eventDto.getEventType() != null ? eventDto.getEventType() : "SMARTWATCH_ACCIDENT_EVENT");
            event.setAccelerationMagnitude(eventDto.getAccelerationMagnitude());
            event.setAngularVelocity(eventDto.getAngularVelocity());
            event.setPostImpactInactivitySec(eventDto.getPostImpactInactivitySec());
            event.setRawTelemetryJson(eventDto.getRawTelemetryJson());
            detectionEventRepo.save(event);
        }

        // 5. Save Idempotency Sync Record
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            syncRecordRepo.save(new SyncRecord(
                    request.getIdempotencyKey(),
                    saved.getId(),
                    "CLIENT_DEVICE",
                    "SYNCED",
                    null
            ));
        }

        // 6. Fanout emergency notifications
        notificationService.dispatchEmergencyAlerts(saved);

        // 7. Live broadcast to connected Web & Mobile devices via SSE
        broadcastService.broadcastEmergencyAlert(saved);

        return IncidentResponse.fromEntity(saved);
    }

    public IncidentResponse getIncident(String id) {
        EmergencyIncident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found with ID: " + id));
        return IncidentResponse.fromEntity(incident);
    }

    public List<IncidentResponse> listUserIncidents(Long userId) {
        return incidentRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(IncidentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<IncidentResponse> listAllIncidents() {
        return incidentRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(IncidentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<IncidentResponse> listActiveIncidents() {
        return incidentRepo.findAllByOrderByCreatedAtDesc().stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.CANCELLED)
                .map(IncidentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public IncidentResponse updateStatus(String id, IncidentStatusUpdateRequest request, User user) {
        EmergencyIncident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found with ID: " + id));

        incident.setStatus(request.getStatus());
        if (request.getStatus() == IncidentStatus.RESOLVED) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        if (request.getHospitalId() != null) {
            Hospital hospital = hospitalRepo.findById(request.getHospitalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + request.getHospitalId()));
            incident.setAssignedHospital(hospital);
        }

        if (request.getResponderId() != null) {
            Responder responder = responderRepo.findById(request.getResponderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Responder not found: " + request.getResponderId()));
            incident.setAssignedResponder(responder);
        }

        EmergencyIncident updated = incidentRepo.save(incident);
        return IncidentResponse.fromEntity(updated);
    }

    @Transactional
    public IncidentResponse cancelIncident(String id, User user) {
        EmergencyIncident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found with ID: " + id));

        incident.setStatus(IncidentStatus.CANCELLED);
        incident.setResolvedAt(LocalDateTime.now());
        EmergencyIncident updated = incidentRepo.save(incident);
        return IncidentResponse.fromEntity(updated);
    }
}

package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.DetectionEventDto;
import net.vvit.csp.emergency.dto.IncidentCreateRequest;
import net.vvit.csp.emergency.dto.IncidentResponse;
import net.vvit.csp.emergency.dto.IncidentStatusUpdateRequest;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.*;
import net.vvit.csp.emergency.repository.*;
import net.vvit.csp.emergency.security.EmergencyRateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class EmergencyService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyService.class);

    private final EmergencyIncidentRepository incidentRepo;
    private final DetectionEventRepository detectionEventRepo;
    private final HospitalRepository hospitalRepo;
    private final ResponderRepository responderRepo;
    private final SyncRecordRepository syncRecordRepo;
    private final NotificationService notificationService;
    private final LiveEmergencyBroadcastService broadcastService;
    private final DeviceAuthService deviceAuthService;
    private final EmergencyRateLimiter rateLimiter;
    private final UserRepository userRepo;
    private final DeviceRepository deviceRepo;

    public EmergencyService(EmergencyIncidentRepository incidentRepo,
                            DetectionEventRepository detectionEventRepo,
                            HospitalRepository hospitalRepo,
                            ResponderRepository responderRepo,
                            SyncRecordRepository syncRecordRepo,
                            NotificationService notificationService,
                            LiveEmergencyBroadcastService broadcastService,
                            DeviceAuthService deviceAuthService,
                            EmergencyRateLimiter rateLimiter,
                            UserRepository userRepo,
                            DeviceRepository deviceRepo) {
        this.incidentRepo = incidentRepo;
        this.detectionEventRepo = detectionEventRepo;
        this.hospitalRepo = hospitalRepo;
        this.responderRepo = responderRepo;
        this.syncRecordRepo = syncRecordRepo;
        this.notificationService = notificationService;
        this.broadcastService = broadcastService;
        this.deviceAuthService = deviceAuthService;
        this.rateLimiter = rateLimiter;
        this.userRepo = userRepo;
        this.deviceRepo = deviceRepo;
    }

    @Transactional
    public IncidentResponse createIncident(IncidentCreateRequest request, User user) {
        return createIncident(request, user, null, null, null);
    }

    @Transactional
    public IncidentResponse createIncident(IncidentCreateRequest request, User user, String clientIp, String deviceId, String deviceToken) {
        // 1. IP-Based Rate Limiting Check
        if (clientIp != null && !rateLimiter.allowRequest(clientIp)) {
            log.warn("Rate limit triggered on emergency creation from IP: {}", clientIp);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Emergency creation rate limit exceeded. Please wait before retrying.");
        }

        // 2. Per-Device Authentication & Hardware Association (Smartwatch & Companion Device)
        String effectiveDeviceId = (deviceId != null && !deviceId.isBlank()) ? deviceId : request.getDeviceIdentifier();
        String effectiveDeviceToken = (deviceToken != null && !deviceToken.isBlank()) ? deviceToken : request.getDeviceToken();

        if (user == null) {
            if (effectiveDeviceId != null && !effectiveDeviceId.isBlank()) {
                if (effectiveDeviceToken != null && !effectiveDeviceToken.isBlank()) {
                    Optional<UserDevice> authenticatedDevice = deviceAuthService.authenticateDevice(effectiveDeviceId, effectiveDeviceToken);
                    if (authenticatedDevice.isPresent()) {
                        user = authenticatedDevice.get().getUser();
                        log.info("Emergency incident authenticated via enrolled hardware device: {} for citizen: {}", effectiveDeviceId, user.getEmail());
                    } else {
                        log.warn("Device authentication failed for deviceId: {}. Invalid token or inactive device.", effectiveDeviceId);
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid device credentials for device: " + effectiveDeviceId);
                    }
                } else {
                    log.warn("Device authentication rejected for deviceId: {}. Missing device token.", effectiveDeviceId);
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Device token required for hardware authentication: " + effectiveDeviceId);
                }
            } else if (request.getUserEmail() != null && !request.getUserEmail().isBlank()) {
                // Reject unauthenticated requests attempting to spoof a user email without credentials
                log.warn("Unauthorized emergency creation attempt using userEmail '{}' without valid JWT or device token.", request.getUserEmail());
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required: Provide a valid user session or enrolled device credentials.");
            } else {
                log.warn("Unauthorized emergency creation attempt from IP: {}. Missing valid user session or enrolled device credentials.", clientIp);
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required: Provide a valid user session or enrolled device credentials (X-Device-Id and X-Device-Token).");
            }
        }

        // 3. Idempotency Check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<SyncRecord> existingSync = syncRecordRepo.findByIdempotencyKey(request.getIdempotencyKey());
            if (existingSync.isPresent()) {
                EmergencyIncident existingIncident = incidentRepo.findById(existingSync.get().getIncidentId()).orElse(null);
                if (existingIncident != null) {
                    log.info("Idempotent duplicate emergency ignored for key: {}", request.getIdempotencyKey());
                    return IncidentResponse.fromEntity(existingIncident);
                }
            }
        }

        // 4. Client ID Check
        String incidentId = (request.getId() != null && !request.getId().isBlank())
                ? request.getId()
                : UUID.randomUUID().toString();

        if (incidentRepo.existsById(incidentId)) {
            log.info("Client ID duplicate emergency returned for ID: {}", incidentId);
            return IncidentResponse.fromEntity(incidentRepo.findById(incidentId).get());
        }

        // 5. Replay Protection & Timestamp Window
        LocalDateTime incidentTime = LocalDateTime.now();
        if (request.getLocationTimestamp() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (request.getLocationTimestamp().isBefore(now.minusHours(2)) || request.getLocationTimestamp().isAfter(now.plusMinutes(10))) {
                log.warn("Suspicious emergency timestamp detected: {}. Server time: {}. Flagging replay anomaly.", request.getLocationTimestamp(), now);
            } else {
                incidentTime = request.getLocationTimestamp();
            }
        }

        EmergencyIncident incident = new EmergencyIncident();
        incident.setId(incidentId);
        incident.setUser(user);
        incident.setSource(request.getSource() != null ? request.getSource() : IncidentSource.MOBILE_SOS);
        incident.setStatus(IncidentStatus.PENDING);
        incident.setLatitude(request.getLatitude());
        incident.setLongitude(request.getLongitude());
        incident.setAccuracyMeters(request.getAccuracyMeters());
        incident.setLocationTimestamp(incidentTime);
        incident.setDetectionReason(request.getDetectionReason() != null ? request.getDetectionReason() : "SOS triggered");
        incident.setDetectionScore(request.getDetectionScore() != null ? request.getDetectionScore() : 1.0);

        // 6. Auto-assign nearest active hospital
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

        // 7. Save detection event if included (e.g. from ESP32 Triage Hardware or Mobile Companion)
        if (request.getDetectionEvent() != null) {
            DetectionEventDto eventDto = request.getDetectionEvent();
            DetectionEvent event = new DetectionEvent();
            event.setIncident(saved);
            event.setEventType(eventDto.getEventType() != null ? eventDto.getEventType() : "ESP32_TRAUMA_EVENT");
            event.setAccelerationMagnitude(eventDto.getAccelerationMagnitude());
            event.setAngularVelocity(eventDto.getAngularVelocity());
            event.setPostImpactInactivitySec(eventDto.getPostImpactInactivitySec());
            event.setRawTelemetryJson(eventDto.getRawTelemetryJson());
            event.setDeviceUptimeSeconds(eventDto.getDeviceUptimeSeconds());
            event.setMobileReceivedAt(eventDto.getMobileReceivedAt());
            event.setServerReceivedAt(incidentTime);
            event.setEventPersistedAt(LocalDateTime.now());
            event.setCreatedAt(LocalDateTime.now());
            detectionEventRepo.save(event);
        }

        // 8. Save Idempotency Sync Record
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            syncRecordRepo.save(new SyncRecord(
                    request.getIdempotencyKey(),
                    saved.getId(),
                    "CLIENT_DEVICE",
                    "SYNCED",
                    null
            ));
        }

        // 9. Fanout emergency notifications
        notificationService.dispatchEmergencyAlerts(saved);

        // 10. Live broadcast to connected Web & Mobile devices via SSE (with patient isolation)
        broadcastService.broadcastEmergencyAlert(saved);

        return IncidentResponse.fromEntity(saved);
    }

    public IncidentResponse getIncident(String id) {
        EmergencyIncident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found with ID: " + id));
        return IncidentResponse.fromEntity(incident);
    }

    public IncidentResponse getIncident(String id, User user) {
        EmergencyIncident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found with ID: " + id));

        if (user != null && user.getRole() == UserRole.CITIZEN) {
            if (incident.getUser() == null || !incident.getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You do not have permission to view other citizens' emergency incidents.");
            }
        }
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

    @Transactional(readOnly = true)
    public List<IncidentResponse> listActiveIncidentsForUser(User user) {
        if (user.getRole() == UserRole.CITIZEN) {
            return incidentRepo.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                    .filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.CANCELLED)
                    .map(IncidentResponse::fromEntity)
                    .toList();
        }

        List<EmergencyIncident> allActive = incidentRepo.findAllByOrderByCreatedAtDesc().stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.CANCELLED)
                .toList();

        if (user.getRole() == UserRole.ADMIN) {
            return allActive.stream().map(IncidentResponse::fromEntity).toList();
        }

        if (user.getRole() == UserRole.HOSPITAL_STAFF) {
            return allActive.stream()
                    .filter(i -> i.getAssignedHospital() == null
                            || user.getHospitalId() == null
                            || (i.getAssignedHospital() != null && i.getAssignedHospital().getId().equals(user.getHospitalId())))
                    .map(IncidentResponse::fromEntity)
                    .toList();
        }

        if (user.getRole() == UserRole.RESPONDER) {
            return allActive.stream()
                    .filter(i -> i.getAssignedResponder() == null
                            || (i.getAssignedResponder() != null && i.getAssignedResponder().getUser() != null && i.getAssignedResponder().getUser().getId().equals(user.getId())))
                    .map(IncidentResponse::fromEntity)
                    .toList();
        }

        return Collections.emptyList();
    }

    @Transactional
    public IncidentResponse updateStatus(String id, IncidentStatusUpdateRequest request, User user) {
        EmergencyIncident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found with ID: " + id));

        if (user.getRole() == UserRole.CITIZEN) {
            throw new AccessDeniedException("Access denied: Citizens cannot modify incident status or dispatch assignments.");
        }

        if (user.getRole() == UserRole.HOSPITAL_STAFF) {
            if (incident.getAssignedHospital() != null && user.getHospitalId() != null
                    && !incident.getAssignedHospital().getId().equals(user.getHospitalId())) {
                throw new AccessDeniedException("Access denied: Incident is assigned to a different hospital.");
            }
        }

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
        broadcastService.broadcastIncident(IncidentResponse.fromEntity(updated));
        return IncidentResponse.fromEntity(updated);
    }

    @Transactional
    public IncidentResponse cancelIncident(String id, User user) {
        EmergencyIncident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found with ID: " + id));

        if (user != null && user.getRole() == UserRole.CITIZEN) {
            if (incident.getUser() == null || !incident.getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You cannot cancel incidents belonging to other citizens.");
            }
        }

        incident.setStatus(IncidentStatus.CANCELLED);
        incident.setResolvedAt(LocalDateTime.now());
        EmergencyIncident updated = incidentRepo.save(incident);
        broadcastService.broadcastIncident(IncidentResponse.fromEntity(updated));
        return IncidentResponse.fromEntity(updated);
    }
}

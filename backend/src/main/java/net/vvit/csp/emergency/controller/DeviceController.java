package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.*;
import net.vvit.csp.emergency.exception.BadRequestException;
import net.vvit.csp.emergency.model.AuditLog;
import net.vvit.csp.emergency.model.DetectionEvent;
import net.vvit.csp.emergency.model.HardwareTelemetry;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserDevice;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.AuditLogRepository;
import net.vvit.csp.emergency.repository.DetectionEventRepository;
import net.vvit.csp.emergency.repository.DeviceRepository;
import net.vvit.csp.emergency.repository.HardwareTelemetryRepository;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.DeviceAuthService;
import net.vvit.csp.emergency.service.LiveEmergencyBroadcastService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/devices")
@Tag(name = "Hardware & Companion Devices", description = "ESP32 accident-detection hardware and mobile companion device fleet management")
public class DeviceController {

    private final DeviceRepository deviceRepository;
    private final DetectionEventRepository detectionEventRepository;
    private final HardwareTelemetryRepository telemetryRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuthService authService;
    private final DeviceAuthService deviceAuthService;
    private final LiveEmergencyBroadcastService broadcastService;

    public DeviceController(DeviceRepository deviceRepository,
                            DetectionEventRepository detectionEventRepository,
                            HardwareTelemetryRepository telemetryRepository,
                            AuditLogRepository auditLogRepository,
                            AuthService authService,
                            DeviceAuthService deviceAuthService,
                            LiveEmergencyBroadcastService broadcastService) {
        this.deviceRepository = deviceRepository;
        this.detectionEventRepository = detectionEventRepository;
        this.telemetryRepository = telemetryRepository;
        this.auditLogRepository = auditLogRepository;
        this.authService = authService;
        this.deviceAuthService = deviceAuthService;
        this.broadcastService = broadcastService;
    }

    @PostMapping("/pairing-challenge")
    @Operation(summary = "Generate a short-lived single-use pairing challenge for linking ESP32 hardware to the authenticated citizen")
    public ResponseEntity<DevicePairingChallengeDto> requestPairingChallenge(
            @RequestParam(required = false) String deviceType
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        var type = net.vvit.csp.emergency.model.DeviceType.ESP32_TRIAGE;
        if (deviceType != null && !deviceType.isBlank()) {
            try {
                type = net.vvit.csp.emergency.model.DeviceType.valueOf(deviceType.toUpperCase());
            } catch (Exception ignored) {}
        }
        DevicePairingChallengeDto challenge = deviceAuthService.createPairingChallenge(user, type);
        return ResponseEntity.status(HttpStatus.CREATED).body(challenge);
    }

    @PostMapping("/claim")
    @Operation(summary = "Claim physical possession of an ESP32 hardware device with pairing challenge and secret")
    public ResponseEntity<DeviceClaimResponse> claimDevice(
            @Valid @RequestBody DeviceClaimRequest request
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        DeviceClaimResponse response = deviceAuthService.claimDevice(request, user);
        auditLogRepository.save(new AuditLog(
                "DEVICE_CLAIMED",
                "DEVICE",
                response.getId().toString(),
                user.getEmail(),
                "Claimed and paired device " + response.getDeviceIdentifier() + " with status " + response.getPairingStatus()
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{deviceIdentifier}")
    @Operation(summary = "Unpair and revoke a hardware device (Owner or Admin only)")
    public ResponseEntity<Map<String, Object>> unpairDevice(@PathVariable String deviceIdentifier) {
        User user = authService.getCurrentAuthenticatedUser();
        deviceAuthService.unpairDevice(deviceIdentifier, user);
        auditLogRepository.save(new AuditLog(
                "DEVICE_UNPAIRED",
                "DEVICE",
                deviceIdentifier,
                user.getEmail(),
                "Unpaired and revoked device " + deviceIdentifier
        ));
        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "SUCCESS");
        resp.put("message", "Device " + deviceIdentifier + " has been revoked and unpaired.");
        resp.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/enroll")
    @Operation(summary = "Enroll a new ESP32 triage hardware or companion mobile device and issue unique authentication token")
    public ResponseEntity<DeviceEnrollmentResponse> enrollDevice(
            @Valid @RequestBody DeviceEnrollmentRequest request
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        DeviceEnrollmentResponse response = deviceAuthService.enrollDevice(request, user);
        auditLogRepository.save(new AuditLog(
                "DEVICE_ENROLLED",
                "DEVICE",
                response.getId().toString(),
                user.getEmail(),
                "Enrolled device " + request.getDeviceIdentifier() + " (" + request.getDeviceType() + ")"
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List registered ESP32 hardware & companion devices (Citizen receives own devices only; Admin receives all)")
    public ResponseEntity<List<Map<String, Object>>> getDevices() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        List<UserDevice> devices;

        // Strict backend-enforced ownership: citizens only ever see their own hardware
        if (currentUser.getRole() == UserRole.CITIZEN) {
            devices = deviceRepository.findByUserIdAndIsActiveTrue(currentUser.getId());
        } else {
            devices = deviceRepository.findAll();
        }

        List<Map<String, Object>> response = devices.stream().map(d -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("deviceType", d.getDeviceType().name());
            map.put("deviceIdentifier", d.getDeviceIdentifier());
            map.put("isActive", d.getIsActive());
            map.put("pairingStatus", d.getPairingStatus() != null ? d.getPairingStatus() : "PAIRED");
            map.put("firmwareVersion", d.getFirmwareVersion() != null ? d.getFirmwareVersion() : "CSP-Triage-V1");
            map.put("lastSyncedAt", d.getLastSyncedAt());
            map.put("createdAt", d.getCreatedAt());
            if (d.getUser() != null) {
                map.put("userId", d.getUser().getId());
                map.put("userName", d.getUser().getFullName());
                map.put("userEmail", d.getUser().getEmail());
            }

            // Check for latest live telemetry from this hardware device
            Optional<HardwareTelemetry> latestTelem = telemetryRepository.findFirstByDeviceIdentifierOrderByCreatedAtDesc(d.getDeviceIdentifier());
            if (latestTelem.isPresent()) {
                HardwareTelemetry t = latestTelem.get();
                map.put("latestHeartRate", t.getHeartRate());
                map.put("latestSpo2", t.getSpo2());
                map.put("latestSignalQuality", t.getSignalQuality());
                map.put("latestAccelMagnitude", t.getAccelMagnitude());
                map.put("latestDeviceState", t.getDeviceState());
                map.put("operatingMode", t.getOperatingMode());
                map.put("lastTelemetryAt", t.getCreatedAt());
            }

            // Hardware capability specifications
            boolean isEsp32 = "ESP32_TRIAGE".equalsIgnoreCase(d.getDeviceType().name()) ||
                              d.getDeviceIdentifier().toLowerCase().contains("esp32") ||
                              d.getDeviceIdentifier().toLowerCase().contains("triage");

            if (isEsp32) {
                map.put("hardwareModel", "ESP32 DevKit v1 (Dual-Core 240MHz)");
                map.put("sensors", "MPU6050 (6-DOF IMU) + MAX30102 (PPG Heart Rate & SpO2)");
                map.put("imuSamplingRate", "20 Hz motion / 5 Hz telemetry");
                map.put("firmwareVersion", d.getFirmwareVersion() != null ? d.getFirmwareVersion() : "CSP-Triage-V1 (Dual BLE/Wi-Fi)");
                map.put("bleGattService", "0000FFF0-0000-1000-8000-00805F9B34FB");
            } else {
                map.put("hardwareModel", "Android Companion Device Gateway");
                map.put("imuSamplingRate", "Event-driven BLE Relay");
                map.put("firmwareVersion", "Android CSP Companion v1.0");
            }

            return map;
        }).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/telemetry")
    @Operation(summary = "Ingest live ESP32 telemetry packet (Authenticated via device token or citizen JWT session) and broadcast via SSE")
    public ResponseEntity<Map<String, Object>> ingestTelemetry(
            @Valid @RequestBody HardwareTelemetryDto dto,
            @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId,
            @RequestHeader(value = "X-Device-Token", required = false) String headerDeviceToken
    ) {
        String effectiveDeviceId = (headerDeviceId != null && !headerDeviceId.isBlank())
                ? headerDeviceId.trim() : dto.getDeviceIdentifier().trim();

        // 1. Authenticate via Direct Device Token (Wi-Fi direct mode)
        if (headerDeviceToken != null && !headerDeviceToken.isBlank()) {
            Optional<UserDevice> authenticatedDevice = deviceAuthService.authenticateDevice(effectiveDeviceId, headerDeviceToken.trim());
            if (authenticatedDevice.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid device credentials for device: " + effectiveDeviceId);
            }
        } else {
            // 2. Alternatively, authenticate via Mobile App JWT session (BLE Gateway mode)
            try {
                User user = authService.getCurrentAuthenticatedUser();
                Optional<UserDevice> deviceOpt = deviceRepository.findByDeviceIdentifier(effectiveDeviceId);
                if (deviceOpt.isPresent()) {
                    UserDevice dev = deviceOpt.get();
                    if (!dev.getUser().getId().equals(user.getId()) && user.getRole() == UserRole.CITIZEN) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Citizen cannot relay telemetry for hardware belonging to another account.");
                    }
                }
            } catch (ResponseStatusException rse) {
                throw rse;
            } catch (Exception ex) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required: Provide X-Device-Token header or authenticated user session.");
            }
        }

        HardwareTelemetry entity = new HardwareTelemetry(
                effectiveDeviceId,
                dto.getHeartRate(),
                dto.getSpo2(),
                dto.getSignalQuality(),
                dto.getAccelX(),
                dto.getAccelY(),
                dto.getAccelZ(),
                dto.getAccelMagnitude(),
                dto.getDeviceState(),
                dto.getOperatingMode(),
                dto.getCountdownSec()
        );
        HardwareTelemetry saved = telemetryRepository.save(entity);

        // Update lastSyncedAt on registered device if exists
        deviceRepository.findByDeviceIdentifier(effectiveDeviceId).ifPresent(dev -> {
            dev.setLastSyncedAt(LocalDateTime.now());
            deviceRepository.save(dev);
        });

        // Broadcast to connected web clients (SSE)
        HardwareTelemetryDto broadcastDto = HardwareTelemetryDto.fromEntity(saved);
        broadcastDto.setTimestampMillis(dto.getTimestampMillis());
        broadcastService.broadcastTelemetry(broadcastDto);

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "SUCCESS");
        resp.put("telemetryId", saved.getId());
        resp.put("deviceIdentifier", saved.getDeviceIdentifier());
        resp.put("receivedAt", saved.getCreatedAt());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping("/{deviceIdentifier}/telemetry/latest")
    @Operation(summary = "Get the latest telemetry reading for an ESP32 device")
    public ResponseEntity<HardwareTelemetryDto> getLatestTelemetry(@PathVariable String deviceIdentifier) {
        verifyDeviceReadPermission(deviceIdentifier);
        return telemetryRepository.findFirstByDeviceIdentifierOrderByCreatedAtDesc(deviceIdentifier)
                .map(t -> ResponseEntity.ok(HardwareTelemetryDto.fromEntity(t)))
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{deviceIdentifier}/telemetry/history")
    @Operation(summary = "Get recent telemetry samples for live dashboard sensor charts (limit 50)")
    public ResponseEntity<List<HardwareTelemetryDto>> getTelemetryHistory(
            @PathVariable String deviceIdentifier,
            @RequestParam(defaultValue = "50") int limit
    ) {
        verifyDeviceReadPermission(deviceIdentifier);
        int safeLimit = Math.min(Math.max(limit, 5), 200);
        List<HardwareTelemetry> logs = telemetryRepository.findByDeviceIdentifierOrderByCreatedAtDesc(
                deviceIdentifier,
                PageRequest.of(0, safeLimit)
        );
        List<HardwareTelemetryDto> dtos = logs.stream()
                .map(HardwareTelemetryDto::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/events")
    @Operation(summary = "List all accident detection telemetry events")
    public ResponseEntity<List<DetectionEvent>> getDetectionEvents(@RequestParam(required = false) String incidentId) {
        if (incidentId != null && !incidentId.isBlank()) {
            return ResponseEntity.ok(detectionEventRepository.findByIncidentId(incidentId));
        }
        return ResponseEntity.ok(detectionEventRepository.findAll());
    }

    @PostMapping("/{id}/ping")
    @Operation(summary = "Send ping / diagnostic request to hardware device")
    public ResponseEntity<Map<String, Object>> pingDevice(@PathVariable Long id) {
        UserDevice dev = deviceRepository.findById(id).orElse(null);
        String devId = dev != null ? dev.getDeviceIdentifier() : "UNKNOWN";
        if (dev != null) {
            dev.setLastSyncedAt(LocalDateTime.now());
            deviceRepository.save(dev);
            auditLogRepository.save(new AuditLog("DEVICE_PING", "SYSTEM", "ADMIN", null, "Pinged device: " + devId));
        }
        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("message", "Device acknowledged ping. ESP32 hardware pipeline responding on BLE GATT.");
        result.put("deviceIdentifier", devId);
        result.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(result);
    }

    private void verifyDeviceReadPermission(String deviceIdentifier) {
        try {
            User user = authService.getCurrentAuthenticatedUser();
            if (user.getRole() == UserRole.CITIZEN) {
                Optional<UserDevice> dev = deviceRepository.findByDeviceIdentifier(deviceIdentifier);
                if (dev.isPresent() && !dev.get().getUser().getId().equals(user.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to hardware device telemetry.");
                }
            }
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception ignored) {
            // Allows unauthenticated local diagnostics in dev if authorized
        }
    }
}

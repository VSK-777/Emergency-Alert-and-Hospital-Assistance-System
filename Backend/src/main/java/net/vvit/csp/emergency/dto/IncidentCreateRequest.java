package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import net.vvit.csp.emergency.model.IncidentSource;

import java.time.LocalDateTime;

public class IncidentCreateRequest {
    private String id; // Client-generated idempotent ID (UUID)
    private IncidentSource source = IncidentSource.MOBILE_SOS;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    private Double accuracyMeters;
    private String detectionReason;
    private Double detectionScore;
    private DetectionEventDto detectionEvent;
    private String idempotencyKey;

    // Optional per-device credentials for enrolled smartwatch / companion mobile device
    private String deviceIdentifier;
    private String deviceToken;
    private String userEmail;
    private Long userId;
    private LocalDateTime locationTimestamp;

    public IncidentCreateRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public IncidentSource getSource() { return source; }
    public void setSource(IncidentSource source) { this.source = source; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getAccuracyMeters() { return accuracyMeters; }
    public void setAccuracyMeters(Double accuracyMeters) { this.accuracyMeters = accuracyMeters; }

    public String getDetectionReason() { return detectionReason; }
    public void setDetectionReason(String detectionReason) { this.detectionReason = detectionReason; }

    public Double getDetectionScore() { return detectionScore; }
    public void setDetectionScore(Double detectionScore) { this.detectionScore = detectionScore; }

    public DetectionEventDto getDetectionEvent() { return detectionEvent; }
    public void setDetectionEvent(DetectionEventDto detectionEvent) { this.detectionEvent = detectionEvent; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getDeviceIdentifier() { return deviceIdentifier; }
    public void setDeviceIdentifier(String deviceIdentifier) { this.deviceIdentifier = deviceIdentifier; }

    public String getDeviceToken() { return deviceToken; }
    public void setDeviceToken(String deviceToken) { this.deviceToken = deviceToken; }

    public LocalDateTime getLocationTimestamp() { return locationTimestamp; }
    public void setLocationTimestamp(LocalDateTime locationTimestamp) { this.locationTimestamp = locationTimestamp; }
}

package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.NotNull;
import net.vvit.csp.emergency.model.IncidentSource;

public class IncidentCreateRequest {
    private String id; // Client-generated idempotent ID (UUID)
    private IncidentSource source = IncidentSource.MOBILE_SOS;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private Double accuracyMeters;
    private String detectionReason;
    private Double detectionScore;
    private DetectionEventDto detectionEvent;
    private String idempotencyKey;

    public IncidentCreateRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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
}

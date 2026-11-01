package net.vvit.csp.emergency.dto;

public class DetectionEventDto {
    private String eventType;
    private Double accelerationMagnitude;
    private Double angularVelocity;
    private Integer postImpactInactivitySec;
    private String rawTelemetryJson;

    public DetectionEventDto() {}

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public Double getAccelerationMagnitude() { return accelerationMagnitude; }
    public void setAccelerationMagnitude(Double accelerationMagnitude) { this.accelerationMagnitude = accelerationMagnitude; }

    public Double getAngularVelocity() { return angularVelocity; }
    public void setAngularVelocity(Double angularVelocity) { this.angularVelocity = angularVelocity; }

    public Integer getPostImpactInactivitySec() { return postImpactInactivitySec; }
    public void setPostImpactInactivitySec(Integer postImpactInactivitySec) { this.postImpactInactivitySec = postImpactInactivitySec; }

    public String getRawTelemetryJson() { return rawTelemetryJson; }
    public void setRawTelemetryJson(String rawTelemetryJson) { this.rawTelemetryJson = rawTelemetryJson; }
}

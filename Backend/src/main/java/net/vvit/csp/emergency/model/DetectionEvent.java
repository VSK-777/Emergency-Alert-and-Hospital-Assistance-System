package net.vvit.csp.emergency.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "detection_events")
public class DetectionEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private EmergencyIncident incident;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "acceleration_magnitude")
    private Double accelerationMagnitude;

    @Column(name = "angular_velocity")
    private Double angularVelocity;

    @Column(name = "post_impact_inactivity_sec")
    private Integer postImpactInactivitySec;

    @Column(name = "raw_telemetry_json", columnDefinition = "TEXT")
    private String rawTelemetryJson;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public DetectionEvent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EmergencyIncident getIncident() { return incident; }
    public void setIncident(EmergencyIncident incident) { this.incident = incident; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

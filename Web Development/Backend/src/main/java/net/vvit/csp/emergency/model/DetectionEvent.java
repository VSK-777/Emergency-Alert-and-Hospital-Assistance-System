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

    @Column(name = "device_uptime_seconds")
    private Long deviceUptimeSeconds;

    @Column(name = "mobile_received_at")
    private LocalDateTime mobileReceivedAt;

    @Column(name = "server_received_at")
    private LocalDateTime serverReceivedAt = LocalDateTime.now();

    @Column(name = "event_persisted_at")
    private LocalDateTime eventPersistedAt = LocalDateTime.now();

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

    public Long getDeviceUptimeSeconds() { return deviceUptimeSeconds; }
    public void setDeviceUptimeSeconds(Long deviceUptimeSeconds) { this.deviceUptimeSeconds = deviceUptimeSeconds; }

    public LocalDateTime getMobileReceivedAt() { return mobileReceivedAt; }
    public void setMobileReceivedAt(LocalDateTime mobileReceivedAt) { this.mobileReceivedAt = mobileReceivedAt; }

    public LocalDateTime getServerReceivedAt() { return serverReceivedAt; }
    public void setServerReceivedAt(LocalDateTime serverReceivedAt) { this.serverReceivedAt = serverReceivedAt; }

    public LocalDateTime getEventPersistedAt() { return eventPersistedAt; }
    public void setEventPersistedAt(LocalDateTime eventPersistedAt) { this.eventPersistedAt = eventPersistedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

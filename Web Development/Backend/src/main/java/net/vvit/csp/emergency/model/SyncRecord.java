package net.vvit.csp.emergency.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "synchronization_records")
public class SyncRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "incident_id", nullable = false, length = 64)
    private String incidentId;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "sync_status", nullable = false, length = 30)
    private String syncStatus;

    @Column(name = "payload_hash", length = 128)
    private String payloadHash;

    @Column(name = "synced_at", updatable = false)
    private LocalDateTime syncedAt = LocalDateTime.now();

    public SyncRecord() {}

    public SyncRecord(String idempotencyKey, String incidentId, String deviceId, String syncStatus, String payloadHash) {
        this.idempotencyKey = idempotencyKey;
        this.incidentId = incidentId;
        this.deviceId = deviceId;
        this.syncStatus = syncStatus;
        this.payloadHash = payloadHash;
        this.syncedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getIncidentId() { return incidentId; }
    public void setIncidentId(String incidentId) { this.incidentId = incidentId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getSyncStatus() { return syncStatus; }
    public void setSyncStatus(String syncStatus) { this.syncStatus = syncStatus; }

    public String getPayloadHash() { return payloadHash; }
    public void setPayloadHash(String payloadHash) { this.payloadHash = payloadHash; }

    public LocalDateTime getSyncedAt() { return syncedAt; }
    public void setSyncedAt(LocalDateTime syncedAt) { this.syncedAt = syncedAt; }
}

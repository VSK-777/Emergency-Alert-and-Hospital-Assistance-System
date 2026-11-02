package net.vvit.csp.emergency.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_incidents")
public class EmergencyIncident {
    @Id
    @Column(length = 64)
    private String id; // UUID or client generated idempotent id

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private IncidentSource source = IncidentSource.MOBILE_SOS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IncidentStatus status = IncidentStatus.PENDING;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "accuracy_meters")
    private Double accuracyMeters;

    @Column(name = "location_timestamp")
    private LocalDateTime locationTimestamp;

    @Column(name = "detection_reason")
    private String detectionReason;

    @Column(name = "detection_score")
    private Double detectionScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_hospital_id")
    private Hospital assignedHospital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_responder_id")
    private Responder assignedResponder;

    @Column(name = "hospital_acknowledgement", length = 30)
    private String hospitalAcknowledgement = "PENDING";

    @Column(name = "hospital_decline_reason", columnDefinition = "TEXT")
    private String hospitalDeclineReason;

    @Column(name = "hospital_preparation_status", length = 40)
    private String hospitalPreparationStatus = "NOT_STARTED";

    @Column(name = "responder_acceptance_status", length = 30)
    private String responderAcceptanceStatus = "NOT_ASSIGNED";

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "assigned_ambulance_id")
    private Long assignedAmbulanceId;

    @Column(name = "assigned_ambulance_plate", length = 50)
    private String assignedAmbulancePlate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public EmergencyIncident() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public IncidentSource getSource() { return source; }
    public void setSource(IncidentSource source) { this.source = source; }

    public IncidentStatus getStatus() { return status; }
    public void setStatus(IncidentStatus status) { this.status = status; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getAccuracyMeters() { return accuracyMeters; }
    public void setAccuracyMeters(Double accuracyMeters) { this.accuracyMeters = accuracyMeters; }

    public LocalDateTime getLocationTimestamp() { return locationTimestamp; }
    public void setLocationTimestamp(LocalDateTime locationTimestamp) { this.locationTimestamp = locationTimestamp; }

    public String getDetectionReason() { return detectionReason; }
    public void setDetectionReason(String detectionReason) { this.detectionReason = detectionReason; }

    public Double getDetectionScore() { return detectionScore; }
    public void setDetectionScore(Double detectionScore) { this.detectionScore = detectionScore; }

    public Hospital getAssignedHospital() { return assignedHospital; }
    public void setAssignedHospital(Hospital assignedHospital) { this.assignedHospital = assignedHospital; }

    public Responder getAssignedResponder() { return assignedResponder; }
    public void setAssignedResponder(Responder assignedResponder) { this.assignedResponder = assignedResponder; }

    public String getHospitalAcknowledgement() { return hospitalAcknowledgement; }
    public void setHospitalAcknowledgement(String hospitalAcknowledgement) { this.hospitalAcknowledgement = hospitalAcknowledgement; }

    public String getHospitalDeclineReason() { return hospitalDeclineReason; }
    public void setHospitalDeclineReason(String hospitalDeclineReason) { this.hospitalDeclineReason = hospitalDeclineReason; }

    public String getHospitalPreparationStatus() { return hospitalPreparationStatus; }
    public void setHospitalPreparationStatus(String hospitalPreparationStatus) { this.hospitalPreparationStatus = hospitalPreparationStatus; }

    public String getResponderAcceptanceStatus() { return responderAcceptanceStatus; }
    public void setResponderAcceptanceStatus(String responderAcceptanceStatus) { this.responderAcceptanceStatus = responderAcceptanceStatus; }

    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }

    public Long getAssignedAmbulanceId() { return assignedAmbulanceId; }
    public void setAssignedAmbulanceId(Long assignedAmbulanceId) { this.assignedAmbulanceId = assignedAmbulanceId; }

    public String getAssignedAmbulancePlate() { return assignedAmbulancePlate; }
    public void setAssignedAmbulancePlate(String assignedAmbulancePlate) { this.assignedAmbulancePlate = assignedAmbulancePlate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}

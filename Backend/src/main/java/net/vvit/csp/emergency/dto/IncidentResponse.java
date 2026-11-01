package net.vvit.csp.emergency.dto;

import net.vvit.csp.emergency.model.EmergencyIncident;
import net.vvit.csp.emergency.model.IncidentSource;
import net.vvit.csp.emergency.model.IncidentStatus;

import java.time.LocalDateTime;

public class IncidentResponse {
    private String id;
    private Long userId;
    private String patientName;
    private String patientPhone;
    private String bloodGroup;
    private String allergies;
    private IncidentSource source;
    private IncidentStatus status;
    private Double latitude;
    private Double longitude;
    private Double accuracyMeters;
    private String detectionReason;
    private Double detectionScore;
    private Long assignedHospitalId;
    private String assignedHospitalName;
    private Long assignedResponderId;
    private String assignedResponderName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentResponse() {}

    public static IncidentResponse fromEntity(EmergencyIncident incident) {
        IncidentResponse dto = new IncidentResponse();
        dto.setId(incident.getId());
        if (incident.getUser() != null) {
            dto.setUserId(incident.getUser().getId());
            dto.setPatientName(incident.getUser().getFullName());
            dto.setPatientPhone(incident.getUser().getPhoneNumber());
            dto.setBloodGroup(incident.getUser().getBloodGroup());
            dto.setAllergies(incident.getUser().getAllergies());
        }
        dto.setSource(incident.getSource());
        dto.setStatus(incident.getStatus());
        dto.setLatitude(incident.getLatitude());
        dto.setLongitude(incident.getLongitude());
        dto.setAccuracyMeters(incident.getAccuracyMeters());
        dto.setDetectionReason(incident.getDetectionReason());
        dto.setDetectionScore(incident.getDetectionScore());
        if (incident.getAssignedHospital() != null) {
            dto.setAssignedHospitalId(incident.getAssignedHospital().getId());
            dto.setAssignedHospitalName(incident.getAssignedHospital().getName());
        }
        if (incident.getAssignedResponder() != null) {
            dto.setAssignedResponderId(incident.getAssignedResponder().getId());
            if (incident.getAssignedResponder().getUser() != null) {
                dto.setAssignedResponderName(incident.getAssignedResponder().getUser().getFullName());
            }
        }
        dto.setCreatedAt(incident.getCreatedAt());
        dto.setUpdatedAt(incident.getUpdatedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

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

    public String getDetectionReason() { return detectionReason; }
    public void setDetectionReason(String detectionReason) { this.detectionReason = detectionReason; }

    public Double getDetectionScore() { return detectionScore; }
    public void setDetectionScore(Double detectionScore) { this.detectionScore = detectionScore; }

    public Long getAssignedHospitalId() { return assignedHospitalId; }
    public void setAssignedHospitalId(Long assignedHospitalId) { this.assignedHospitalId = assignedHospitalId; }

    public String getAssignedHospitalName() { return assignedHospitalName; }
    public void setAssignedHospitalName(String assignedHospitalName) { this.assignedHospitalName = assignedHospitalName; }

    public Long getAssignedResponderId() { return assignedResponderId; }
    public void setAssignedResponderId(Long assignedResponderId) { this.assignedResponderId = assignedResponderId; }

    public String getAssignedResponderName() { return assignedResponderName; }
    public void setAssignedResponderName(String assignedResponderName) { this.assignedResponderName = assignedResponderName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

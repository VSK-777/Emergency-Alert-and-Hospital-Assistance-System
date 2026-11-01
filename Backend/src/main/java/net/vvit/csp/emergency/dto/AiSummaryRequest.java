package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.NotBlank;

public class AiSummaryRequest {
    private String incidentId;

    @NotBlank(message = "Prompt or incident description is required")
    private String query;

    private String patientMedicalNotes;
    private String emergencyType;

    public AiSummaryRequest() {}

    public String getIncidentId() { return incidentId; }
    public void setIncidentId(String incidentId) { this.incidentId = incidentId; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public String getPatientMedicalNotes() { return patientMedicalNotes; }
    public void setPatientMedicalNotes(String patientMedicalNotes) { this.patientMedicalNotes = patientMedicalNotes; }

    public String getEmergencyType() { return emergencyType; }
    public void setEmergencyType(String emergencyType) { this.emergencyType = emergencyType; }
}

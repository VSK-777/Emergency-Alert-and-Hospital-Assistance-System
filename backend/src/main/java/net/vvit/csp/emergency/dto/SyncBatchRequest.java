package net.vvit.csp.emergency.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class SyncBatchRequest {
    private String deviceId;

    @NotEmpty(message = "Incidents batch list cannot be empty")
    @Valid
    private List<IncidentCreateRequest> incidents;

    public SyncBatchRequest() {}

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public List<IncidentCreateRequest> getIncidents() { return incidents; }
    public void setIncidents(List<IncidentCreateRequest> incidents) { this.incidents = incidents; }
}

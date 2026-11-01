package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.NotNull;
import net.vvit.csp.emergency.model.IncidentStatus;

public class IncidentStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private IncidentStatus status;

    private Long hospitalId;
    private Long responderId;

    public IncidentStatusUpdateRequest() {}

    public IncidentStatus getStatus() { return status; }
    public void setStatus(IncidentStatus status) { this.status = status; }

    public Long getHospitalId() { return hospitalId; }
    public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

    public Long getResponderId() { return responderId; }
    public void setResponderId(Long responderId) { this.responderId = responderId; }
}

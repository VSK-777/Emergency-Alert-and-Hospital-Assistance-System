package net.vvit.csp.emergency.dto;

import net.vvit.csp.emergency.model.DeviceType;
import java.time.LocalDateTime;

public class DeviceEnrollmentResponse {
    private Long id;
    private String deviceIdentifier;
    private DeviceType deviceType;
    private String deviceToken;
    private Long userId;
    private String userEmail;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public DeviceEnrollmentResponse() {}

    public DeviceEnrollmentResponse(Long id, String deviceIdentifier, DeviceType deviceType, String deviceToken, Long userId, String userEmail, Boolean isActive, LocalDateTime createdAt) {
        this.id = id;
        this.deviceIdentifier = deviceIdentifier;
        this.deviceType = deviceType;
        this.deviceToken = deviceToken;
        this.userId = userId;
        this.userEmail = userEmail;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getDeviceIdentifier() { return deviceIdentifier; }
    public DeviceType getDeviceType() { return deviceType; }
    public String getDeviceToken() { return deviceToken; }
    public Long getUserId() { return userId; }
    public String getUserEmail() { return userEmail; }
    public Boolean getIsActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

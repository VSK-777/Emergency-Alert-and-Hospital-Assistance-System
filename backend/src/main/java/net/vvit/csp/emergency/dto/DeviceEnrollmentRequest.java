package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import net.vvit.csp.emergency.model.DeviceType;

public class DeviceEnrollmentRequest {

    @NotBlank(message = "Device identifier is required")
    private String deviceIdentifier;

    @NotNull(message = "Device type is required")
    private DeviceType deviceType;

    private String fcmToken;

    public DeviceEnrollmentRequest() {}

    public DeviceEnrollmentRequest(String deviceIdentifier, DeviceType deviceType, String fcmToken) {
        this.deviceIdentifier = deviceIdentifier;
        this.deviceType = deviceType;
        this.fcmToken = fcmToken;
    }

    public String getDeviceIdentifier() { return deviceIdentifier; }
    public void setDeviceIdentifier(String deviceIdentifier) { this.deviceIdentifier = deviceIdentifier; }

    public DeviceType getDeviceType() { return deviceType; }
    public void setDeviceType(DeviceType deviceType) { this.deviceType = deviceType; }

    public String getFcmToken() { return fcmToken; }
    public void setFcmToken(String fcmToken) { this.fcmToken = fcmToken; }
}

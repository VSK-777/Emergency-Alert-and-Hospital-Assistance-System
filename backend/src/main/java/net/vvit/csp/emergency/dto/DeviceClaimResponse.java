package net.vvit.csp.emergency.dto;

import net.vvit.csp.emergency.model.DeviceType;
import java.time.LocalDateTime;

public class DeviceClaimResponse {
    private Long id;
    private String deviceIdentifier;
    private DeviceType deviceType;
    private String rawDeviceToken;
    private String pairingStatus;
    private Long userId;
    private String userEmail;
    private String message;
    private LocalDateTime pairedAt;

    public DeviceClaimResponse() {}

    public DeviceClaimResponse(Long id, String deviceIdentifier, DeviceType deviceType, String rawDeviceToken,
                               String pairingStatus, Long userId, String userEmail, String message, LocalDateTime pairedAt) {
        this.id = id;
        this.deviceIdentifier = deviceIdentifier;
        this.deviceType = deviceType;
        this.rawDeviceToken = rawDeviceToken;
        this.pairingStatus = pairingStatus;
        this.userId = userId;
        this.userEmail = userEmail;
        this.message = message;
        this.pairedAt = pairedAt;
    }

    public Long getId() { return id; }
    public String getDeviceIdentifier() { return deviceIdentifier; }
    public DeviceType getDeviceType() { return deviceType; }
    public String getRawDeviceToken() { return rawDeviceToken; }
    public String getPairingStatus() { return pairingStatus; }
    public Long getUserId() { return userId; }
    public String getUserEmail() { return userEmail; }
    public String getMessage() { return message; }
    public LocalDateTime getPairedAt() { return pairedAt; }
}

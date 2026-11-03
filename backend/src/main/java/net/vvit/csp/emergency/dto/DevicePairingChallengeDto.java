package net.vvit.csp.emergency.dto;

import net.vvit.csp.emergency.model.DeviceType;
import java.time.LocalDateTime;

public class DevicePairingChallengeDto {
    private String challengeCode;
    private String claimSecret;
    private DeviceType deviceType;
    private long expiresInSeconds;
    private String qrPayload;
    private LocalDateTime expiresAt;

    public DevicePairingChallengeDto() {}

    public DevicePairingChallengeDto(String challengeCode, String claimSecret, DeviceType deviceType,
                                     long expiresInSeconds, String qrPayload, LocalDateTime expiresAt) {
        this.challengeCode = challengeCode;
        this.claimSecret = claimSecret;
        this.deviceType = deviceType;
        this.expiresInSeconds = expiresInSeconds;
        this.qrPayload = qrPayload;
        this.expiresAt = expiresAt;
    }

    public String getChallengeCode() { return challengeCode; }
    public void setChallengeCode(String challengeCode) { this.challengeCode = challengeCode; }

    public String getClaimSecret() { return claimSecret; }
    public void setClaimSecret(String claimSecret) { this.claimSecret = claimSecret; }

    public DeviceType getDeviceType() { return deviceType; }
    public void setDeviceType(DeviceType deviceType) { this.deviceType = deviceType; }

    public long getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(long expiresInSeconds) { this.expiresInSeconds = expiresInSeconds; }

    public String getQrPayload() { return qrPayload; }
    public void setQrPayload(String qrPayload) { this.qrPayload = qrPayload; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}

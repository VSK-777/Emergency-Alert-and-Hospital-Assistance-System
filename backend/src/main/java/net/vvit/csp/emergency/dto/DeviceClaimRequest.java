package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import net.vvit.csp.emergency.model.DeviceType;

public class DeviceClaimRequest {

    @NotBlank(message = "Challenge code is required")
    private String challengeCode;

    @NotBlank(message = "Claim secret is required")
    private String claimSecret;

    @NotBlank(message = "Device identifier is required")
    private String deviceIdentifier;

    @NotNull(message = "Device type is required")
    private DeviceType deviceType = DeviceType.ESP32_TRIAGE;

    private String firmwareVersion = "CSP-Triage-V1";

    public DeviceClaimRequest() {}

    public String getChallengeCode() { return challengeCode; }
    public void setChallengeCode(String challengeCode) { this.challengeCode = challengeCode; }

    public String getClaimSecret() { return claimSecret; }
    public void setClaimSecret(String claimSecret) { this.claimSecret = claimSecret; }

    public String getDeviceIdentifier() { return deviceIdentifier; }
    public void setDeviceIdentifier(String deviceIdentifier) { this.deviceIdentifier = deviceIdentifier; }

    public DeviceType getDeviceType() { return deviceType; }
    public void setDeviceType(DeviceType deviceType) { this.deviceType = deviceType; }

    public String getFirmwareVersion() { return firmwareVersion; }
    public void setFirmwareVersion(String firmwareVersion) { this.firmwareVersion = firmwareVersion; }
}

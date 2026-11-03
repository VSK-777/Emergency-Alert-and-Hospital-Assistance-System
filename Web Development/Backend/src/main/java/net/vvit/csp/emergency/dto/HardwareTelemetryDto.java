package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import net.vvit.csp.emergency.model.HardwareTelemetry;

import java.time.LocalDateTime;

public class HardwareTelemetryDto {

    @NotBlank(message = "Device identifier is required")
    private String deviceIdentifier;

    @NotBlank(message = "Device state is required")
    private String deviceState;

    @NotBlank(message = "Operating mode is required")
    private String operatingMode;

    private Integer heartRate;
    private Integer spo2;
    private Integer signalQuality;

    private Double accelX;
    private Double accelY;
    private Double accelZ;
    private Double accelMagnitude;

    private Integer countdownSec;
    private Long timestampMillis;
    private LocalDateTime createdAt;

    public HardwareTelemetryDto() {}

    public static HardwareTelemetryDto fromEntity(HardwareTelemetry entity) {
        HardwareTelemetryDto dto = new HardwareTelemetryDto();
        dto.setDeviceIdentifier(entity.getDeviceIdentifier());
        dto.setDeviceState(entity.getDeviceState());
        dto.setOperatingMode(entity.getOperatingMode());
        dto.setHeartRate(entity.getHeartRate());
        dto.setSpo2(entity.getSpo2());
        dto.setSignalQuality(entity.getSignalQuality());
        dto.setAccelX(entity.getAccelX());
        dto.setAccelY(entity.getAccelY());
        dto.setAccelZ(entity.getAccelZ());
        dto.setAccelMagnitude(entity.getAccelMagnitude());
        dto.setCountdownSec(entity.getCountdownSec());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    public String getDeviceIdentifier() { return deviceIdentifier; }
    public void setDeviceIdentifier(String deviceIdentifier) { this.deviceIdentifier = deviceIdentifier; }

    public String getDeviceState() { return deviceState; }
    public void setDeviceState(String deviceState) { this.deviceState = deviceState; }

    public String getOperatingMode() { return operatingMode; }
    public void setOperatingMode(String operatingMode) { this.operatingMode = operatingMode; }

    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }

    public Integer getSpo2() { return spo2; }
    public void setSpo2(Integer spo2) { this.spo2 = spo2; }

    public Integer getSignalQuality() { return signalQuality; }
    public void setSignalQuality(Integer signalQuality) { this.signalQuality = signalQuality; }

    public Double getAccelX() { return accelX; }
    public void setAccelX(Double accelX) { this.accelX = accelX; }

    public Double getAccelY() { return accelY; }
    public void setAccelY(Double accelY) { this.accelY = accelY; }

    public Double getAccelZ() { return accelZ; }
    public void setAccelZ(Double accelZ) { this.accelZ = accelZ; }

    public Double getAccelMagnitude() { return accelMagnitude; }
    public void setAccelMagnitude(Double accelMagnitude) { this.accelMagnitude = accelMagnitude; }

    public Integer getCountdownSec() { return countdownSec; }
    public void setCountdownSec(Integer countdownSec) { this.countdownSec = countdownSec; }

    public Long getTimestampMillis() { return timestampMillis; }
    public void setTimestampMillis(Long timestampMillis) { this.timestampMillis = timestampMillis; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

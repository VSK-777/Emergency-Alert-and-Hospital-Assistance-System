package net.vvit.csp.emergency.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hardware_telemetry_logs")
public class HardwareTelemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_identifier", nullable = false, length = 100)
    private String deviceIdentifier;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "spo2")
    private Integer spo2;

    @Column(name = "signal_quality")
    private Integer signalQuality;

    @Column(name = "accel_x")
    private Double accelX;

    @Column(name = "accel_y")
    private Double accelY;

    @Column(name = "accel_z")
    private Double accelZ;

    @Column(name = "accel_magnitude")
    private Double accelMagnitude;

    @Column(name = "device_state", nullable = false, length = 50)
    private String deviceState;

    @Column(name = "operating_mode", nullable = false, length = 20)
    private String operatingMode;

    @Column(name = "countdown_sec")
    private Integer countdownSec;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public HardwareTelemetry() {}

    public HardwareTelemetry(String deviceIdentifier, Integer heartRate, Integer spo2, Integer signalQuality,
                             Double accelX, Double accelY, Double accelZ, Double accelMagnitude,
                             String deviceState, String operatingMode, Integer countdownSec) {
        this.deviceIdentifier = deviceIdentifier;
        this.heartRate = heartRate;
        this.spo2 = spo2;
        this.signalQuality = signalQuality;
        this.accelX = accelX;
        this.accelY = accelY;
        this.accelZ = accelZ;
        this.accelMagnitude = accelMagnitude;
        this.deviceState = deviceState;
        this.operatingMode = operatingMode;
        this.countdownSec = countdownSec;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDeviceIdentifier() { return deviceIdentifier; }
    public void setDeviceIdentifier(String deviceIdentifier) { this.deviceIdentifier = deviceIdentifier; }

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

    public String getDeviceState() { return deviceState; }
    public void setDeviceState(String deviceState) { this.deviceState = deviceState; }

    public String getOperatingMode() { return operatingMode; }
    public void setOperatingMode(String operatingMode) { this.operatingMode = operatingMode; }

    public Integer getCountdownSec() { return countdownSec; }
    public void setCountdownSec(Integer countdownSec) { this.countdownSec = countdownSec; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

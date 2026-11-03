package net.vvit.csptriage.domain.model

data class TelemetryData(
    val state: AccidentState,
    val mode: OperatingMode,
    val sensors: SensorAvailability,
    val heartRateBpm: Int?, // null when sensor is absent or no pulse detected. NEVER default to 0.
    val spo2Percent: Int?,  // null when sensor is absent or invalid. NEVER default to 0.
    val signalQualityPercent: Int,
    val accelX: Float,      // Acceleration in m/s^2 (scaled from firmware int16)
    val accelY: Float,      // Acceleration in m/s^2
    val accelZ: Float,      // Acceleration in m/s^2
    val accelMagnitude: Float, // Total vector magnitude |A| in g
    val countdownRemainingSeconds: Int,
    val sequenceNumber: Int,
    val timestampMillis: Long = System.currentTimeMillis()
) {
    val isStale: Boolean
        get() = (System.currentTimeMillis() - timestampMillis) > 3000L
}

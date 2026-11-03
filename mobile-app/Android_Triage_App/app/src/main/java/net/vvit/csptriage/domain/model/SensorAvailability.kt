package net.vvit.csptriage.domain.model

data class SensorAvailability(
    val isHeartRateAvailable: Boolean,
    val isSpO2Available: Boolean,
    val isAccelerometerAvailable: Boolean,
    val isFingerDetected: Boolean,
    val isSimulationMode: Boolean = false
) {
    companion object {
        fun fromFlags(flags: Int): SensorAvailability {
            return SensorAvailability(
                isHeartRateAvailable = (flags and (1 shl 0)) != 0,
                isSpO2Available = (flags and (1 shl 1)) != 0,
                isAccelerometerAvailable = (flags and (1 shl 2)) != 0,
                isFingerDetected = (flags and (1 shl 3)) != 0,
                isSimulationMode = (flags and (1 shl 7)) != 0
            )
        }

        val ALL_UNAVAILABLE = SensorAvailability(
            isHeartRateAvailable = false,
            isSpO2Available = false,
            isAccelerometerAvailable = false,
            isFingerDetected = false,
            isSimulationMode = false
        )
    }
}

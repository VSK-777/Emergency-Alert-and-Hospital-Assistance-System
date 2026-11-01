package net.vvit.csp.wear.state

/**
 * Application-level state machine for the Emergency Watch.
 *
 * Community Service Project — VVIT CSE Batch 8.
 */
sealed class AppState {
    /** App is starting, checking permissions and sensor availability. */
    data object Initializing : AppState()

    /** Required permissions not yet granted. */
    data class PermissionRequired(val missing: List<String>) : AppState()

    /** Required sensor hardware is not available on this device. */
    data object SensorUnavailable : AppState()

    /** Sensors are registered and continuously monitoring. */
    data object MonitoringActive : AppState()

    /** Monitoring has been paused by the user. */
    data object MonitoringPaused : AppState()

    /** A potential accident has been detected by the sensor pipeline. */
    data class PossibleAccident(
        val incidentId: String,
        val reason: String,
        val peakAccelG: Float,
        val peakGyroRadS: Float,
        val riskScore: Float,
        val isSimulated: Boolean = false
    ) : AppState()

    /** Countdown timer is active — waiting for user response. */
    data class CountdownActive(
        val incidentId: String,
        val secondsRemaining: Int,
        val isSimulated: Boolean = false
    ) : AppState()

    /** User cancelled the alert — they are okay. */
    data class UserCancelled(val incidentId: String) : AppState()

    /** Emergency confirmed — incident saved and being transmitted. */
    data class EmergencyConfirmed(val incidentId: String) : AppState()
}

/**
 * Origin of an incident — distinguishes real sensor events from simulated tests.
 */
enum class IncidentOrigin {
    /** Detected by actual accelerometer/gyroscope sensor data. */
    SENSOR,
    /** User pressed the Manual SOS button. */
    MANUAL_SOS,
    /** Developer test — simulated fall event. */
    SIMULATED
}

/**
 * Connectivity state between the watch and the paired phone.
 */
enum class PhoneConnectionState {
    CONNECTED,
    DISCONNECTED,
    CHECKING,
    UNKNOWN
}

/**
 * Sensor availability on the current device.
 */
data class SensorStatus(
    val hasAccelerometer: Boolean = false,
    val hasGyroscope: Boolean = false,
    val isListening: Boolean = false
) {
    val isAvailable: Boolean get() = hasAccelerometer
    val isFullCapability: Boolean get() = hasAccelerometer && hasGyroscope
    val statusText: String get() = when {
        !hasAccelerometer -> "Motion sensor unavailable"
        !hasGyroscope -> "Accelerometer only (limited)"
        isListening -> "Motion sensors active"
        else -> "Sensors available"
    }
}

package net.vvit.csp.wear.storage

data class WatchIncident(
    val id: String,
    val timestampMs: Long,
    val detectionReason: String,
    val detectionScore: Float,
    val userConfirmationState: String, // PENDING_COUNTDOWN, CONFIRMED, CANCELLED
    val deliveryState: String, // SAVED_LOCALLY, DELIVERED_TO_PHONE, FAILED
    val peakAccelG: Float,
    val peakGyroRadS: Float,
    val origin: String = "SENSOR", // SENSOR, MANUAL_SOS, SIMULATED
    val isSimulated: Boolean = false
)

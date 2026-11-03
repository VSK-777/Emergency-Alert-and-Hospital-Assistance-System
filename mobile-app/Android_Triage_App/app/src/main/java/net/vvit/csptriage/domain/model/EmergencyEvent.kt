package net.vvit.csptriage.domain.model

data class EmergencyEvent(
    val eventId: Long,
    val state: AccidentState,
    val mode: OperatingMode,
    val peakAccelG: Float,
    val stillnessSeconds: Float,
    val heartRateBpm: Int?,
    val spo2Percent: Int?,
    val timestampSeconds: Long,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val locationAccuracyMeters: Float? = null,
    val notificationStatus: NotificationStatus = NotificationStatus.PENDING,
    val createdAtMillis: Long = System.currentTimeMillis()
)

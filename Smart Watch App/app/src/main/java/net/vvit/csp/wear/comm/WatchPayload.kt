package net.vvit.csp.wear.comm

import org.json.JSONObject

data class WatchPayload(
    val schemaVersion: String = "1.0.0",
    val incidentId: String,
    val eventTimestampMs: Long,
    val detectionReason: String,
    val detectionScore: Float,
    val userConfirmationState: String, // CONFIRMED, CANCELLED
    val peakAccelG: Float,
    val peakGyroRadS: Float,
    val origin: String = "SENSOR",
    val isSimulated: Boolean = false
) {
    fun toJsonString(): String {
        return JSONObject().apply {
            put("schemaVersion", schemaVersion)
            put("incidentId", incidentId)
            put("eventTimestampMs", eventTimestampMs)
            put("detectionReason", detectionReason)
            put("detectionScore", detectionScore.toDouble())
            put("userConfirmationState", userConfirmationState)
            put("peakAccelG", peakAccelG.toDouble())
            put("peakGyroRadS", peakGyroRadS.toDouble())
            put("origin", origin)
            put("isSimulated", isSimulated)
        }.toString()
    }

    companion object {
        fun fromJsonString(jsonStr: String): WatchPayload {
            val obj = JSONObject(jsonStr)
            return WatchPayload(
                schemaVersion = obj.optString("schemaVersion", "1.0.0"),
                incidentId = obj.getString("incidentId"),
                eventTimestampMs = obj.getLong("eventTimestampMs"),
                detectionReason = obj.getString("detectionReason"),
                detectionScore = obj.getDouble("detectionScore").toFloat(),
                userConfirmationState = obj.getString("userConfirmationState"),
                peakAccelG = obj.optDouble("peakAccelG", 1.0).toFloat(),
                peakGyroRadS = obj.optDouble("peakGyroRadS", 0.0).toFloat(),
                origin = obj.optString("origin", "SENSOR"),
                isSimulated = obj.optBoolean("isSimulated", false)
            )
        }
    }
}

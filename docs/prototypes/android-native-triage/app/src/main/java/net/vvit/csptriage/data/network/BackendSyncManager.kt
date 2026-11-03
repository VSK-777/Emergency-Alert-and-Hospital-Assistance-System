package net.vvit.csptriage.data.network

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import net.vvit.csptriage.data.location.LocationResult
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.TelemetryData
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.format.DateTimeFormatter

class BackendSyncManager(private val context: Context) {

    companion object {
        private const val TAG = "BackendSyncManager"
        private const val PREFS_NAME = "csp_triage_network_prefs"
        private const val KEY_BACKEND_URL = "backend_url"
        private const val KEY_CITIZEN_EMAIL = "citizen_email"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_TOKEN = "device_token"

        const val DEFAULT_BACKEND_URL = "https://emergency-alert-and-hospital-assistance.onrender.com"
        const val DEFAULT_CITIZEN_EMAIL = "patient.vsk@vvit.net"
        const val DEFAULT_DEVICE_ID = "CSP-Triage-V1"
        const val DEFAULT_DEVICE_TOKEN = "dvt_esp32_triage_v1_secure_key"
    }

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private var lastTelemetrySyncTime = 0L

    var backendBaseUrl: String
        get() = prefs.getString(KEY_BACKEND_URL, DEFAULT_BACKEND_URL) ?: DEFAULT_BACKEND_URL
        set(value) = prefs.edit().putString(KEY_BACKEND_URL, value.trim().trimEnd('/')).apply()

    var citizenEmail: String
        get() = prefs.getString(KEY_CITIZEN_EMAIL, DEFAULT_CITIZEN_EMAIL) ?: DEFAULT_CITIZEN_EMAIL
        set(value) = prefs.edit().putString(KEY_CITIZEN_EMAIL, value.trim()).apply()

    var deviceId: String
        get() = prefs.getString(KEY_DEVICE_ID, DEFAULT_DEVICE_ID) ?: DEFAULT_DEVICE_ID
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value.trim()).apply()

    var deviceToken: String
        get() = prefs.getString(KEY_DEVICE_TOKEN, DEFAULT_DEVICE_TOKEN) ?: DEFAULT_DEVICE_TOKEN
        set(value) = prefs.edit().putString(KEY_DEVICE_TOKEN, value.trim()).apply()

    /**
     * Sends an authenticated emergency trauma incident to Spring Boot REST API
     */
    suspend fun syncEmergencyIncident(
        event: EmergencyEvent,
        location: LocationResult.Success?
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val urlString = "$backendBaseUrl/api/v1/emergencies"
            val url = URL(urlString)
            val connection = url.openConnection() as HttpURLConnection
            val currentDeviceId = deviceId
            val currentDeviceToken = deviceToken

            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("X-Device-Id", currentDeviceId)
            connection.setRequestProperty("X-Device-Token", currentDeviceToken)
            connection.connectTimeout = 8000
            connection.readTimeout = 8000
            connection.doOutput = true

            val lat = location?.latitude ?: event.latitude ?: 16.3456
            val lon = location?.longitude ?: event.longitude ?: 80.5234
            val acc = location?.accuracyMeters ?: event.locationAccuracyMeters ?: 10.0f

            val isoReceivedAt = DateTimeFormatter.ISO_INSTANT.format(Instant.ofEpochMilli(event.createdAtMillis))

            val detectionEventObj = JSONObject().apply {
                put("eventType", "ESP32_TRAUMA_EVENT")
                put("accelerationMagnitude", event.peakAccelG.toDouble())
                put("postImpactInactivitySec", event.stillnessSeconds.toInt())
                put("deviceUptimeSeconds", event.timestampSeconds)
                put("mobileReceivedAt", isoReceivedAt)
                val rawJson = JSONObject().apply {
                    put("eventId", event.eventId)
                    put("deviceUptimeSeconds", event.timestampSeconds)
                    put("mobileReceivedAt", event.createdAtMillis)
                    put("heartRate", event.heartRateBpm)
                    put("spo2", event.spo2Percent)
                    put("peakAccelG", event.peakAccelG)
                    put("stillnessSec", event.stillnessSeconds)
                    put("operatingMode", event.mode.name)
                    put("hardwareDevice", currentDeviceId)
                }
                put("rawTelemetryJson", rawJson.toString())
            }

            val payload = JSONObject().apply {
                put("id", "ESP32-EVT-${event.eventId}-${event.createdAtMillis}")
                put("idempotencyKey", "$currentDeviceId-${event.eventId}-${event.createdAtMillis}")
                put("source", "ESP32_HARDWARE")
                put("latitude", lat)
                put("longitude", lon)
                put("accuracyMeters", acc.toDouble())
                put("deviceIdentifier", currentDeviceId)
                put("deviceToken", currentDeviceToken)
                put("userEmail", citizenEmail)
                put("locationTimestamp", isoReceivedAt)
                put("detectionReason", "ESP32 Hardware Triage: ${event.state.displayName} (Peak: ${event.peakAccelG}g)")
                put("detectionScore", event.peakAccelG.toDouble())
                put("detectionEvent", detectionEventObj)
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(payload.toString())
                writer.flush()
            }

            val responseCode = connection.responseCode
            val isSuccess = responseCode in 200..299
            Log.i(TAG, "Emergency Incident #${event.eventId} sync status: HTTP $responseCode (Success: $isSuccess)")
            connection.disconnect()
            isSuccess
        } catch (ex: Exception) {
            Log.w(TAG, "Failed to sync emergency incident #${event.eventId} to backend: ${ex.message}")
            false
        }
    }

    /**
     * Sends live ESP32 telemetry packet to Spring Boot backend
     * Throttled to at most once per 1.5 seconds unless emergency countdown is active.
     */
    suspend fun syncTelemetry(telemetry: TelemetryData): Boolean = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val isEmergency = telemetry.countdownRemainingSeconds > 0 ||
                          telemetry.state.name == "EMERGENCY_ALERT" ||
                          telemetry.state.name == "COUNTDOWN"

        if (!isEmergency && (now - lastTelemetrySyncTime) < 1500) {
            return@withContext false
        }
        lastTelemetrySyncTime = now

        try {
            val urlString = "$backendBaseUrl/api/v1/devices/telemetry"
            val url = URL(urlString)
            val connection = url.openConnection() as HttpURLConnection
            val currentDeviceId = deviceId
            val currentDeviceToken = deviceToken

            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("X-Device-Id", currentDeviceId)
            connection.setRequestProperty("X-Device-Token", currentDeviceToken)
            connection.connectTimeout = 4000
            connection.readTimeout = 4000
            connection.doOutput = true

            val payload = JSONObject().apply {
                put("deviceIdentifier", currentDeviceId)
                put("deviceState", telemetry.state.name)
                put("operatingMode", telemetry.mode.name)
                if (telemetry.heartRateBpm != null) put("heartRate", telemetry.heartRateBpm)
                if (telemetry.spo2Percent != null) put("spo2", telemetry.spo2Percent)
                put("signalQuality", telemetry.signalQualityPercent)
                put("accelX", telemetry.accelX.toDouble())
                put("accelY", telemetry.accelY.toDouble())
                put("accelZ", telemetry.accelZ.toDouble())
                put("accelMagnitude", telemetry.accelMagnitude.toDouble())
                put("countdownSec", telemetry.countdownRemainingSeconds)
                put("timestampMillis", telemetry.timestampMillis)
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(payload.toString())
                writer.flush()
            }

            val responseCode = connection.responseCode
            connection.disconnect()
            responseCode in 200..299
        } catch (ex: Exception) {
            // Silently ignore telemetry drop when offline
            false
        }
    }
}

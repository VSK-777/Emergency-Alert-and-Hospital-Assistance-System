package net.vvit.csp.wear.comm

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.google.android.gms.wearable.Wearable
import net.vvit.csp.wear.state.PhoneConnectionState
import net.vvit.csp.wear.storage.LocalWatchStore
import net.vvit.csp.wear.storage.WatchIncident
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class PhoneSyncManager(private val context: Context) {
    private val localStore = LocalWatchStore(context)
    private val mainHandler = Handler(Looper.getMainLooper())

    companion object {
        const val EMERGENCY_MESSAGE_PATH = "/vvit/emergency/accident_event"
    }

    /**
     * Checks if paired phone or any companion node is currently connected.
     */
    fun checkConnection(callback: (PhoneConnectionState, String?) -> Unit) {
        try {
            val nodeClient = Wearable.getNodeClient(context)
            nodeClient.connectedNodes
                .addOnSuccessListener { nodes ->
                    if (nodes.isNotEmpty()) {
                        val primaryNode = nodes.first()
                        callback(PhoneConnectionState.CONNECTED, primaryNode.displayName)
                    } else {
                        callback(PhoneConnectionState.DISCONNECTED, null)
                    }
                }
                .addOnFailureListener {
                    callback(PhoneConnectionState.DISCONNECTED, null)
                }
        } catch (_: Exception) {
            callback(PhoneConnectionState.UNKNOWN, null)
        }
    }

    /**
     * Dispatches incident to Cloud Backend API (POST /api/v1/emergencies)
     * and Bluetooth Wearable Data Layer simultaneously.
     * Web app & Mobile app are notified instantly via backend SSE broadcast.
     */
    fun transmitIncident(incident: WatchIncident, onResult: (Boolean, String) -> Unit) {
        thread {
            var cloudSuccess = false
            var phoneBluetoothSuccess = false
            var message = ""

            // 1. Direct Cloud REST API dispatch
            try {
                cloudSuccess = postToCloudBackend(incident)
            } catch (ex: Exception) {
                cloudSuccess = false
            }

            // 2. Bluetooth Companion Data Layer dispatch (if paired phone node available)
            try {
                val nodeClient = Wearable.getNodeClient(context)
                val messageClient = Wearable.getMessageClient(context)
                val nodesTask = nodeClient.connectedNodes
                val nodes = com.google.android.gms.tasks.Tasks.await(nodesTask)

                if (nodes.isNotEmpty()) {
                    val payload = WatchPayload(
                        incidentId = incident.id,
                        eventTimestampMs = incident.timestampMs,
                        detectionReason = incident.detectionReason,
                        detectionScore = incident.detectionScore,
                        userConfirmationState = incident.userConfirmationState,
                        peakAccelG = incident.peakAccelG,
                        peakGyroRadS = incident.peakGyroRadS,
                        origin = incident.origin,
                        isSimulated = incident.isSimulated
                    )
                    val payloadBytes = payload.toJsonString().toByteArray(Charsets.UTF_8)
                    for (node in nodes) {
                        try {
                            val sendTask = messageClient.sendMessage(node.id, EMERGENCY_MESSAGE_PATH, payloadBytes)
                            com.google.android.gms.tasks.Tasks.await(sendTask)
                            phoneBluetoothSuccess = true
                        } catch (_: Exception) {}
                    }
                }
            } catch (_: Exception) {
                // Wearable API unavailable or standalone mode
            }

            val isDelivered = cloudSuccess || phoneBluetoothSuccess
            if (isDelivered) {
                localStore.markDelivered(incident.id)
                message = when {
                    cloudSuccess && phoneBluetoothSuccess -> "Delivered to Phone & Cloud (Web Notified)"
                    cloudSuccess -> "Dispatched to Cloud (Web & Phone Notified)"
                    else -> "Delivered to Paired Phone"
                }
            } else {
                message = "Network offline. Saved locally on watch."
            }

            mainHandler.post {
                onResult(isDelivered, message)
            }
        }
    }

    private fun postToCloudBackend(incident: WatchIncident): Boolean {
        // 10.0.2.2 points to host machine loopback inside Android/Wear OS emulator
        val candidateUrls = listOf(
            "http://10.0.2.2:8080/api/v1/emergencies",
            "http://127.0.0.1:8080/api/v1/emergencies"
        )
        val sourceStr = if (incident.origin.contains("SOS", ignoreCase = true)) "SMARTWATCH_SOS" else "SMARTWATCH_AUTO"
        val reasonClean = incident.detectionReason.replace("\"", "\\\"")
        val jsonPayload = """
            {
                "source": "$sourceStr",
                "latitude": 16.3567,
                "longitude": 80.5253,
                "accuracyMeters": 4.5,
                "detectionReason": "$reasonClean",
                "detectionScore": ${incident.detectionScore}
            }
        """.trimIndent()

        for (urlString in candidateUrls) {
            var conn: HttpURLConnection? = null
            try {
                val url = URL(urlString)
                conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 3500
                conn.readTimeout = 3500
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.setRequestProperty("Accept", "application/json")
                conn.doOutput = true

                val bytes = jsonPayload.toByteArray(Charsets.UTF_8)
                conn.setFixedLengthStreamingMode(bytes.size)
                conn.outputStream.use { os ->
                    os.write(bytes)
                    os.flush()
                }

                val responseCode = conn.responseCode
                if (responseCode in 200..299) {
                    return true
                }
            } catch (_: Exception) {
                // Try next endpoint candidate
            } finally {
                conn?.disconnect()
            }
        }
        return false
    }
}

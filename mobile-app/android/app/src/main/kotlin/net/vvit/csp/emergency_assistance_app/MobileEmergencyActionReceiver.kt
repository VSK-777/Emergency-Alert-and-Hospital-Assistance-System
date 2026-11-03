package net.vvit.csp.emergency_assistance_app

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Handles action button presses directly on the Android system emergency notification shade.
 */
class MobileEmergencyActionReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_CANCEL_EMERGENCY = "net.vvit.csp.emergency.action.CANCEL_EMERGENCY"
        const val ACTION_ESCALATE_EMERGENCY = "net.vvit.csp.emergency.action.ESCALATE_EMERGENCY"
        const val ACTION_TRIGGER_TEST_NOTIFICATION = "net.vvit.csp.emergency.action.TRIGGER_TEST_NOTIFICATION"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return

        if (action == ACTION_TRIGGER_TEST_NOTIFICATION) {
            val incidentId = intent.getStringExtra("incidentId") ?: "sim-mob-${System.currentTimeMillis()}"
            val reason = intent.getStringExtra("detectionReason") ?: "Sudden high-impact fall with rotational acceleration"
            val peakG = intent.getDoubleExtra("peakAccelG", 3.85)
            WearMessageListenerService.showNotification(context, incidentId, reason, peakG)
            return
        }

        val incidentId = intent.getStringExtra("incidentId") ?: return

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        notificationManager?.cancel(incidentId.hashCode())

        when (action) {
            ACTION_CANCEL_EMERGENCY -> {
                thread {
                    postCancellationToBackend(incidentId)
                }
                Handler(Looper.getMainLooper()).post {
                    Toast.makeText(context, "Safety Confirmed — Emergency Cancelled", Toast.LENGTH_LONG).show()
                }
            }

            ACTION_ESCALATE_EMERGENCY -> {
                thread {
                    postEscalationToBackend(incidentId)
                }
                Handler(Looper.getMainLooper()).post {
                    Toast.makeText(context, "Emergency Escalated — Responders & Hospital Alerted", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun postCancellationToBackend(incidentId: String) {
        val endpoints = listOf(
            "https://emergency-alert-and-hospital-assistance.onrender.com/api/v1/emergencies/$incidentId/cancel",
            "http://10.0.2.2:8080/api/v1/emergencies/$incidentId/cancel"
        )
        for (endpoint in endpoints) {
            try {
                val url = URL(endpoint)
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 3000
                conn.readTimeout = 3000
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.responseCode
                conn.disconnect()
                break
            } catch (_: Exception) {}
        }
    }

    private fun postEscalationToBackend(incidentId: String) {
        val endpoints = listOf(
            "https://emergency-alert-and-hospital-assistance.onrender.com/api/v1/emergencies",
            "http://10.0.2.2:8080/api/v1/emergencies"
        )
        val payload = """
            {
                "id": "$incidentId",
                "source": "MOBILE_SOS",
                "detectionReason": "Explicit SOS help requested from phone emergency notification",
                "detectionScore": 1.0,
                "latitude": 16.3567,
                "longitude": 80.5253,
                "userEmail": "vajjhasaikrishna@gmail.com"
            }
        """.trimIndent()

        for (endpoint in endpoints) {
            try {
                val url = URL(endpoint)
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 3000
                conn.readTimeout = 3000
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                val bytes = payload.toByteArray(Charsets.UTF_8)
                conn.outputStream.use { it.write(bytes) }
                conn.responseCode
                conn.disconnect()
                break
            } catch (_: Exception) {}
        }
    }
}

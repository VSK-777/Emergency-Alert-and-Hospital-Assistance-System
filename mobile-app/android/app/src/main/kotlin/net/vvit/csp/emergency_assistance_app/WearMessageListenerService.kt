package net.vvit.csp.emergency_assistance_app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject
import java.util.Collections
import java.util.LinkedHashMap

/**
 * Native companion service on Android phone that receives Wearable Data Layer
 * emergency accident alerts dispatched directly from the Wear OS smartwatch over Bluetooth/Wi-Fi.
 *
 * Community Service Project — VVIT CSE Batch 8.
 */
class WearMessageListenerService : WearableListenerService() {

    companion object {
        const val EMERGENCY_PATH = "/vvit/emergency/accident_event"
        const val CHANNEL_ID = "emergency_alerts"
        const val CHANNEL_NAME = "Emergency Alerts"

        // Deduplication cache to prevent duplicate notifications (retaining last 50 incident IDs)
        private val recentIncidents = Collections.synchronizedMap(
            object : LinkedHashMap<String, Long>(50, 0.75f, true) {
                override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Long>?): Boolean {
                    return size > 50
                }
            }
        )

        fun isDuplicate(incidentId: String): Boolean {
            val now = System.currentTimeMillis()
            val lastSeen = recentIncidents[incidentId]
            if (lastSeen != null && (now - lastSeen) < 60_000L) {
                return true
            }
            recentIncidents[incidentId] = now
            return false
        }

        fun showNotification(
            context: Context,
            incidentId: String,
            reason: String,
            peakAccelG: Double
        ) {
            // 1. Deduplication check
            if (isDuplicate(incidentId)) {
                return
            }

            // 2. Ensure high importance notification channel is registered
            createEmergencyNotificationChannel(context)

            // 3. Post native high-priority Android notification
            showNativeEmergencyNotification(context, incidentId, reason, peakAccelG)
        }

        private fun createEmergencyNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val existing = notificationManager.getNotificationChannel(CHANNEL_ID)
                if (existing == null) {
                    val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                    val audioAttributes = AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                        .build()

                    val channel = NotificationChannel(
                        CHANNEL_ID,
                        CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                    ).apply {
                        description = "Urgent automatic accident and crash alerts from Wear OS companion device"
                        enableLights(true)
                        enableVibration(true)
                        vibrationPattern = longArrayOf(0, 500, 250, 500, 250, 1000)
                        setSound(soundUri, audioAttributes)
                        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                    }
                    notificationManager.createNotificationChannel(channel)
                }
            }
        }

        private fun showNativeEmergencyNotification(
            context: Context,
            incidentId: String,
            reason: String,
            peakAccelG: Double
        ) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Tapping notification or VIEW SAFETY CHECK navigates directly to safety check in Flutter app
            val contentIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("route", "/sos")
                putExtra("incidentId", incidentId)
                putExtra("detectionReason", reason)
            }
            val contentPendingIntent = PendingIntent.getActivity(
                context,
                incidentId.hashCode(),
                contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Action 1: "I'M OK"
            val okIntent = Intent(context, MobileEmergencyActionReceiver::class.java).apply {
                action = MobileEmergencyActionReceiver.ACTION_CANCEL_EMERGENCY
                putExtra("incidentId", incidentId)
            }
            val okPendingIntent = PendingIntent.getBroadcast(
                context,
                (incidentId + "_ok").hashCode(),
                okIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Action 2: "NEED HELP"
            val helpIntent = Intent(context, MobileEmergencyActionReceiver::class.java).apply {
                action = MobileEmergencyActionReceiver.ACTION_ESCALATE_EMERGENCY
                putExtra("incidentId", incidentId)
            }
            val helpPendingIntent = PendingIntent.getBroadcast(
                context,
                (incidentId + "_help").hashCode(),
                helpIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val vibrationPattern = longArrayOf(0, 500, 250, 500, 250, 1000)

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("🚨 Possible Accident Detected")
                .setContentText("Your smartwatch detected a possible accident. Please confirm your safety immediately.")
                .setStyle(
                    NotificationCompat.BigTextStyle().bigText(
                        "Your smartwatch detected a possible accident: $reason (Force: ${String.format("%.2f", peakAccelG)}g). Please confirm your safety immediately."
                    )
                )
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setSound(soundUri)
                .setVibrate(vibrationPattern)
                .setContentIntent(contentPendingIntent)
                .addAction(0, "I'M OK", okPendingIntent)
                .addAction(0, "NEED HELP", helpPendingIntent)
                .addAction(0, "VIEW SAFETY CHECK", contentPendingIntent)
                .build()

            val notificationId = incidentId.hashCode()
            notificationManager.notify(notificationId, notification)
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path == EMERGENCY_PATH) {
            val rawBytes = messageEvent.data
            val jsonString = String(rawBytes, Charsets.UTF_8)
            handleEmergencyMessage(jsonString)
        }
    }

    private fun handleEmergencyMessage(jsonString: String) {
        try {
            val json = JSONObject(jsonString)
            val incidentId = json.optString("incidentId", "unknown-${System.currentTimeMillis()}")
            val reason = json.optString("detectionReason", "Possible accident detected")
            val peakAccelG = json.optDouble("peakAccelG", 2.8)

            showNotification(this, incidentId, reason, peakAccelG)
        } catch (_: Exception) {}
    }
}

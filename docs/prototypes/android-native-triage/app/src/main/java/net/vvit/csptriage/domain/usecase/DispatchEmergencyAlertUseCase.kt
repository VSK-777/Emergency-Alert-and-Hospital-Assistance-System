package net.vvit.csptriage.domain.usecase

import android.content.Context
import android.content.Intent
import android.net.Uri
import net.vvit.csptriage.data.location.LocationResult
import net.vvit.csptriage.domain.model.EmergencyContact
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.NotificationStatus
import net.vvit.csptriage.domain.repository.ContactRepository
import net.vvit.csptriage.domain.repository.TriageRepository
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DispatchEmergencyAlertUseCase(
    private val triageRepository: TriageRepository,
    private val contactRepository: ContactRepository,
    private val backendSyncManager: net.vvit.csptriage.data.network.BackendSyncManager? = null
) {
    suspend fun prepareAlertMessage(event: EmergencyEvent): Triple<String, Double?, Double?> {
        val locationResult = triageRepository.getCurrentLocation()
        var lat: Double? = null
        var lon: Double? = null
        var acc: Float? = null

        if (locationResult is LocationResult.Success) {
            lat = locationResult.latitude
            lon = locationResult.longitude
            acc = locationResult.accuracyMeters
        }

        val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        val dateString = dateFormat.format(Date(event.createdAtMillis))

        val hrText = event.heartRateBpm?.let { "$it BPM" } ?: "Unavailable"
        val spo2Text = event.spo2Percent?.let { "$it%" } ?: "Unavailable"

        val locationBlock = if (lat != null && lon != null) {
            "Location: $lat, $lon (±${acc?.toInt() ?: 0}m)\nMap: https://www.google.com/maps/search/?api=1&query=$lat,$lon"
        } else {
            "Location: GPS Unavailable / Acquiring"
        }

        val text = """
            🚨 EMERGENCY TRAUMA ALERT — CSP TRIAGE
            Event ID: #${event.eventId}
            Mode: ${event.mode.displayName}
            State: ${event.state.displayName}
            Timestamp: $dateString

            [PATIENT VITALS]
            Heart Rate: $hrText
            Blood Oxygen (SpO2): $spo2Text
            Peak Impact: ${event.peakAccelG}g
            Post-Impact Inactivity: ${event.stillnessSeconds}s

            [COORDINATES]
            $locationBlock

            Immediate medical assistance and ambulance dispatch required.
        """.trimIndent()

        // Update event record with acquired location
        val updatedEvent = event.copy(
            latitude = lat,
            longitude = lon,
            locationAccuracyMeters = acc
        )
        triageRepository.insertEmergencyEvent(updatedEvent)

        // Automatically upload verified trauma incident to Spring Boot Cloud API
        backendSyncManager?.let { sync ->
            val synced = sync.syncEmergencyIncident(updatedEvent, locationResult as? LocationResult.Success)
            if (synced) {
                triageRepository.updateNotificationStatus(event.eventId, NotificationStatus.DELIVERED)
            }
        }

        return Triple(text, lat, lon)
    }

    fun dispatchSms(context: Context, contact: EmergencyContact, messageText: String, eventId: Long) {
        try {
            val intent = Intent(Intent.ACTION_SENDTO).apply {
                data = Uri.parse("smsto:${contact.phoneNumber}")
                putExtra("sms_body", messageText)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            triageRepository.updateNotificationStatus(eventId, NotificationStatus.INITIATED)
        } catch (_: Exception) {
            triageRepository.updateNotificationStatus(eventId, NotificationStatus.FAILED)
        }
    }

    fun dispatchWhatsApp(context: Context, contact: EmergencyContact, messageText: String, eventId: Long) {
        try {
            val cleanPhone = contact.phoneNumber.replace("[^0-9]".toRegex(), "")
            val url = "https://api.whatsapp.com/send?phone=$cleanPhone&text=${Uri.encode(messageText)}"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            triageRepository.updateNotificationStatus(eventId, NotificationStatus.INITIATED)
        } catch (_: Exception) {
            triageRepository.updateNotificationStatus(eventId, NotificationStatus.FAILED)
        }
    }
}

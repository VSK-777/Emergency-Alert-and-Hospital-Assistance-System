package net.vvit.csptriage.domain.usecase

import net.vvit.csptriage.data.ble.CommandResult
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.NotificationStatus
import net.vvit.csptriage.domain.model.OperatingMode
import net.vvit.csptriage.domain.repository.TriageRepository

class CancelEmergencyCountdownUseCase(private val repository: TriageRepository) {

    suspend fun cancelCountdown(currentEvent: EmergencyEvent?): Pair<Boolean, String> {
        val result = repository.sendCancelAlert()

        // Create or update cancelled event in history
        val cancelledEvent = currentEvent?.copy(
            state = AccidentState.CANCELLED,
            notificationStatus = NotificationStatus.UNCONFIRMED
        ) ?: EmergencyEvent(
            eventId = System.currentTimeMillis() / 1000,
            state = AccidentState.CANCELLED,
            mode = OperatingMode.REAL,
            peakAccelG = 0f,
            stillnessSeconds = 0f,
            heartRateBpm = null,
            spo2Percent = null,
            timestampSeconds = System.currentTimeMillis() / 1000,
            notificationStatus = NotificationStatus.UNCONFIRMED
        )

        repository.insertEmergencyEvent(cancelledEvent)

        return when (result) {
            is CommandResult.Success -> Pair(true, "Remote cancellation acknowledged by ESP32 firmware.")
            is CommandResult.Failure -> Pair(false, "Remote command rejected by firmware: ${result.reason}")
            is CommandResult.NotConnected -> Pair(false, "ESP32 disconnected. Event cancelled locally on phone.")
        }
    }
}

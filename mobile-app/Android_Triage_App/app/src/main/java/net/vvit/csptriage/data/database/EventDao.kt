package net.vvit.csptriage.data.database

import kotlinx.coroutines.flow.Flow
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.NotificationStatus
import net.vvit.csptriage.domain.model.OperatingMode

interface EventDao {
    fun insertEvent(event: EmergencyEvent): Long
    fun getAllEvents(): Flow<List<EmergencyEvent>>
    fun getFilteredEvents(mode: OperatingMode?, state: AccidentState?): Flow<List<EmergencyEvent>>
    fun updateNotificationStatus(eventId: Long, status: NotificationStatus)
    fun clearAllEvents()
}

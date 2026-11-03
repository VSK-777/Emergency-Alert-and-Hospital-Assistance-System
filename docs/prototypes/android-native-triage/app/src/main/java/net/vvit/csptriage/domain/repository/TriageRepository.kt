package net.vvit.csptriage.domain.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow
import net.vvit.csptriage.data.ble.BleConnectionState
import net.vvit.csptriage.data.ble.BleDeviceModel
import net.vvit.csptriage.data.ble.CommandResult
import net.vvit.csptriage.data.location.LocationResult
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.NotificationStatus
import net.vvit.csptriage.domain.model.OperatingMode
import net.vvit.csptriage.domain.model.TelemetryData

interface TriageRepository {
    val connectionState: StateFlow<BleConnectionState>
    val latestTelemetry: StateFlow<TelemetryData?>
    val emergencyEvents: Flow<EmergencyEvent>
    val scannedDevices: StateFlow<Map<String, BleDeviceModel>>
    val isScanning: StateFlow<Boolean>
    val isAutoReconnectEnabled: StateFlow<Boolean>

    fun startScanning(targetOnly: Boolean = false)
    fun stopScanning()
    fun connect(deviceModel: BleDeviceModel)
    fun disconnect()
    fun setAutoReconnect(enabled: Boolean)

    suspend fun sendSimToggle(): CommandResult
    suspend fun sendSimImpact(): CommandResult
    suspend fun sendCancelAlert(): CommandResult

    suspend fun getCurrentLocation(): LocationResult

    fun insertEmergencyEvent(event: EmergencyEvent): Long
    fun getAllEvents(): Flow<List<EmergencyEvent>>
    fun getFilteredEvents(mode: OperatingMode?, state: AccidentState?): Flow<List<EmergencyEvent>>
    fun updateNotificationStatus(eventId: Long, status: NotificationStatus)
    fun clearAllEvents()
}

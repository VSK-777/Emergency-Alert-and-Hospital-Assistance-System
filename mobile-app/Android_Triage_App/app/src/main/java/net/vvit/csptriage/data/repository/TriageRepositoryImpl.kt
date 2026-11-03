package net.vvit.csptriage.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow
import net.vvit.csptriage.data.ble.BleConnectionManager
import net.vvit.csptriage.data.ble.BleConnectionState
import net.vvit.csptriage.data.ble.BleDeviceModel
import net.vvit.csptriage.data.ble.CommandResult
import net.vvit.csptriage.data.database.AppDatabase
import net.vvit.csptriage.data.location.LocationProvider
import net.vvit.csptriage.data.location.LocationResult
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.NotificationStatus
import net.vvit.csptriage.domain.model.OperatingMode
import net.vvit.csptriage.domain.model.TelemetryData
import net.vvit.csptriage.domain.repository.TriageRepository

class TriageRepositoryImpl(
    private val bleManager: BleConnectionManager,
    private val database: AppDatabase,
    private val locationProvider: LocationProvider
) : TriageRepository {

    override val connectionState: StateFlow<BleConnectionState> = bleManager.connectionState
    override val latestTelemetry: StateFlow<TelemetryData?> = bleManager.latestTelemetry
    override val emergencyEvents: Flow<EmergencyEvent> = bleManager.emergencyEvents
    override val scannedDevices: StateFlow<Map<String, BleDeviceModel>> = bleManager.scannedDevices
    override val isScanning: StateFlow<Boolean> = bleManager.isScanning
    override val isAutoReconnectEnabled: StateFlow<Boolean> = bleManager.isAutoReconnectEnabled

    override fun startScanning(targetOnly: Boolean) = bleManager.startScanning(targetOnly)
    override fun stopScanning() = bleManager.stopScanning()
    override fun connect(deviceModel: BleDeviceModel) = bleManager.connect(deviceModel.device)
    override fun disconnect() = bleManager.disconnect()
    override fun setAutoReconnect(enabled: Boolean) = bleManager.setAutoReconnect(enabled)

    override suspend fun sendSimToggle(): CommandResult = bleManager.commandManager.sendSimToggle()
    override suspend fun sendSimImpact(): CommandResult = bleManager.commandManager.sendSimImpact()
    override suspend fun sendCancelAlert(): CommandResult = bleManager.commandManager.sendCancelAlert()

    override suspend fun getCurrentLocation(): LocationResult = locationProvider.getCurrentLocation()

    override fun insertEmergencyEvent(event: EmergencyEvent): Long = database.eventDao.insertEvent(event)
    override fun getAllEvents(): Flow<List<EmergencyEvent>> = database.eventDao.getAllEvents()
    override fun getFilteredEvents(mode: OperatingMode?, state: AccidentState?): Flow<List<EmergencyEvent>> =
        database.eventDao.getFilteredEvents(mode, state)
    override fun updateNotificationStatus(eventId: Long, status: NotificationStatus) =
        database.eventDao.updateNotificationStatus(eventId, status)
    override fun clearAllEvents() = database.eventDao.clearAllEvents()
}

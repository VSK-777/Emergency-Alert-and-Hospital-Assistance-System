package net.vvit.csptriage.data.ble

import android.bluetooth.BluetoothDevice
import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.TelemetryData

class BleConnectionManager(
    private val context: Context,
    val scanner: BleScanner,
    val gattManager: BleGattManager,
    val commandManager: BleCommandManager
) {
    private val scope = CoroutineScope(Dispatchers.Main + Job())
    private var reconnectJob: Job? = null

    private var lastConnectedDevice: BluetoothDevice? = null
    private var reconnectAttempts = 0

    private val _isAutoReconnectEnabled = MutableStateFlow(true)
    val isAutoReconnectEnabled: StateFlow<Boolean> = _isAutoReconnectEnabled.asStateFlow()

    val connectionState: StateFlow<BleConnectionState> = gattManager.connectionState
    val latestTelemetry: StateFlow<TelemetryData?> = gattManager.latestTelemetry
    val emergencyEvents: SharedFlow<EmergencyEvent> = gattManager.emergencyEvents
    val scannedDevices: StateFlow<Map<String, BleDeviceModel>> = scanner.scannedDevices
    val isScanning: StateFlow<Boolean> = scanner.isScanning

    init {
        gattManager.onDisconnectedUnexpectedly = {
            if (_isAutoReconnectEnabled.value && lastConnectedDevice != null) {
                scheduleReconnect()
            }
        }
    }

    fun startScanning(targetOnly: Boolean = false) {
        cancelReconnect()
        scanner.startScan(filterTargetOnly = targetOnly)
    }

    fun stopScanning() {
        scanner.stopScan()
    }

    fun connect(device: BluetoothDevice) {
        cancelReconnect()
        scanner.stopScan()
        lastConnectedDevice = device
        reconnectAttempts = 0
        gattManager.connect(device)
    }

    fun disconnect() {
        cancelReconnect()
        scanner.stopScan()
        gattManager.disconnect()
    }

    fun setAutoReconnect(enabled: Boolean) {
        _isAutoReconnectEnabled.value = enabled
        if (!enabled) {
            cancelReconnect()
        }
    }

    private fun scheduleReconnect() {
        cancelReconnect()
        reconnectJob = scope.launch {
            reconnectAttempts++
            val delayMs = (BleConfig.INITIAL_RECONNECT_DELAY_MS * (1 shl (reconnectAttempts - 1).coerceAtMost(4)))
                .coerceAtMost(BleConfig.MAX_RECONNECT_DELAY_MS)

            // Update state
            (gattManager.connectionState as? MutableStateFlow)?.value =
                BleConnectionState.Reconnecting(reconnectAttempts, delayMs)

            delay(delayMs)

            val device = lastConnectedDevice
            if (device != null && _isAutoReconnectEnabled.value) {
                gattManager.connect(device)
            }
        }
    }

    private fun cancelReconnect() {
        reconnectJob?.cancel()
        reconnectJob = null
        reconnectAttempts = 0
    }
}

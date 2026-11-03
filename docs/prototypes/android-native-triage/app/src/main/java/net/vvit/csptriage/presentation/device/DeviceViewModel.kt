package net.vvit.csptriage.presentation.device

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import net.vvit.csptriage.data.ble.BleConnectionState
import net.vvit.csptriage.data.ble.BleDeviceModel
import net.vvit.csptriage.domain.repository.TriageRepository

data class DeviceUiState(
    val connectionState: BleConnectionState = BleConnectionState.Disconnected,
    val scannedDevices: List<BleDeviceModel> = emptyList(),
    val isScanning: Boolean = false,
    val isAutoReconnectEnabled: Boolean = true,
    val statusMessage: String? = null
)

class DeviceViewModel(private val repository: TriageRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(DeviceUiState())
    val uiState: StateFlow<DeviceUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.connectionState.collectLatest { conn ->
                _uiState.value = _uiState.value.copy(connectionState = conn)
            }
        }

        viewModelScope.launch {
            repository.scannedDevices.collectLatest { map ->
                val sorted = map.values.sortedWith(
                    compareByDescending<BleDeviceModel> { it.isTargetDevice }
                        .thenByDescending { it.rssi }
                )
                _uiState.value = _uiState.value.copy(scannedDevices = sorted)
            }
        }

        viewModelScope.launch {
            repository.isScanning.collectLatest { scanning ->
                _uiState.value = _uiState.value.copy(isScanning = scanning)
            }
        }

        viewModelScope.launch {
            repository.isAutoReconnectEnabled.collectLatest { autoRec ->
                _uiState.value = _uiState.value.copy(isAutoReconnectEnabled = autoRec)
            }
        }
    }

    fun startScanning() {
        repository.startScanning(targetOnly = false)
    }

    fun stopScanning() {
        repository.stopScanning()
    }

    fun connectDevice(device: BleDeviceModel) {
        repository.connect(device)
    }

    fun disconnect() {
        repository.disconnect()
    }

    fun toggleAutoReconnect(enabled: Boolean) {
        repository.setAutoReconnect(enabled)
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(statusMessage = null)
    }

    class Factory(private val repository: TriageRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return DeviceViewModel(repository) as T
        }
    }
}

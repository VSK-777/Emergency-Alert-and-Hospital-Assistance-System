package net.vvit.csptriage.presentation.settings

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import net.vvit.csptriage.data.ble.BleConnectionState
import net.vvit.csptriage.data.ble.CommandResult
import net.vvit.csptriage.domain.repository.TriageRepository
import net.vvit.csptriage.domain.usecase.SendSimulationCommandUseCase
import net.vvit.csptriage.permissions.PermissionManager
import net.vvit.csptriage.permissions.PermissionState

data class SettingsUiState(
    val connectionState: BleConnectionState = BleConnectionState.Disconnected,
    val permissions: PermissionState = PermissionState(),
    val soundAlertsEnabled: Boolean = true,
    val vibrationAlertsEnabled: Boolean = true,
    val feedbackMessage: String? = null
)

class SettingsViewModel(
    private val repository: TriageRepository,
    private val sendSimulationCommandUseCase: SendSimulationCommandUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.connectionState.collect { conn ->
                _uiState.value = _uiState.value.copy(connectionState = conn)
            }
        }
    }

    fun checkPermissions(context: Context) {
        val state = PermissionManager.checkPermissionState(context)
        _uiState.value = _uiState.value.copy(permissions = state)
    }

    fun toggleSound(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(soundAlertsEnabled = enabled)
    }

    fun toggleVibration(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(vibrationAlertsEnabled = enabled)
    }

    fun triggerSimToggle() {
        viewModelScope.launch {
            when (val res = sendSimulationCommandUseCase.toggleSimMode()) {
                is CommandResult.Success -> {
                    _uiState.value = _uiState.value.copy(feedbackMessage = "Sent 'SIM' command to firmware")
                }
                is CommandResult.Failure -> {
                    _uiState.value = _uiState.value.copy(feedbackMessage = "Command failed: ${res.reason}")
                }
                is CommandResult.NotConnected -> {
                    _uiState.value = _uiState.value.copy(feedbackMessage = "Cannot send command: ESP32 is not connected")
                }
            }
        }
    }

    fun triggerSimImpact() {
        viewModelScope.launch {
            when (val res = sendSimulationCommandUseCase.triggerSimImpact()) {
                is CommandResult.Success -> {
                    _uiState.value = _uiState.value.copy(feedbackMessage = "Sent 'SIM IMPACT' command to firmware")
                }
                is CommandResult.Failure -> {
                    _uiState.value = _uiState.value.copy(feedbackMessage = "Command failed: ${res.reason}")
                }
                is CommandResult.NotConnected -> {
                    _uiState.value = _uiState.value.copy(feedbackMessage = "Cannot send command: ESP32 is not connected")
                }
            }
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(feedbackMessage = null)
    }

    class Factory(
        private val repository: TriageRepository,
        private val sendSimulationCommandUseCase: SendSimulationCommandUseCase
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return SettingsViewModel(repository, sendSimulationCommandUseCase) as T
        }
    }
}

package net.vvit.csptriage.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import net.vvit.csptriage.data.ble.BleConnectionState
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.OperatingMode
import net.vvit.csptriage.domain.model.TelemetryData
import net.vvit.csptriage.domain.repository.TriageRepository
import net.vvit.csptriage.domain.usecase.CancelEmergencyCountdownUseCase
import net.vvit.csptriage.domain.usecase.GetLiveTelemetryUseCase

data class DashboardUiState(
    val connectionState: BleConnectionState = BleConnectionState.Disconnected,
    val telemetry: TelemetryData? = null,
    val hrHistory: List<Float> = emptyList(),
    val spo2History: List<Float> = emptyList(),
    val cancelFeedbackMessage: String? = null
)

class DashboardViewModel(
    private val triageRepository: TriageRepository,
    private val getLiveTelemetryUseCase: GetLiveTelemetryUseCase,
    private val cancelEmergencyCountdownUseCase: CancelEmergencyCountdownUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val maxHistoryPoints = 25
    private val hrList = ArrayDeque<Float>()
    private val spo2List = ArrayDeque<Float>()

    init {
        // Collect Connection State
        viewModelScope.launch {
            triageRepository.connectionState.collectLatest { conn ->
                _uiState.value = _uiState.value.copy(connectionState = conn)
            }
        }

        // Collect Live Telemetry
        viewModelScope.launch {
            getLiveTelemetryUseCase().collectLatest { data ->
                if (data != null) {
                    if (data.heartRateBpm != null) {
                        if (hrList.size >= maxHistoryPoints) hrList.removeFirst()
                        hrList.add(data.heartRateBpm.toFloat())
                    }
                    if (data.spo2Percent != null) {
                        if (spo2List.size >= maxHistoryPoints) spo2List.removeFirst()
                        spo2List.add(data.spo2Percent.toFloat())
                    }

                    _uiState.value = _uiState.value.copy(
                        telemetry = data,
                        hrHistory = hrList.toList(),
                        spo2History = spo2List.toList()
                    )
                }
            }
        }
    }

    fun cancelActiveCountdown() {
        viewModelScope.launch {
            val (success, msg) = cancelEmergencyCountdownUseCase.cancelCountdown(null)
            _uiState.value = _uiState.value.copy(cancelFeedbackMessage = msg)
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(cancelFeedbackMessage = null)
    }

    class Factory(
        private val triageRepository: TriageRepository,
        private val getLiveTelemetryUseCase: GetLiveTelemetryUseCase,
        private val cancelEmergencyCountdownUseCase: CancelEmergencyCountdownUseCase
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return DashboardViewModel(triageRepository, getLiveTelemetryUseCase, cancelEmergencyCountdownUseCase) as T
        }
    }
}

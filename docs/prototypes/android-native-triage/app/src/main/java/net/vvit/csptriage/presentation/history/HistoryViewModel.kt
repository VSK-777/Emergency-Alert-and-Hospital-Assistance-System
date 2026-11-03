package net.vvit.csptriage.presentation.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.OperatingMode
import net.vvit.csptriage.domain.repository.TriageRepository

data class HistoryUiState(
    val events: List<EmergencyEvent> = emptyList(),
    val selectedModeFilter: OperatingMode? = null,
    val selectedStateFilter: AccidentState? = null
)

class HistoryViewModel(private val repository: TriageRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        loadEvents()
    }

    private fun loadEvents() {
        viewModelScope.launch {
            repository.getAllEvents().collectLatest { allEvents ->
                applyFilters(allEvents, _uiState.value.selectedModeFilter, _uiState.value.selectedStateFilter)
            }
        }
    }

    fun setModeFilter(mode: OperatingMode?) {
        _uiState.value = _uiState.value.copy(selectedModeFilter = mode)
        viewModelScope.launch {
            repository.getAllEvents().collectLatest { all ->
                applyFilters(all, mode, _uiState.value.selectedStateFilter)
            }
        }
    }

    fun setStateFilter(state: AccidentState?) {
        _uiState.value = _uiState.value.copy(selectedStateFilter = state)
        viewModelScope.launch {
            repository.getAllEvents().collectLatest { all ->
                applyFilters(all, _uiState.value.selectedModeFilter, state)
            }
        }
    }

    private fun applyFilters(list: List<EmergencyEvent>, mode: OperatingMode?, state: AccidentState?) {
        var filtered = list
        if (mode != null) {
            filtered = filtered.filter { it.mode == mode }
        }
        if (state != null) {
            filtered = filtered.filter { it.state == state }
        }
        _uiState.value = _uiState.value.copy(events = filtered)
    }

    fun clearHistory() {
        repository.clearAllEvents()
    }

    class Factory(private val repository: TriageRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return HistoryViewModel(repository) as T
        }
    }
}

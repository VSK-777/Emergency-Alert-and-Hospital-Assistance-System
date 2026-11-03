package net.vvit.csptriage.presentation.emergency

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import net.vvit.csptriage.data.location.LocationResult
import net.vvit.csptriage.domain.model.EmergencyContact
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.NotificationStatus
import net.vvit.csptriage.domain.repository.ContactRepository
import net.vvit.csptriage.domain.repository.TriageRepository
import net.vvit.csptriage.domain.usecase.CancelEmergencyCountdownUseCase
import net.vvit.csptriage.domain.usecase.DispatchEmergencyAlertUseCase

data class EmergencyUiState(
    val activeEvent: EmergencyEvent? = null,
    val contacts: List<EmergencyContact> = emptyList(),
    val primaryContact: EmergencyContact? = null,
    val location: LocationResult? = null,
    val isAcquiringLocation: Boolean = false,
    val preparedMessageText: String? = null,
    val statusFeedback: String? = null
)

class EmergencyViewModel(
    private val triageRepository: TriageRepository,
    private val contactRepository: ContactRepository,
    private val dispatchEmergencyAlertUseCase: DispatchEmergencyAlertUseCase,
    private val cancelEmergencyCountdownUseCase: CancelEmergencyCountdownUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(EmergencyUiState())
    val uiState: StateFlow<EmergencyUiState> = _uiState.asStateFlow()

    init {
        // Collect real emergency events from BLE hardware
        viewModelScope.launch {
            triageRepository.emergencyEvents.collectLatest { event ->
                handleIncomingEmergencyEvent(event)
            }
        }

        // Collect emergency contacts
        viewModelScope.launch {
            contactRepository.getAllContacts().collectLatest { contactList ->
                val primary = contactList.firstOrNull { it.isPrimary } ?: contactList.firstOrNull()
                _uiState.value = _uiState.value.copy(
                    contacts = contactList,
                    primaryContact = primary
                )
            }
        }
    }

    private fun handleIncomingEmergencyEvent(event: EmergencyEvent) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                activeEvent = event,
                isAcquiringLocation = true
            )

            // 1. Save event locally
            triageRepository.insertEmergencyEvent(event)

            // 2. Obtain Smartphone GPS
            val loc = triageRepository.getCurrentLocation()
            _uiState.value = _uiState.value.copy(
                location = loc,
                isAcquiringLocation = false
            )

            // 3. Prepare formatted emergency message
            val (msg, _, _) = dispatchEmergencyAlertUseCase.prepareAlertMessage(event)
            _uiState.value = _uiState.value.copy(preparedMessageText = msg)
        }
    }

    fun refreshLocation() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAcquiringLocation = true)
            val loc = triageRepository.getCurrentLocation()
            _uiState.value = _uiState.value.copy(
                location = loc,
                isAcquiringLocation = false
            )
            val current = _uiState.value.activeEvent
            if (current != null) {
                val (msg, _, _) = dispatchEmergencyAlertUseCase.prepareAlertMessage(current)
                _uiState.value = _uiState.value.copy(preparedMessageText = msg)
            }
        }
    }

    fun dispatchSms(context: Context, contact: EmergencyContact) {
        val event = _uiState.value.activeEvent ?: return
        val msg = _uiState.value.preparedMessageText ?: return
        dispatchEmergencyAlertUseCase.dispatchSms(context, contact, msg, event.eventId)
        _uiState.value = _uiState.value.copy(
            activeEvent = event.copy(notificationStatus = NotificationStatus.INITIATED),
            statusFeedback = "SMS Intent initiated for ${contact.name}"
        )
    }

    fun dispatchWhatsApp(context: Context, contact: EmergencyContact) {
        val event = _uiState.value.activeEvent ?: return
        val msg = _uiState.value.preparedMessageText ?: return
        dispatchEmergencyAlertUseCase.dispatchWhatsApp(context, contact, msg, event.eventId)
        _uiState.value = _uiState.value.copy(
            activeEvent = event.copy(notificationStatus = NotificationStatus.INITIATED),
            statusFeedback = "WhatsApp Intent initiated for ${contact.name}"
        )
    }

    fun cancelEvent() {
        viewModelScope.launch {
            val current = _uiState.value.activeEvent
            val (success, msg) = cancelEmergencyCountdownUseCase.cancelCountdown(current)
            _uiState.value = _uiState.value.copy(
                activeEvent = null,
                statusFeedback = msg
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(statusFeedback = null)
    }

    class Factory(
        private val triageRepository: TriageRepository,
        private val contactRepository: ContactRepository,
        private val dispatchEmergencyAlertUseCase: DispatchEmergencyAlertUseCase,
        private val cancelEmergencyCountdownUseCase: CancelEmergencyCountdownUseCase
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return EmergencyViewModel(
                triageRepository,
                contactRepository,
                dispatchEmergencyAlertUseCase,
                cancelEmergencyCountdownUseCase
            ) as T
        }
    }
}

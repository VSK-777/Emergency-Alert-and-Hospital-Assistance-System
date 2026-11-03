package net.vvit.csptriage.presentation.contacts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import net.vvit.csptriage.domain.model.EmergencyContact
import net.vvit.csptriage.domain.repository.ContactRepository

data class ContactsUiState(
    val contacts: List<EmergencyContact> = emptyList(),
    val isAddDialogOpen: Boolean = false,
    val editingContact: EmergencyContact? = null,
    val feedbackMessage: String? = null
)

class ContactsViewModel(private val repository: ContactRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(ContactsUiState())
    val uiState: StateFlow<ContactsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.getAllContacts().collectLatest { list ->
                _uiState.value = _uiState.value.copy(contacts = list)
            }
        }
    }

    fun openAddDialog() {
        _uiState.value = _uiState.value.copy(isAddDialogOpen = true, editingContact = null)
    }

    fun openEditDialog(contact: EmergencyContact) {
        _uiState.value = _uiState.value.copy(isAddDialogOpen = true, editingContact = contact)
    }

    fun closeDialog() {
        _uiState.value = _uiState.value.copy(isAddDialogOpen = false, editingContact = null)
    }

    fun saveContact(name: String, phone: String, relationship: String, isPrimary: Boolean) {
        if (name.isBlank() || phone.isBlank()) {
            _uiState.value = _uiState.value.copy(feedbackMessage = "Name and Phone cannot be empty")
            return
        }

        viewModelScope.launch {
            val editing = _uiState.value.editingContact
            if (editing != null) {
                repository.updateContact(
                    editing.copy(
                        name = name.trim(),
                        phoneNumber = phone.trim(),
                        relationship = relationship.trim(),
                        isPrimary = isPrimary
                    )
                )
                _uiState.value = _uiState.value.copy(feedbackMessage = "Contact updated")
            } else {
                repository.addContact(
                    EmergencyContact(
                        name = name.trim(),
                        phoneNumber = phone.trim(),
                        relationship = relationship.trim(),
                        isPrimary = isPrimary
                    )
                )
                _uiState.value = _uiState.value.copy(feedbackMessage = "Contact added")
            }
            closeDialog()
        }
    }

    fun deleteContact(contactId: Long) {
        viewModelScope.launch {
            repository.deleteContact(contactId)
            _uiState.value = _uiState.value.copy(feedbackMessage = "Contact removed")
        }
    }

    fun setPrimaryContact(contactId: Long) {
        viewModelScope.launch {
            repository.setPrimaryContact(contactId)
            _uiState.value = _uiState.value.copy(feedbackMessage = "Primary contact updated")
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(feedbackMessage = null)
    }

    class Factory(private val repository: ContactRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ContactsViewModel(repository) as T
        }
    }
}

package net.vvit.csptriage.domain.repository

import kotlinx.coroutines.flow.Flow
import net.vvit.csptriage.domain.model.EmergencyContact

interface ContactRepository {
    fun getAllContacts(): Flow<List<EmergencyContact>>
    fun getPrimaryContact(): EmergencyContact?
    fun addContact(contact: EmergencyContact): Long
    fun updateContact(contact: EmergencyContact)
    fun deleteContact(contactId: Long)
    fun setPrimaryContact(contactId: Long)
}

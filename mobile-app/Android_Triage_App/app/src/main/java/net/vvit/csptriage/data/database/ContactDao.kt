package net.vvit.csptriage.data.database

import kotlinx.coroutines.flow.Flow
import net.vvit.csptriage.domain.model.EmergencyContact

interface ContactDao {
    fun insertContact(contact: EmergencyContact): Long
    fun updateContact(contact: EmergencyContact)
    fun deleteContact(contactId: Long)
    fun getAllContacts(): Flow<List<EmergencyContact>>
    fun getPrimaryContact(): EmergencyContact?
    fun setPrimaryContact(contactId: Long)
}

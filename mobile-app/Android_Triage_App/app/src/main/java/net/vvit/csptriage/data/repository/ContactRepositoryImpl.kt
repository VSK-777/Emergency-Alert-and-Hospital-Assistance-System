package net.vvit.csptriage.data.repository

import kotlinx.coroutines.flow.Flow
import net.vvit.csptriage.data.database.AppDatabase
import net.vvit.csptriage.domain.model.EmergencyContact
import net.vvit.csptriage.domain.repository.ContactRepository

class ContactRepositoryImpl(private val database: AppDatabase) : ContactRepository {
    override fun getAllContacts(): Flow<List<EmergencyContact>> = database.contactDao.getAllContacts()
    override fun getPrimaryContact(): EmergencyContact? = database.contactDao.getPrimaryContact()
    override fun addContact(contact: EmergencyContact): Long = database.contactDao.insertContact(contact)
    override fun updateContact(contact: EmergencyContact) = database.contactDao.updateContact(contact)
    override fun deleteContact(contactId: Long) = database.contactDao.deleteContact(contactId)
    override fun setPrimaryContact(contactId: Long) = database.contactDao.setPrimaryContact(contactId)
}

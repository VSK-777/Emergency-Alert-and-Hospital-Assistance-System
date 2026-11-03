package net.vvit.csptriage.data.database

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.EmergencyContact
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.NotificationStatus
import net.vvit.csptriage.domain.model.OperatingMode

class AppDatabase(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    private val dbScope = CoroutineScope(Dispatchers.IO)
    private val _eventsFlow = MutableStateFlow<List<EmergencyEvent>>(emptyList())
    private val _contactsFlow = MutableStateFlow<List<EmergencyContact>>(emptyList())

    companion object {
        const val DATABASE_NAME = "csp_triage.db"
        const val DATABASE_VERSION = 1

        const val TABLE_EVENTS = "events"
        const val COL_EVENT_ID = "event_id"
        const val COL_STATE = "state"
        const val COL_MODE = "mode"
        const val COL_PEAK_ACCEL = "peak_accel"
        const val COL_STILLNESS = "stillness"
        const val COL_HR = "heart_rate"
        const val COL_SPO2 = "spo2"
        const val COL_TIMESTAMP_SEC = "timestamp_sec"
        const val COL_LATITUDE = "latitude"
        const val COL_LONGITUDE = "longitude"
        const val COL_ACCURACY = "accuracy"
        const val COL_NOTIFICATION_STATUS = "notification_status"
        const val COL_CREATED_AT = "created_at"

        const val TABLE_CONTACTS = "contacts"
        const val COL_CONTACT_ID = "id"
        const val COL_NAME = "name"
        const val COL_PHONE = "phone"
        const val COL_RELATIONSHIP = "relationship"
        const val COL_IS_PRIMARY = "is_primary"
    }

    init {
        refreshEvents()
        refreshContacts()
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createEventsTable = """
            CREATE TABLE $TABLE_EVENTS (
                $COL_EVENT_ID INTEGER PRIMARY KEY,
                $COL_STATE INTEGER NOT NULL,
                $COL_MODE INTEGER NOT NULL,
                $COL_PEAK_ACCEL REAL NOT NULL,
                $COL_STILLNESS REAL NOT NULL,
                $COL_HR INTEGER,
                $COL_SPO2 INTEGER,
                $COL_TIMESTAMP_SEC INTEGER NOT NULL,
                $COL_LATITUDE REAL,
                $COL_LONGITUDE REAL,
                $COL_ACCURACY REAL,
                $COL_NOTIFICATION_STATUS TEXT NOT NULL,
                $COL_CREATED_AT INTEGER NOT NULL
            )
        """.trimIndent()

        val createContactsTable = """
            CREATE TABLE $TABLE_CONTACTS (
                $COL_CONTACT_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_NAME TEXT NOT NULL,
                $COL_PHONE TEXT NOT NULL,
                $COL_RELATIONSHIP TEXT NOT NULL,
                $COL_IS_PRIMARY INTEGER NOT NULL DEFAULT 0
            )
        """.trimIndent()

        db.execSQL(createEventsTable)
        db.execSQL(createContactsTable)

        // Seed default emergency contacts
        db.execSQL("INSERT INTO $TABLE_CONTACTS ($COL_NAME, $COL_PHONE, $COL_RELATIONSHIP, $COL_IS_PRIMARY) VALUES ('Primary Guardian (Family)', '+91 9876543210', 'Family Guardian', 1)")
        db.execSQL("INSERT INTO $TABLE_CONTACTS ($COL_NAME, $COL_PHONE, $COL_RELATIONSHIP, $COL_IS_PRIMARY) VALUES ('Trauma Coordinator (AIIMS)', '+91 8765432109', 'Hospital Triage', 0)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_EVENTS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_CONTACTS")
        onCreate(db)
    }

    private fun refreshEvents() {
        dbScope.launch {
            val list = mutableListOf<EmergencyEvent>()
            val db = readableDatabase
            val cursor = db.query(TABLE_EVENTS, null, null, null, null, null, "$COL_CREATED_AT DESC")
            cursor.use {
                while (it.moveToNext()) {
                    list.add(cursorToEvent(it))
                }
            }
            _eventsFlow.value = list
        }
    }

    private fun refreshContacts() {
        dbScope.launch {
            val list = mutableListOf<EmergencyContact>()
            val db = readableDatabase
            val cursor = db.query(TABLE_CONTACTS, null, null, null, null, null, "$COL_IS_PRIMARY DESC, $COL_NAME ASC")
            cursor.use {
                while (it.moveToNext()) {
                    list.add(cursorToContact(it))
                }
            }
            _contactsFlow.value = list
        }
    }

    private fun cursorToEvent(c: Cursor): EmergencyEvent {
        val eventId = c.getLong(c.getColumnIndexOrThrow(COL_EVENT_ID))
        val state = AccidentState.fromCode(c.getInt(c.getColumnIndexOrThrow(COL_STATE)))
        val mode = OperatingMode.fromCode(c.getInt(c.getColumnIndexOrThrow(COL_MODE)))
        val peakAccel = c.getFloat(c.getColumnIndexOrThrow(COL_PEAK_ACCEL))
        val stillness = c.getFloat(c.getColumnIndexOrThrow(COL_STILLNESS))
        val hr = if (c.isNull(c.getColumnIndexOrThrow(COL_HR))) null else c.getInt(c.getColumnIndexOrThrow(COL_HR))
        val spo2 = if (c.isNull(c.getColumnIndexOrThrow(COL_SPO2))) null else c.getInt(c.getColumnIndexOrThrow(COL_SPO2))
        val timestampSec = c.getLong(c.getColumnIndexOrThrow(COL_TIMESTAMP_SEC))
        val lat = if (c.isNull(c.getColumnIndexOrThrow(COL_LATITUDE))) null else c.getDouble(c.getColumnIndexOrThrow(COL_LATITUDE))
        val lon = if (c.isNull(c.getColumnIndexOrThrow(COL_LONGITUDE))) null else c.getDouble(c.getColumnIndexOrThrow(COL_LONGITUDE))
        val acc = if (c.isNull(c.getColumnIndexOrThrow(COL_ACCURACY))) null else c.getFloat(c.getColumnIndexOrThrow(COL_ACCURACY))
        val statusStr = c.getString(c.getColumnIndexOrThrow(COL_NOTIFICATION_STATUS))
        val notifStatus = runCatching { NotificationStatus.valueOf(statusStr) }.getOrDefault(NotificationStatus.PENDING)
        val createdAt = c.getLong(c.getColumnIndexOrThrow(COL_CREATED_AT))

        return EmergencyEvent(
            eventId = eventId,
            state = state,
            mode = mode,
            peakAccelG = peakAccel,
            stillnessSeconds = stillness,
            heartRateBpm = hr,
            spo2Percent = spo2,
            timestampSeconds = timestampSec,
            latitude = lat,
            longitude = lon,
            locationAccuracyMeters = acc,
            notificationStatus = notifStatus,
            createdAtMillis = createdAt
        )
    }

    private fun cursorToContact(c: Cursor): EmergencyContact {
        return EmergencyContact(
            id = c.getLong(c.getColumnIndexOrThrow(COL_CONTACT_ID)),
            name = c.getString(c.getColumnIndexOrThrow(COL_NAME)),
            phoneNumber = c.getString(c.getColumnIndexOrThrow(COL_PHONE)),
            relationship = c.getString(c.getColumnIndexOrThrow(COL_RELATIONSHIP)),
            isPrimary = c.getInt(c.getColumnIndexOrThrow(COL_IS_PRIMARY)) == 1
        )
    }

    val eventDao = object : EventDao {
        override fun insertEvent(event: EmergencyEvent): Long {
            val cv = ContentValues().apply {
                put(COL_EVENT_ID, event.eventId)
                put(COL_STATE, event.state.code)
                put(COL_MODE, event.mode.code)
                put(COL_PEAK_ACCEL, event.peakAccelG)
                put(COL_STILLNESS, event.stillnessSeconds)
                if (event.heartRateBpm != null) put(COL_HR, event.heartRateBpm) else putNull(COL_HR)
                if (event.spo2Percent != null) put(COL_SPO2, event.spo2Percent) else putNull(COL_SPO2)
                put(COL_TIMESTAMP_SEC, event.timestampSeconds)
                if (event.latitude != null) put(COL_LATITUDE, event.latitude) else putNull(COL_LATITUDE)
                if (event.longitude != null) put(COL_LONGITUDE, event.longitude) else putNull(COL_LONGITUDE)
                if (event.locationAccuracyMeters != null) put(COL_ACCURACY, event.locationAccuracyMeters) else putNull(COL_ACCURACY)
                put(COL_NOTIFICATION_STATUS, event.notificationStatus.name)
                put(COL_CREATED_AT, event.createdAtMillis)
            }
            val res = writableDatabase.insertWithOnConflict(TABLE_EVENTS, null, cv, SQLiteDatabase.CONFLICT_REPLACE)
            refreshEvents()
            return res
        }

        override fun getAllEvents(): Flow<List<EmergencyEvent>> = _eventsFlow.asStateFlow()

        override fun getFilteredEvents(mode: OperatingMode?, state: AccidentState?): Flow<List<EmergencyEvent>> {
            return kotlinx.coroutines.flow.flow {
                _eventsFlow.collect { list ->
                    var filtered = list
                    if (mode != null) {
                        filtered = filtered.filter { it.mode == mode }
                    }
                    if (state != null) {
                        filtered = filtered.filter { it.state == state }
                    }
                    emit(filtered)
                }
            }
        }

        override fun updateNotificationStatus(eventId: Long, status: NotificationStatus) {
            val cv = ContentValues().apply {
                put(COL_NOTIFICATION_STATUS, status.name)
            }
            writableDatabase.update(TABLE_EVENTS, cv, "$COL_EVENT_ID = ?", arrayOf(eventId.toString()))
            refreshEvents()
        }

        override fun clearAllEvents() {
            writableDatabase.delete(TABLE_EVENTS, null, null)
            refreshEvents()
        }
    }

    val contactDao = object : ContactDao {
        override fun insertContact(contact: EmergencyContact): Long {
            val cv = ContentValues().apply {
                put(COL_NAME, contact.name)
                put(COL_PHONE, contact.phoneNumber)
                put(COL_RELATIONSHIP, contact.relationship)
                put(COL_IS_PRIMARY, if (contact.isPrimary) 1 else 0)
            }
            if (contact.isPrimary) {
                // Clear existing primary
                val resetCv = ContentValues().apply { put(COL_IS_PRIMARY, 0) }
                writableDatabase.update(TABLE_CONTACTS, resetCv, null, null)
            }
            val id = writableDatabase.insert(TABLE_CONTACTS, null, cv)
            refreshContacts()
            return id
        }

        override fun updateContact(contact: EmergencyContact) {
            if (contact.isPrimary) {
                val resetCv = ContentValues().apply { put(COL_IS_PRIMARY, 0) }
                writableDatabase.update(TABLE_CONTACTS, resetCv, null, null)
            }
            val cv = ContentValues().apply {
                put(COL_NAME, contact.name)
                put(COL_PHONE, contact.phoneNumber)
                put(COL_RELATIONSHIP, contact.relationship)
                put(COL_IS_PRIMARY, if (contact.isPrimary) 1 else 0)
            }
            writableDatabase.update(TABLE_CONTACTS, cv, "$COL_CONTACT_ID = ?", arrayOf(contact.id.toString()))
            refreshContacts()
        }

        override fun deleteContact(contactId: Long) {
            writableDatabase.delete(TABLE_CONTACTS, "$COL_CONTACT_ID = ?", arrayOf(contactId.toString()))
            refreshContacts()
        }

        override fun getAllContacts(): Flow<List<EmergencyContact>> = _contactsFlow.asStateFlow()

        override fun getPrimaryContact(): EmergencyContact? {
            return _contactsFlow.value.firstOrNull { it.isPrimary } ?: _contactsFlow.value.firstOrNull()
        }

        override fun setPrimaryContact(contactId: Long) {
            writableDatabase.beginTransaction()
            try {
                val resetCv = ContentValues().apply { put(COL_IS_PRIMARY, 0) }
                writableDatabase.update(TABLE_CONTACTS, resetCv, null, null)

                val setCv = ContentValues().apply { put(COL_IS_PRIMARY, 1) }
                writableDatabase.update(TABLE_CONTACTS, setCv, "$COL_CONTACT_ID = ?", arrayOf(contactId.toString()))
                writableDatabase.setTransactionSuccessful()
            } finally {
                writableDatabase.endTransaction()
            }
            refreshContacts()
        }
    }
}

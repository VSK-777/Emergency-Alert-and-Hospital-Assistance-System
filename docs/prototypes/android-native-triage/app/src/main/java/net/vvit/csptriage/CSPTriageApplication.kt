package net.vvit.csptriage

import android.app.Application
import android.content.Intent
import android.os.Build
import net.vvit.csptriage.data.ble.BleCommandManager
import net.vvit.csptriage.data.ble.BleConnectionManager
import net.vvit.csptriage.data.ble.BleGattManager
import net.vvit.csptriage.data.ble.BleScanner
import net.vvit.csptriage.data.database.AppDatabase
import net.vvit.csptriage.data.location.LocationProvider
import net.vvit.csptriage.data.repository.ContactRepositoryImpl
import net.vvit.csptriage.data.repository.TriageRepositoryImpl
import net.vvit.csptriage.domain.repository.ContactRepository
import net.vvit.csptriage.domain.repository.TriageRepository
import net.vvit.csptriage.domain.usecase.CancelEmergencyCountdownUseCase
import net.vvit.csptriage.domain.usecase.DispatchEmergencyAlertUseCase
import net.vvit.csptriage.domain.usecase.GetLiveTelemetryUseCase
import net.vvit.csptriage.domain.usecase.SendSimulationCommandUseCase
import net.vvit.csptriage.service.BleMonitoringService

class CSPTriageApplication : Application() {

    lateinit var database: AppDatabase
        private set
    lateinit var locationProvider: LocationProvider
        private set
    lateinit var bleScanner: BleScanner
        private set
    lateinit var bleGattManager: BleGattManager
        private set
    lateinit var bleCommandManager: BleCommandManager
        private set
    lateinit var bleConnectionManager: BleConnectionManager
        private set

    lateinit var triageRepository: TriageRepository
        private set
    lateinit var contactRepository: ContactRepository
        private set
    lateinit var backendSyncManager: net.vvit.csptriage.data.network.BackendSyncManager
        private set

    lateinit var getLiveTelemetryUseCase: GetLiveTelemetryUseCase
        private set
    lateinit var sendSimulationCommandUseCase: SendSimulationCommandUseCase
        private set
    lateinit var cancelEmergencyCountdownUseCase: CancelEmergencyCountdownUseCase
        private set
    lateinit var dispatchEmergencyAlertUseCase: DispatchEmergencyAlertUseCase
        private set

    override fun onCreate() {
        super.onCreate()

        database = AppDatabase(this)
        locationProvider = LocationProvider(this)

        bleScanner = BleScanner(this)
        bleGattManager = BleGattManager(this)
        bleCommandManager = BleCommandManager(bleGattManager)
        bleConnectionManager = BleConnectionManager(this, bleScanner, bleGattManager, bleCommandManager)

        triageRepository = TriageRepositoryImpl(bleConnectionManager, database, locationProvider)
        contactRepository = ContactRepositoryImpl(database)
        backendSyncManager = net.vvit.csptriage.data.network.BackendSyncManager(this)

        getLiveTelemetryUseCase = GetLiveTelemetryUseCase(triageRepository)
        sendSimulationCommandUseCase = SendSimulationCommandUseCase(triageRepository)
        cancelEmergencyCountdownUseCase = CancelEmergencyCountdownUseCase(triageRepository)
        dispatchEmergencyAlertUseCase = DispatchEmergencyAlertUseCase(triageRepository, contactRepository, backendSyncManager)
    }

    fun startMonitoringService() {
        val intent = Intent(this, BleMonitoringService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    fun stopMonitoringService() {
        val intent = Intent(this, BleMonitoringService::class.java)
        stopService(intent)
    }
}

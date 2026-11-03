package net.vvit.csptriage.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import net.vvit.csptriage.CSPTriageApplication
import net.vvit.csptriage.MainActivity
import net.vvit.csptriage.data.ble.BleConnectionState
import net.vvit.csptriage.domain.model.AccidentState

class BleMonitoringService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private lateinit var notificationHelper: NotificationHelper

    override fun onCreate() {
        super.onCreate()
        notificationHelper = NotificationHelper(this)
        startForegroundWithNotification("CSP Triage: Armed & Monitoring")
        observeBleAndEvents()
    }

    private fun startForegroundWithNotification(statusText: String) {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = NotificationCompat.Builder(this, NotificationHelper.CHANNEL_MONITORING)
            .setContentTitle("CSP Triage System")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val foregroundServiceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE or ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            } else {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            }
            startForeground(NotificationHelper.NOTIFICATION_ID_FOREGROUND, notification, foregroundServiceType)
        } else {
            startForeground(NotificationHelper.NOTIFICATION_ID_FOREGROUND, notification)
        }
    }

    private fun observeBleAndEvents() {
        val app = application as? CSPTriageApplication ?: return
        val repository = app.triageRepository

        serviceScope.launch {
            repository.connectionState.collectLatest { state ->
                val text = when (state) {
                    is BleConnectionState.Ready -> "Online & Armed: ${state.deviceName}"
                    is BleConnectionState.Connected -> "Connected to ${state.deviceName}"
                    is BleConnectionState.Connecting -> "Connecting…"
                    is BleConnectionState.Reconnecting -> "Reconnecting (Attempt ${state.attempt})…"
                    is BleConnectionState.Scanning -> "Scanning for CSP-Triage-V1…"
                    is BleConnectionState.Disconnected -> "Disconnected"
                    else -> "System Standby"
                }
                updateForegroundNotification(text)
            }
        }

        serviceScope.launch {
            repository.latestTelemetry.collectLatest { telemetry ->
                if (telemetry != null) {
                    if (telemetry.state == AccidentState.COUNTDOWN) {
                        notificationHelper.triggerEmergencyAlarm(
                            "🚨 IMPACT DETECTED — 15s COUNTDOWN",
                            "Emergency countdown active! Tap to review or cancel on device."
                        )
                    } else if (telemetry.state == AccidentState.EMERGENCY_ALERT) {
                        notificationHelper.triggerEmergencyAlarm(
                            "🚨 CRITICAL TRAUMA EVENT CONFIRMED",
                            "Emergency alert active! Notifying designated emergency contacts."
                        )
                    } else if (telemetry.state == AccidentState.CANCELLED) {
                        notificationHelper.cancelEmergencyAlert()
                    }

                    // Forward real-time sensor metrics to cloud backend
                    app.backendSyncManager.syncTelemetry(telemetry)
                }
            }
        }

        serviceScope.launch {
            repository.emergencyEvents.collectLatest { event ->
                // Automatically handle, locate, and upload new trauma event to backend
                app.dispatchEmergencyAlertUseCase.prepareAlertMessage(event)
            }
        }
    }

    private fun updateForegroundNotification(text: String) {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, NotificationHelper.CHANNEL_MONITORING)
            .setContentTitle("CSP Triage System")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        val manager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        manager.notify(NotificationHelper.NOTIFICATION_ID_FOREGROUND, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

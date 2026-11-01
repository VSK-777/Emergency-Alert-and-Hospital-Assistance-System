package net.vvit.csp.wear.service

import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import net.vvit.csp.wear.detector.DetectionResult
import net.vvit.csp.wear.detector.SensorPipeline
import net.vvit.csp.wear.state.SensorStatus
import net.vvit.csp.wear.ui.CountdownActivity

/**
 * Service for persistent accident and fall monitoring on Wear OS.
 * Maintains the IMU SensorPipeline lifecycle across activity transitions.
 */
class AccidentMonitorService : Service() {

    private val binder = LocalBinder()
    private var sensorPipeline: SensorPipeline? = null

    companion object {
        const val ACTION_START = "net.vvit.csp.wear.action.START"
        const val ACTION_STOP = "net.vvit.csp.wear.action.STOP"

        var isServiceRunning = false
            private set
    }

    inner class LocalBinder : Binder() {
        fun getService(): AccidentMonitorService = this@AccidentMonitorService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        sensorPipeline = SensorPipeline(this) { result, incidentId ->
            handleAccidentDetected(result, incidentId)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopMonitoring()
                stopSelf()
            }
            else -> {
                startMonitoring()
            }
        }
        return START_STICKY
    }

    fun startMonitoring(): Boolean {
        val started = sensorPipeline?.start() ?: false
        isServiceRunning = started
        return started
    }

    fun stopMonitoring() {
        sensorPipeline?.stop()
        isServiceRunning = false
    }

    fun getSensorStatus(): SensorStatus {
        return sensorPipeline?.getSensorStatus() ?: SensorStatus()
    }

    fun getCurrentAccelG(): Float {
        return sensorPipeline?.currentAccelG ?: 1.0f
    }

    private fun handleAccidentDetected(result: DetectionResult, incidentId: String) {
        val intent = Intent(this, CountdownActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("incidentId", incidentId)
            putExtra("detectionReason", result.reason)
            putExtra("detectionScore", result.riskScore)
            putExtra("peakAccelG", result.peakAccelG)
            putExtra("peakGyroRadS", result.peakGyroRadS)
            putExtra("origin", "SENSOR")
            putExtra("isSimulated", false)
        }
        startActivity(intent)
    }

    override fun onDestroy() {
        stopMonitoring()
        super.onDestroy()
    }
}

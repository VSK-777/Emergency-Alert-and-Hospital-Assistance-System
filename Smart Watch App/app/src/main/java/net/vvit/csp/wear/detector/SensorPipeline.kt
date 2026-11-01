package net.vvit.csp.wear.detector

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import net.vvit.csp.wear.state.SensorStatus
import java.util.Collections
import java.util.LinkedList
import java.util.UUID

/**
 * Real-time IMU Sensor Monitor and Pipeline for Wear OS.
 * Reads actual hardware accelerometer and gyroscope data at ~50Hz.
 * Maintains a temporal sliding window and evaluates for impact followed by immobility.
 *
 * Community Service Project — VVIT CSE Batch 8.
 */
class SensorPipeline(
    private val context: Context,
    private val fallDetector: FallDetector = FallDetector(),
    private val onCandidateAccidentDetected: (DetectionResult, String) -> Unit
) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val accelerometer: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyroscope: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    private val bufferCapacity = 150 // ~3 seconds at 50Hz
    private val rollingBuffer = Collections.synchronizedList(LinkedList<MotionTelemetry>())

    @Volatile
    private var lastAx = 0f
    @Volatile
    private var lastAy = 9.8f
    @Volatile
    private var lastAz = 0f
    @Volatile
    private var lastGx = 0f
    @Volatile
    private var lastGy = 0f
    @Volatile
    private var lastGz = 0f

    @Volatile
    var isMonitoringActive: Boolean = false
        private set

    @Volatile
    var currentAccelG: Float = 1.0f
        private set

    private var lastTriggerTimeMs: Long = 0L
    private val cooldownMs: Long = 10_000L // 10s cooldown to suppress repeated triggers

    fun getSensorStatus(): SensorStatus {
        return SensorStatus(
            hasAccelerometer = accelerometer != null,
            hasGyroscope = gyroscope != null,
            isListening = isMonitoringActive
        )
    }

    /**
     * Start continuous hardware sensor listening
     */
    @Synchronized
    fun start(): Boolean {
        if (sensorManager == null || accelerometer == null) {
            isMonitoringActive = false
            return false
        }
        if (isMonitoringActive) return true

        rollingBuffer.clear()

        // SENSOR_DELAY_GAME delivers ~50Hz (20ms interval) on Wear OS
        val accelRegistered = sensorManager.registerListener(
            this,
            accelerometer,
            SensorManager.SENSOR_DELAY_GAME
        )

        val gyroRegistered = gyroscope?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        } ?: true

        isMonitoringActive = accelRegistered
        return isMonitoringActive
    }

    /**
     * Stop hardware sensor listening to conserve battery
     */
    @Synchronized
    fun stop() {
        if (!isMonitoringActive) return
        sensorManager?.unregisterListener(this)
        isMonitoringActive = false
    }

    override fun onSensorChanged(event: SensorEvent) {
        val now = System.currentTimeMillis()

        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                lastAx = event.values[0]
                lastAy = event.values[1]
                lastAz = event.values[2]

                val telemetry = MotionTelemetry(
                    timestampMs = now,
                    ax = lastAx,
                    ay = lastAy,
                    az = lastAz,
                    gx = lastGx,
                    gy = lastGy,
                    gz = lastGz
                )

                currentAccelG = telemetry.accelMagnitudeG

                synchronized(rollingBuffer) {
                    rollingBuffer.add(telemetry)
                    while (rollingBuffer.size > bufferCapacity) {
                        rollingBuffer.removeAt(0)
                    }
                }

                // Fast instantaneous spike check
                if (fallDetector.isInstantaneousImpactSpike(telemetry)) {
                    checkBufferForAccident(now)
                }
            }

            Sensor.TYPE_GYROSCOPE -> {
                lastGx = event.values[0]
                lastGy = event.values[1]
                lastGz = event.values[2]
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No-op
    }

    private fun checkBufferForAccident(now: Long) {
        if (now - lastTriggerTimeMs < cooldownMs) {
            return // Within cooldown
        }

        val snapshot: List<MotionTelemetry>
        synchronized(rollingBuffer) {
            if (rollingBuffer.size < 15) return
            snapshot = ArrayList(rollingBuffer)
        }

        val result = fallDetector.evaluateTelemetryWindow(snapshot)
        if (result.isCandidateAccident) {
            lastTriggerTimeMs = now
            val incidentId = "wear-sensor-${UUID.randomUUID().toString().take(8)}"
            onCandidateAccidentDetected(result, incidentId)
        }
    }
}

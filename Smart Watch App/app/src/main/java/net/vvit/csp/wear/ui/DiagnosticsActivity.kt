package net.vvit.csp.wear.ui

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import net.vvit.csp.wear.comm.PhoneSyncManager
import net.vvit.csp.wear.detector.SensorPipeline
import net.vvit.csp.wear.state.PhoneConnectionState
import net.vvit.csp.wear.storage.LocalWatchStore
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Technical Diagnostics and Hardware Telemetry Inspector.
 * Separates technical sensor metrics, buffer rates, and synchronization states
 * from the clean public-facing monitoring interface.
 */
class DiagnosticsActivity : Activity() {

    private lateinit var localStore: LocalWatchStore
    private lateinit var phoneSyncManager: PhoneSyncManager
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        localStore = LocalWatchStore(this)
        phoneSyncManager = PhoneSyncManager(this)

        buildUi()
    }

    private fun dp(value: Float): Int = TactileUi.dp(this, value)

    private fun buildUi() {
        val sensorManager = getSystemService(SENSOR_SERVICE) as? SensorManager
        val accel = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        val gyro = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

        val incidents = localStore.getIncidents()
        val pendingSync = incidents.count { it.deliveryState != "DELIVERED_TO_PHONE" }
        val simulatedCount = incidents.count { it.isSimulated }
        val sensorCount = incidents.count { !it.isSimulated && it.origin == "SENSOR" }
        val sosCount = incidents.count { it.origin == "MANUAL_SOS" }

        val scrollView = ScrollView(this).apply {
            background = TactileUi.createScreenBackground(this@DiagnosticsActivity)
            isFillViewport = true
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(20f), dp(22f), dp(20f), dp(36f))
        }

        // Header
        val tvHeader = TextView(this).apply {
            text = "SYSTEM DIAGNOSTICS"
            textSize = 10f
            setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
            setTextColor(Color.parseColor("#90A4AE"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(6f))
        }
        root.addView(tvHeader)

        // 1. Hardware IMU Card
        val imuCard = createSectionCard("IMU SENSORS", listOf(
            "Accelerometer" to if (accel != null) "PRESENT (${accel.vendor.take(12)})" else "UNAVAILABLE",
            "Gyroscope" to if (gyro != null) "PRESENT (${gyro.vendor.take(12)})" else "UNAVAILABLE",
            "Sampling Rate" to "50Hz (SENSOR_DELAY_GAME)",
            "Sliding Buffer" to "150 samples (~3.0s window)",
            "Threshold G" to "2.8g Peak Impact"
        ))
        root.addView(imuCard)

        // 2. Storage & Incidents Card
        val storageCard = createSectionCard("LOCAL STORE", listOf(
            "Total Cached" to "${incidents.size} records",
            "Pending Sync" to "$pendingSync records",
            "Real Sensor" to "$sensorCount incidents",
            "Manual SOS" to "$sosCount requests",
            "Simulated Test" to "$simulatedCount events"
        ))
        root.addView(storageCard)

        // 3. Connectivity Card
        val connCard = createSectionCard("COMPANION NODE", listOf(
            "Transport" to "Wearable Data Layer API",
            "Target Path" to "/vvit/emergency/accident_event",
            "Payload Schema" to "v1.0.0 (JSON Strict)",
            "Sync Mode" to "Store-and-Forward (Offline-First)"
        ))
        root.addView(connCard)

        // Back Button with 3D tactile styling
        val btnBack = Button(this).apply {
            text = "BACK TO MONITOR"
            textSize = 8.5f
            setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
            setTextColor(Color.WHITE)
            background = TactileUi.create3dButtonDrawable(
                this@DiagnosticsActivity,
                topColor = Color.parseColor("#263238"),
                bottomColor = Color.parseColor("#171E23"),
                shadowColor = Color.parseColor("#0C1115"),
                cornerRadiusDp = 18f
            )
        }
        TactileUi.attachTactileFeedback(btnBack) { finish() }

        val backParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(36f)
        ).apply {
            setMargins(dp(16f), dp(8f), dp(16f), 0)
        }
        root.addView(btnBack, backParams)

        scrollView.addView(root)
        setContentView(scrollView)
    }

    private fun createSectionCard(title: String, items: List<Pair<String, String>>): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = TactileUi.createCardSurfaceDrawable(this@DiagnosticsActivity)
            setPadding(dp(12f), dp(8f), dp(12f), dp(8f))
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dp(6f)
            }
            layoutParams = params

            val tvTitle = TextView(this@DiagnosticsActivity).apply {
                text = title
                textSize = 7.5f
                setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
                setTextColor(Color.parseColor("#64B5F6"))
                setPadding(0, 0, 0, dp(3f))
            }
            addView(tvTitle)

            for ((label, value) in items) {
                val row = LinearLayout(this@DiagnosticsActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    setPadding(0, dp(1f), 0, dp(1f))
                }
                val tvLabel = TextView(this@DiagnosticsActivity).apply {
                    text = label
                    textSize = 7f
                    setTextColor(Color.parseColor("#78909C"))
                    layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                }
                val tvVal = TextView(this@DiagnosticsActivity).apply {
                    text = value
                    textSize = 7f
                    setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
                    setTextColor(Color.parseColor("#ECEFF1"))
                }
                row.addView(tvLabel)
                row.addView(tvVal)
                addView(row)
            }
        }
    }
}

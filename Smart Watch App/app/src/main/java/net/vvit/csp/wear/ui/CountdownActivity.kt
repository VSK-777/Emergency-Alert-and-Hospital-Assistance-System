package net.vvit.csp.wear.ui

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import net.vvit.csp.wear.comm.PhoneSyncManager
import net.vvit.csp.wear.storage.LocalWatchStore
import net.vvit.csp.wear.storage.WatchIncident
import java.util.UUID

/**
 * Premium 3D Emergency Countdown & False Alarm Mitigation Display.
 * Features tactile physical buttons, elevated status indicators,
 * and high-contrast emergency actions designed for high-stress usability.
 */
class CountdownActivity : Activity() {

    private lateinit var tvHeaderBadge: TextView
    private lateinit var tvSubtitle: TextView
    private lateinit var tvSeconds: TextView
    private lateinit var tvDispatchDesc: TextView
    private lateinit var btnCancel: Button
    private lateinit var btnConfirm: Button
    private lateinit var localStore: LocalWatchStore
    private lateinit var phoneSyncManager: PhoneSyncManager

    private var countdownSeconds = 10
    private var countDownTimer: CountDownTimer? = null
    private var vibrator: Vibrator? = null

    private lateinit var incidentId: String
    private var detectionReason: String = "Possible Severe Fall Detected"
    private var detectionScore: Float = 0.92f
    private var peakAccelG: Float = 3.65f
    private var peakGyroRadS: Float = 4.20f
    private var origin: String = "SENSOR"
    private var isSimulated: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        incidentId = intent.getStringExtra("incidentId") ?: UUID.randomUUID().toString()
        detectionReason = intent.getStringExtra("detectionReason") ?: detectionReason
        detectionScore = intent.getFloatExtra("detectionScore", 0.92f)
        peakAccelG = intent.getFloatExtra("peakAccelG", 3.65f)
        peakGyroRadS = intent.getFloatExtra("peakGyroRadS", 4.20f)
        origin = intent.getStringExtra("origin") ?: "SENSOR"
        isSimulated = intent.getBooleanExtra("isSimulated", false)

        localStore = LocalWatchStore(this)
        phoneSyncManager = PhoneSyncManager(this)

        @Suppress("DEPRECATION")
        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator

        buildUi()
        startCountdown()
    }

    private fun dp(value: Float): Int = TactileUi.dp(this, value)

    private fun buildUi() {
        val scrollView = ScrollView(this).apply {
            background = TactileUi.createScreenBackground(this@CountdownActivity)
            isFillViewport = true
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(22f), dp(20f), dp(22f), dp(32f))
        }

        // Header Alert Pill Badge
        tvHeaderBadge = TextView(this).apply {
            text = when {
                isSimulated -> "SIMULATED FALL TEST"
                origin == "MANUAL_SOS" -> "EMERGENCY SOS"
                else -> "POSSIBLE ACCIDENT"
            }
            textSize = 9.5f
            setTextColor(if (isSimulated) Color.parseColor("#FFD54F") else Color.parseColor("#FF5252"))
            setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
            gravity = Gravity.CENTER
            letterSpacing = 0.06f
            setPadding(0, 0, 0, dp(1f))
        }
        root.addView(tvHeaderBadge)

        // Subtitle / Prompt
        tvSubtitle = TextView(this).apply {
            text = if (origin == "MANUAL_SOS") "Manual alert initiated" else "Are you okay?"
            textSize = 8.5f
            setTextColor(Color.parseColor("#E0E0E0"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(2f))
        }
        root.addView(tvSubtitle)

        // 3D Elevated Countdown Timer Chamber
        val timerChamber = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            background = TactileUi.createCardSurfaceDrawable(
                this@CountdownActivity,
                topBgColor = Color.parseColor("#220A0A"),
                bottomBgColor = Color.parseColor("#140404"),
                strokeColor = Color.parseColor("#441010"),
                cornerRadiusDp = 18f
            )
            setPadding(dp(16f), dp(2f), dp(16f), dp(4f))
        }
        val chamberParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = dp(6f)
        }
        root.addView(timerChamber, chamberParams)

        tvSeconds = TextView(this).apply {
            text = "10"
            textSize = 44f
            setTextColor(Color.WHITE)
            setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        timerChamber.addView(tvSeconds)

        tvDispatchDesc = TextView(this).apply {
            text = "Auto-sending in 10s"
            textSize = 7.5f
            setTextColor(Color.parseColor("#FFA726"))
            gravity = Gravity.CENTER
        }
        timerChamber.addView(tvDispatchDesc)

        // 1. PRIMARY TACTILE ACTION: False Alarm Prevention - "I'M OK"
        btnCancel = Button(this).apply {
            text = "I'M OK (CANCEL)"
            textSize = 10f
            setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
            setTextColor(Color.parseColor("#0C0E14"))
            letterSpacing = 0.04f
            background = TactileUi.create3dButtonDrawable(
                this@CountdownActivity,
                topColor = Color.parseColor("#FFFFFF"),
                bottomColor = Color.parseColor("#E0E0E0"),
                shadowColor = Color.parseColor("#808080"),
                highlightStrokeColor = Color.parseColor("#60FFFFFF"),
                cornerRadiusDp = 20f,
                shadowHeightDp = 3.5f
            )
        }
        val cancelParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(40f)
        ).apply {
            setMargins(dp(10f), 0, dp(10f), dp(7f))
        }
        TactileUi.attachTactileFeedback(btnCancel) { cancelEmergency() }
        root.addView(btnCancel, cancelParams)

        // 2. IMMEDIATE CONFIRMATION ACTION - "SEND ALERT NOW"
        btnConfirm = Button(this).apply {
            text = "SEND ALERT NOW"
            textSize = 8.5f
            setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
            setTextColor(Color.WHITE)
            letterSpacing = 0.04f
            background = TactileUi.create3dButtonDrawable(
                this@CountdownActivity,
                topColor = Color.parseColor("#D32F2F"),
                bottomColor = Color.parseColor("#9A0007"),
                shadowColor = Color.parseColor("#4A0000"),
                highlightStrokeColor = Color.parseColor("#50FF8A80"),
                cornerRadiusDp = 18f,
                shadowHeightDp = 3.5f
            )
        }
        val confirmParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(36f)
        ).apply {
            setMargins(dp(14f), 0, dp(14f), 0)
        }
        TactileUi.attachTactileFeedback(btnConfirm) { confirmAndDispatch() }
        root.addView(btnConfirm, confirmParams)

        scrollView.addView(root)
        setContentView(scrollView)
    }

    private fun startCountdown() {
        triggerHapticPulse(250)

        countDownTimer = object : CountDownTimer(10000L, 1000L) {
            override fun onTick(millisUntilFinished: Long) {
                countdownSeconds = ((millisUntilFinished + 500) / 1000).toInt()
                tvSeconds.text = "$countdownSeconds"
                tvDispatchDesc.text = "Auto-sending in ${countdownSeconds}s"
                triggerHapticPulse(110)
            }

            override fun onFinish() {
                tvSeconds.text = "0"
                confirmAndDispatch()
            }
        }.start()
    }

    private fun triggerHapticPulse(durationMs: Long) {
        vibrator?.let { v ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(durationMs)
            }
        }
    }

    private fun cancelEmergency() {
        countDownTimer?.cancel()
        val incident = WatchIncident(
            id = incidentId,
            timestampMs = System.currentTimeMillis(),
            detectionReason = detectionReason,
            detectionScore = detectionScore,
            userConfirmationState = "CANCELLED",
            deliveryState = "SAVED_LOCALLY",
            peakAccelG = peakAccelG,
            peakGyroRadS = peakGyroRadS,
            origin = origin,
            isSimulated = isSimulated
        )
        localStore.saveIncident(incident)
        finish()
    }

    private fun confirmAndDispatch() {
        countDownTimer?.cancel()
        tvHeaderBadge.text = "DISPATCHING ALERT"
        tvHeaderBadge.setTextColor(Color.parseColor("#00E676"))
        tvSubtitle.text = "Recording & synchronizing..."
        tvDispatchDesc.text = "Contacting responder network"
        btnCancel.isEnabled = false
        btnConfirm.isEnabled = false
        btnCancel.alpha = 0.4f
        btnConfirm.alpha = 0.4f

        val incident = WatchIncident(
            id = incidentId,
            timestampMs = System.currentTimeMillis(),
            detectionReason = detectionReason,
            detectionScore = detectionScore,
            userConfirmationState = "CONFIRMED",
            deliveryState = "SAVED_LOCALLY",
            peakAccelG = peakAccelG,
            peakGyroRadS = peakGyroRadS,
            origin = origin,
            isSimulated = isSimulated
        )

        // 1. Durably save locally on watch first
        localStore.saveIncident(incident)

        // 2. Transmit to companion phone & cloud backend
        phoneSyncManager.transmitIncident(incident) { success, msg ->
            runOnUiThread {
                tvDispatchDesc.text = if (success) "Dispatched to Cloud & Apps!" else "Saved on watch (Offline)"
                Handler(Looper.getMainLooper()).postDelayed({ finish() }, 1600)
            }
        }
    }

    override fun onDestroy() {
        countDownTimer?.cancel()
        super.onDestroy()
    }
}

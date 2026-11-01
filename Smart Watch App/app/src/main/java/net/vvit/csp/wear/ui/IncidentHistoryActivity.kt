package net.vvit.csp.wear.ui

import android.app.Activity
import android.app.AlertDialog
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import net.vvit.csp.wear.storage.LocalWatchStore
import net.vvit.csp.wear.storage.WatchIncident
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Premium 3D Incident History & Detailed Event Inspector for Wear OS.
 * Features tactile cards, color-coded origin badges, and detail inspection dialogs.
 */
class IncidentHistoryActivity : Activity() {

    private lateinit var localStore: LocalWatchStore
    private val timeFormat = SimpleDateFormat("HH:mm:ss · dd MMM", Locale.getDefault())
    private val detailDateFormat = SimpleDateFormat("dd MMM yyyy, HH:mm:ss", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        localStore = LocalWatchStore(this)
        buildUi()
    }

    private fun dp(value: Float): Int = TactileUi.dp(this, value)

    private fun buildUi() {
        val incidents = localStore.getIncidents()

        val scrollView = ScrollView(this).apply {
            background = TactileUi.createScreenBackground(this@IncidentHistoryActivity)
            isFillViewport = true
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(20f), dp(20f), dp(20f), dp(36f))
        }

        // Header
        val tvHeader = TextView(this).apply {
            text = "INCIDENT AUDIT LOG"
            textSize = 10f
            setTextColor(Color.parseColor("#90A4AE"))
            setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
            gravity = Gravity.CENTER
            letterSpacing = 0.06f
            setPadding(0, 0, 0, dp(3f))
        }
        root.addView(tvHeader)

        if (incidents.isEmpty()) {
            val emptyCard = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                background = TactileUi.createCardSurfaceDrawable(this@IncidentHistoryActivity)
                setPadding(dp(16f), dp(20f), dp(16f), dp(20f))
            }
            val tvEmpty = TextView(this).apply {
                text = "No incidents recorded.\nWatch storage is clean."
                textSize = 8.5f
                setTextColor(Color.parseColor("#607D8B"))
                gravity = Gravity.CENTER
            }
            emptyCard.addView(tvEmpty)
            root.addView(emptyCard)
        } else {
            val tvCount = TextView(this).apply {
                text = "${incidents.size} incident${if (incidents.size > 1) "s" else ""} recorded"
                textSize = 7.5f
                setTextColor(Color.parseColor("#80D8FF"))
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, dp(6f))
            }
            root.addView(tvCount)

            for (incident in incidents) {
                root.addView(createIncidentCard(incident))
            }

            // Clear Log 3D Tactile Button
            val btnClear = Button(this).apply {
                text = "CLEAR AUDIT LOG"
                textSize = 7.5f
                setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
                setTextColor(Color.parseColor("#FF8A80"))
                background = TactileUi.create3dButtonDrawable(
                    this@IncidentHistoryActivity,
                    topColor = Color.parseColor("#331414"),
                    bottomColor = Color.parseColor("#220A0A"),
                    shadowColor = Color.parseColor("#120303"),
                    highlightStrokeColor = Color.parseColor("#40FF5252"),
                    cornerRadiusDp = 16f,
                    shadowHeightDp = 2.5f
                )
            }
            TactileUi.attachTactileFeedback(btnClear) {
                localStore.clearAll()
                buildUi()
            }
            val clearParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(30f)
            ).apply {
                setMargins(dp(18f), dp(8f), dp(18f), dp(6f))
            }
            root.addView(btnClear, clearParams)
        }

        // Back 3D Tactile Button
        val btnBack = Button(this).apply {
            text = "BACK TO MONITOR"
            textSize = 8f
            setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
            setTextColor(Color.WHITE)
            background = TactileUi.create3dButtonDrawable(
                this@IncidentHistoryActivity,
                topColor = Color.parseColor("#222A38"),
                bottomColor = Color.parseColor("#151B24"),
                shadowColor = Color.parseColor("#090D13"),
                highlightStrokeColor = Color.parseColor("#4090CAF9"),
                cornerRadiusDp = 16f,
                shadowHeightDp = 2.5f
            )
        }
        TactileUi.attachTactileFeedback(btnBack) { finish() }

        val backParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(32f)
        ).apply {
            setMargins(dp(14f), dp(4f), dp(14f), 0)
        }
        root.addView(btnBack, backParams)

        scrollView.removeAllViews()
        scrollView.addView(root)
        setContentView(scrollView)
    }

    private fun createIncidentCard(incident: WatchIncident): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = TactileUi.createCardSurfaceDrawable(
                this@IncidentHistoryActivity,
                topBgColor = Color.parseColor("#151822"),
                bottomBgColor = Color.parseColor("#0E1118"),
                strokeColor = Color.parseColor("#232938"),
                cornerRadiusDp = 12f
            )
            setPadding(dp(11f), dp(8f), dp(11f), dp(8f))
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dp(6f)
            }
            layoutParams = params

            // Line 1: Origin Badge + Confirmation State
            val topRow = LinearLayout(this@IncidentHistoryActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
            }

            val originBadge = TextView(this@IncidentHistoryActivity).apply {
                text = when (incident.origin) {
                    "SIMULATED" -> "SIM TEST"
                    "MANUAL_SOS" -> "MANUAL SOS"
                    else -> "REAL SENSOR"
                }
                textSize = 6.5f
                setTypeface(Typeface.MONOSPACE, Typeface.BOLD)
                setPadding(dp(5f), dp(1f), dp(5f), dp(1f))
                setTextColor(Color.WHITE)
                background = TactileUi.createCardSurfaceDrawable(
                    this@IncidentHistoryActivity,
                    topBgColor = when (incident.origin) {
                        "SIMULATED" -> Color.parseColor("#5E35B1")
                        "MANUAL_SOS" -> Color.parseColor("#C62828")
                        else -> Color.parseColor("#00838F")
                    },
                    bottomBgColor = when (incident.origin) {
                        "SIMULATED" -> Color.parseColor("#4527A0")
                        "MANUAL_SOS" -> Color.parseColor("#8E0000")
                        else -> Color.parseColor("#005662")
                    },
                    strokeColor = Color.parseColor("#40FFFFFF"),
                    cornerRadiusDp = 6f
                )
            }
            topRow.addView(originBadge)

            val tvState = TextView(this@IncidentHistoryActivity).apply {
                text = "  ${incident.userConfirmationState}"
                textSize = 8f
                setTypeface(Typeface.SANS_SERIF, Typeface.BOLD)
                setTextColor(
                    if (incident.userConfirmationState == "CONFIRMED")
                        Color.parseColor("#FF5252")
                    else
                        Color.parseColor("#69F0AE")
                )
            }
            topRow.addView(tvState)
            addView(topRow)

            // Line 2: Reason
            val tvReason = TextView(this@IncidentHistoryActivity).apply {
                text = incident.detectionReason
                textSize = 7.5f
                setTextColor(Color.parseColor("#CFD8DC"))
                setPadding(0, dp(3f), 0, dp(1f))
            }
            addView(tvReason)

            // Line 3: Peak metrics & timestamp
            val dateStr = timeFormat.format(Date(incident.timestampMs))
            val tvMeta = TextView(this@IncidentHistoryActivity).apply {
                text = "${String.format("%.1f", incident.peakAccelG)}g · $dateStr"
                textSize = 6.5f
                setTextColor(Color.parseColor("#78909C"))
            }
            addView(tvMeta)

            // Line 4: Delivery state chip
            val tvDelivery = TextView(this@IncidentHistoryActivity).apply {
                text = if (incident.deliveryState == "DELIVERED_TO_PHONE")
                    "✓ Synced to phone"
                else
                    "○ Saved locally (watch)"
                textSize = 6.5f
                setTextColor(
                    if (incident.deliveryState == "DELIVERED_TO_PHONE")
                        Color.parseColor("#00E676")
                    else
                        Color.parseColor("#FFA726")
                )
            }
            addView(tvDelivery)

            // Tap card for full incident details dialog
            setOnClickListener { showIncidentDetail(incident) }
        }
    }

    private fun showIncidentDetail(incident: WatchIncident) {
        val details = StringBuilder().apply {
            append("ID: ${incident.id}\n")
            append("Origin: ${incident.origin}\n")
            append("State: ${incident.userConfirmationState}\n")
            append("Time: ${detailDateFormat.format(Date(incident.timestampMs))}\n")
            append("Peak Force: ${String.format("%.2f", incident.peakAccelG)} g\n")
            append("Angular Vel: ${String.format("%.2f", incident.peakGyroRadS)} rad/s\n")
            append("Risk Score: ${String.format("%.0f", incident.detectionScore * 100)}%\n")
            append("Sync State: ${incident.deliveryState}\n\n")
            append("Reason:\n${incident.detectionReason}")
        }.toString()

        AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle("INCIDENT DETAILS")
            .setMessage(details)
            .setPositiveButton("CLOSE") { dialog, _ -> dialog.dismiss() }
            .show()
    }
}

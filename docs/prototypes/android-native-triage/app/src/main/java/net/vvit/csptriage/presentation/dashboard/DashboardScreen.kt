package net.vvit.csptriage.presentation.dashboard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.vvit.csptriage.data.ble.BleConfig
import net.vvit.csptriage.data.ble.BleConnectionState
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.OperatingMode
import net.vvit.csptriage.presentation.components.CountdownRing
import net.vvit.csptriage.presentation.components.SensorCard
import net.vvit.csptriage.presentation.components.StatusPill
import net.vvit.csptriage.presentation.components.StatusPillType
import net.vvit.csptriage.presentation.theme.GraphHeartRate
import net.vvit.csptriage.presentation.theme.GraphSpO2
import net.vvit.csptriage.presentation.theme.MedicalAccentBlue
import net.vvit.csptriage.presentation.theme.MedicalCardBorder
import net.vvit.csptriage.presentation.theme.MedicalDarkBackground
import net.vvit.csptriage.presentation.theme.MedicalDarkCard
import net.vvit.csptriage.presentation.theme.MedicalDarkSurface
import net.vvit.csptriage.presentation.theme.MedicalEmergencyRed
import net.vvit.csptriage.presentation.theme.MedicalVitalGreen
import net.vvit.csptriage.presentation.theme.MedicalWarningAmber
import net.vvit.csptriage.presentation.theme.TextMutedDark
import net.vvit.csptriage.presentation.theme.TextPrimaryDark
import net.vvit.csptriage.presentation.theme.TextSecondaryDark
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.cancelFeedbackMessage) {
        state.cancelFeedbackMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearFeedback()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MedicalDarkBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp)
        ) {
            // Screen Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "CSP Triage",
                        color = TextPrimaryDark,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Accident & Physiological Monitoring",
                        color = TextSecondaryDark,
                        fontSize = 13.sp
                    )
                }

                val conn = state.connectionState
                StatusPill(
                    text = conn.label,
                    type = when (conn) {
                        is BleConnectionState.Ready -> StatusPillType.SUCCESS
                        is BleConnectionState.Connected -> StatusPillType.INFO
                        is BleConnectionState.Reconnecting, is BleConnectionState.Scanning -> StatusPillType.WARNING
                        is BleConnectionState.Error -> StatusPillType.DANGER
                        else -> StatusPillType.MUTED
                    }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 1. Simulation Mode Banner (if operating in SIM)
            val telemetry = state.telemetry
            if (telemetry?.mode == OperatingMode.SIMULATION) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MedicalWarningAmber.copy(alpha = 0.15f))
                        .padding(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Simulation Mode",
                            tint = MedicalWarningAmber
                        )
                        Spacer(modifier = Modifier.padding(horizontal = 6.dp))
                        Column {
                            Text(
                                text = "SIMULATION OPERATING MODE ACTIVE",
                                color = MedicalWarningAmber,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Telemetry is generated by firmware demo harness. Not clinical.",
                                color = TextSecondaryDark,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // 2. State Banner / Countdown interface
            val currentAccidentState = telemetry?.state ?: AccidentState.NORMAL_MONITORING
            when (currentAccidentState) {
                AccidentState.COUNTDOWN -> {
                    CountdownRing(
                        secondsRemaining = telemetry?.countdownRemainingSeconds ?: 15,
                        onCancelClicked = { viewModel.cancelActiveCountdown() }
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }
                AccidentState.EMERGENCY_ALERT -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(MedicalEmergencyRed.copy(alpha = 0.2f))
                            .padding(16.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = "Alert Active",
                                tint = MedicalEmergencyRed
                            )
                            Spacer(modifier = Modifier.padding(horizontal = 6.dp))
                            Column {
                                Text(
                                    text = "🚨 EMERGENCY TRAUMA ALERT ACTIVE",
                                    color = MedicalEmergencyRed,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Accident confirmed. Check Emergency tab for GPS & contacts.",
                                    color = TextPrimaryDark,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
                AccidentState.IMPACT_CANDIDATE -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(MedicalWarningAmber.copy(alpha = 0.15f))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "⚠️ IMPACT CANDIDATE DETECTED — Evaluating immobility…",
                            color = MedicalWarningAmber,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
                AccidentState.IMMOBILITY_CHECK -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(MedicalAccentBlue.copy(alpha = 0.15f))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "🔍 IMMOBILITY CHECK — Analyzing post-impact stillness…",
                            color = MedicalAccentBlue,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
                AccidentState.PHYSIOLOGICAL_ASSESSMENT -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(MedicalVitalGreen.copy(alpha = 0.15f))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "🩺 PHYSIOLOGICAL ASSESSMENT — Inspecting vitals stability…",
                            color = MedicalVitalGreen,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
                AccidentState.CANCELLED -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.Gray.copy(alpha = 0.15f))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "✅ PREVIOUS ALERT CANCELLED — Normal monitoring resumed",
                            color = MedicalVitalGreen,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
                AccidentState.NORMAL_MONITORING -> {
                    // Normal monitoring quiet state
                }
            }

            // 3. Heart Rate Card
            SensorCard(
                title = "Heart Rate (MAX30102)",
                valueText = telemetry?.heartRateBpm?.toString(),
                unitText = "BPM",
                isAvailable = telemetry?.sensors?.isHeartRateAvailable == true,
                signalQuality = telemetry?.signalQualityPercent,
                statusText = if (telemetry?.sensors?.isFingerDetected == true) "Finger Detected • Pulse Tracking" else "No finger contact",
                accentColor = GraphHeartRate,
                graphPoints = state.hrHistory,
                graphMin = 40f,
                graphMax = 180f
            )

            Spacer(modifier = Modifier.height(14.dp))

            // 4. SpO2 Card
            SensorCard(
                title = "Estimated Blood Oxygen (SpO2)",
                valueText = telemetry?.spo2Percent?.toString(),
                unitText = "%",
                isAvailable = telemetry?.sensors?.isSpO2Available == true,
                signalQuality = telemetry?.signalQualityPercent,
                statusText = "Calculated via photoplethysmography ratio",
                accentColor = GraphSpO2,
                graphPoints = state.spo2History,
                graphMin = 85f,
                graphMax = 100f
            )

            Spacer(modifier = Modifier.height(14.dp))

            // 5. Accelerometer Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkCard),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "TRIAXIAL ACCELEROMETER (IMU)",
                            color = TextSecondaryDark,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                        StatusPill(
                            text = if (telemetry?.sensors?.isAccelerometerAvailable == true) "50 Hz Active" else "Offline",
                            type = if (telemetry?.sensors?.isAccelerometerAvailable == true) StatusPillType.SUCCESS else StatusPillType.MUTED
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        verticalAlignment = Alignment.Bottom
                    ) {
                        val mag = telemetry?.accelMagnitude
                        Text(
                            text = if (mag != null) String.format(Locale.US, "%.2f", mag) else "Unavailable",
                            color = MedicalVitalGreen,
                            fontSize = 38.sp,
                            fontWeight = FontWeight.Bold
                        )
                        if (mag != null) {
                            Text(
                                text = " g (Total Magnitude)",
                                color = TextSecondaryDark,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        val ax = telemetry?.accelX?.let { String.format(Locale.US, "%+.2f", it) } ?: "--"
                        val ay = telemetry?.accelY?.let { String.format(Locale.US, "%+.2f", it) } ?: "--"
                        val az = telemetry?.accelZ?.let { String.format(Locale.US, "%+.2f", it) } ?: "--"

                        Text(text = "X: $ax m/s²", color = TextSecondaryDark, fontSize = 12.sp)
                        Text(text = "Y: $ay m/s²", color = TextSecondaryDark, fontSize = 12.sp)
                        Text(text = "Z: $az m/s²", color = TextSecondaryDark, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 6. System Status Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkSurface),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "HARDWARE & TELEMETRY DIAGNOSTICS",
                        color = TextSecondaryDark,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
                    val lastUpdate = telemetry?.timestampMillis?.let { timeFormat.format(Date(it)) } ?: "Awaiting initial packet"
                    val isStale = telemetry?.isStale == true

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Last Update:", color = TextSecondaryDark, fontSize = 12.sp)
                        Text(
                            text = if (isStale && telemetry != null) "$lastUpdate (STALE)" else lastUpdate,
                            color = if (isStale) MedicalWarningAmber else TextPrimaryDark,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Sequence Number:", color = TextSecondaryDark, fontSize = 12.sp)
                        Text(
                            text = telemetry?.sequenceNumber?.toString() ?: "--",
                            color = TextPrimaryDark,
                            fontSize = 12.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Target Device:", color = TextSecondaryDark, fontSize = 12.sp)
                        Text(
                            text = BleConfig.TARGET_DEVICE_NAME,
                            color = MedicalAccentBlue,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp)) // Bottom nav padding
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 70.dp)
        )
    }
}

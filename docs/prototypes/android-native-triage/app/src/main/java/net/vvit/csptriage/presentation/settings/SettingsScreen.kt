package net.vvit.csptriage.presentation.settings

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Vibration
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.vvit.csptriage.presentation.components.StatusPill
import net.vvit.csptriage.presentation.components.StatusPillType
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

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onNavigateToContacts: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        viewModel.checkPermissions(context)
    }

    LaunchedEffect(state.feedbackMessage) {
        state.feedbackMessage?.let { msg ->
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
            // Header
            Text(
                text = "System Settings",
                color = TextPrimaryDark,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Device control, simulation & security preferences",
                color = TextSecondaryDark,
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 1. Simulation & Testing Commands (Firmware Control)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkCard),
                border = BorderStroke(1.dp, MedicalWarningAmber)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.BugReport,
                                contentDescription = null,
                                tint = MedicalWarningAmber
                            )
                            Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                            Text(
                                text = "HARDWARE SIMULATION COMMANDS",
                                color = TextSecondaryDark,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        StatusPill(
                            text = if (state.connectionState.isArmed) "Connected" else "Offline",
                            type = if (state.connectionState.isArmed) StatusPillType.SUCCESS else StatusPillType.MUTED
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Transmit documented test sequences directly to the ESP32 Device Control characteristic. These trigger in-firmware simulation algorithms without physical impacts.",
                        color = TextMutedDark,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { viewModel.triggerSimToggle() },
                            colors = ButtonDefaults.buttonColors(containerColor = MedicalWarningAmber),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("SIM (Toggle)", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }

                        Button(
                            onClick = { viewModel.triggerSimImpact() },
                            colors = ButtonDefaults.buttonColors(containerColor = MedicalEmergencyRed),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("SIM IMPACT", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 2. Emergency Contacts Shortcut Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkSurface),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.People, contentDescription = null, tint = MedicalAccentBlue)
                            Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                            Text(
                                text = "Emergency Contacts",
                                color = TextPrimaryDark,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = "Manage primary guardians and trauma hospital numbers",
                            color = TextSecondaryDark,
                            fontSize = 12.sp
                        )
                    }

                    Button(
                        onClick = onNavigateToContacts,
                        colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Manage", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 3. Notification & Alert Preferences
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkSurface),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "ALERT PREFERENCES",
                        color = TextSecondaryDark,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Notifications, contentDescription = null, tint = TextSecondaryDark)
                            Spacer(modifier = Modifier.padding(horizontal = 6.dp))
                            Text(text = "Auditory Sirens during Countdown", color = TextPrimaryDark, fontSize = 14.sp)
                        }
                        Switch(
                            checked = state.soundAlertsEnabled,
                            onCheckedChange = { viewModel.toggleSound(it) },
                            colors = SwitchDefaults.colors(checkedThumbColor = MedicalAccentBlue)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Vibration, contentDescription = null, tint = TextSecondaryDark)
                            Spacer(modifier = Modifier.padding(horizontal = 6.dp))
                            Text(text = "Haptic Vibration Warning Pattern", color = TextPrimaryDark, fontSize = 14.sp)
                        }
                        Switch(
                            checked = state.vibrationAlertsEnabled,
                            onCheckedChange = { viewModel.toggleVibration(it) },
                            colors = SwitchDefaults.colors(checkedThumbColor = MedicalAccentBlue)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 4. Permissions Status Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkSurface),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Security, contentDescription = null, tint = MedicalAccentBlue)
                        Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                        Text(
                            text = "ANDROID RUNTIME PERMISSIONS",
                            color = TextSecondaryDark,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    val p = state.permissions
                    PermissionStatusRow("Bluetooth Scanning (Nearby Devices)", p.hasBleScan)
                    PermissionStatusRow("Bluetooth Connect (Hardware Link)", p.hasBleConnect)
                    PermissionStatusRow("High-Precision GPS Location", p.hasFineLocation)
                    PermissionStatusRow("Post Notifications & Alarms", p.hasNotifications)
                    PermissionStatusRow("Send SMS (Optional Carrier Dispatch)", p.hasSms)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 5. About Application
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkSurface),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "ABOUT CSP TRIAGE", color = TextSecondaryDark, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = "CSP Prototype V1 — Accident Detection & Emergency Response Companion", color = TextPrimaryDark, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Text(text = "Institution: Vasireddy Venkatadri Institute of Technology (VVIT)", color = TextSecondaryDark, fontSize = 12.sp)
                    Text(text = "Programme: B.Tech Computer Science & Engineering (Batch 8)", color = TextSecondaryDark, fontSize = 12.sp)
                    Text(text = "Student Developer: VSK (Reg. No: 24BQ1A054O)", color = TextSecondaryDark, fontSize = 12.sp)
                    Text(text = "Project Guide: Mr. G. Lakshmi Narayana (Assist. Prof)", color = TextSecondaryDark, fontSize = 12.sp)
                    Text(text = "Target BLE Device: CSP-Triage-V1", color = MedicalAccentBlue, fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 70.dp)
        )
    }
}

@Composable
private fun PermissionStatusRow(name: String, isGranted: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = name, color = TextPrimaryDark, fontSize = 12.sp)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = if (isGranted) Icons.Default.Check else Icons.Default.Close,
                contentDescription = null,
                tint = if (isGranted) MedicalVitalGreen else MedicalEmergencyRed,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.padding(horizontal = 2.dp))
            Text(
                text = if (isGranted) "Granted" else "Missing",
                color = if (isGranted) MedicalVitalGreen else MedicalEmergencyRed,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

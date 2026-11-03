package net.vvit.csptriage.presentation.emergency

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.vvit.csptriage.data.location.LocationResult
import net.vvit.csptriage.domain.model.NotificationStatus
import net.vvit.csptriage.domain.model.OperatingMode
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun EmergencyScreen(
    viewModel: EmergencyViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.statusFeedback) {
        state.statusFeedback?.let { msg ->
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Emergency Response",
                        color = TextPrimaryDark,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Real-time trauma alert & dispatch coordination",
                        color = TextSecondaryDark,
                        fontSize = 13.sp
                    )
                }

                val hasActive = state.activeEvent != null
                StatusPill(
                    text = if (hasActive) "CRITICAL ALERT" else "STANDBY (ARMED)",
                    type = if (hasActive) StatusPillType.DANGER else StatusPillType.SUCCESS
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            val event = state.activeEvent
            if (event != null) {
                // Active Event Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MedicalEmergencyRed.copy(alpha = 0.15f)),
                    border = BorderStroke(1.5.dp, MedicalEmergencyRed)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "INCIDENT #${event.eventId}",
                                color = MedicalEmergencyRed,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            StatusPill(
                                text = event.mode.displayName,
                                type = if (event.mode == OperatingMode.REAL) StatusPillType.DANGER else StatusPillType.WARNING
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
                        Text(
                            text = "Detected: ${dateFormat.format(Date(event.createdAtMillis))}",
                            color = TextSecondaryDark,
                            fontSize = 12.sp
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Trauma Metrics Snapshot
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(text = "Heart Rate", color = TextSecondaryDark, fontSize = 11.sp)
                                Text(
                                    text = event.heartRateBpm?.let { "$it BPM" } ?: "Unavailable",
                                    color = TextPrimaryDark,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Column {
                                Text(text = "Blood Oxygen", color = TextSecondaryDark, fontSize = 11.sp)
                                Text(
                                    text = event.spo2Percent?.let { "$it%" } ?: "Unavailable",
                                    color = TextPrimaryDark,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Column {
                                Text(text = "Peak Impact", color = TextSecondaryDark, fontSize = 11.sp)
                                Text(
                                    text = "${event.peakAccelG}g",
                                    color = MedicalEmergencyRed,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Status of notification dispatch
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Dispatch Audit Status:",
                                color = TextSecondaryDark,
                                fontSize = 12.sp
                            )
                            StatusPill(
                                text = event.notificationStatus.displayName,
                                type = when (event.notificationStatus) {
                                    NotificationStatus.DELIVERED -> StatusPillType.SUCCESS
                                    NotificationStatus.INITIATED -> StatusPillType.INFO
                                    NotificationStatus.SENT -> StatusPillType.INFO
                                    NotificationStatus.FAILED -> StatusPillType.DANGER
                                    else -> StatusPillType.WARNING
                                }
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Cancel / False alarm button
                        OutlinedButton(
                            onClick = { viewModel.cancelEvent() },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                            border = BorderStroke(1.dp, Color.White),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Cancel / Mark as False Alarm", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else {
                // Standby Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MedicalDarkCard),
                    border = BorderStroke(1.dp, MedicalCardBorder)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = MedicalVitalGreen,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No Active Emergency Incidents",
                            color = TextPrimaryDark,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Sensors are armed. In the event of a verified collision or severe fall, rapid alert triage will activate automatically.",
                            color = TextSecondaryDark,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 16.dp),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 2. GPS Location Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkSurface),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = MedicalAccentBlue
                            )
                            Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                            Text(
                                text = "SMARTPHONE GPS COORDINATES",
                                color = TextSecondaryDark,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Button(
                            onClick = { viewModel.refreshLocation() },
                            colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue.copy(alpha = 0.2f), contentColor = MedicalAccentBlue),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh GPS", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.padding(horizontal = 2.dp))
                            Text("Refresh", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    val loc = state.location
                    if (state.isAcquiringLocation) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MedicalAccentBlue, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.padding(horizontal = 6.dp))
                            Text(text = "Acquiring high-accuracy satellite fix…", color = TextSecondaryDark, fontSize = 13.sp)
                        }
                    } else if (loc is LocationResult.Success) {
                        Text(
                            text = String.format(Locale.US, "%.5f° N, %.5f° E", loc.latitude, loc.longitude),
                            color = TextPrimaryDark,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Accuracy: ±${loc.accuracyMeters.toInt()} meters",
                            color = MedicalVitalGreen,
                            fontSize = 12.sp
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Button(
                            onClick = {
                                val mapIntent = Intent(Intent.ACTION_VIEW, Uri.parse(loc.googleMapsUrl))
                                context.startActivity(mapIntent)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Open in Google Maps", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else if (loc is LocationResult.GpsDisabled) {
                        Text(text = "GPS Provider is disabled. Please turn on Location in Android settings.", color = MedicalWarningAmber, fontSize = 13.sp)
                    } else if (loc is LocationResult.PermissionDenied) {
                        Text(text = "Location permission is not granted. Please allow location access in Settings.", color = MedicalEmergencyRed, fontSize = 13.sp)
                    } else {
                        Text(text = "GPS standing by. Satellite coordinates will attach automatically during incident triage.", color = TextMutedDark, fontSize = 13.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 3. Emergency Contacts Fanout Dispatch Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkSurface),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "EMERGENCY CONTACT NOTIFICATION DISPATCH",
                        color = TextSecondaryDark,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Initiate instant verified trauma SMS and WhatsApp messages to designated guardians and emergency room coordinators.",
                        color = TextMutedDark,
                        fontSize = 11.sp
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    if (state.contacts.isEmpty()) {
                        Text(
                            text = "No emergency contacts configured. Please configure contacts in the Settings or Contacts tab.",
                            color = MedicalWarningAmber,
                            fontSize = 12.sp
                        )
                    } else {
                        state.contacts.forEach { contact ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                shape = RoundedCornerShape(10.dp),
                                colors = CardDefaults.cardColors(containerColor = MedicalDarkCard),
                                border = BorderStroke(1.dp, if (contact.isPrimary) MedicalAccentBlue else MedicalCardBorder)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    text = contact.name,
                                                    color = TextPrimaryDark,
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                if (contact.isPrimary) {
                                                    Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                                                    StatusPill("Primary", StatusPillType.INFO)
                                                }
                                            }
                                            Text(
                                                text = "${contact.relationship} • ${contact.phoneNumber}",
                                                color = TextSecondaryDark,
                                                fontSize = 12.sp
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = { viewModel.dispatchSms(context, contact) },
                                            colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.Message, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.padding(horizontal = 2.dp))
                                            Text("Send SMS", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }

                                        Button(
                                            onClick = { viewModel.dispatchWhatsApp(context, contact) },
                                            colors = ButtonDefaults.buttonColors(containerColor = MedicalVitalGreen),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.padding(horizontal = 2.dp))
                                            Text("WhatsApp", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
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

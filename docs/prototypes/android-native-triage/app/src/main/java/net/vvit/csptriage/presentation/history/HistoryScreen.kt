package net.vvit.csptriage.presentation.history

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.vvit.csptriage.domain.model.AccidentState
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
fun HistoryScreen(
    viewModel: HistoryViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val filterScrollState = rememberScrollState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MedicalDarkBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
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
                        text = "Event History",
                        color = TextPrimaryDark,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Durable incident audit log (Room / SQLite)",
                        color = TextSecondaryDark,
                        fontSize = 13.sp
                    )
                }

                if (state.events.isNotEmpty()) {
                    IconButton(onClick = { viewModel.clearHistory() }) {
                        Icon(
                            imageVector = Icons.Default.DeleteSweep,
                            contentDescription = "Clear History",
                            tint = MedicalEmergencyRed
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Filters Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(filterScrollState),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = state.selectedModeFilter == null,
                    onClick = { viewModel.setModeFilter(null) },
                    label = { Text("All Modes") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MedicalAccentBlue,
                        selectedLabelColor = Color.Black
                    )
                )

                FilterChip(
                    selected = state.selectedModeFilter == OperatingMode.REAL,
                    onClick = { viewModel.setModeFilter(OperatingMode.REAL) },
                    label = { Text("Real Hardware") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MedicalVitalGreen,
                        selectedLabelColor = Color.Black
                    )
                )

                FilterChip(
                    selected = state.selectedModeFilter == OperatingMode.SIMULATION,
                    onClick = { viewModel.setModeFilter(OperatingMode.SIMULATION) },
                    label = { Text("Simulation (Demo)") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MedicalWarningAmber,
                        selectedLabelColor = Color.Black
                    )
                )

                FilterChip(
                    selected = state.selectedStateFilter == AccidentState.EMERGENCY_ALERT,
                    onClick = {
                        val newFilter = if (state.selectedStateFilter == AccidentState.EMERGENCY_ALERT) null else AccidentState.EMERGENCY_ALERT
                        viewModel.setStateFilter(newFilter)
                    },
                    label = { Text("Emergency Alerts") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MedicalEmergencyRed,
                        selectedLabelColor = Color.White
                    )
                )

                FilterChip(
                    selected = state.selectedStateFilter == AccidentState.CANCELLED,
                    onClick = {
                        val newFilter = if (state.selectedStateFilter == AccidentState.CANCELLED) null else AccidentState.CANCELLED
                        viewModel.setStateFilter(newFilter)
                    },
                    label = { Text("Cancelled (False Alarms)") }
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (state.events.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 60.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "No Recorded Events Found",
                            color = TextPrimaryDark,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Crash alerts, candidates, and cancellations persist here.",
                            color = TextMutedDark,
                            fontSize = 12.sp
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(state.events) { item ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MedicalDarkCard),
                            border = BorderStroke(1.dp, MedicalCardBorder)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "INCIDENT #${item.eventId}",
                                        color = if (item.state == AccidentState.EMERGENCY_ALERT) MedicalEmergencyRed else MedicalAccentBlue,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )

                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        StatusPill(
                                            text = item.mode.displayName,
                                            type = if (item.mode == OperatingMode.REAL) StatusPillType.DANGER else StatusPillType.WARNING
                                        )
                                        StatusPill(
                                            text = item.state.displayName,
                                            type = if (item.state == AccidentState.EMERGENCY_ALERT) StatusPillType.DANGER else StatusPillType.MUTED
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
                                Text(
                                    text = dateFormat.format(Date(item.createdAtMillis)),
                                    color = TextSecondaryDark,
                                    fontSize = 12.sp
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "HR: ${item.heartRateBpm?.let { "$it BPM" } ?: "Unavailable"}",
                                        color = TextPrimaryDark,
                                        fontSize = 12.sp
                                    )
                                    Text(
                                        text = "SpO2: ${item.spo2Percent?.let { "$it%" } ?: "Unavailable"}",
                                        color = TextPrimaryDark,
                                        fontSize = 12.sp
                                    )
                                    Text(
                                        text = "Impact: ${item.peakAccelG}g",
                                        color = TextPrimaryDark,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }

                                if (item.latitude != null && item.longitude != null) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = String.format(Locale.US, "GPS: %.4f, %.4f", item.latitude, item.longitude),
                                            color = MedicalVitalGreen,
                                            fontSize = 11.sp
                                        )

                                        Button(
                                            onClick = {
                                                val url = "https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}"
                                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue.copy(alpha = 0.2f), contentColor = MedicalAccentBlue),
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.padding(horizontal = 2.dp))
                                            Text("Map", fontSize = 11.sp)
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = "Audit Dispatch:", color = TextMutedDark, fontSize = 11.sp)
                                    Text(
                                        text = item.notificationStatus.displayName,
                                        color = TextSecondaryDark,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    item {
                        Spacer(modifier = Modifier.height(80.dp))
                    }
                }
            }
        }
    }
}

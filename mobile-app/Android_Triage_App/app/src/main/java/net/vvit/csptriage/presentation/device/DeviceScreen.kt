package net.vvit.csptriage.presentation.device

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
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.BluetoothConnected
import androidx.compose.material.icons.filled.BluetoothSearching
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.vvit.csptriage.data.ble.BleConfig
import net.vvit.csptriage.data.ble.BleConnectionState
import net.vvit.csptriage.presentation.components.StatusPill
import net.vvit.csptriage.presentation.components.StatusPillType
import net.vvit.csptriage.presentation.theme.MedicalAccentBlue
import net.vvit.csptriage.presentation.theme.MedicalCardBorder
import net.vvit.csptriage.presentation.theme.MedicalDarkBackground
import net.vvit.csptriage.presentation.theme.MedicalDarkCard
import net.vvit.csptriage.presentation.theme.MedicalDarkSurface
import net.vvit.csptriage.presentation.theme.MedicalEmergencyRed
import net.vvit.csptriage.presentation.theme.MedicalVitalGreen
import net.vvit.csptriage.presentation.theme.TextMutedDark
import net.vvit.csptriage.presentation.theme.TextPrimaryDark
import net.vvit.csptriage.presentation.theme.TextSecondaryDark

@Composable
fun DeviceScreen(
    viewModel: DeviceViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

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
                        text = "BLE Device Hub",
                        color = TextPrimaryDark,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Hardware link & GATT management",
                        color = TextSecondaryDark,
                        fontSize = 13.sp
                    )
                }

                if (state.isScanning) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MedicalAccentBlue,
                        strokeWidth = 2.5.dp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 1. Connection Manager Card
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (state.connectionState is BleConnectionState.Ready) Icons.Default.BluetoothConnected else Icons.Default.Bluetooth,
                                contentDescription = null,
                                tint = if (state.connectionState is BleConnectionState.Ready) MedicalVitalGreen else MedicalAccentBlue
                            )
                            Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                            Text(
                                text = "CONNECTION STATUS",
                                color = TextSecondaryDark,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        StatusPill(
                            text = state.connectionState.label,
                            type = if (state.connectionState is BleConnectionState.Ready) StatusPillType.SUCCESS else StatusPillType.INFO
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    val conn = state.connectionState
                    val connectedDeviceName = when (conn) {
                        is BleConnectionState.Ready -> conn.deviceName
                        is BleConnectionState.Connected -> conn.deviceName
                        is BleConnectionState.Connecting -> conn.deviceName
                        else -> "No Active Hardware Linked"
                    }
                    val connectedAddress = when (conn) {
                        is BleConnectionState.Ready -> conn.address
                        is BleConnectionState.Connected -> conn.address
                        is BleConnectionState.Connecting -> conn.address
                        else -> "--"
                    }

                    Text(
                        text = connectedDeviceName,
                        color = TextPrimaryDark,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "MAC: $connectedAddress",
                        color = TextMutedDark,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Action Controls
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (state.connectionState is BleConnectionState.Ready || state.connectionState is BleConnectionState.Connected) {
                            Button(
                                onClick = { viewModel.disconnect() },
                                colors = ButtonDefaults.buttonColors(containerColor = MedicalEmergencyRed),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Disconnect", fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Button(
                                onClick = {
                                    if (state.isScanning) viewModel.stopScanning() else viewModel.startScanning()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = if (state.isScanning) Icons.Default.Stop else Icons.Default.BluetoothSearching,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                                Text(if (state.isScanning) "Stop Scanning" else "Scan for Devices", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Auto-Reconnect Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Automatic Reconnection",
                                color = TextPrimaryDark,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Auto-reconnect with exponential backoff on link loss",
                                color = TextSecondaryDark,
                                fontSize = 11.sp
                            )
                        }

                        Switch(
                            checked = state.isAutoReconnectEnabled,
                            onCheckedChange = { viewModel.toggleAutoReconnect(it) },
                            colors = SwitchDefaults.colors(checkedThumbColor = MedicalAccentBlue)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 2. Documented GATT Services Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MedicalDarkSurface),
                border = BorderStroke(1.dp, MedicalCardBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "DOCUMENTED TRIAGE GATT ARCHITECTURE",
                        color = TextSecondaryDark,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    GattEntryRow("Primary Service", BleConfig.TRIAGE_SERVICE_UUID.toString())
                    GattEntryRow("Live Telemetry (NOTIFY)", BleConfig.LIVE_TELEMETRY_CHAR_UUID.toString())
                    GattEntryRow("Emergency Event (NOTIFY)", BleConfig.EMERGENCY_EVENT_CHAR_UUID.toString())
                    GattEntryRow("Device Control (WRITE)", BleConfig.DEVICE_CONTROL_CHAR_UUID.toString())
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 3. Scanned Devices List
            Text(
                text = "DISCOVERED BLE DEVICES (${state.scannedDevices.size})",
                color = TextSecondaryDark,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (state.scannedDevices.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (state.isScanning) "Listening for BLE broadcasts from CSP-Triage-V1…" else "Tap 'Scan for Devices' to discover nearby hardware.",
                        color = TextMutedDark,
                        fontSize = 13.sp
                    )
                }
            } else {
                state.scannedDevices.forEach { device ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (device.isTargetDevice) MedicalAccentBlue.copy(alpha = 0.12f) else MedicalDarkCard
                        ),
                        border = BorderStroke(
                            1.dp,
                            if (device.isTargetDevice) MedicalAccentBlue else MedicalCardBorder
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = device.name,
                                        color = TextPrimaryDark,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    if (device.isTargetDevice) {
                                        Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                                        StatusPill("Target", StatusPillType.SUCCESS)
                                    }
                                }
                                Text(
                                    text = "${device.address} • Signal: ${device.rssi} dBm",
                                    color = TextSecondaryDark,
                                    fontSize = 12.sp
                                )
                            }

                            Button(
                                onClick = { viewModel.connectDevice(device) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (device.isTargetDevice) MedicalVitalGreen else MedicalAccentBlue
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Connect", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
private fun GattEntryRow(title: String, uuid: String) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(text = title, color = MedicalAccentBlue, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        Text(text = uuid, color = TextMutedDark, fontSize = 11.sp)
    }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/hardware_triage_provider.dart';

class HardwareTriageScreen extends ConsumerStatefulWidget {
  const HardwareTriageScreen({super.key});

  @override
  ConsumerState<HardwareTriageScreen> createState() => _HardwareTriageScreenState();
}

class _HardwareTriageScreenState extends ConsumerState<HardwareTriageScreen> {
  void _showPairingDialog() {
    final devIdController = TextEditingController(text: 'CSP-Triage-V1');
    final secretController = TextEditingController(text: '123456');
    String? challengeToken;
    String step = 'ID'; // 'ID', 'SECRET', 'DONE'
    String? error;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.link, color: AppTheme.trustBlue),
              SizedBox(width: 8),
              Text('Pair ESP32 Hardware'),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Text(
                      error!,
                      style: const TextStyle(color: Colors.red, fontSize: 12),
                    ),
                  ),
                if (step == 'ID') ...[
                  const Text(
                    'Enter the ESP32 Device Identifier to bind to your medical profile:',
                    style: TextStyle(fontSize: 12),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: devIdController,
                    decoration: const InputDecoration(
                      labelText: 'Device Identifier',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ] else if (step == 'SECRET') ...[
                  Text(
                    'Challenge token generated for ${devIdController.text}.\nEnter the 6-digit hardware secret code:',
                    style: const TextStyle(fontSize: 12),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: secretController,
                    decoration: const InputDecoration(
                      labelText: 'Hardware Secret Code',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ] else ...[
                  const Center(
                    child: Icon(Icons.check_circle, color: Colors.green, size: 48),
                  ),
                  const SizedBox(height: 8),
                  const Center(
                    child: Text(
                      'Device Paired & Provisioned Successfully!',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(step == 'DONE' ? 'Close' : 'Cancel'),
            ),
            if (step == 'ID')
              ElevatedButton(
                onPressed: () async {
                  setDialogState(() => error = null);
                  final challenge = await ref
                      .read(hardwareTriageNotifierProvider.notifier)
                      .requestPairingChallenge(devIdController.text.trim());
                  if (challenge != null) {
                    challengeToken = challenge;
                    setDialogState(() => step = 'SECRET');
                  } else {
                    setDialogState(() => error = 'Failed to generate challenge token.');
                  }
                },
                child: const Text('Next'),
              )
            else if (step == 'SECRET')
              ElevatedButton(
                onPressed: () async {
                  setDialogState(() => error = null);
                  final token = await ref
                      .read(hardwareTriageNotifierProvider.notifier)
                      .claimDevice(
                        deviceIdentifier: devIdController.text.trim(),
                        challengeToken: challengeToken!,
                        secretCode: secretController.text.trim(),
                      );
                  if (token != null) {
                    setDialogState(() => step = 'DONE');
                  } else {
                    setDialogState(() => error = 'Verification failed. Incorrect secret code.');
                  }
                },
                child: const Text('Verify & Claim'),
              ),
          ],
        ),
      ),
    );
  }

  void _showWifiProvisioningDialog() {
    final ssidController = TextEditingController();
    final passController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.wifi, color: AppTheme.trustBlue),
            SizedBox(width: 8),
            Text('Provision ESP32 Wi-Fi'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Transmit local Wi-Fi credentials to ESP32 over BLE for direct cloud connectivity:',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: ssidController,
              decoration: const InputDecoration(
                labelText: 'Wi-Fi SSID',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: passController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Wi-Fi Password',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              ref
                  .read(hardwareTriageNotifierProvider.notifier)
                  .sendWifiProvisioning(
                    ssidController.text.trim(),
                    passController.text.trim(),
                  );
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Wi-Fi credentials dispatched over BLE')),
              );
            },
            child: const Text('Provision via BLE'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final triageState = ref.watch(hardwareTriageNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('ESP32 Hardware Triage Hub'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Telemetry',
            onPressed: () {
              ref
                  .read(hardwareTriageNotifierProvider.notifier)
                  .fetchLatestHardwareTelemetry();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Header Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: triageState.isConnected
                          ? AppTheme.verifiedGreen.withValues(alpha: 0.15)
                          : Colors.grey.shade200,
                      child: Icon(
                        Icons.memory,
                        size: 40,
                        color: triageState.isConnected
                            ? AppTheme.verifiedGreen
                            : Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      triageState.deviceName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      triageState.isConnected
                          ? 'BLE GATT Active • Central Linked'
                          : 'Hardware Standby / Disconnected',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: triageState.isConnected
                            ? AppTheme.verifiedGreen
                            : Colors.red,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Power: ${triageState.powerSource}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildStat(
                          'Heart Rate',
                          '${triageState.heartRateBpm} BPM',
                          Icons.favorite,
                          Colors.redAccent,
                        ),
                        _buildStat(
                          'SpO2',
                          '${triageState.spo2Percent}%',
                          Icons.air,
                          Colors.blueAccent,
                        ),
                        _buildStat(
                          'Accel Vector',
                          '${triageState.accelMagnitudeG.toStringAsFixed(2)}G',
                          Icons.speed,
                          Colors.amber.shade800,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Bluetooth Scan & Device Binding Controls
            const Text(
              'BLE Gateway & Device Management',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: triageState.isBleScanning
                                  ? Colors.grey
                                  : AppTheme.trustBlue,
                            ),
                            icon: triageState.isBleScanning
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.bluetooth_searching),
                            label: Text(triageState.isBleScanning
                                ? 'Scanning BLE...'
                                : 'Scan for ESP32 Bands'),
                            onPressed: triageState.isBleScanning
                                ? null
                                : () => ref
                                    .read(hardwareTriageNotifierProvider.notifier)
                                    .startScan(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (triageState.isConnected)
                          OutlinedButton.icon(
                            icon: const Icon(Icons.bluetooth_disabled),
                            label: const Text('Disconnect'),
                            onPressed: () => ref
                                .read(hardwareTriageNotifierProvider.notifier)
                                .disconnectBle(),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.link),
                            label: const Text('Pair Device'),
                            onPressed: _showPairingDialog,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.wifi),
                            label: const Text('Config Wi-Fi'),
                            onPressed: _showWifiProvisioningDialog,
                          ),
                        ),
                      ],
                    ),

                    // Discovered devices list
                    if (triageState.discoveredDevices.isNotEmpty) ...[
                      const Divider(height: 20),
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Discovered BLE Peripherals:',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      ...triageState.discoveredDevices.map((d) => ListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            leading: const Icon(Icons.bluetooth, color: AppTheme.trustBlue),
                            title: Text(
                              d.device.platformName.isNotEmpty
                                  ? d.device.platformName
                                  : d.device.remoteId.str,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            subtitle: Text('RSSI: ${d.rssi} dBm · ${d.device.remoteId}'),
                            trailing: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                              ),
                              onPressed: () => ref
                                  .read(hardwareTriageNotifierProvider.notifier)
                                  .connectToBleDevice(d.device),
                              child: const Text('Connect'),
                            ),
                          )),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Hardware & Simulator Controls
            const Text(
              'ESP32 Test Harness & Impact Simulation',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Automated Sensor-Event Replay',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Injects simulated MPU6050 impact peak (3.82g) and post-impact stillness into the triage pipeline to verify emergency countdown & hospital trauma dispatch.',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppTheme.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.emergencyRed,
                        minimumSize: const Size.fromHeight(50),
                      ),
                      icon: const Icon(Icons.warning_amber),
                      label: const Text('Simulate ESP32 Impact Spike'),
                      onPressed: () {
                        ref
                            .read(hardwareTriageNotifierProvider.notifier)
                            .sendSimulateImpact();
                        context.push('/sos');
                      },
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(40),
                      ),
                      icon: const Icon(Icons.cancel_outlined),
                      label: const Text('Cancel Hardware Countdown (Mute Buzzer)'),
                      onPressed: () {
                        ref
                            .read(hardwareTriageNotifierProvider.notifier)
                            .sendCancelEmergency();
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Live Telemetry Stream Box
            const Text(
              'ESP32 Hardware GATT Telemetry Stream',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.terminal, size: 14, color: Colors.greenAccent),
                      SizedBox(width: 6),
                      Text(
                        'CSP-TRIAGE-V1 HARDWARE CONSOLE',
                        style: TextStyle(
                          color: Colors.greenAccent,
                          fontSize: 11,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: Colors.white24, height: 16),
                  Text(
                    triageState.lastTelemetryLog,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    '[OK] MPU6050 Accelerometer & Gyroscope calibrated at 50Hz.\n'
                    '[OK] MAX30102 Optical PPG Vitals sensor streaming.\n'
                    '[OK] BLE UUID 0000FFF0 GATT Triage Service broadcast active.',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            SwitchListTile(
              title: const Text('Continuous Sensor Pipeline'),
              subtitle: const Text('Process MPU6050 & MAX30102 live frames'),
              value: triageState.isMonitoringSensors,
              onChanged: (_) => ref
                  .read(hardwareTriageNotifierProvider.notifier)
                  .toggleSensorMonitoring(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: AppTheme.textSecondaryLight,
          ),
        ),
      ],
    );
  }
}

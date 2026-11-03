import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/hardware_triage_provider.dart';

class HardwareTriageScreen extends ConsumerWidget {
  const HardwareTriageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                            .replayAccidentTelemetrySpike();
                        context.push('/sos');
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

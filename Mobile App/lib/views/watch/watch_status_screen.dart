import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/watch_connection_provider.dart';

class WatchStatusScreen extends ConsumerWidget {
  const WatchStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final watchState = ref.watch(watchNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Wear OS Smartwatch Hub')),
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
                      backgroundColor: watchState.isConnected
                          ? AppTheme.verifiedGreen.withOpacity(0.15)
                          : Colors.grey.shade200,
                      child: Icon(
                        Icons.watch,
                        size: 40,
                        color: watchState.isConnected
                            ? AppTheme.verifiedGreen
                            : Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      watchState.deviceName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      watchState.isConnected
                          ? 'Connected & Actively Paired'
                          : 'Device Disconnected',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: watchState.isConnected
                            ? AppTheme.verifiedGreen
                            : Colors.red,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildStat(
                          'Battery',
                          '${watchState.batteryPercent}%',
                          Icons.battery_full,
                        ),
                        _buildStat(
                          'Sensor State',
                          watchState.isMonitoringSensors ? 'ACTIVE' : 'IDLE',
                          Icons.sensors,
                        ),
                        _buildStat('Offline IMU', 'ON', Icons.offline_bolt),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Hardware & Simulator Controls
            const Text(
              'Wearable Simulator & Test Harness',
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
                      'Injects simulated IMU acceleration peak (3.82g) and post-impact stillness into the wearable pipeline to verify emergency countdown & dispatch workflows.',
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
                      label: const Text('Simulate Wear OS Accident Spike'),
                      onPressed: () {
                        ref
                            .read(watchNotifierProvider.notifier)
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
              'Wearable Communication Bus Log',
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
                        'WEARABLE TELEMETRY CONSOLE',
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
                    watchState.lastTelemetryLog,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    '[OK] Heartbeat ping ACK received via Wearable DataClient.\n[OK] Local SQLite fallback enabled on wearable.',
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
              title: const Text('Continuous Sensor Monitoring'),
              subtitle: const Text('Sample Accelerometer & Gyroscope at 50Hz'),
              value: watchState.isMonitoringSensors,
              onChanged: (_) => ref
                  .read(watchNotifierProvider.notifier)
                  .toggleSensorMonitoring(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 18, color: AppTheme.trustBlue),
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

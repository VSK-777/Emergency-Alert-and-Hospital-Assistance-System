import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'emergency_provider.dart';

class WatchState {
  final bool isConnected;
  final String deviceName;
  final int batteryPercent;
  final bool isMonitoringSensors;
  final String lastTelemetryLog;

  WatchState({
    this.isConnected = true,
    this.deviceName = 'Wear OS Galaxy Watch / Emulator (Wear_OS_Round)',
    this.batteryPercent = 88,
    this.isMonitoringSensors = true,
    this.lastTelemetryLog =
        'Wearable sensor pipeline active: Accel 1.01g, Gyro 0.02 rad/s',
  });

  WatchState copyWith({
    bool? isConnected,
    String? deviceName,
    int? batteryPercent,
    bool? isMonitoringSensors,
    String? lastTelemetryLog,
  }) {
    return WatchState(
      isConnected: isConnected ?? this.isConnected,
      deviceName: deviceName ?? this.deviceName,
      batteryPercent: batteryPercent ?? this.batteryPercent,
      isMonitoringSensors: isMonitoringSensors ?? this.isMonitoringSensors,
      lastTelemetryLog: lastTelemetryLog ?? this.lastTelemetryLog,
    );
  }
}

class WatchNotifier extends StateNotifier<WatchState> {
  final Ref ref;

  WatchNotifier(this.ref) : super(WatchState());

  void toggleConnection() {
    state = state.copyWith(isConnected: !state.isConnected);
  }

  void toggleSensorMonitoring() {
    state = state.copyWith(isMonitoringSensors: !state.isMonitoringSensors);
  }

  // Sensor Replay Harness: Simulates an impact spike event received from watch
  void replayAccidentTelemetrySpike() {
    state = state.copyWith(
      lastTelemetryLog:
          'CRITICAL EVENT: Peak Accel 3.82g, Gyro 480 dps. Inactivity 10s detected.',
    );

    // Trigger phone-side emergency countdown
    ref
        .read(emergencyNotifierProvider.notifier)
        .startEmergencyCountdown(
          source: 'SMARTWATCH_AUTO',
          reason:
              'Severe impact and sudden deceleration detected by Smartwatch IMU',
          score: 0.94,
          countdownDuration: 10,
        );
  }
}

final watchNotifierProvider = StateNotifierProvider<WatchNotifier, WatchState>((
  ref,
) {
  return WatchNotifier(ref);
});

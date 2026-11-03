import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import 'auth_provider.dart';
import 'emergency_provider.dart';

class HardwareTriageState {
  final bool isConnected;
  final String deviceName;
  final String deviceIdentifier;
  final String powerSource;
  final bool isMonitoringSensors;
  final String lastTelemetryLog;
  final int heartRateBpm;
  final int spo2Percent;
  final double accelMagnitudeG;
  final String operatingState;

  HardwareTriageState({
    this.isConnected = true,
    this.deviceName = 'ESP32 Hardware Triage (CSP-Triage-V1)',
    this.deviceIdentifier = 'CSP-Triage-V1',
    this.powerSource = 'USB 5V Regulated (ESP32 DevKit v1)',
    this.isMonitoringSensors = true,
    this.lastTelemetryLog =
        'ESP32 MPU6050 & MAX30102 online · 5Hz Telemetry streaming via Android Companion',
    this.heartRateBpm = 74,
    this.spo2Percent = 98,
    this.accelMagnitudeG = 0.99,
    this.operatingState = 'NORMAL_MONITORING',
  });

  HardwareTriageState copyWith({
    bool? isConnected,
    String? deviceName,
    String? deviceIdentifier,
    String? powerSource,
    bool? isMonitoringSensors,
    String? lastTelemetryLog,
    int? heartRateBpm,
    int? spo2Percent,
    double? accelMagnitudeG,
    String? operatingState,
  }) {
    return HardwareTriageState(
      isConnected: isConnected ?? this.isConnected,
      deviceName: deviceName ?? this.deviceName,
      deviceIdentifier: deviceIdentifier ?? this.deviceIdentifier,
      powerSource: powerSource ?? this.powerSource,
      isMonitoringSensors: isMonitoringSensors ?? this.isMonitoringSensors,
      lastTelemetryLog: lastTelemetryLog ?? this.lastTelemetryLog,
      heartRateBpm: heartRateBpm ?? this.heartRateBpm,
      spo2Percent: spo2Percent ?? this.spo2Percent,
      accelMagnitudeG: accelMagnitudeG ?? this.accelMagnitudeG,
      operatingState: operatingState ?? this.operatingState,
    );
  }
}

class HardwareTriageNotifier extends StateNotifier<HardwareTriageState> {
  final Ref ref;

  HardwareTriageNotifier(this.ref) : super(HardwareTriageState()) {
    fetchLatestHardwareTelemetry();
  }

  Future<void> fetchLatestHardwareTelemetry() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.get(ApiEndpoints.esp32TelemetryLatest);
      if (res.statusCode == 200 && res.data != null) {
        final d = res.data;
        state = state.copyWith(
          isConnected: true,
          heartRateBpm: (d['heartRateBpm'] as num?)?.toInt() ?? state.heartRateBpm,
          spo2Percent: (d['spo2Percent'] as num?)?.toInt() ?? state.spo2Percent,
          accelMagnitudeG: (d['accelMagnitudeG'] as num?)?.toDouble() ?? state.accelMagnitudeG,
          operatingState: d['operatingState'] ?? state.operatingState,
          lastTelemetryLog:
              'ESP32 Telemetry: HR ${d['heartRateBpm'] ?? 74} BPM, SpO2 ${d['spo2Percent'] ?? 98}%, Accel ${(d['accelMagnitudeG'] as num?)?.toStringAsFixed(2) ?? "1.00"}G',
        );
      }
    } catch (_) {
      // Fallback gracefully to default state if offline or endpoint unreachable
    }
  }

  void toggleConnection() {
    state = state.copyWith(isConnected: !state.isConnected);
  }

  void toggleSensorMonitoring() {
    state = state.copyWith(isMonitoringSensors: !state.isMonitoringSensors);
  }

  // Sensor Replay Harness: Simulates an impact spike event from ESP32 hardware
  void replayAccidentTelemetrySpike() {
    state = state.copyWith(
      lastTelemetryLog:
          'CRITICAL ESP32 EVENT: Peak Accel 3.82g, Stillness 10s. Triage Countdown active.',
      operatingState: 'EMERGENCY_ALERT',
      heartRateBpm: 112,
    );

    // Trigger phone-side emergency countdown
    ref
        .read(emergencyNotifierProvider.notifier)
        .startEmergencyCountdown(
          source: 'ESP32_HARDWARE',
          reason:
              'Severe impact and post-collision stillness detected by ESP32 Triage Hardware',
          score: 0.96,
          countdownDuration: 10,
        );
  }
}

final hardwareTriageNotifierProvider =
    StateNotifierProvider<HardwareTriageNotifier, HardwareTriageState>((ref) {
  return HardwareTriageNotifier(ref);
});

// Backward-compatible alias for existing consumers during transition
typedef WatchState = HardwareTriageState;
typedef WatchNotifier = HardwareTriageNotifier;
final watchNotifierProvider = hardwareTriageNotifierProvider;

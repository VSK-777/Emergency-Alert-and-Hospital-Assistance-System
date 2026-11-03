import 'dart:async';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import '../services/ble_service.dart';
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
  final bool isBleScanning;
  final String pairingStatus;
  final String? pairingChallenge;
  final String? provisionedToken;
  final List<ScanResult> discoveredDevices;

  HardwareTriageState({
    this.isConnected = false,
    this.deviceName = 'ESP32 Hardware Triage (CSP-Triage-V1)',
    this.deviceIdentifier = 'CSP-Triage-V1',
    this.powerSource = 'USB 5V Regulated (ESP32 DevKit v1)',
    this.isMonitoringSensors = true,
    this.lastTelemetryLog =
        'GATT Triage Gateway initialized · Ready to scan for ESP32 DevKit v1',
    this.heartRateBpm = 72,
    this.spo2Percent = 98,
    this.accelMagnitudeG = 0.99,
    this.operatingState = 'NORMAL_MONITORING',
    this.isBleScanning = false,
    this.pairingStatus = 'PAIRED',
    this.pairingChallenge,
    this.provisionedToken,
    this.discoveredDevices = const [],
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
    bool? isBleScanning,
    String? pairingStatus,
    String? pairingChallenge,
    String? provisionedToken,
    List<ScanResult>? discoveredDevices,
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
      isBleScanning: isBleScanning ?? this.isBleScanning,
      pairingStatus: pairingStatus ?? this.pairingStatus,
      pairingChallenge: pairingChallenge ?? this.pairingChallenge,
      provisionedToken: provisionedToken ?? this.provisionedToken,
      discoveredDevices: discoveredDevices ?? this.discoveredDevices,
    );
  }
}

class HardwareTriageNotifier extends StateNotifier<HardwareTriageState> {
  final Ref ref;
  final BleTriageService bleService = BleTriageService();
  StreamSubscription? _bleTelemetrySub;
  StreamSubscription? _bleEmergencySub;
  StreamSubscription? _bleScanSub;
  StreamSubscription? _bleStatusSub;

  HardwareTriageNotifier(this.ref) : super(HardwareTriageState()) {
    _initBleSubscriptions();
    fetchLatestHardwareTelemetry();
  }

  void _initBleSubscriptions() {
    _bleStatusSub = bleService.statusStream.listen((status) {
      state = state.copyWith(lastTelemetryLog: status);
    });

    _bleScanSub = bleService.scanResults.listen((results) {
      state = state.copyWith(discoveredDevices: results);
    });

    _bleTelemetrySub = bleService.telemetryStream.listen((t) {
      state = state.copyWith(
        isConnected: true,
        heartRateBpm: t.heartRate > 0 ? t.heartRate : state.heartRateBpm,
        spo2Percent: t.spo2 > 0 ? t.spo2 : state.spo2Percent,
        accelMagnitudeG: t.accelMagnitude,
        operatingState: t.stateName,
        lastTelemetryLog:
            'GATT Packet #0x01: HR ${t.heartRate} BPM, SpO2 ${t.spo2}%, Accel ${t.accelMagnitude.toStringAsFixed(2)}G, State: ${t.stateName}',
      );

      // Relay telemetry to Spring Boot backend
      _forwardTelemetryToBackend(t);
    });

    _bleEmergencySub = bleService.emergencyStream.listen((e) {
      state = state.copyWith(
        operatingState: 'EMERGENCY_ALERT',
        lastTelemetryLog:
            'CRITICAL ESP32 EVENT: Peak Accel ${e.peakAccelG.toStringAsFixed(2)}g, Stillness ${e.stillnessSec.toStringAsFixed(1)}s.',
      );

      // Trigger phone-side emergency countdown and trauma dispatch
      ref.read(emergencyNotifierProvider.notifier).startEmergencyCountdown(
            source: 'ESP32_HARDWARE',
            reason:
                'Severe impact (${e.peakAccelG.toStringAsFixed(2)}g) and stillness (${e.stillnessSec.toStringAsFixed(1)}s) confirmed by ESP32 Triage Hardware',
            score: 0.98,
            countdownDuration: 10,
          );
    });
  }

  Future<void> _forwardTelemetryToBackend(DecodedTelemetry t) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final payload = t.toJson(state.deviceIdentifier);
      await apiClient.dio.post(ApiEndpoints.deviceTelemetry, data: payload);
    } catch (_) {
      // Backend relay offline fallback
    }
  }

  Future<void> startScan() async {
    state = state.copyWith(isBleScanning: true);
    await bleService.startScan();
    state = state.copyWith(isBleScanning: false);
  }

  Future<void> stopScan() async {
    await bleService.stopScan();
    state = state.copyWith(isBleScanning: false);
  }

  Future<bool> connectToBleDevice(BluetoothDevice device) async {
    final success = await bleService.connectToDevice(device);
    state = state.copyWith(
      isConnected: success,
      deviceName: device.platformName.isNotEmpty
          ? device.platformName
          : device.remoteId.str,
    );
    return success;
  }

  Future<void> disconnectBle() async {
    await bleService.disconnect();
    state = state.copyWith(isConnected: false);
  }

  Future<String?> requestPairingChallenge(String deviceIdentifier) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.post(
        ApiEndpoints.devicePairingChallenge,
        data: {'deviceIdentifier': deviceIdentifier},
      );
      if (res.statusCode == 200 && res.data != null) {
        final challenge = res.data['challengeToken'] as String?;
        state = state.copyWith(
          deviceIdentifier: deviceIdentifier,
          pairingChallenge: challenge,
        );
        return challenge;
      }
    } catch (_) {}
    return null;
  }

  Future<String?> claimDevice({
    required String deviceIdentifier,
    required String challengeToken,
    required String secretCode,
  }) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.post(
        ApiEndpoints.deviceClaim,
        data: {
          'deviceIdentifier': deviceIdentifier,
          'challengeToken': challengeToken,
          'secretCode': secretCode,
        },
      );
      if (res.statusCode == 200 && res.data != null) {
        final token = res.data['token'] as String?;
        state = state.copyWith(
          pairingStatus: 'PAIRED',
          provisionedToken: token,
          lastTelemetryLog: 'Device paired successfully. Token provisioned.',
        );

        // If connected via BLE, auto-provision token to ESP32 firmware
        if (token != null && bleService.isConnected) {
          await bleService.provisionDeviceAuthToken(token);
        }

        return token;
      }
    } catch (_) {}
    return null;
  }

  Future<void> sendCancelEmergency() async {
    if (bleService.isConnected) {
      await bleService.sendCancelCountdown();
    }
  }

  Future<void> sendSimulateImpact() async {
    if (bleService.isConnected) {
      await bleService.simulateImpactSpike();
    } else {
      replayAccidentTelemetrySpike();
    }
  }

  Future<void> sendWifiProvisioning(String ssid, String pass) async {
    if (bleService.isConnected) {
      await bleService.provisionWifi(ssid, pass);
    }
  }

  Future<void> fetchLatestHardwareTelemetry() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.get(ApiEndpoints.esp32TelemetryLatest);
      if (res.statusCode == 200 && res.data != null) {
        final d = res.data;
        state = state.copyWith(
          heartRateBpm: (d['heartRateBpm'] as num?)?.toInt() ?? state.heartRateBpm,
          spo2Percent: (d['spo2Percent'] as num?)?.toInt() ?? state.spo2Percent,
          accelMagnitudeG: (d['accelMagnitudeG'] as num?)?.toDouble() ?? state.accelMagnitudeG,
          operatingState: d['operatingState'] ?? state.operatingState,
          lastTelemetryLog:
              'ESP32 Telemetry: HR ${d['heartRateBpm'] ?? 74} BPM, SpO2 ${d['spo2Percent'] ?? 98}%, Accel ${(d['accelMagnitudeG'] as num?)?.toStringAsFixed(2) ?? "1.00"}G',
        );
      }
    } catch (_) {}
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

    ref.read(emergencyNotifierProvider.notifier).startEmergencyCountdown(
          source: 'ESP32_HARDWARE',
          reason:
              'Severe impact and post-collision stillness detected by ESP32 Triage Hardware',
          score: 0.96,
          countdownDuration: 10,
        );
  }

  @override
  void dispose() {
    _bleTelemetrySub?.cancel();
    _bleEmergencySub?.cancel();
    _bleScanSub?.cancel();
    _bleStatusSub?.cancel();
    super.dispose();
  }
}

final hardwareTriageNotifierProvider =
    StateNotifierProvider<HardwareTriageNotifier, HardwareTriageState>((ref) {
  return HardwareTriageNotifier(ref);
});

typedef WatchState = HardwareTriageState;
typedef WatchNotifier = HardwareTriageNotifier;
final watchNotifierProvider = hardwareTriageNotifierProvider;

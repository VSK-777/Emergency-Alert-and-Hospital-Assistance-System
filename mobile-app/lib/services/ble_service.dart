import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class DecodedTelemetry {
  final int packetType;
  final int deviceState;
  final int operatingMode;
  final int sensorFlags;
  final int heartRate;
  final int spo2;
  final int signalQuality;
  final double accelX;
  final double accelY;
  final double accelZ;
  final double accelMagnitude;
  final int countdownSec;
  final int seqNum;

  DecodedTelemetry({
    required this.packetType,
    required this.deviceState,
    required this.operatingMode,
    required this.sensorFlags,
    required this.heartRate,
    required this.spo2,
    required this.signalQuality,
    required this.accelX,
    required this.accelY,
    required this.accelZ,
    required this.accelMagnitude,
    required this.countdownSec,
    required this.seqNum,
  });

  String get stateName {
    switch (deviceState) {
      case 0:
        return 'NORMAL_MONITORING';
      case 1:
        return 'IMPACT_CANDIDATE';
      case 2:
        return 'IMMOBILITY_CHECK';
      case 3:
        return 'COUNTDOWN';
      case 4:
        return 'PHYSIOLOGICAL_ASSESSMENT';
      case 5:
        return 'EMERGENCY_ALERT';
      case 6:
        return 'CANCELLED';
      default:
        return 'UNKNOWN';
    }
  }

  Map<String, dynamic> toJson(String deviceIdentifier) {
    return {
      'deviceIdentifier': deviceIdentifier,
      'deviceState': stateName,
      'operatingMode': operatingMode == 0 ? 'REAL' : 'SIMULATION',
      'heartRate': heartRate,
      'spo2': spo2,
      'signalQuality': signalQuality,
      'accelX': accelX,
      'accelY': accelY,
      'accelZ': accelZ,
      'accelMagnitude': accelMagnitude,
      'countdownSec': countdownSec,
    };
  }
}

class DecodedEmergencyEvent {
  final int eventId;
  final int eventState;
  final int operatingMode;
  final double peakAccelG;
  final double stillnessSec;
  final int hrAtEvent;
  final int spo2AtEvent;
  final int timestampSec;

  DecodedEmergencyEvent({
    required this.eventId,
    required this.eventState,
    required this.operatingMode,
    required this.peakAccelG,
    required this.stillnessSec,
    required this.hrAtEvent,
    required this.spo2AtEvent,
    required this.timestampSec,
  });
}

class BleTriageService {
  static final BleTriageService _instance = BleTriageService._internal();
  factory BleTriageService() => _instance;
  BleTriageService._internal();

  // UUIDs matching firmware ESP32_Triage_Firmware.ino
  static final Guid serviceUuid = Guid('0000FFF0-0000-1000-8000-00805F9B34FB');
  static final Guid charUuidTelemetry = Guid('0000FFF1-0000-1000-8000-00805F9B34FB');
  static final Guid charUuidEmergency = Guid('0000FFF2-0000-1000-8000-00805F9B34FB');
  static final Guid charUuidControl = Guid('0000FFF3-0000-1000-8000-00805F9B34FB');

  BluetoothDevice? connectedDevice;
  BluetoothCharacteristic? _controlChar;
  StreamSubscription? _telemetrySub;
  StreamSubscription? _emergencySub;
  StreamSubscription? _connectionSub;

  final _telemetryController = StreamController<DecodedTelemetry>.broadcast();
  Stream<DecodedTelemetry> get telemetryStream => _telemetryController.stream;

  final _emergencyController = StreamController<DecodedEmergencyEvent>.broadcast();
  Stream<DecodedEmergencyEvent> get emergencyStream => _emergencyController.stream;

  final _statusController = StreamController<String>.broadcast();
  Stream<String> get statusStream => _statusController.stream;

  bool get isConnected => connectedDevice != null;

  Future<void> startScan({Duration timeout = const Duration(seconds: 10)}) async {
    try {
      if (await FlutterBluePlus.isSupported == false) {
        _statusController.add('Bluetooth is not supported on this device');
        return;
      }
      await FlutterBluePlus.startScan(timeout: timeout);
    } catch (e) {
      _statusController.add('Scan error: $e');
    }
  }

  Future<void> stopScan() async {
    try {
      await FlutterBluePlus.stopScan();
    } catch (_) {}
  }

  Stream<List<ScanResult>> get scanResults => FlutterBluePlus.scanResults;

  Future<bool> connectToDevice(BluetoothDevice device) async {
    try {
      _statusController.add('Connecting to ${device.platformName.isNotEmpty ? device.platformName : device.remoteId}...');
      await device.connect(autoConnect: false);
      connectedDevice = device;

      _connectionSub = device.connectionState.listen((state) {
        if (state == BluetoothConnectionState.disconnected) {
          _statusController.add('Hardware disconnected');
          _cleanupConnection();
        }
      });

      _statusController.add('Discovering GATT Triage services...');
      List<BluetoothService> services = await device.discoverServices();
      for (var s in services) {
        if (s.uuid == serviceUuid) {
          for (var c in s.characteristics) {
            if (c.uuid == charUuidTelemetry) {
              await c.setNotifyValue(true);
              _telemetrySub = c.onValueReceived.listen(_handleTelemetryPacket);
            } else if (c.uuid == charUuidEmergency) {
              await c.setNotifyValue(true);
              _emergencySub = c.onValueReceived.listen(_handleEmergencyPacket);
            } else if (c.uuid == charUuidControl) {
              _controlChar = c;
            }
          }
        }
      }

      _statusController.add('Connected & Subscribed to GATT Triage Stream');
      return true;
    } catch (e) {
      _statusController.add('Connection failed: $e');
      _cleanupConnection();
      return false;
    }
  }

  void _cleanupConnection() {
    _telemetrySub?.cancel();
    _emergencySub?.cancel();
    _connectionSub?.cancel();
    _telemetrySub = null;
    _emergencySub = null;
    _connectionSub = null;
    _controlChar = null;
    connectedDevice = null;
  }

  Future<void> disconnect() async {
    try {
      await connectedDevice?.disconnect();
    } catch (_) {}
    _cleanupConnection();
  }

  // Parse 20-byte TelemetryPacket from ESP32
  void _handleTelemetryPacket(List<int> bytes) {
    if (bytes.length < 20 || bytes[0] != 0xAA || bytes[1] != 0x01) {
      return;
    }

    try {
      final bd = ByteData.sublistView(Uint8List.fromList(bytes));
      final deviceState = bd.getUint8(2);
      final operatingMode = bd.getUint8(3);
      final sensorFlags = bd.getUint8(4);
      final heartRate = bd.getUint8(5);
      final spo2 = bd.getUint8(6);
      final signalQuality = bd.getUint8(7);
      final accelX = bd.getInt16(8, Endian.little) / 981.0;
      final accelY = bd.getInt16(10, Endian.little) / 981.0;
      final accelZ = bd.getInt16(12, Endian.little) / 981.0;
      final accelMag = bd.getUint16(14, Endian.little) / 100.0;
      final countdownSec = bd.getUint16(16, Endian.little);
      final seqNum = bd.getUint8(18);

      final decoded = DecodedTelemetry(
        packetType: 0x01,
        deviceState: deviceState,
        operatingMode: operatingMode,
        sensorFlags: sensorFlags,
        heartRate: heartRate,
        spo2: spo2,
        signalQuality: signalQuality,
        accelX: accelX,
        accelY: accelY,
        accelZ: accelZ,
        accelMagnitude: accelMag,
        countdownSec: countdownSec,
        seqNum: seqNum,
      );

      _telemetryController.add(decoded);
    } catch (e) {
      if (kDebugMode) print('Telemetry unpack error: $e');
    }
  }

  // Parse 19-byte EmergencyPacket from ESP32
  void _handleEmergencyPacket(List<int> bytes) {
    if (bytes.length < 19 || bytes[0] != 0xEE || bytes[1] != 0x02) {
      return;
    }

    try {
      final bd = ByteData.sublistView(Uint8List.fromList(bytes));
      final eventId = bd.getUint32(2, Endian.little);
      final eventState = bd.getUint8(6);
      final opMode = bd.getUint8(7);
      final peakAccel = bd.getUint16(8, Endian.little) / 100.0;
      final stillness = bd.getUint16(10, Endian.little) / 10.0;
      final hr = bd.getUint8(12);
      final spo2 = bd.getUint8(13);
      final timestampSec = bd.getUint32(14, Endian.little);

      final event = DecodedEmergencyEvent(
        eventId: eventId,
        eventState: eventState,
        operatingMode: opMode,
        peakAccelG: peakAccel,
        stillnessSec: stillness,
        hrAtEvent: hr,
        spo2AtEvent: spo2,
        timestampSec: timestampSec,
      );

      _emergencyController.add(event);
    } catch (e) {
      if (kDebugMode) print('Emergency unpack error: $e');
    }
  }

  // Write commands to ESP32 Control Characteristic (0000FFF3)
  Future<bool> sendControlCommand(String command) async {
    if (_controlChar == null) {
      _statusController.add('Cannot send command: GATT Control characteristic not available');
      return false;
    }
    try {
      final bytes = utf8.encode(command);
      await _controlChar!.write(bytes, withoutResponse: false);
      _statusController.add('Sent command: $command');
      return true;
    } catch (e) {
      _statusController.add('Failed to send command: $e');
      return false;
    }
  }

  Future<bool> provisionDeviceAuthToken(String token) async {
    return sendControlCommand('PROVISION:$token');
  }

  Future<bool> provisionWifi(String ssid, String password) async {
    return sendControlCommand('WIFI:$ssid,$password');
  }

  Future<bool> sendCancelCountdown() async {
    return sendControlCommand('CANCEL');
  }

  Future<bool> simulateImpactSpike() async {
    return sendControlCommand('SIM IMPACT');
  }
}

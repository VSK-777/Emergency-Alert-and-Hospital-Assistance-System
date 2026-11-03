/**
 * ============================================================================
 * CSP PROTOTYPE V1 — FIRMWARE PROTOCOL GUIDE & BLE DEFINITIONS
 * Project: Accident Detection & Emergency Response System
 * Target Device: ESP32 (WROOM-32 / ESP32-S3)
 * Device Name: CSP-Triage-V1
 * ============================================================================
 * 
 * This header defines the exact BLE GATT architecture, 128-bit UUIDs,
 * packet byte layouts, sensor telemetry structures, emergency event payloads,
 * device control commands, and state machine enums for the CSP Triage hardware.
 */

#ifndef PROJECT_GUIDE_H
#define PROJECT_GUIDE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// 1. BLE DEVICE IDENTIFICATION & GATT SERVICE / CHARACTERISTIC UUIDS
// ============================================================================

#define BLE_DEVICE_NAME                     "CSP-Triage-V1"

// Primary Triage Service UUID: 0000FFF0-0000-1000-8000-00805F9B34FB
#define UUID_TRIAGE_SERVICE                 "0000FFF0-0000-1000-8000-00805F9B34FB"

// Live Telemetry Characteristic (NOTIFY | READ): 0000FFF1-0000-1000-8000-00805F9B34FB
#define UUID_CHAR_LIVE_TELEMETRY            "0000FFF1-0000-1000-8000-00805F9B34FB"

// Emergency Event Characteristic (NOTIFY | READ): 0000FFF2-0000-1000-8000-00805F9B34FB
#define UUID_CHAR_EMERGENCY_EVENT           "0000FFF2-0000-1000-8000-00805F9B34FB"

// Device Control Characteristic (WRITE | WRITE_WITHOUT_RESPONSE): 0000FFF3-0000-1000-8000-00805F9B34FB
#define UUID_CHAR_DEVICE_CONTROL            "0000FFF3-0000-1000-8000-00805F9B34FB"

// Standard Client Characteristic Configuration Descriptor (CCCD)
#define UUID_DESCRIPTOR_CCCD                "00002902-0000-1000-8000-00805F9B34FB"

// ============================================================================
// 2. ACCIDENT DETECTION STATE MACHINE
// ============================================================================

typedef enum {
    STATE_NORMAL_MONITORING       = 0, // Baseline normal physiological & motion monitoring
    STATE_IMPACT_CANDIDATE        = 1, // Acceleration spike detected (>= 2.8g); candidate impact
    STATE_IMMOBILITY_CHECK        = 2, // Post-impact motion stillness check in progress
    STATE_COUNTDOWN               = 3, // Active 15-second emergency countdown warning
    STATE_PHYSIOLOGICAL_ASSESSMENT= 4, // Assessing patient vitals (HR, SpO2)
    STATE_EMERGENCY_ALERT         = 5, // Confirmed trauma event; dispatching emergency alert
    STATE_CANCELLED               = 6  // Alert cancelled by victim or false-alarm timeout
} AccidentState_t;

typedef enum {
    MODE_REAL                     = 0, // Live sensor hardware readings
    MODE_SIMULATION               = 1  // In-firmware simulation demonstration mode
} OperatingMode_t;

// Sensor availability bitmask flags
#define SENSOR_FLAG_HEART_RATE_OK     (1 << 0) // Bit 0: MAX30102 HR available
#define SENSOR_FLAG_SPO2_OK           (1 << 1) // Bit 1: MAX30102 SpO2 available
#define SENSOR_FLAG_ACCEL_OK          (1 << 2) // Bit 2: MPU6050 / IMU available
#define SENSOR_FLAG_FINGER_DETECTED   (1 << 3) // Bit 3: Optical finger contact detected

// ============================================================================
// 3. TELEMETRY PACKET FORMAT (20 BYTES BINARY, LITTLE-ENDIAN)
// ============================================================================
// Transmitted periodically (1–5 Hz) via UUID_CHAR_LIVE_TELEMETRY notification.

#define TELEMETRY_PACKET_HEADER       0xAA
#define TELEMETRY_PACKET_TYPE         0x01
#define TELEMETRY_PACKET_LENGTH       20

#pragma pack(push, 1)
typedef struct {
    uint8_t  header;           // Byte 0: 0xAA (Packet sync header)
    uint8_t  packet_type;      // Byte 1: 0x01 (TELEMETRY)
    uint8_t  device_state;     // Byte 2: AccidentState_t (0..6)
    uint8_t  operating_mode;   // Byte 3: OperatingMode_t (0 = REAL, 1 = SIMULATION)
    uint8_t  sensor_flags;     // Byte 4: Sensor availability bitmask
    uint8_t  heart_rate;       // Byte 5: Heart rate in BPM (0 if unavailable)
    uint8_t  spo2;             // Byte 6: SpO2 percentage 0..100% (0 if unavailable)
    uint8_t  signal_quality;   // Byte 7: Signal quality / confidence 0..100%
    int16_t  accel_x;          // Bytes 8-9: Accel X axis in mg or cm/s^2 (int16 LE, scale /100 = m/s^2)
    int16_t  accel_y;          // Bytes 10-11: Accel Y axis (int16 LE, scale /100)
    int16_t  accel_z;          // Bytes 12-13: Accel Z axis (int16 LE, scale /100)
    uint16_t accel_magnitude;  // Bytes 14-15: Vector magnitude |A| (uint16 LE, scale /100 = g-force)
    uint16_t countdown_sec;    // Bytes 16-17: Countdown seconds remaining (15..0, 0 if not in countdown)
    uint8_t  seq_num;          // Byte 18: Rolling sequence counter (0..255)
    uint8_t  checksum;         // Byte 19: XOR checksum of bytes 0..18
} TelemetryPacket_t;
#pragma pack(pop)

// ============================================================================
// 4. EMERGENCY EVENT PACKET FORMAT (18 BYTES BINARY, LITTLE-ENDIAN)
// ============================================================================
// Transmitted immediately on accident trigger / escalation via UUID_CHAR_EMERGENCY_EVENT.

#define EMERGENCY_PACKET_HEADER       0xEE
#define EMERGENCY_PACKET_TYPE         0x02
#define EMERGENCY_PACKET_LENGTH       18

#pragma pack(push, 1)
typedef struct {
    uint8_t  header;           // Byte 0: 0xEE (Emergency sync header)
    uint8_t  packet_type;      // Byte 1: 0x02 (EMERGENCY_EVENT)
    uint32_t event_id;         // Bytes 2-5: Unique sequential incident ID (uint32 LE)
    uint8_t  event_state;      // Byte 6: AccidentState_t at trigger time (3=COUNTDOWN, 5=ALERT, 6=CANCEL)
    uint8_t  operating_mode;   // Byte 7: OperatingMode_t (0=REAL, 1=SIMULATION)
    uint16_t peak_accel_mg;    // Bytes 8-9: Peak impact acceleration in 0.01g units (uint16 LE)
    uint16_t stillness_sec_x10;// Bytes 10-11: Post-impact stillness duration in 0.1s units (uint16 LE)
    uint8_t  hr_at_event;      // Byte 12: Heart rate at event time (BPM, 0 if unavailable)
    uint8_t  spo2_at_event;    // Byte 13: SpO2 at event time (%, 0 if unavailable)
    uint32_t timestamp_sec;    // Bytes 14-16: Firmware uptime / timestamp in seconds (uint24/32 LE)
    uint8_t  checksum;         // Byte 17: XOR checksum of bytes 0..16
} EmergencyEventPacket_t;
#pragma pack(pop)

// ============================================================================
// 5. DEVICE CONTROL COMMANDS
// ============================================================================
// Written from Android Companion App to UUID_CHAR_DEVICE_CONTROL.
// Supports both human-readable ASCII string commands and single-byte binary opcodes.

#define CMD_STR_SIM                   "SIM"        // Toggle Simulation mode on/off
#define CMD_STR_SIM_IMPACT            "SIM IMPACT" // Inject simulated impact candidate sequence
#define CMD_STR_CANCEL                "CANCEL"     // Remote emergency countdown cancellation acknowledgement

#define CMD_OPCODE_SIM                0x01
#define CMD_OPCODE_SIM_IMPACT         0x02
#define CMD_OPCODE_CANCEL             0x03

#ifdef __cplusplus
}
#endif

#endif // PROJECT_GUIDE_H

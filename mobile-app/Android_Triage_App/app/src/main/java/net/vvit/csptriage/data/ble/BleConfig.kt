package net.vvit.csptriage.data.ble

import java.util.UUID

object BleConfig {
    const val TARGET_DEVICE_NAME = "CSP-Triage-V1"

    // Primary Triage GATT Service
    val TRIAGE_SERVICE_UUID: UUID = UUID.fromString("0000FFF0-0000-1000-8000-00805F9B34FB")

    // Live Telemetry Characteristic (NOTIFY | READ)
    val LIVE_TELEMETRY_CHAR_UUID: UUID = UUID.fromString("0000FFF1-0000-1000-8000-00805F9B34FB")

    // Emergency Event Characteristic (NOTIFY | READ)
    val EMERGENCY_EVENT_CHAR_UUID: UUID = UUID.fromString("0000FFF2-0000-1000-8000-00805F9B34FB")

    // Device Control Characteristic (WRITE | WRITE_WITHOUT_RESPONSE)
    val DEVICE_CONTROL_CHAR_UUID: UUID = UUID.fromString("0000FFF3-0000-1000-8000-00805F9B34FB")

    // Client Characteristic Configuration Descriptor (CCCD)
    val CCCD_DESCRIPTOR_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805F9B34FB")

    // Protocol Constants
    const val TELEMETRY_PACKET_HEADER: Byte = 0xAA.toByte()
    const val TELEMETRY_PACKET_TYPE: Byte = 0x01.toByte()
    const val TELEMETRY_PACKET_LENGTH: Int = 20

    const val EMERGENCY_PACKET_HEADER: Byte = 0xEE.toByte()
    const val EMERGENCY_PACKET_TYPE: Byte = 0x02.toByte()
    const val EMERGENCY_PACKET_LENGTH: Int = 19

    // Documented Firmware Simulation & Control Commands
    const val CMD_SIM = "SIM"
    const val CMD_SIM_IMPACT = "SIM IMPACT"
    const val CMD_CANCEL = "CANCEL"

    // Connection parameters
    const val DESIRED_MTU = 512
    const val SCAN_TIMEOUT_MS = 15000L
    const val INITIAL_RECONNECT_DELAY_MS = 2000L
    const val MAX_RECONNECT_DELAY_MS = 30000L
}

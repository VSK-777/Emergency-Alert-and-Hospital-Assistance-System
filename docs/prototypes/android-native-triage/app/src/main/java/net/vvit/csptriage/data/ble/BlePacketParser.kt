package net.vvit.csptriage.data.ble

import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.OperatingMode
import net.vvit.csptriage.domain.model.SensorAvailability
import net.vvit.csptriage.domain.model.TelemetryData
import java.nio.ByteBuffer
import java.nio.ByteOrder

object BlePacketParser {

    /**
     * Parses a raw BLE notification byte array into a verified [TelemetryData] instance.
     * Returns null if the packet fails exact length check, sync header check, or XOR checksum verification.
     *
     * Firmware Layout (20 bytes packed, Little-Endian):
     * Offset  0: Header (0xAA)
     * Offset  1: Packet Type (0x01 = TELEMETRY)
     * Offset  2: Device State (0..6)
     * Offset  3: Operating Mode (0 = REAL, 1 = SIMULATION)
     * Offset  4: Sensor Flags Bitmask (bit 0: HR, bit 1: SpO2, bit 2: Accel, bit 3: Finger, bit 7: Sim)
     * Offset  5: Heart Rate in BPM (0 if unavailable)
     * Offset  6: SpO2 in % (0 if unavailable)
     * Offset  7: Signal Quality (0..100%)
     * Offset 8-9: Accel X in 0.01 m/s^2 (int16 LE)
     * Offset 10-11: Accel Y in 0.01 m/s^2 (int16 LE)
     * Offset 12-13: Accel Z in 0.01 m/s^2 (int16 LE)
     * Offset 14-15: Accel Magnitude |A| in 0.01g (uint16 LE)
     * Offset 16-17: Countdown seconds remaining (uint16 LE)
     * Offset 18: Sequence Number (uint8)
     * Offset 19: XOR checksum over bytes 0..18
     */
    fun parseTelemetry(bytes: ByteArray): TelemetryData? {
        if (bytes.size != BleConfig.TELEMETRY_PACKET_LENGTH) {
            return null
        }

        // 1. Verify Header and Type
        if (bytes[0] != BleConfig.TELEMETRY_PACKET_HEADER || bytes[1] != BleConfig.TELEMETRY_PACKET_TYPE) {
            return null
        }

        // 2. Verify Checksum (XOR across bytes 0..18)
        var expectedChecksum: Byte = 0
        for (i in 0 until BleConfig.TELEMETRY_PACKET_LENGTH - 1) {
            expectedChecksum = (expectedChecksum.toInt() xor bytes[i].toInt()).toByte()
        }
        val packetChecksum = bytes[BleConfig.TELEMETRY_PACKET_LENGTH - 1]
        if (packetChecksum != expectedChecksum) {
            return null
        }

        // 3. Unpack Fields using Little-Endian buffer
        val buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)

        buffer.get() // Skip Byte 0: Header (0xAA)
        buffer.get() // Skip Byte 1: Type (0x01)
        val stateByte = buffer.get().toInt() and 0xFF
        val modeByte = buffer.get().toInt() and 0xFF
        val sensorFlags = buffer.get().toInt() and 0xFF
        val rawHr = buffer.get().toInt() and 0xFF
        val rawSpo2 = buffer.get().toInt() and 0xFF
        val signalQuality = buffer.get().toInt() and 0xFF

        val accelXRaw = buffer.short
        val accelYRaw = buffer.short
        val accelZRaw = buffer.short
        val accelMagRaw = buffer.short.toInt() and 0xFFFF
        val countdownSecRaw = buffer.short.toInt() and 0xFFFF
        val seqNum = buffer.get().toInt() and 0xFF

        // Decode Enums and Flags
        val state = AccidentState.fromCode(stateByte)
        val mode = OperatingMode.fromCode(modeByte)
        val sensors = SensorAvailability.fromFlags(sensorFlags)

        // Strict Medical Safeguard:
        // Do not convert missing sensor readings (0 or out-of-range) into valid vitals.
        val hrValue = if (sensors.isHeartRateAvailable && rawHr in 30..240) rawHr else null
        val spo2Value = if (sensors.isSpO2Available && rawSpo2 in 50..100) rawSpo2 else null

        // Acceleration scale factor: 100 -> 1.0 m/s^2 (firmware scales 1g ~ 981 to 0.01 m/s^2)
        val accelX = accelXRaw / 100f
        val accelY = accelYRaw / 100f
        val accelZ = accelZRaw / 100f
        val accelMagnitude = accelMagRaw / 100f

        return TelemetryData(
            state = state,
            mode = mode,
            sensors = sensors,
            heartRateBpm = hrValue,
            spo2Percent = spo2Value,
            signalQualityPercent = signalQuality.coerceIn(0, 100),
            accelX = accelX,
            accelY = accelY,
            accelZ = accelZ,
            accelMagnitude = accelMagnitude,
            countdownRemainingSeconds = countdownSecRaw,
            sequenceNumber = seqNum,
            timestampMillis = System.currentTimeMillis()
        )
    }

    /**
     * Parses a raw BLE notification byte array into a verified [EmergencyEvent] instance.
     * Returns null if packet fails exact length, sync header, or XOR checksum validation.
     *
     * Firmware Layout (19 bytes packed, Little-Endian):
     * Offset  0: Header (0xEE)
     * Offset  1: Packet Type (0x02 = EMERGENCY_EVENT)
     * Offset 2-5: Event ID (uint32 LE)
     * Offset  6: Event State (uint8: 3=COUNTDOWN, 5=ALERT, 6=CANCEL)
     * Offset  7: Operating Mode (uint8: 0=REAL, 1=SIMULATION)
     * Offset 8-9: Peak Impact Accel in 0.01g (uint16 LE)
     * Offset 10-11: Stillness Duration in 0.1s (uint16 LE)
     * Offset 12: Heart Rate at Event in BPM (uint8)
     * Offset 13: SpO2 at Event in % (uint8)
     * Offset 14-17: Firmware Uptime Timestamp in Seconds (uint32 LE)
     * Offset 18: XOR checksum over bytes 0..17
     */
    fun parseEmergencyEvent(bytes: ByteArray): EmergencyEvent? {
        if (bytes.size != BleConfig.EMERGENCY_PACKET_LENGTH) {
            return null
        }

        // 1. Verify Header and Type
        if (bytes[0] != BleConfig.EMERGENCY_PACKET_HEADER || bytes[1] != BleConfig.EMERGENCY_PACKET_TYPE) {
            return null
        }

        // 2. Verify Checksum (XOR across bytes 0..17)
        var expectedChecksum: Byte = 0
        for (i in 0 until BleConfig.EMERGENCY_PACKET_LENGTH - 1) {
            expectedChecksum = (expectedChecksum.toInt() xor bytes[i].toInt()).toByte()
        }
        val packetChecksum = bytes[BleConfig.EMERGENCY_PACKET_LENGTH - 1]
        if (packetChecksum != expectedChecksum) {
            return null
        }

        // 3. Unpack Fields using Little-Endian buffer
        val buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)

        buffer.get() // Skip Byte 0: 0xEE
        buffer.get() // Skip Byte 1: 0x02
        val eventId = buffer.int.toLong() and 0xFFFFFFFFL
        val eventStateByte = buffer.get().toInt() and 0xFF
        val modeByte = buffer.get().toInt() and 0xFF
        val peakAccelRaw = buffer.short.toInt() and 0xFFFF
        val stillnessRaw = buffer.short.toInt() and 0xFFFF
        val rawHr = buffer.get().toInt() and 0xFF
        val rawSpo2 = buffer.get().toInt() and 0xFF
        val timestampSec = buffer.int.toLong() and 0xFFFFFFFFL

        val state = AccidentState.fromCode(eventStateByte)
        val mode = OperatingMode.fromCode(modeByte)

        val hrValue = if (rawHr in 30..240) rawHr else null
        val spo2Value = if (rawSpo2 in 50..100) rawSpo2 else null

        val peakAccelG = peakAccelRaw / 100f
        val stillnessSec = stillnessRaw / 10f

        return EmergencyEvent(
            eventId = eventId,
            state = state,
            mode = mode,
            peakAccelG = peakAccelG,
            stillnessSeconds = stillnessSec,
            heartRateBpm = hrValue,
            spo2Percent = spo2Value,
            timestampSeconds = timestampSec,
            createdAtMillis = System.currentTimeMillis()
        )
    }

    /**
     * Reassembly buffer helper for potential BLE MTU packet fragmentation.
     */
    class PacketReassembler {
        private val buffer = ByteArray(128)
        private var bufferSize = 0

        @Synchronized
        fun append(bytes: ByteArray): List<ByteArray> {
            val completePackets = mutableListOf<ByteArray>()
            if (bufferSize + bytes.size > buffer.size) {
                // Buffer overflow protection: flush invalid accumulation
                bufferSize = 0
            }

            System.arraycopy(bytes, 0, buffer, bufferSize, bytes.size)
            bufferSize += bytes.size

            while (bufferSize > 0) {
                // Seek to sync byte 0xAA or 0xEE
                var syncIdx = -1
                for (i in 0 until bufferSize) {
                    if (buffer[i] == BleConfig.TELEMETRY_PACKET_HEADER || buffer[i] == BleConfig.EMERGENCY_PACKET_HEADER) {
                        syncIdx = i
                        break
                    }
                }

                if (syncIdx == -1) {
                    // No valid sync byte in entire buffer
                    bufferSize = 0
                    break
                }

                if (syncIdx > 0) {
                    // Discard leading garbage
                    System.arraycopy(buffer, syncIdx, buffer, 0, bufferSize - syncIdx)
                    bufferSize -= syncIdx
                }

                val expectedLen = if (buffer[0] == BleConfig.TELEMETRY_PACKET_HEADER) {
                    BleConfig.TELEMETRY_PACKET_LENGTH
                } else {
                    BleConfig.EMERGENCY_PACKET_LENGTH
                }

                if (bufferSize >= expectedLen) {
                    val packet = ByteArray(expectedLen)
                    System.arraycopy(buffer, 0, packet, 0, expectedLen)
                    completePackets.add(packet)

                    // Shift remaining bytes
                    System.arraycopy(buffer, expectedLen, buffer, 0, bufferSize - expectedLen)
                    bufferSize -= expectedLen
                } else {
                    // Need more bytes
                    break
                }
            }

            return completePackets
        }
    }
}

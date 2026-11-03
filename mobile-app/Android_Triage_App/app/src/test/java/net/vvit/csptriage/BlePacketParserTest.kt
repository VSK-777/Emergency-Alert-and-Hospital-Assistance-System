package net.vvit.csptriage

import net.vvit.csptriage.data.ble.BleConfig
import net.vvit.csptriage.data.ble.BlePacketParser
import net.vvit.csptriage.domain.model.AccidentState
import net.vvit.csptriage.domain.model.OperatingMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.nio.ByteBuffer
import java.nio.ByteOrder

class BlePacketParserTest {

    private fun calculateXorChecksum(bytes: ByteArray, length: Int): Byte {
        var cs: Byte = 0
        for (i in 0 until length) {
            cs = (cs.toInt() xor bytes[i].toInt()).toByte()
        }
        return cs
    }

    @Test
    fun parseTelemetry_validPacket_parsedCorrectly() {
        val bytes = ByteArray(20)
        val buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)

        buf.put(0xAA.toByte()) // Byte 0: Header
        buf.put(0x01.toByte()) // Byte 1: Type
        buf.put(0x00.toByte()) // Byte 2: State = NORMAL_MONITORING
        buf.put(0x00.toByte()) // Byte 3: Mode = REAL
        buf.put(0x0F.toByte()) // Byte 4: Sensor flags (HR_OK | SPO2_OK | ACCEL_OK | FINGER_OK)
        buf.put(76.toByte())   // Byte 5: HR = 76 BPM
        buf.put(98.toByte())   // Byte 6: SpO2 = 98%
        buf.put(95.toByte())   // Byte 7: Signal quality = 95%
        buf.putShort(12)       // Bytes 8-9: Accel X = 0.12 m/s^2 (raw 12)
        buf.putShort(-24)      // Bytes 10-11: Accel Y = -0.24 m/s^2 (raw -24)
        buf.putShort(981)      // Bytes 12-13: Accel Z = 9.81 m/s^2 (raw 981)
        buf.putShort(100)      // Bytes 14-15: Accel Mag = 1.00g (raw 100)
        buf.putShort(0)        // Bytes 16-17: Countdown = 0
        buf.put(42.toByte())   // Byte 18: SeqNum = 42
        bytes[19] = calculateXorChecksum(bytes, 19)

        val telemetry = BlePacketParser.parseTelemetry(bytes)
        assertNotNull("Telemetry packet should parse successfully", telemetry)
        assertEquals(AccidentState.NORMAL_MONITORING, telemetry!!.state)
        assertEquals(OperatingMode.REAL, telemetry.mode)
        assertTrue(telemetry.sensors.isHeartRateAvailable)
        assertTrue(telemetry.sensors.isSpO2Available)
        assertTrue(telemetry.sensors.isAccelerometerAvailable)
        assertTrue(telemetry.sensors.isFingerDetected)
        assertEquals(76, telemetry.heartRateBpm)
        assertEquals(98, telemetry.spo2Percent)
        assertEquals(95, telemetry.signalQualityPercent)
        assertEquals(0.12f, telemetry.accelX, 0.001f)
        assertEquals(-0.24f, telemetry.accelY, 0.001f)
        assertEquals(9.81f, telemetry.accelZ, 0.001f)
        assertEquals(1.00f, telemetry.accelMagnitude, 0.001f)
        assertEquals(0, telemetry.countdownRemainingSeconds)
        assertEquals(42, telemetry.sequenceNumber)
    }

    @Test
    fun parseTelemetry_unavailableSensorReadings_neverDefaultToZero() {
        val bytes = ByteArray(20)
        val buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)

        buf.put(0xAA.toByte())
        buf.put(0x01.toByte())
        buf.put(0x00.toByte())
        buf.put(0x00.toByte())
        buf.put(0x04.toByte()) // Only ACCEL_OK (bit 2), HR and SpO2 not available
        buf.put(0.toByte())    // HR = 0
        buf.put(0.toByte())    // SpO2 = 0
        buf.put(50.toByte())
        buf.putShort(0)
        buf.putShort(0)
        buf.putShort(981)
        buf.putShort(100)
        buf.putShort(0)
        buf.put(1.toByte())
        bytes[19] = calculateXorChecksum(bytes, 19)

        val telemetry = BlePacketParser.parseTelemetry(bytes)
        assertNotNull(telemetry)
        assertNull("Missing HR reading must be parsed as null, not 0", telemetry!!.heartRateBpm)
        assertNull("Missing SpO2 reading must be parsed as null, not 0", telemetry.spo2Percent)
    }

    @Test
    fun parseTelemetry_corruptedChecksum_rejected() {
        val bytes = ByteArray(20)
        bytes[0] = 0xAA.toByte()
        bytes[1] = 0x01.toByte()
        bytes[19] = 0x77.toByte() // Wrong checksum

        val telemetry = BlePacketParser.parseTelemetry(bytes)
        assertNull("Telemetry with corrupted checksum must be rejected", telemetry)
    }

    @Test
    fun parseTelemetry_wrongLength_rejected() {
        val shortBytes = ByteArray(19)
        shortBytes[0] = 0xAA.toByte()
        shortBytes[1] = 0x01.toByte()
        assertNull("Telemetry with length < 20 must be rejected", BlePacketParser.parseTelemetry(shortBytes))

        val longBytes = ByteArray(21)
        longBytes[0] = 0xAA.toByte()
        longBytes[1] = 0x01.toByte()
        assertNull("Telemetry with length > 20 must be rejected", BlePacketParser.parseTelemetry(longBytes))
    }

    @Test
    fun parseEmergencyEvent_valid19BytePacket_parsedCorrectly() {
        val bytes = ByteArray(19)
        val buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)

        buf.put(0xEE.toByte()) // Byte 0: Header
        buf.put(0x02.toByte()) // Byte 1: Type
        buf.putInt(1042)       // Bytes 2-5: Event ID = 1042
        buf.put(0x05.toByte()) // Byte 6: State = EMERGENCY_ALERT
        buf.put(0x00.toByte()) // Byte 7: Mode = REAL
        buf.putShort(385)      // Bytes 8-9: Peak Accel = 3.85g (raw 385)
        buf.putShort(125)      // Bytes 10-11: Stillness = 12.5s (raw 125)
        buf.put(118.toByte())  // Byte 12: HR = 118 BPM
        buf.put(96.toByte())   // Byte 13: SpO2 = 96%
        buf.putInt(3600)       // Bytes 14-17: Timestamp = 3600 seconds
        bytes[18] = calculateXorChecksum(bytes, 18)

        val event = BlePacketParser.parseEmergencyEvent(bytes)
        assertNotNull("Emergency event should parse successfully", event)
        assertEquals(1042L, event!!.eventId)
        assertEquals(AccidentState.EMERGENCY_ALERT, event.state)
        assertEquals(OperatingMode.REAL, event.mode)
        assertEquals(3.85f, event.peakAccelG, 0.001f)
        assertEquals(12.5f, event.stillnessSeconds, 0.001f)
        assertEquals(118, event.heartRateBpm)
        assertEquals(96, event.spo2Percent)
        assertEquals(3600L, event.timestampSeconds)
    }

    @Test
    fun parseEmergencyEvent_18BytePacket_strictlyRejected() {
        // Strict firmware conformance: 18-byte packets are not generated by CSP-Triage-V1 firmware
        val bytes = ByteArray(18)
        bytes[0] = 0xEE.toByte()
        bytes[1] = 0x02.toByte()
        bytes[17] = calculateXorChecksum(bytes, 17)

        val event = BlePacketParser.parseEmergencyEvent(bytes)
        assertNull("Emergency packet with 18 bytes must be strictly rejected", event)
    }

    @Test
    fun parseEmergencyEvent_corruptedChecksum_rejected() {
        val bytes = ByteArray(19)
        bytes[0] = 0xEE.toByte()
        bytes[1] = 0x02.toByte()
        bytes[18] = 0x55.toByte() // Wrong checksum

        val event = BlePacketParser.parseEmergencyEvent(bytes)
        assertNull("Emergency event with bad checksum must be rejected", event)
    }

    @Test
    fun packetReassembler_handlesFragmentationAndSyncSeek() {
        val reassembler = BlePacketParser.PacketReassembler()

        // Create a valid 20-byte telemetry packet
        val tBytes = ByteArray(20)
        tBytes[0] = 0xAA.toByte()
        tBytes[1] = 0x01.toByte()
        tBytes[19] = calculateXorChecksum(tBytes, 19)

        // Inject 5 bytes of garbage before the packet
        val stream = byteArrayOf(0x00, 0x12, 0x34, 0x56, 0x78) + tBytes

        // Split into chunks of 8 bytes
        val chunk1 = stream.copyOfRange(0, 8)
        val chunk2 = stream.copyOfRange(8, 16)
        val chunk3 = stream.copyOfRange(16, stream.size)

        val out1 = reassembler.append(chunk1)
        assertEquals(0, out1.size)

        val out2 = reassembler.append(chunk2)
        assertEquals(0, out2.size)

        val out3 = reassembler.append(chunk3)
        assertEquals(1, out3.size)
        assertEquals(20, out3[0].size)
        assertEquals(0xAA.toByte(), out3[0][0])
    }
}

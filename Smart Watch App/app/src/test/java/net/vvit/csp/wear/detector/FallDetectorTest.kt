package net.vvit.csp.wear.detector

import net.vvit.csp.wear.comm.WatchPayload
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class FallDetectorTest {

    private lateinit var detector: FallDetector

    @Before
    fun setUp() {
        detector = FallDetector(
            impactThresholdG = 2.8f,
            gyroThresholdRadS = 2.5f,
            stillnessWindowMs = 2000L,
            stillnessVarianceMaxG = 0.35f
        )
    }

    @Test
    fun testNormalWalkingMovement_DoesNotTriggerAccident() {
        val now = System.currentTimeMillis()
        val walkingSamples = (0..20).map { i ->
            // Normal walking oscillates mildly around 1.0g (gravity)
            val ax = if (i % 2 == 0) 1.5f else -1.2f
            val ay = 9.8f
            val az = 0.8f
            MotionTelemetry(
                timestampMs = now + i * 50L,
                ax = ax,
                ay = ay,
                az = az,
                gx = 0.1f,
                gy = 0.2f,
                gz = 0.1f
            )
        }

        val result = detector.evaluateTelemetryWindow(walkingSamples)
        assertFalse("Normal walking must not trigger accident candidate", result.isCandidateAccident)
        assertTrue("Risk score must be below 0.5 for walking", result.riskScore < 0.5f)
    }

    @Test
    fun testSevereImpactAndStillness_TriggersAccidentCandidate() {
        val now = System.currentTimeMillis()
        val samples = mutableListOf<MotionTelemetry>()

        // 1. Pre-impact baseline (1 second)
        for (i in 0..10) {
            samples.add(MotionTelemetry(now + i * 50L, 0.1f, 9.8f, 0.1f))
        }

        // 2. High Impact Crash Spike (ax=25 m/s^2, ay=24 m/s^2, az=18 m/s^2 -> ~3.9g, gyro ~4.2 rad/s)
        samples.add(
            MotionTelemetry(
                timestampMs = now + 600L,
                ax = 25.0f,
                ay = 24.0f,
                az = 18.0f,
                gx = 2.8f,
                gy = 3.1f,
                gz = 1.2f
            )
        )

        // 3. Post-impact stillness (2.5 seconds)
        for (i in 1..50) {
            samples.add(
                MotionTelemetry(
                    timestampMs = now + 600L + i * 50L,
                    ax = 0.05f,
                    ay = 9.81f,
                    az = 0.05f,
                    gx = 0.01f,
                    gy = 0.01f,
                    gz = 0.01f
                )
            )
        }

        val result = detector.evaluateTelemetryWindow(samples)
        assertTrue("High impact + stillness must trigger candidate accident", result.isCandidateAccident)
        assertTrue("Peak accel must exceed threshold", result.peakAccelG >= 2.8f)
        assertTrue("Risk score must be high (>= 0.75)", result.riskScore >= 0.75f)
        assertTrue("Reason must mention impact", result.reason.contains("impact", ignoreCase = true))
    }

    @Test
    fun testWatchPayloadSerialization() {
        val payload = WatchPayload(
            schemaVersion = "1.0.0",
            incidentId = "inc-test-uuid-1234",
            eventTimestampMs = 1793254000000L,
            detectionReason = "High Impact Fall with Post-Impact Inactivity",
            detectionScore = 0.94f,
            userConfirmationState = "CONFIRMED",
            peakAccelG = 3.82f,
            peakGyroRadS = 4.15f
        )

        val jsonString = payload.toJsonString()
        assertTrue(jsonString.contains("inc-test-uuid-1234"))
        assertTrue(jsonString.contains("CONFIRMED"))
        assertTrue(jsonString.contains("1.0.0"))

        val deserialized = WatchPayload.fromJsonString(jsonString)
        assertEquals(payload.incidentId, deserialized.incidentId)
        assertEquals(payload.userConfirmationState, deserialized.userConfirmationState)
        assertEquals(payload.peakAccelG, deserialized.peakAccelG, 0.01f)
    }
}

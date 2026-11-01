package net.vvit.csp.wear.detector

import kotlin.math.abs

/**
 * Deterministic, offline-first Wear OS accident and severe fall detector.
 * Operates strictly locally using on-device IMU telemetry.
 *
 * Designed for B.Tech CSE Batch 8 Community Service Project (VVIT - VSK).
 */
class FallDetector(
    val impactThresholdG: Float = 2.8f,
    val gyroThresholdRadS: Float = 2.5f,
    val stillnessWindowMs: Long = 2000L,
    val stillnessVarianceMaxG: Float = 0.35f
) {
    /**
     * Evaluates a temporal sequence of IMU samples (e.g. 3-5 seconds of buffer at 50Hz)
     * to identify impact peak followed by immobility / stillness.
     */
    fun evaluateTelemetryWindow(samples: List<MotionTelemetry>): DetectionResult {
        if (samples.size < 10) {
            return DetectionResult.negative()
        }

        // 1. Find Peak Acceleration Magnitude
        var maxAccelG = 0f
        var maxGyroRadS = 0f
        var impactIndex = -1

        for (i in samples.indices) {
            val sample = samples[i]
            if (sample.accelMagnitudeG > maxAccelG) {
                maxAccelG = sample.accelMagnitudeG
                impactIndex = i
            }
            if (sample.gyroMagnitudeRadS > maxGyroRadS) {
                maxGyroRadS = sample.gyroMagnitudeRadS
            }
        }

        // 2. Check if impact exceeds trauma threshold
        val hasImpactSpike = maxAccelG >= impactThresholdG
        val hasRotationalSpike = maxGyroRadS >= gyroThresholdRadS

        if (!hasImpactSpike) {
            return DetectionResult(
                isCandidateAccident = false,
                riskScore = (maxAccelG / impactThresholdG) * 0.4f,
                reason = "Acceleration magnitude ($maxAccelG g) below threshold ($impactThresholdG g)",
                peakAccelG = maxAccelG,
                peakGyroRadS = maxGyroRadS,
                postImpactStillnessDurationMs = 0L
            )
        }

        // 3. Post-impact stillness assessment
        var postImpactStillnessDuration = 0L
        var isStill = false

        if (impactIndex >= 0 && impactIndex < samples.size - 5) {
            val postSamples = samples.subList(impactIndex + 1, samples.size)
            val startTime = postSamples.first().timestampMs
            val endTime = postSamples.last().timestampMs
            val duration = endTime - startTime

            // Calculate variance from resting 1.0g
            var totalDev = 0f
            for (s in postSamples) {
                totalDev += abs(s.accelMagnitudeG - 1.0f)
            }
            val meanDev = totalDev / postSamples.size

            if (meanDev <= stillnessVarianceMaxG && duration >= stillnessWindowMs) {
                isStill = true
                postImpactStillnessDuration = duration
            }
        }

        // 4. Calculate Risk Score [0.0 - 1.0]
        var score = 0.5f
        if (hasImpactSpike) score += 0.25f
        if (hasRotationalSpike) score += 0.15f
        if (isStill) score += 0.10f
        if (maxAccelG > 4.0f) score = 0.95f.coerceAtMost(score + 0.1f)

        val isCandidate = hasImpactSpike && (hasRotationalSpike || isStill || maxAccelG >= 3.5f)

        val reason = when {
            isStill && hasRotationalSpike -> "High-impact fall with rotational velocity and post-impact immobility"
            isStill -> "Severe impact spike (${String.format("%.2f", maxAccelG)}g) followed by stillness"
            hasRotationalSpike -> "Sudden angular deceleration with impact (${String.format("%.2f", maxAccelG)}g)"
            else -> "High acceleration force detected (${String.format("%.2f", maxAccelG)}g)"
        }

        return DetectionResult(
            isCandidateAccident = isCandidate,
            riskScore = score.coerceIn(0f, 1f),
            reason = reason,
            peakAccelG = maxAccelG,
            peakGyroRadS = maxGyroRadS,
            postImpactStillnessDurationMs = postImpactStillnessDuration
        )
    }

    /**
     * Fast real-time instantaneous threshold check
     */
    fun isInstantaneousImpactSpike(sample: MotionTelemetry): Boolean {
        return sample.accelMagnitudeG >= impactThresholdG
    }
}

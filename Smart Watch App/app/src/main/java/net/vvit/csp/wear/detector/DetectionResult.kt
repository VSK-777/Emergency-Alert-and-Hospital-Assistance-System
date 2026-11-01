package net.vvit.csp.wear.detector

data class DetectionResult(
    val isCandidateAccident: Boolean,
    val riskScore: Float,
    val reason: String,
    val peakAccelG: Float,
    val peakGyroRadS: Float,
    val postImpactStillnessDurationMs: Long
) {
    companion object {
        fun negative(): DetectionResult = DetectionResult(
            isCandidateAccident = false,
            riskScore = 0f,
            reason = "Normal movement pattern within baseline thresholds",
            peakAccelG = 1.0f,
            peakGyroRadS = 0f,
            postImpactStillnessDurationMs = 0L
        )
    }
}

package net.vvit.csp.wear.detector

import kotlin.math.sqrt

data class MotionTelemetry(
    val timestampMs: Long,
    val ax: Float,
    val ay: Float,
    val az: Float,
    val gx: Float = 0f,
    val gy: Float = 0f,
    val gz: Float = 0f
) {
    /**
     * Total Acceleration Vector Magnitude in Gs (Standard Gravity = 9.81 m/s^2)
     */
    val accelMagnitudeG: Float by lazy {
        val magMs2 = sqrt(ax * ax + ay * ay + az * az)
        magMs2 / 9.80665f
    }

    /**
     * Total Angular Velocity Magnitude in rad/s
     */
    val gyroMagnitudeRadS: Float by lazy {
        sqrt(gx * gx + gy * gy + gz * gz)
    }
}

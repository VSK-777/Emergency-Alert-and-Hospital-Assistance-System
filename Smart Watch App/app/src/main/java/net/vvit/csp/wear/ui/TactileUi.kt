package net.vvit.csp.wear.ui

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.LayerDrawable
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.MotionEvent
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator

/**
 * Tactile 3D Wear OS Design System Utility.
 * Provides physical depth, layered bevels, specular top highlights,
 * and realistic press-down animations for circular smartwatch screens.
 *
 * Community Service Project — VVIT CSE Batch 8.
 */
object TactileUi {

    fun dp(context: Context, value: Float): Int {
        return (value * context.resources.displayMetrics.density).toInt()
    }

    /**
     * Creates a layered 3D tactile button with:
     * - Bottom shadow / base rim (physical thickness)
     * - Top surface gradient (specular top highlight to base color)
     * - Subtle inner highlight rim
     */
    fun create3dButtonDrawable(
        context: Context,
        topColor: Int,
        bottomColor: Int,
        shadowColor: Int,
        highlightStrokeColor: Int = Color.parseColor("#40FFFFFF"),
        cornerRadiusDp: Float = 22f,
        shadowHeightDp: Float = 3.5f
    ): LayerDrawable {
        val cornerPx = cornerRadiusDp * context.resources.displayMetrics.density
        val shadowPx = dp(context, shadowHeightDp)

        // 1. Bottom shadow layer (represents button base / drop rim)
        val shadowDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = cornerPx
            setColor(shadowColor)
        }

        // 2. Top surface layer (elevated face with vertical gradient)
        val surfaceDrawable = GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(topColor, bottomColor)
        ).apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = cornerPx
            setStroke(dp(context, 1.0f), highlightStrokeColor)
        }

        val layers = arrayOf(shadowDrawable, surfaceDrawable)
        return LayerDrawable(layers).apply {
            // Shadow occupies full bounds
            setLayerInset(0, 0, 0, 0, 0)
            // Surface is elevated, leaving bottom shadow visible
            setLayerInset(1, 0, 0, 0, shadowPx)
        }
    }

    /**
     * Creates an elevated dark card surface with subtle highlight stroke
     */
    fun createCardSurfaceDrawable(
        context: Context,
        topBgColor: Int = Color.parseColor("#151821"),
        bottomBgColor: Int = Color.parseColor("#0E1017"),
        strokeColor: Int = Color.parseColor("#262C3A"),
        cornerRadiusDp: Float = 14f
    ): GradientDrawable {
        val cornerPx = cornerRadiusDp * context.resources.displayMetrics.density
        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(topBgColor, bottomBgColor)
        ).apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = cornerPx
            setStroke(dp(context, 1.0f), strokeColor)
        }
    }

    /**
     * Creates a deep circular background with subtle radial-like layered border
     */
    fun createScreenBackground(context: Context): GradientDrawable {
        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(Color.parseColor("#0C0E13"), Color.parseColor("#060709"))
        )
    }

    /**
     * Attaches tactile physical depression animation and haptic pulse on touch
     */
    fun attachTactileFeedback(view: View, onClick: () -> Unit) {
        val vibrator = view.context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator

        view.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    // Tactile press: scale down slightly & shift downwards
                    v.animate()
                        .scaleX(0.95f)
                        .scaleY(0.95f)
                        .translationY(v.context.resources.displayMetrics.density * 2f)
                        .setDuration(70)
                        .setInterpolator(AccelerateDecelerateInterpolator())
                        .start()

                    // Light haptic click
                    vibrator?.let {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            it.vibrate(VibrationEffect.createOneShot(25, VibrationEffect.DEFAULT_AMPLITUDE))
                        } else {
                            @Suppress("DEPRECATION")
                            it.vibrate(25)
                        }
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    // Release: spring back up
                    v.animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .translationY(0f)
                        .setDuration(110)
                        .setInterpolator(AccelerateDecelerateInterpolator())
                        .withEndAction { onClick() }
                        .start()
                    true
                }
                MotionEvent.ACTION_CANCEL -> {
                    v.animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .translationY(0f)
                        .setDuration(110)
                        .setInterpolator(AccelerateDecelerateInterpolator())
                        .start()
                    true
                }
                else -> false
            }
        }
    }

    /**
     * Starts a gentle breathing pulse animation for the monitoring status dot
     */
    fun startBreatheAnimation(view: View): ObjectAnimator {
        return ObjectAnimator.ofFloat(view, "alpha", 0.35f, 1.0f).apply {
            duration = 1100
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }
}

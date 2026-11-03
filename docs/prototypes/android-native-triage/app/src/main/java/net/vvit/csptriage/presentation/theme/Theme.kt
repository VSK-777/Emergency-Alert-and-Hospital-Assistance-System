package net.vvit.csptriage.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = MedicalAccentBlue,
    onPrimary = Color.Black,
    secondary = MedicalVitalGreen,
    onSecondary = Color.Black,
    tertiary = MedicalWarningAmber,
    error = MedicalEmergencyRed,
    background = MedicalDarkBackground,
    onBackground = TextPrimaryDark,
    surface = MedicalDarkSurface,
    onSurface = TextPrimaryDark,
    surfaceVariant = MedicalDarkCard,
    onSurfaceVariant = TextSecondaryDark,
    outline = MedicalCardBorder
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF0284C7),
    onPrimary = Color.White,
    secondary = Color(0xFF059669),
    onSecondary = Color.White,
    tertiary = Color(0xFFD97706),
    error = Color(0xFFDC2626),
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),
    surface = Color.White,
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFCBD5E1)
)

@Composable
fun CSPTriageTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

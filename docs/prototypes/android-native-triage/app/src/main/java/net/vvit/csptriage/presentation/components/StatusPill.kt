package net.vvit.csptriage.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.vvit.csptriage.presentation.theme.MedicalAccentBlue
import net.vvit.csptriage.presentation.theme.MedicalEmergencyRed
import net.vvit.csptriage.presentation.theme.MedicalVitalGreen
import net.vvit.csptriage.presentation.theme.MedicalWarningAmber

@Composable
fun StatusPill(
    text: String,
    type: StatusPillType,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor) = when (type) {
        StatusPillType.SUCCESS -> Pair(MedicalVitalGreen.copy(alpha = 0.2f), MedicalVitalGreen)
        StatusPillType.WARNING -> Pair(MedicalWarningAmber.copy(alpha = 0.2f), MedicalWarningAmber)
        StatusPillType.DANGER -> Pair(MedicalEmergencyRed.copy(alpha = 0.2f), MedicalEmergencyRed)
        StatusPillType.INFO -> Pair(MedicalAccentBlue.copy(alpha = 0.2f), MedicalAccentBlue)
        StatusPillType.MUTED -> Pair(Color.Gray.copy(alpha = 0.2f), Color.LightGray)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
    }
}

enum class StatusPillType {
    SUCCESS,
    WARNING,
    DANGER,
    INFO,
    MUTED
}

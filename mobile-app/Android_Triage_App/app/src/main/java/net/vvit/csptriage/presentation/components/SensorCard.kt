package net.vvit.csptriage.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.vvit.csptriage.presentation.theme.MedicalCardBorder
import net.vvit.csptriage.presentation.theme.MedicalDarkCard
import net.vvit.csptriage.presentation.theme.TextMutedDark
import net.vvit.csptriage.presentation.theme.TextPrimaryDark
import net.vvit.csptriage.presentation.theme.TextSecondaryDark

@Composable
fun SensorCard(
    title: String,
    valueText: String?, // null if unavailable, never 0
    unitText: String,
    isAvailable: Boolean,
    signalQuality: Int? = null,
    statusText: String? = null,
    accentColor: Color,
    graphPoints: List<Float>? = null,
    graphMin: Float = 0f,
    graphMax: Float = 100f,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalDarkCard),
        border = BorderStroke(1.dp, MedicalCardBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header: Title & Availability Pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title.uppercase(),
                    color = TextSecondaryDark,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )

                if (isAvailable) {
                    StatusPill(
                        text = if (signalQuality != null) "Quality $signalQuality%" else "Active",
                        type = if ((signalQuality ?: 100) >= 50) StatusPillType.SUCCESS else StatusPillType.WARNING
                    )
                } else {
                    StatusPill(
                        text = "Sensor Offline",
                        type = StatusPillType.MUTED
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Main Metric Display
            Row(
                verticalAlignment = Alignment.Bottom
            ) {
                if (isAvailable && valueText != null) {
                    Text(
                        text = valueText,
                        color = accentColor,
                        fontSize = 38.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = " $unitText",
                        color = TextSecondaryDark,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                } else {
                    Text(
                        text = "Unavailable",
                        color = TextMutedDark,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            if (statusText != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = statusText,
                    color = TextSecondaryDark,
                    fontSize = 12.sp
                )
            }

            // Embedded live mini graph if points provided
            if (isAvailable && graphPoints != null && graphPoints.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                MetricGraph(
                    dataPoints = graphPoints,
                    minRange = graphMin,
                    maxRange = graphMax,
                    lineColor = accentColor
                )
            }
        }
    }
}

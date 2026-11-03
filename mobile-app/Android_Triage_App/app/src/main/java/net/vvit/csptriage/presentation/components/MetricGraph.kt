package net.vvit.csptriage.presentation.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import net.vvit.csptriage.presentation.theme.GraphGridLine
import net.vvit.csptriage.presentation.theme.MedicalDarkBackground

@Composable
fun MetricGraph(
    dataPoints: List<Float>,
    minRange: Float,
    maxRange: Float,
    lineColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(72.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(MedicalDarkBackground)
    ) {
        Canvas(modifier = Modifier.matchParentSize()) {
            val width = size.width
            val height = size.height

            // 1. Draw subtle medical grid lines
            val numGridLines = 4
            for (i in 1..numGridLines) {
                val y = height * (i.toFloat() / (numGridLines + 1))
                drawLine(
                    color = GraphGridLine,
                    start = Offset(0f, y),
                    end = Offset(width, y),
                    strokeWidth = 1f
                )
            }

            if (dataPoints.size < 2) return@Canvas

            // 2. Plot live trend path
            val path = Path()
            val stepX = width / (dataPoints.size - 1).coerceAtLeast(1)
            val range = (maxRange - minRange).coerceAtLeast(1f)

            dataPoints.forEachIndexed { index, value ->
                val normY = 1f - ((value - minRange) / range).coerceIn(0f, 1f)
                val x = index * stepX
                val y = normY * height

                if (index == 0) {
                    path.moveTo(x, y)
                } else {
                    path.lineTo(x, y)
                }
            }

            drawPath(
                path = path,
                color = lineColor,
                style = Stroke(width = 2.5f.dp.toPx(), cap = StrokeCap.Round)
            )

            // Current latest point dot
            val lastVal = dataPoints.last()
            val lastNormY = 1f - ((lastVal - minRange) / range).coerceIn(0f, 1f)
            drawCircle(
                color = lineColor,
                radius = 3.5f.dp.toPx(),
                center = Offset(width, lastNormY * height)
            )
        }
    }
}

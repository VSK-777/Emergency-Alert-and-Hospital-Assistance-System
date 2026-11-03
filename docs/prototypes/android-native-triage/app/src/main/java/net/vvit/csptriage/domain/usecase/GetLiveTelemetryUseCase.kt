package net.vvit.csptriage.domain.usecase

import kotlinx.coroutines.flow.StateFlow
import net.vvit.csptriage.domain.model.TelemetryData
import net.vvit.csptriage.domain.repository.TriageRepository

class GetLiveTelemetryUseCase(private val repository: TriageRepository) {
    operator fun invoke(): StateFlow<TelemetryData?> = repository.latestTelemetry
}

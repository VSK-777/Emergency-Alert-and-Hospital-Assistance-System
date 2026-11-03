package net.vvit.csptriage.domain.usecase

import net.vvit.csptriage.data.ble.CommandResult
import net.vvit.csptriage.domain.repository.TriageRepository

class SendSimulationCommandUseCase(private val repository: TriageRepository) {
    suspend fun toggleSimMode(): CommandResult = repository.sendSimToggle()
    suspend fun triggerSimImpact(): CommandResult = repository.sendSimImpact()
}

package net.vvit.csptriage.data.ble

import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

sealed class CommandResult {
    data class Success(val command: String) : CommandResult()
    data class Failure(val command: String, val reason: String) : CommandResult()
    object NotConnected : CommandResult()
}

class BleCommandManager(private val gattManager: BleGattManager) {

    suspend fun sendSimToggle(): CommandResult {
        return sendCommand(BleConfig.CMD_SIM)
    }

    suspend fun sendSimImpact(): CommandResult {
        return sendCommand(BleConfig.CMD_SIM_IMPACT)
    }

    suspend fun sendCancelAlert(): CommandResult {
        return sendCommand(BleConfig.CMD_CANCEL)
    }

    private suspend fun sendCommand(commandText: String): CommandResult {
        val currentState = gattManager.connectionState.value
        if (!currentState.isArmed) {
            return CommandResult.NotConnected
        }

        val bytes = commandText.toByteArray(Charsets.UTF_8)
        return suspendCancellableCoroutine { continuation ->
            val sent = gattManager.sendControlCommand(bytes) { success ->
                if (continuation.isActive) {
                    if (success) {
                        continuation.resume(CommandResult.Success(commandText))
                    } else {
                        continuation.resume(CommandResult.Failure(commandText, "Firmware rejected write or GATT failed"))
                    }
                }
            }

            if (!sent) {
                if (continuation.isActive) {
                    continuation.resume(CommandResult.Failure(commandText, "Could not initiate characteristic write"))
                }
            }
        }
    }
}

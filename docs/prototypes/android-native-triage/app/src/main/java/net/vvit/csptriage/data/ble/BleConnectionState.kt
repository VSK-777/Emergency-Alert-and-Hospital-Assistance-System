package net.vvit.csptriage.data.ble

sealed class BleConnectionState(val label: String) {
    object Disconnected : BleConnectionState("Disconnected")
    object Scanning : BleConnectionState("Scanning for CSP-Triage-V1…")
    data class Connecting(val deviceName: String, val address: String) : BleConnectionState("Connecting to $deviceName…")
    data class Connected(val deviceName: String, val address: String) : BleConnectionState("Connected")
    object DiscoveringServices : BleConnectionState("Discovering GATT Services…")
    object Subscribing : BleConnectionState("Subscribing to Telemetry…")
    data class Ready(val deviceName: String, val address: String) : BleConnectionState("System Online & Armed")
    data class Reconnecting(val attempt: Int, val delayMs: Long) : BleConnectionState("Reconnecting (Attempt $attempt)…")
    data class Error(val message: String, val cause: Throwable? = null) : BleConnectionState("Error: $message")

    val isArmed: Boolean get() = this is Ready
    val isConnectingOrBusy: Boolean get() = this is Scanning || this is Connecting || this is DiscoveringServices || this is Subscribing || this is Reconnecting
}

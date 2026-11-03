package net.vvit.csptriage.permissions

data class PermissionState(
    val hasBleScan: Boolean = false,
    val hasBleConnect: Boolean = false,
    val hasFineLocation: Boolean = false,
    val hasNotifications: Boolean = false,
    val hasSms: Boolean = false
) {
    val isCoreReady: Boolean
        get() = (hasBleScan && hasBleConnect && hasFineLocation)
}

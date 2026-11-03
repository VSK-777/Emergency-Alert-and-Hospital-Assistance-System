package net.vvit.csptriage.data.location

sealed class LocationResult {
    data class Success(
        val latitude: Double,
        val longitude: Double,
        val accuracyMeters: Float,
        val timestampMillis: Long = System.currentTimeMillis()
    ) : LocationResult() {
        val googleMapsUrl: String
            get() = "https://www.google.com/maps/search/?api=1&query=$latitude,$longitude"
    }

    object PermissionDenied : LocationResult()
    object GpsDisabled : LocationResult()
    data class Unavailable(val reason: String) : LocationResult()
}

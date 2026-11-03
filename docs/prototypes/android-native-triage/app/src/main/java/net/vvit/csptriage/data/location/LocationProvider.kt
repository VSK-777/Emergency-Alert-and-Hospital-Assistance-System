package net.vvit.csptriage.data.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class LocationProvider(private val context: Context) {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)
    private val locationManager: LocationManager =
        context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    fun hasLocationPermission(): Boolean {
        val fineLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarseLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fineLocation || coarseLocation
    }

    fun isGpsEnabled(): Boolean {
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocation(): LocationResult {
        if (!hasLocationPermission()) {
            return LocationResult.PermissionDenied
        }
        if (!isGpsEnabled()) {
            return LocationResult.GpsDisabled
        }

        // Try FusedLocationProviderClient first
        try {
            val fusedLocation = suspendCancellableCoroutine<Location?> { cont ->
                fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                    .addOnSuccessListener { loc ->
                        if (cont.isActive) cont.resume(loc)
                    }
                    .addOnFailureListener {
                        if (cont.isActive) cont.resume(null)
                    }
            }

            if (fusedLocation != null) {
                return LocationResult.Success(
                    latitude = fusedLocation.latitude,
                    longitude = fusedLocation.longitude,
                    accuracyMeters = fusedLocation.accuracy,
                    timestampMillis = fusedLocation.time
                )
            }
        } catch (_: Exception) {}

        // Fallback to LocationManager last known or one-shot update
        return suspendCancellableCoroutine { continuation ->
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            var bestLocation: Location? = null

            for (p in providers) {
                if (locationManager.isProviderEnabled(p)) {
                    val last = locationManager.getLastKnownLocation(p)
                    if (last != null && (bestLocation == null || last.accuracy < bestLocation.accuracy)) {
                        bestLocation = last
                    }
                }
            }

            if (bestLocation != null) {
                continuation.resume(
                    LocationResult.Success(
                        latitude = bestLocation.latitude,
                        longitude = bestLocation.longitude,
                        accuracyMeters = bestLocation.accuracy,
                        timestampMillis = bestLocation.time
                    )
                )
                return@suspendCancellableCoroutine
            }

            // One-shot single location request fallback
            val listener = object : LocationListener {
                override fun onLocationChanged(loc: Location) {
                    locationManager.removeUpdates(this)
                    if (continuation.isActive) {
                        continuation.resume(
                            LocationResult.Success(
                                latitude = loc.latitude,
                                longitude = loc.longitude,
                                accuracyMeters = loc.accuracy,
                                timestampMillis = loc.time
                            )
                        )
                    }
                }
                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            val registered = try {
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, listener, Looper.getMainLooper())
                    true
                } else if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, listener, Looper.getMainLooper())
                    true
                } else {
                    false
                }
            } catch (e: Exception) {
                false
            }

            if (!registered && continuation.isActive) {
                continuation.resume(LocationResult.Unavailable("GPS signal acquiring, please move outdoors"))
            }
        }
    }
}

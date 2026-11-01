package net.vvit.csp.wear.storage

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class LocalWatchStore(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("vvit_wear_incidents_store", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_INCIDENTS = "cached_incidents_json"
    }

    @Synchronized
    fun saveIncident(incident: WatchIncident) {
        val list = getIncidents().toMutableList()
        val index = list.indexOfFirst { it.id == incident.id }
        if (index >= 0) {
            list[index] = incident
        } else {
            list.add(0, incident) // Prepend newest
        }

        // Limit stored incidents to 25 to preserve memory
        val trimmedList = if (list.size > 25) list.take(25) else list

        val jsonArray = JSONArray()
        for (item in trimmedList) {
            val obj = JSONObject().apply {
                put("id", item.id)
                put("timestampMs", item.timestampMs)
                put("detectionReason", item.detectionReason)
                put("detectionScore", item.detectionScore.toDouble())
                put("userConfirmationState", item.userConfirmationState)
                put("deliveryState", item.deliveryState)
                put("peakAccelG", item.peakAccelG.toDouble())
                put("peakGyroRadS", item.peakGyroRadS.toDouble())
                put("origin", item.origin)
                put("isSimulated", item.isSimulated)
            }
            jsonArray.put(obj)
        }

        prefs.edit().putString(KEY_INCIDENTS, jsonArray.toString()).apply()
    }

    @Synchronized
    fun getIncidents(): List<WatchIncident> {
        val raw = prefs.getString(KEY_INCIDENTS, null) ?: return emptyList()
        val results = mutableListOf<WatchIncident>()
        try {
            val jsonArray = JSONArray(raw)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                results.add(
                    WatchIncident(
                        id = obj.getString("id"),
                        timestampMs = obj.getLong("timestampMs"),
                        detectionReason = obj.getString("detectionReason"),
                        detectionScore = obj.getDouble("detectionScore").toFloat(),
                        userConfirmationState = obj.getString("userConfirmationState"),
                        deliveryState = obj.getString("deliveryState"),
                        peakAccelG = obj.optDouble("peakAccelG", 1.0).toFloat(),
                        peakGyroRadS = obj.optDouble("peakGyroRadS", 0.0).toFloat(),
                        origin = obj.optString("origin", "SENSOR"),
                        isSimulated = obj.optBoolean("isSimulated", false)
                    )
                )
            }
        } catch (_: Exception) {}
        return results
    }

    @Synchronized
    fun markDelivered(id: String) {
        val list = getIncidents().map {
            if (it.id == id) it.copy(deliveryState = "DELIVERED_TO_PHONE") else it
        }
        val jsonArray = JSONArray()
        for (item in list) {
            val obj = JSONObject().apply {
                put("id", item.id)
                put("timestampMs", item.timestampMs)
                put("detectionReason", item.detectionReason)
                put("detectionScore", item.detectionScore.toDouble())
                put("userConfirmationState", item.userConfirmationState)
                put("deliveryState", item.deliveryState)
                put("peakAccelG", item.peakAccelG.toDouble())
                put("peakGyroRadS", item.peakGyroRadS.toDouble())
                put("origin", item.origin)
                put("isSimulated", item.isSimulated)
            }
            jsonArray.put(obj)
        }
        prefs.edit().putString(KEY_INCIDENTS, jsonArray.toString()).apply()
    }

    @Synchronized
    fun clearAll() {
        prefs.edit().remove(KEY_INCIDENTS).apply()
    }
}

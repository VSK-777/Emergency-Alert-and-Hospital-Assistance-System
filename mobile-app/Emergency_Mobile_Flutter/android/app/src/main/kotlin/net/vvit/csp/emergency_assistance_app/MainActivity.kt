package net.vvit.csp.emergency_assistance_app

import android.content.Intent
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val CHANNEL = "net.vvit.csp.emergency/notifications"
    private var pendingRoute: String? = null
    private var pendingIncidentId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        extractEmergencyPayload(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        extractEmergencyPayload(intent)
    }

    private fun extractEmergencyPayload(intent: Intent?) {
        if (intent != null) {
            val route = intent.getStringExtra("route")
            val incidentId = intent.getStringExtra("incidentId")
            if (!route.isNullOrBlank()) {
                pendingRoute = route
                pendingIncidentId = incidentId
            }
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getPendingNotificationRoute" -> {
                    val map = mutableMapOf<String, String>()
                    pendingRoute?.let { map["route"] = it }
                    pendingIncidentId?.let { map["incidentId"] = it }
                    // Consume pending route once read
                    pendingRoute = null
                    pendingIncidentId = null
                    result.success(map)
                }
                "showEmergencyNotification" -> {
                    val incidentId = call.argument<String>("incidentId") ?: "inc-${System.currentTimeMillis()}"
                    val reason = call.argument<String>("detectionReason") ?: "Possible accident detected"
                    val peakG = call.argument<Double>("peakAccelG") ?: 3.5
                    WearMessageListenerService.showNotification(this, incidentId, reason, peakG)
                    result.success(true)
                }
                "triggerTestAccidentNotification" -> {
                    val fakePayload = """
                        {
                            "incidentId": "test-sim-${System.currentTimeMillis()}",
                            "detectionReason": "High-impact fall detected with angular acceleration",
                            "peakAccelG": 3.75
                        }
                    """.trimIndent()
                    val listener = WearMessageListenerService()
                    // Create channel and display notification
                    try {
                        val method = WearMessageListenerService::class.java.getDeclaredMethod("handleEmergencyMessage", String::class.java)
                        method.isAccessible = true
                        method.invoke(listener, fakePayload)
                        result.success(true)
                    } catch (ex: Exception) {
                        result.error("TEST_ERROR", ex.message, null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }
}

package net.vvit.csp.emergency.model;

public enum IncidentSource {
    SMARTWATCH_SENSOR, // Genuine triple-axis accelerometer + gyroscope IMU detected accident
    MANUAL_SOS,        // Explicit deliberate user emergency SOS trigger
    SMARTWATCH_AUTO,   // Legacy alias
    SMARTWATCH_SOS,    // Watch manual trigger
    MOBILE_SOS,        // Mobile manual trigger
    MANUAL_WEB,        // Dispatcher manual trigger
    MANUAL,
    SIMULATED          // Isolated test harness only - separated from real operations
}

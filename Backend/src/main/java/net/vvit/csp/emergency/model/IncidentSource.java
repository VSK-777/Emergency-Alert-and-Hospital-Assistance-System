package net.vvit.csp.emergency.model;

public enum IncidentSource {
    SMARTWATCH_SENSOR, // Genuine triple-axis accelerometer + gyroscope IMU detected accident
    MOBILE_MANUAL_SOS, // Deliberate mobile app citizen manual emergency trigger
    MANUAL_SOS,        // Explicit deliberate user emergency SOS trigger
    SMARTWATCH_AUTO,   // Smartwatch sensor detection
    SMARTWATCH_SOS,    // Watch manual trigger
    MOBILE_SOS,        // Mobile manual trigger
    MANUAL_WEB,        // Legacy dispatcher manual trigger
    MANUAL,
    SIMULATED          // Isolated test harness only - separated from real operations
}

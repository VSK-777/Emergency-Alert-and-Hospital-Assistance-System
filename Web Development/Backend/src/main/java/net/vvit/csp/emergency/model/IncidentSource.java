package net.vvit.csp.emergency.model;

public enum IncidentSource {
    ESP32_HARDWARE,    // ESP32 Triage Hardware automatic trauma & accident detection
    ESP32_TRIAGE,      // ESP32 Triage companion alert
    MOBILE_MANUAL_SOS, // Deliberate mobile app citizen manual emergency trigger
    MANUAL_SOS,        // Explicit deliberate user emergency SOS trigger
    MOBILE_SOS,        // Mobile manual trigger
    MANUAL_WEB,        // Dispatcher manual trigger
    MANUAL,
    SIMULATED,         // Isolated test harness only - separated from real operations
    SMARTWATCH_SENSOR, // Legacy / backward compatibility
    SMARTWATCH_AUTO,
    SMARTWATCH_SOS
}

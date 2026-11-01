# VVIT CSP Watch — Wear OS Smartwatch Application

Part of the **Emergency Alert and Hospital Assistance System**  
B.Tech Community Service Project (CSP) — VVIT CSE Batch 8  
**Project Guide:** Mr. G. Lakshmi Narayana  
**Prepared by:** VSK  

---

## Overview

The VVIT CSP Watch application is a native Kotlin Wear OS application engineered for real-time accident detection, severe fall impact evaluation, and emergency response dispatch. It operates with an offline-first architecture, ensuring incidents are recorded locally on the watch hardware and synchronized to companion phones via the Google Play Services Wearable Data Layer.

## Key Features

1. **Hardware IMU Sensor Pipeline:**
   - Real-time sampling of hardware accelerometer and gyroscope at ~50Hz.
   - 150-sample sliding telemetry buffer (~3 seconds temporal window).
   - Real-time G-force magnitude calculation and stillness immobility evaluation.
   - Dynamic hardware status check (`IMU 50Hz: Accel + Gyro active`).

2. **Strict Application State Machine:**
   - `INITIALIZING` &rarr; `MONITORING_ACTIVE` &rarr; `POSSIBLE_ACCIDENT` &rarr; `COUNTDOWN_ACTIVE` &rarr; `USER_CANCELLED` / `EMERGENCY_CONFIRMED`.
   - Distinct attribution for `SENSOR`, `MANUAL_SOS`, and `SIMULATED` events.

3. **Wear OS Circular Design System:**
   - Deep dark charcoal background (`#0A0B0E`) optimized for circular OLED displays.
   - Ergonomic rounded pill buttons (`EMERGENCY SOS`, `SIMULATE FALL (TEST)`, `INCIDENT HISTORY`).
   - Circular display safe-inset margins to prevent edge clipping.

4. **False-Alarm Mitigation & Emergency Countdown:**
   - 10-second countdown with per-second haptic vibration pulses.
   - High-contrast **I'M OK (CANCEL)** button to prevent accidental dispatches.
   - Immediate **SEND ALERT NOW** button for rapid manual escalation.

5. **Local Persistent Storage & Dedicated Incident Log:**
   - Durably saves up to 25 recent incidents with timestamps, peak G-forces, confirmation states, and sync status.
   - Scrollable `IncidentHistoryActivity` with color-coded origin badges (`[SIM]`, `[SOS]`, `[SENSOR]`).

## Project Structure

```
Smart Watch App/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── java/net/vvit/csp/wear/
│   │   │       ├── comm/
│   │   │       │   ├── PhoneSyncManager.kt     # Wearable Data Layer sync
│   │   │       │   └── WatchPayload.kt         # JSON message payload
│   │   │       ├── detector/
│   │   │       │   ├── DetectionResult.kt      # Detection evaluation model
│   │   │       │   ├── FallDetector.kt         # IMU trauma algorithm
│   │   │       │   ├── MotionTelemetry.kt      # 3-axis accel/gyro telemetry
│   │   │       │   └── SensorPipeline.kt       # Continuous 50Hz hardware IMU listener
│   │   │       ├── service/
│   │   │       │   └── AccidentMonitorService.kt # Background monitoring lifecycle service
│   │   │       ├── state/
│   │   │       │   └── AppState.kt             # Application state machine & enums
│   │   │       ├── storage/
│   │   │       │   ├── LocalWatchStore.kt      # SharedPreferences persistent incident storage
│   │   │       │   └── WatchIncident.kt        # Stored incident data model
│   │   │       └── ui/
│   │   │           ├── CountdownActivity.kt    # Circular countdown alert screen
│   │   │           ├── IncidentHistoryActivity.kt # Scrollable history log viewer
│   │   │           └── MainActivity.kt         # Main monitoring circular dashboard
│   │   └── test/java/net/vvit/csp/wear/
│   │       └── detector/
│   │           └── FallDetectorTest.kt         # Unit tests
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

## Build and Testing

```powershell
# Run unit tests
.\gradlew.bat test

# Assemble debug APK
.\gradlew.bat assembleDebug

# Install on Wear OS emulator
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Launch Main Activity
adb shell am start -n net.vvit.csp.wear/.ui.MainActivity
```

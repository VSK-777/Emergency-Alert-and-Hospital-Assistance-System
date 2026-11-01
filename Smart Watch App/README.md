# VVIT CSP Watch — Wear OS Smartwatch Application

### Native Wear OS High-Frequency Fall & Accident Detection Application

**Official Project Name:** Emergency Alert and Hospital Assistance System  
**Project Type:** Community Service Project (CSP)  
**Academic Programme:** Bachelor of Technology (B.Tech)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT), Guntur, Andhra Pradesh  
**Department:** Computer Science and Engineering  
**Batch:** Batch 8  
**Prepared by:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana (Assistant Professor)  

**Live Production Deployments:**
- **Web App (Vercel):** [https://emergency-alert-and-hospital-assistance-system.vercel.app](https://emergency-alert-and-hospital-assistance-system.vercel.app)
- **Backend API (Render):** [https://emergency-alert-and-hospital-assistance.onrender.com](https://emergency-alert-and-hospital-assistance.onrender.com)
- **Swagger UI:** [https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html](https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html)

---

## 1. Overview & Architecture

The **VVIT CSP Watch** application is an autonomous Wear OS Kotlin application engineered for real-time accident detection, severe vehicular impact analysis, and emergency response escalation. It features an offline-first architecture, ensuring all telemetry and incident logs are durably saved to the smartwatch's local storage and synchronized to companion phones via the Google Play Services Wearable Data Layer.

```
Hardware IMU Sensors (50Hz) ──> FallDetector Pipeline ──> 10s Countdown ──> PhoneSyncManager ──> Companion Phone
                                       │
                                       └──> LocalWatchStore (Persistent Incident Journal)
```

---

## 2. Key Capabilities

### 1. High-Frequency Hardware IMU Sensor Pipeline
- Continuous sampling of the watch's physical 3-axis accelerometer and gyroscope at ~50Hz.
- 150-sample sliding telemetry window (~3000ms duration) evaluating acceleration peaks and rotational velocity.
- Multi-phase impact validation:
  $$\text{Vector Magnitude} \ge 2.8\text{g} \quad \text{and} \quad \text{Angular Velocity} \ge 2.5\text{ rad/s} \quad \text{followed by} \quad \text{Immobility Window} \ge 2000\text{ms}$$

### 2. Strict Deterministic State Machine
- Lifecycle states: `INITIALIZING` &rarr; `MONITORING_ACTIVE` &rarr; `POSSIBLE_ACCIDENT` &rarr; `COUNTDOWN_ACTIVE` &rarr; `USER_CANCELLED` / `EMERGENCY_CONFIRMED`.
- Explicit event provenance tracking (`SENSOR`, `MANUAL_SOS`, `SIMULATED`).

### 3. Circular Wear OS Ergonomics
- High-contrast charcoal aesthetic (`#0A0B0E`) tailored for circular OLED smartwatch displays.
- Safe-inset padding preventing UI clipping along curved screen perimeters.
- Tactile, oversized buttons for rapid emergency action (`EMERGENCY SOS`, `SIMULATE FALL (TEST)`, `INCIDENT HISTORY`).

### 4. False-Alarm Mitigation & Safety Countdown
- 10-second alert countdown accompanied by rhythmic haptic vibration pulses.
- High-visibility **"I'M OK (CANCEL)"** action to dismiss non-injurious events.
- Immediate **"SEND ALERT NOW"** button for instantaneous manual dispatch.

### 5. Durable Local Journaling
- Automatically preserves the 25 most recent incident records with timestamps, peak G-forces, confirmation states, and phone sync flags.
- Dedicated `IncidentHistoryActivity` view with color-coded origin tags.

---

## 3. Directory Structure

```
Smart Watch App/
|-- app/
|   |-- src/main/
|   |   |-- AndroidManifest.xml     # Wear OS sensor permissions & service declarations
|   |   |-- java/net/vvit/csp/wear/
|   |   |   |-- comm/               # PhoneSyncManager & WatchPayload serialization
|   |   |   |-- detector/           # FallDetector, SensorPipeline, MotionTelemetry
|   |   |   |-- service/            # Background AccidentMonitorService
|   |   |   |-- state/              # AppState lifecycle transitions & enums
|   |   |   |-- storage/            # LocalWatchStore persistent SharedPreferences
|   |   |   `-- ui/                 # MainActivity, CountdownActivity, IncidentHistoryActivity
|   |   `-- res/                    # Circular drawables, icons, and layouts
|   `-- build.gradle.kts            # Wear OS module dependencies and Android SDK config
|-- build.gradle.kts                # Project-level Gradle build configuration
|-- settings.gradle.kts             # Gradle settings
`-- README.md                       # Smartwatch documentation
```

---

## 4. Build and Deployment

### Prerequisites
- Android SDK (API 30+ / Wear OS 3+)
- Java Development Kit (JDK) 17+ or 21
- Android Studio / ADB

### Build Debug APK
```bash
cd "Smart Watch App"
.\gradlew.bat assembleDebug
```

### Install onto Wear OS Emulator or Physical Watch
```bash
# Install via ADB:
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Launch Main Wear OS Activity:
adb shell am start -n net.vvit.csp.wear/.ui.MainActivity
```

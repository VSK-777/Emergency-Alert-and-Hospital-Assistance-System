# Emergency Alert and Hospital Assistance System — Flutter Mobile App

### Cross-Platform Emergency Assistance & Citizen Companion Application

**Official Project Name:** Emergency Alert and Hospital Assistance System  
**Project Type:** Community Service Project (CSP)  
**Academic Programme:** Bachelor of Technology (B.Tech)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT), Guntur, Andhra Pradesh  
**Department:** Computer Science and Engineering  
**Batch:** Batch 8  
**Prepared by:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana (Assistant Professor)  

**Live Production Deployments:**
- **Web App (Vercel):** [https://frontend-seven-zeta-99.vercel.app](https://frontend-seven-zeta-99.vercel.app)
- **Backend API (Render):** [https://emergency-alert-and-hospital-assistance.onrender.com](https://emergency-alert-and-hospital-assistance.onrender.com)
- **Swagger UI:** [https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html](https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html)

---

## 1. Overview & Architecture

The **Emergency Alert and Hospital Assistance System Mobile App** serves as the citizen's primary field companion. Engineered in Flutter (Dart), it provides an offline-first emergency response pipeline, an interactive first-aid reference guide, and automatic synchronization with the Spring Boot backend on Render.

```text
ESP32 Firmware (IMU & BLE GATT) ──Bluetooth LE──> Mobile App (Flutter) ──HTTPS──> Spring Boot API
                                                         │
                                                         └──Local Persistence (Offline Buffer)
```

- **Framework:** Flutter 3.x (Dart 3.x)
- **State Management:** Riverpod 2.6
- **Routing:** `go_router` 14.8
- **Networking:** Dio 5.11 with automatic JWT interceptors and connectivity detection
- **Local Persistence & Security:**
  - `flutter_secure_storage` for encrypted JWT credentials
  - `shared_preferences` for offline pending emergency incident queues, cached emergency contacts, and medical profiles
- **Mapping:** OpenStreetMap (`flutter_map` 7.0 + `latlong2`) with fallback coordinates for VVIT / Guntur / Vijayawada trauma network
- **Offline First Aid:** Authoritative emergency first-aid knowledge base (`assets/first_aid.json`) complying with Red Cross and WHO guidelines
- **ESP32 Hardware Integration:** Real-time sensor telemetry listener over BLE GATT and automated emergency dispatch upon high-G impact / crash detection

---

## 2. Core Capabilities

### 1. Offline-First Emergency SOS
- High-visibility emergency red user interface with high-contrast tactile tap targets.
- 10-second animated safety countdown with audible and haptic feedback.
- Prominent **"I'M OK — CANCEL ALERT"** trigger to prevent false dispatches.
- Immediate manual emergency dispatch override.

### 2. Durable Local Storage & Sync Engine
- Every incident is persisted to local device storage prior to network transmission.
- Survives device reboots and low-battery shutdowns.
- Background `SyncService` detects network restoration and dispatches buffered incidents via `/api/v1/sync` using unique idempotency keys to eliminate server duplication.

### 3. Curated Emergency First-Aid Directory
- Instant offline access to life-saving step-by-step instructions for 10 critical trauma scenarios:
  1. CPR / Cardiac Arrest
  2. Severe Bleeding & Hemorrhage
  3. Road Traffic Accidents
  4. Burns & Scalds
  5. Choking & Airway Obstruction
  6. Seizures & Epilepsy
  7. Fractures & Spinal Trauma
  8. Electric Shock
  9. Heat Stroke & Hypothermia
  10. Poisoning & Chemical Exposure

### 4. Real-Time Hospital Discovery
- Haversine-based proximity listing of nearby participating emergency centers.
- Real-time visibility into available ICU beds, trauma facilities, and ambulance fleets.

### 5. Hardware Sensor Hub & Telemetry
- Active connection health indicator with paired ESP32 accident detection hardware over BLE GATT.
- Real-time IMU sensor monitoring (accelerometer G-force magnitude and gyroscope angular velocity).
- One-tap `"Simulate Hardware Accident Spike"` test harness for validation without physical hazard.

---

## 3. Directory Structure

```
mobile-app/
|-- android/                        # Android platform project & Gradle build
|-- ios/                            # iOS platform project & Xcode workspace
|-- assets/                         # Curated emergency first-aid guides & icon assets
|-- lib/
|   |-- core/
|   |   |-- constants/              # ApiEndpoints configuration (Render production URL)
|   |   |-- network/                # Dio client with JWT interceptor & retry policies
|   |   |-- storage/                # LocalStore persistent caching engine
|   |   |-- sync/                   # Background idempotency sync engine
|   |   `-- theme/                  # High-contrast clinical and emergency styling
|   |-- models/                     # Incident, triage, hospital, user, and expense data models
|   |-- providers/                  # Riverpod state notifiers & view models
|   |-- router/                     # Navigation route definitions
|   |-- views/                      # Application screens (Home, SOS, Map, Profile, Hospitals, Triage)
|   `-- main.dart                   # Application entry point
|-- pubspec.yaml                    # Package dependencies and asset declarations
`-- README.md                       # Mobile client documentation
```

---

## 4. Running the Mobile Application

### Step 1: Install Dependencies
```bash
cd mobile-app
flutter pub get
```

### Step 2: Launch on Target Device
```bash
# Run on connected Android device or emulator:
flutter run

# Run on Windows Desktop:
flutter run -d windows
```

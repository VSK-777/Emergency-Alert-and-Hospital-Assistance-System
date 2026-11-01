# Emergency Alert and Hospital Assistance System - Flutter Mobile App

**Project:** B.Tech Community Service Project (CSP)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Department:** Computer Science and Engineering (Batch 8)  
**Prepared by:** VSK  

---

## Architecture & Technology Stack
- **Framework:** Flutter 3.44.8 (Dart 3.12.2)
- **State Management:** Riverpod 2.6
- **Routing:** go_router 14.8
- **Networking:** Dio 5.11 with automatic JWT interceptor and connectivity detection
- **Local Persistence & Security:**
  - `flutter_secure_storage` for JWT tokens
  - `shared_preferences` for offline pending emergency incidents queue, cached emergency contacts, and cached medical profiles
- **Mapping:** OpenStreetMap (`flutter_map` 7.0 + `latlong2`) with offline fallback coordinates for VVIT / Guntur / Vijayawada region
- **Offline First Aid:** Curated, authoritative first-aid knowledge base (`assets/first_aid.json`) based on Red Cross and WHO guidelines
- **Wear OS Integration:** Real-time sensor telemetry listener and test replay harness for smartwatch accident detection

---

## Features
1. **Offline-First Emergency SOS:**
   - Big tap target with high-visibility emergency red theme.
   - 10-second animated countdown.
   - Prominent **"I'M OK — CANCEL ALERT"** button to eliminate false alarms.
   - Immediate manual override dispatch option.
2. **Offline Local Incident Persistence:**
   - Every incident is durably saved to device storage before any network request is attempted.
   - Survives app restarts.
   - Displays clear status indicators: `"Saved locally"`, `"Sending"`, `"Delivered"`, `"Acknowledged"`, or `"Failed"`.
3. **Automatic & Idempotent Sync Service:**
   - Detects when network connectivity returns.
   - Batches unsynced incidents to `/api/v1/sync` using unique idempotency keys.
   - Deduplicates replays without creating duplicate incidents on server.
4. **Offline First-Aid Guide:**
   - Instant access to emergency protocols for 10 critical scenarios (Cardiac Arrest, Bleeding, Road Accidents, Burns, Choking, Seizures, Fractures, Electric Shock, Unconsciousness).
   - Authoritative attribution and crucial safety warnings.
5. **Hospital Proximity Discovery:**
   - Displays nearby participating trauma centers with distances.
   - Shows emergency beds, available ICUs, and ambulances.
6. **Smartwatch Hub & Telemetry Replay:**
   - Real-time connection status with Wear OS.
   - IMU sensor stream monitoring.
   - One-tap "Simulate Wear OS Accident Spike" test trigger.

---

## Running the Mobile Application

### Fetch Dependencies
```bash
flutter pub get
```

### Run Automated Unit and Widget Tests
```bash
flutter test
```

### Run on Android Emulator or Physical Device
```bash
# Target Android Pixel_9_Pro emulator
flutter run -d emulator-5554
# Target Windows Desktop
flutter run -d windows
```

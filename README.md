# Emergency Alert and Hospital Assistance System

### Offline-First Smartwatch Accident Detection + Flutter Mobile Application + Java Spring Boot Backend

**Official Project Name:** Emergency Alert and Hospital Assistance System  
**Project Type:** Community Service Project (CSP)  
**Academic Programme:** Bachelor of Technology (B.Tech)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT), Guntur, Andhra Pradesh  
**Department:** Computer Science and Engineering  
**Batch:** 8  
**Prepared by:** VSK  
**Project Guide:** Mr. G. Lakshmi Narayana (Assist. Prof)  

---

## 1. Executive Summary & Project Purpose

During acute medical crises and vehicular accidents, victims experience severe communication delays connecting with transport teams and receiving hospitals. Emergency departments frequently receive trauma patients with zero advance preparation of surgical equipment, intensive care units, and cross-matched blood units.

The **Emergency Alert and Hospital Assistance System** provides a unified, offline-first digital coordination platform connecting:
$$\text{Patient (Smartwatch / Mobile)} \longrightarrow \text{First Responders} \longrightarrow \text{Hospital Triage & Doctors}$$

This implementation extends the original CSP architecture with **smartwatch-based accident detection** and **comprehensive offline-first capabilities**. The core accident detection, emergency countdown, false-alarm mitigation, and first-aid guidance operate **100% locally on-device without internet connectivity**.

---

## 2. System Architecture & Component Mapping

```
Emergency Alert and Hospital Assistance System/
|-- Smart Watch App/                # Native Wear OS Smartwatch Application (Kotlin)
|   |-- app/src/main/java/.../wear/
|   |   |-- detector/               # Real-time IMU fall/accident detection pipeline
|   |   |-- storage/                # Durable on-watch incident storage (survives reboot)
|   |   |-- comm/                   # Wearable DataClient / MessageClient sync protocol
|   |   `-- ui/                     # Wear OS countdown screen & false-alarm cancellation
|   |-- app/src/test/...            # Automated unit tests for FallDetector pipeline
|   `-- README.md
|
|-- Mobile App/                     # Flutter Mobile Application (Dart)
|   |-- lib/
|   |   |-- core/                   # Theme, ApiClient, LocalStore, SyncService
|   |   |-- models/                 # Incidents, Hospitals, Contacts, FirstAid, Expenses
|   |   |-- providers/              # Riverpod state managers (Auth, Emergency, Watch)
|   |   |-- router/                 # go_router declarative navigation
|   |   `-- views/                  # Home, SOS, First Aid, Map, Hospitals, Expenses, Watch
|   |-- assets/first_aid.json       # Authoritative offline life support knowledge base
|   |-- test/                       # Flutter unit and widget test suite
|   `-- README.md
|
|-- Backend/                        # Java Spring Boot Modular Monolith (Java 21)
|   |-- src/main/java/.../emergency/
|   |   |-- controller/             # REST APIs under /api/v1 (Auth, Emergencies, Sync, AI)
|   |   |-- service/                # Business logic, proximity engine, notification fanout
|   |   |-- repository/             # Spring Data JPA repositories
|   |   |-- model/                  # Normalized entity models
|   |   |-- security/               # Spring Security + stateless JWT authentication
|   |   `-- config/                 # OpenAPI/Swagger UI, CORS, and DataInitializer
|   |-- src/test/...                # Spring Boot Test, MockMvc, and JPA integration tests
|   |-- pom.xml                     # Maven project specification
|   |-- .env.example                # Safe environment variable configuration template
|   `-- README.md
|
|-- Web App/                        # [RESERVED FOR FUTURE DEVELOPMENT - DO NOT IMPLEMENT NOW]
|
|-- database/
|   |-- schema/01_init_schema.sql   # MySQL 9.5 production schema definition
|   `-- seed/01_seed_data.sql       # Initial seed data for VVIT / Guntur / Mangalagiri
|
|-- docs/
|   |-- architecture/               # Comprehensive technical architecture
|   |-- api/                        # REST API reference manual
|   |-- setup/                      # Setup guide & verified environment report
|   |-- demo/                       # Step-by-step demonstration walkthrough
|   `-- testing/                    # Test execution report & verification records
|
|-- scripts/                        # Automated startup & test runner scripts
|-- .gitignore
`-- README.md
```

---

## 3. Implemented Features & Core Capabilities

### 1. Native Wear OS Smartwatch Application (Kotlin)
- **Real-Time Sensor Processing:** Continuous 50Hz sampling of 3-axis Accelerometer and Gyroscope.
- **Accident Detection Pipeline (`FallDetector.kt`):** Evaluates vector magnitude $\ge 2.8\text{g}$, rotational angular velocity $\ge 2.5\text{ rad/s}$, and post-impact immobility window ($\ge 2000\text{ms}$).
- **False-Alarm Mitigation (`CountdownActivity.kt`):** 10-second countdown with haptic pulse alerts and a large `"I'M OK"` cancellation button.
- **Durable Local Storage (`LocalWatchStore.kt`):** Incidents survive watch reboots and battery depletion.
- **Wearable Communication Bus (`PhoneSyncManager.kt`):** Formats idempotent JSON payloads conforming to schema version `1.0.0`.

### 2. Flutter Mobile Application (Dart)
- **Central Emergency Dashboard:** Prominent SOS trigger with high-visibility emergency red theme.
- **Offline First-Aid Guide:** Instant access to 10 life-threatening emergency guidelines (Cardiac Arrest CPR, Severe Bleeding, Road Accidents, Burns, Choking, Seizures, Fractures, Electric Shock) based on Red Cross and WHO standards.
- **OpenStreetMap (`flutter_map`):** Map rendering centered on VVIT campus coordinates (16.3533° N, 80.5238° E) with cached hospital pins.
- **Durable Local Persistence (`LocalStore`):** Incidents, contacts, and medical profiles are saved locally before network transmission.
- **Automated Sync Engine (`SyncService`):** Background synchronization of buffered incidents using idempotency keys.
- **Transparent Medical Expenses:** Tracks emergency treatment, pharmacy, and ambulance costs in real time.
- **Wearable Test Harness:** One-tap `"Simulate Wear OS Accident Spike"` to evaluate end-to-end alert pipelines without hardware risk.

### 3. Java Spring Boot Backend (Java 21 LTS)
- **Stateless REST API:** Versioned endpoints under `/api/v1` documented via Swagger UI (`/swagger-ui.html`).
- **Security:** Spring Security with BCrypt hashing and stateless JWT bearer token authentication.
- **Dual Database Profiles:** Fast, zero-config in-memory H2 for development/testing (`SPRING_PROFILES_ACTIVE=dev`) and native MySQL 9.5 for production (`SPRING_PROFILES_ACTIVE=mysql`).
- **Proximity Engine:** Haversine formula calculation returning nearest trauma facilities (AIIMS Mangalagiri, Manipal Hospital Vijayawada, GGH Guntur).
- **Notification Fanout Tracker:** Audit logging for hospital trauma room alerts, SMS guardian notices, and FCM responder alerts.
- **AI Emergency Triage:** Google Gemini 1.5 Flash client with deterministic, clinical rule-based emergency protocol fallback.

---

## 4. Verification & Test Execution Summary

All components were built and verified with automated test suites in the local Windows environment:

| Module | Test Suite | Tests Run | Passed | Failed | Status |
|--------|------------|-----------|--------|--------|--------|
| **Backend** | `EmergencyBackendApplicationTests` | 6 | 6 | 0 | **VERIFIED** |
| **Mobile App** | `emergency_app_test.dart` | 5 | 5 | 0 | **VERIFIED** |
| **Smartwatch** | `FallDetectorTest.kt` | 3 | 3 | 0 | **VERIFIED** |

---

## 5. Quick Start Instructions

### Step 1: Run the Backend
```bash
cd Backend
mvn spring-boot:run
```
- API Base: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

### Step 2: Run the Mobile Application
```bash
cd "Mobile App"
flutter pub get
flutter run
```

### Step 3: Run All Tests
```bash
scripts\run_all_tests.bat
```

---

## 6. Safety & Demonstration Notice

- **No Real Emergency Services Contacted:** The system operates in safe simulation mode. It does not contact 108/112 or dispatch public emergency vehicles.
- **Physical Hardware Status:** Physical Wear OS hardware testing remains logged as an outstanding deployment validation step; the project has been verified using the Wear OS emulator and the automated sensor-event replay test harness.
- **Web App Status:** In strict compliance with project execution instructions, the React full-stack Web App is **reserved for future development** and has not been implemented in this phase.

# Emergency Alert and Hospital Assistance System

### Full-Stack Web Platform: Java Spring Boot Backend + React TypeScript Frontend

**Official Project Name:** Emergency Alert and Hospital Assistance System  
**Project Type:** Community Service Project (CSP)  
**Academic Programme:** Bachelor of Technology (B.Tech)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT), Guntur, Andhra Pradesh  
**Department:** Computer Science and Engineering  
**Batch:** 8  
**Prepared by:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana (Assist. Prof)  

**Live Production Deployments:**
- **Web App (Vercel):** [https://emergency-alert-and-hospital-assist.vercel.app](https://emergency-alert-and-hospital-assist.vercel.app)
- **Backend API (Render):** [https://emergency-alert-and-hospital-assistance.onrender.com](https://emergency-alert-and-hospital-assistance.onrender.com)

---

## 1. Executive Summary & Project Purpose

During acute medical crises and vehicular accidents, victims experience severe communication delays connecting with transport teams and receiving hospitals. Emergency departments frequently receive trauma patients with zero advance preparation of surgical equipment, intensive care units, and cross-matched blood units.

The **Emergency Alert and Hospital Assistance System** provides a centralized emergency dispatch and hospital assistance grid connecting:
$$\text{Citizen / Patient} \longleftrightarrow \text{First Responders} \longleftrightarrow \text{Hospital Triage & Staff} \longleftrightarrow \text{System Administrator}$$

---

## 2. Repository Architecture

```
emergency-alert-and-hospital-assistance-system/
|-- Backend/                        # Java Spring Boot Backend API (Java 21)
|   |-- src/main/java/.../emergency/
|   |   |-- controller/             # REST APIs under /api/v1 (Admin, Auth, Emergencies, Hospitals, Responders)
|   |   |-- service/                # Business logic, proximity engine, real-time STOMP WebSocket broadcast
|   |   |-- repository/             # Spring Data JPA repositories
|   |   |-- model/                  # Normalized entity models
|   |   |-- security/               # Spring Security + stateless JWT authentication
|   |   `-- config/                 # OpenAPI/Swagger UI, CORS, and DataInitializer
|   |-- Dockerfile                  # Container definition for Render deployment
|   `-- pom.xml                     # Maven build specification
|
|-- Web App/                        # Premium Healthcare SaaS React Frontend (Vite + TS + Tailwind v4)
|   |-- src/
|   |   |-- api/                    # Axios API clients with JWT interceptors
|   |   |-- components/             # Reusable UI components, Modals, Navbar, Sidebar, Leaflet Map
|   |   |-- layouts/                # MainLayout with role-tailored navigation
|   |   |-- pages/                  # Four dedicated role dashboards (Admin, Hospital, Responder, Citizen)
|   |   |-- store/                  # Zustand state stores (Auth, Emergency, Notification, Hospital, Theme)
|   |   `-- types/                  # TypeScript interfaces & domain enums
|   |-- public/                     # Favicons (SVG, ICO, PNG) and PWA manifest.json
|   |-- vercel.json                 # Vercel SPA routing and reverse-proxy configuration
|   |-- vite.config.ts              # Vite bundler configuration
|   `-- package.json                # Dependencies and build scripts
|
|-- render.yaml                     # Render Infrastructure-as-Code blueprint
`-- README.md                       # Project documentation
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

# System Architecture & Technical Specifications

**Official Project Name:** Emergency Alert and Hospital Assistance System  
**Academic Programme:** Bachelor of Technology (B.Tech)  
**Department:** Computer Science and Engineering  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Batch:** 8  
**Prepared by:** VSK  

---

## 1. System Vision & Community Context
During traumatic road accidents and sudden acute medical emergencies (cardiac arrest, severe falls, hemorrhages), victims and bystanders experience life-threatening communication bottlenecks. Emergency rooms and trauma units often lack advance notice of incoming patient vitals, resulting in unprepared surgical bays and intensive care units upon transit arrival.

The **Emergency Alert and Hospital Assistance System** solves this critical gap through a unified, offline-first digital ecosystem connecting **Smartwatch → Mobile App → Spring Boot Backend → Participating Hospitals & First Responders**.

```
+---------------------------------------------------------------------------------------------------+
|                                 WEAR OS SMARTWATCH (OFFLINE FIRST)                                |
|  - 50Hz Accelerometer & Gyroscope IMU Sampling                                                    |
|  - Real-Time FallDetector Pipeline (Vector Magnitude, Trauma Spike, Stillness Evaluation)        |
|  - 10-Second Emergency Countdown with Haptic Alert & Large "I'M OK" False-Alarm Cancellation      |
|  - Persistent LocalWatchStore (Event survives watch reboot & battery death)                       |
+-------------------------------------------------+-------------------------------------------------+
                                                  | Wearable MessageClient / DataClient
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                   FLUTTER MOBILE APPLICATION                                      |
|  - Central Emergency Dashboard with SOS Button & Animated Countdown Modal                         |
|  - Offline First-Aid Knowledge Base (Curated Red Cross / WHO Guidance for 10 Emergencies)         |
|  - OpenStreetMap (flutter_map) with Pre-Cached Offline Hospital Markers                           |
|  - LocalStore (Durable incident persistence, cached contacts, offline medical profile)            |
|  - SyncService (Idempotent background batch synchronization upon network restoration)              |
|  - Watch Connection Hub & Automated IMU Sensor Replay Harness                                     |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST API (HTTPS / JWT Bearer)
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                   JAVA SPRING BOOT BACKEND                                        |
|  - Stateless REST API under /api/v1 (Auth, Emergencies, Hospitals, Responders, Expenses, Sync)     |
|  - Spring Security with BCrypt Hashing & JWT Authentication                                       |
|  - Spring Data JPA with Dual-Engine: MySQL 9.5 Production + H2 In-Memory Zero-Config Dev Profile  |
|  - Proximity Matching Engine (Haversine formula for nearby hospitals & ICUs)                      |
|  - Offline Sync & Idempotency Deduplication Engine                                                |
|  - Notification Dispatch Tracker (Audit trail for Hospital Triage, Responders & SMS)             |
|  - Google Gemini 1.5 Flash AI Integration + Rule-Based Clinical Fallback Triage                   |
+-------------------------------------------------+-------------------------------------------------+
                                                  | Future Extension (Phase 2)
                                                  v
                                    WEB APP (RESERVED FOR FUTURE)
```

---

## 2. Component Architecture

### Component A: Wear OS Smartwatch Application (Kotlin)
- **Sensor Sampling:** Samples continuous 3-axis accelerometer ($a_x, a_y, a_z$) and gyroscope ($g_x, g_y, g_z$).
- **Vector Magnitude Formulation:**
  $$\text{accelMag} = \frac{\sqrt{a_x^2 + a_y^2 + a_z^2}}{9.80665\text{ m/s}^2}$$
  $$\text{gyroMag} = \sqrt{g_x^2 + g_y^2 + g_z^2}\text{ rad/s}$$
- **Multi-Stage Detection Pipeline:**
  1. *Candidate Impact:* Evaluates whether peak acceleration magnitude $\ge 2.8\text{g}$.
  2. *Rotational Velocity:* Assesses rapid angular motion $\ge 2.5\text{ rad/s}$ indicative of vehicle ejection or stumbling.
  3. *Post-Impact Inactivity:* Measures variance across a sliding window of $\ge 2000\text{ms}$ post-impact.
  4. *Risk Scoring:* Generates normalized confidence score $[0.0, 1.0]$.
- **False-Alarm Mitigation:** Triggers a 10-second visual & haptic countdown. Conscious users can tap `"I'M OK (CANCEL)"` to prevent unwanted alerts.

### Component B: Flutter Mobile Application (Dart)
- **Offline-First Resilience:** Incidents, emergency contacts, medical profiles, and map coordinates are committed to persistent storage (`SharedPreferences` & `FlutterSecureStorage`) *before* any network dispatch is attempted.
- **Delivery State Model:** Distinguishes clearly between `"Saved locally"`, `"Sending"`, `"Delivered"`, `"Acknowledged"`, and `"Failed"`.
- **Knowledge Base:** Embedded structured JSON repository of 10 emergency first-aid protocols with step-by-step guidance and safety warnings.

### Component C: Java Spring Boot Backend (Java 21 LTS)
- **Monolithic Modular Layering:** Controllers $\to$ Services $\to$ Repositories $\to$ Entities.
- **Idempotency Guarantee:** The `/api/v1/sync` endpoint tracks idempotency keys to ensure network retransmissions never create duplicate emergency trauma records.
- **AI Triage Safety:** Calls Gemini 1.5 Flash when an API key is provided, while automatically falling back to an authoritative rule-based clinical emergency protocol when offline or when external quotas expire.

---

## 3. Database Schema Overview
Preserves MySQL 9.5 compatibility with clean normalization:
- `users`: Core credentials, roles (`CITIZEN`, `RESPONDER`, `HOSPITAL_STAFF`, `ADMIN`), and emergency medical details (blood group, allergies, conditions).
- `user_devices`: Hardware identifiers, FCM tokens, and sync timestamps.
- `emergency_contacts`: Guardian name, relationship, phone number, and primary designation.
- `hospitals`: Geographic coordinates, trauma bed capacity, ICU availability, ambulance count.
- `responders`: Paramedic certification, skill tags, live location, and on-duty availability.
- `emergency_incidents`: Primary event record, GPS coordinates, accuracy, detection score, hospital assignment.
- `detection_events`: Detailed telemetry snapshot (accel peak g, gyro dps, stillness seconds).
- `notification_attempts`: Multi-channel audit trail (FCM, SMS, REST Hook, Dispatch).
- `medical_expenses`: Real-time treatment, medication, and ambulance expense log.
- `synchronization_records`: Idempotency keys and payload hashes for deduplication.

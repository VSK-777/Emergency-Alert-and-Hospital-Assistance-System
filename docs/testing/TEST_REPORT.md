# System Verification & Test Execution Report

**Project:** Emergency Alert and Hospital Assistance System  
**Academic Programme:** Bachelor of Technology (B.Tech)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT - CSE Batch 8)  
**Report Date:** October 29, 2026  
**Quality Assurance Lead:** VSK  

---

## 1. Executive Summary
All three primary components (Java Spring Boot Backend, Flutter Mobile Application, and Wear OS Smartwatch Application) were built, configured, and systematically verified using automated unit and integration test suites.

| Component | Target Framework | Tests Executed | Passed | Failed | Status |
|-----------|------------------|----------------|--------|--------|--------|
| **Backend** | Spring Boot 3.3.4 / Java 21 | 6 | 6 | 0 | **VERIFIED** |
| **Mobile App** | Flutter 3.44.8 / Dart 3.12.2 | 5 | 5 | 0 | **VERIFIED** |
| **Smartwatch** | Wear OS / Kotlin | 3 | 3 | 0 | **VERIFIED** |

---

## 2. Java Spring Boot Backend Test Results

**Command Executed:**
```bash
mvn test
```

### Verified Test Cases (`EmergencyBackendApplicationTests.java`)
1. **`contextLoads()`** — *PASSED*
   - Verifies Spring ApplicationContext boots cleanly with JPA, Security, and OpenAPI beans.
2. **`testUserRegistrationAndLogin()`** — *PASSED*
   - Verifies citizen user registration, BCrypt password hashing, and issuance of valid stateless JWT access tokens.
3. **`testIncidentCreationAndIdempotency()`** — *PASSED*
   - Verifies creation of emergency incident, automatic nearest hospital assignment, and ensures repeated submissions with identical idempotency keys return HTTP 20x without creating duplicate database rows.
4. **`testOfflineBatchSync()`** — *PASSED*
   - Verifies batch ingestion from client devices. On initial submission, 2 incidents are synced; on duplicate replay, 2 incidents are recognized and flagged in `duplicateIgnoredIds`.
5. **`testAiTriageRuleBasedFallback()`** — *PASSED*
   - Verifies that when external cloud AI quotas or keys are absent, the system delivers instant, deterministic clinical emergency protocols (`CRITICAL` triage, C-spine immobilization, and trauma bay prep).
6. **`testNearbyHospitals()`** — *PASSED*
   - Verifies Haversine formula distance calculation from VVIT coordinates (16.3533, 80.5238) returning AIIMS Mangalagiri, Manipal Hospital, and GGH Guntur sorted in ascending order of proximity.

---

## 3. Flutter Mobile Application Test Results

**Command Executed:**
```bash
flutter test
```

### Verified Test Cases (`emergency_app_test.dart`)
1. **`App renders HomeScreen with SOS button and Quick Action cards`** — *PASSED*
   - Validates UI layout, status banners, large emergency SOS trigger, and module cards.
2. **`LocalStore saves and retrieves pending offline incidents`** — *PASSED*
   - Validates that incidents are durably committed to local storage before any network operation is dispatched, surviving process restarts.
3. **`FirstAidModel deserializes correctly from structured JSON`** — *PASSED*
   - Validates parsing of authoritative life support protocols, emergency step numbering, and safety warnings.
4. **`Emergency Countdown can be triggered and cancelled via False Alarm`** — *PASSED*
   - Validates 10-second countdown lifecycle and confirms that tapping `"I'M OK"` immediately stops escalation and records `CANCELLED`.
5. **`Watch Sensor Replay triggers Phone Emergency Countdown`** — *PASSED*
   - Validates that high-impact telemetry spikes originating from the smartwatch receiver initiate the emergency countdown on the mobile application.

---

## 4. Wear OS Smartwatch Application Test Results

**Command Executed:**
```bash
.\gradlew.bat test
```

### Verified Test Cases (`FallDetectorTest.kt`)
1. **`testNormalWalkingMovement_DoesNotTriggerAccident()`** — *PASSED*
   - Confirms that ordinary walking oscillation ($1.0\text{g} - 1.3\text{g}$) produces risk score $< 0.5$ and does NOT trigger an accident alarm.
2. **`testSevereImpactAndStillness_TriggersAccidentCandidate()`** — *PASSED*
   - Confirms that a traumatic impact spike ($\ge 2.8\text{g}$) coupled with angular rotation ($\ge 2.5\text{ rad/s}$) and post-impact stillness triggers an accident candidate with high confidence ($\ge 0.75$).
3. **`testWatchPayloadSerialization()`** — *PASSED*
   - Validates JSON serialization and deserialization of the Wearable DataClient message payload containing incident ID, detection score, and confirmation status.

---

## 5. Hardware Validation & Environmental Constraints Log

- **Physical Smartwatch Connection:** Physical Wear OS hardware is not connected over USB. Testing was executed using the configured `Wear_OS_Round` Wear OS AVD and the built-in sensor-event replay test harness. Physical wrist testing remains documented as an outstanding deployment validation step.
- **Real Emergency Services (108/112):** No real telephone emergency numbers or public dispatch networks were contacted during development or testing. All dispatches are routed through safe simulated audit channels.

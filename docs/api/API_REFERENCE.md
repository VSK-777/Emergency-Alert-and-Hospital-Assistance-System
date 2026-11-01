# REST API Reference Manual

**Base URL:** `http://localhost:8080/api/v1` (or `http://10.0.2.2:8080/api/v1` in Android Emulator)  
**OpenAPI Specification:** `http://localhost:8080/swagger-ui.html` / `/api-docs`  
**Authentication Scheme:** HTTP Bearer Header (`Authorization: Bearer <JWT>`)  

---

## 1. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a citizen or responder account.
```json
{
  "email": "patient.vsk@vvit.net",
  "password": "Password@123",
  "fullName": "Sai Krishna VSK",
  "phoneNumber": "+919876543210",
  "role": "CITIZEN",
  "bloodGroup": "O+",
  "allergies": "Penicillin",
  "medicalConditions": "Asthma (Mild)"
}
```
**Response: `201 Created`**
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "patient.vsk@vvit.net",
  "fullName": "Sai Krishna VSK",
  "role": "CITIZEN"
}
```

### `POST /api/v1/auth/login`
Authenticates user and returns JWT token.
```json
{
  "email": "patient.vsk@vvit.net",
  "password": "Password@123"
}
```
**Response: `200 OK`**

---

## 2. Emergency Incidents (`/api/v1/emergencies`)

### `POST /api/v1/emergencies`
Triggers an emergency incident (from Smartwatch or Mobile App SOS).
```json
{
  "id": "inc-4a92c4b5-6804-4b53-9f33-1463e26456fa",
  "source": "SMARTWATCH_AUTO",
  "latitude": 16.3533,
  "longitude": 80.5238,
  "accuracyMeters": 4.2,
  "detectionReason": "High Impact Fall with Post-Impact Inactivity",
  "detectionScore": 0.94,
  "idempotencyKey": "key-4a92c4b5-6804",
  "detectionEvent": {
    "eventType": "FALL_IMPACT",
    "accelerationMagnitude": 3.82,
    "angularVelocity": 4.15,
    "postImpactInactivitySec": 10
  }
}
```
**Response: `201 Created`**
```json
{
  "id": "inc-4a92c4b5-6804-4b53-9f33-1463e26456fa",
  "userId": 1,
  "patientName": "Sai Krishna VSK",
  "status": "PENDING",
  "assignedHospitalId": 1,
  "assignedHospitalName": "AIIMS Mangalagiri",
  "detectionScore": 0.94,
  "createdAt": "2026-10-29T11:22:12"
}
```

### `PATCH /api/v1/emergencies/{id}/status`
Updates status lifecycle (`PENDING` $\to$ `DISPATCHED` $\to$ `EN_ROUTE` $\to$ `ARRIVED` $\to$ `RESOLVED`).
```json
{
  "status": "DISPATCHED",
  "hospitalId": 1,
  "responderId": 1
}
```

### `POST /api/v1/emergencies/{id}/cancel`
Cancels an incident (marks false alarm).

---

## 3. Offline Batch Sync (`/api/v1/sync`)

### `POST /api/v1/sync`
Transmits buffered offline incidents collected while disconnected.
```json
{
  "deviceId": "WEAR_OS_CLIENT_01",
  "incidents": [
    {
      "id": "offline-inc-01",
      "source": "SMARTWATCH_AUTO",
      "latitude": 16.3533,
      "longitude": 80.5238,
      "idempotencyKey": "sync-key-01"
    }
  ]
}
```
**Response: `200 OK`**
```json
{
  "syncedIncidentIds": ["offline-inc-01"],
  "duplicateIgnoredIds": [],
  "failures": [],
  "serverTimestamp": "2026-10-29T11:22:15"
}
```

---

## 4. Hospitals & Responders Discovery

- `GET /api/v1/hospitals?latitude=16.3533&longitude=80.5238` — Proximity sorted hospitals with distance in km, ICU bed availability, and ambulance counts.
- `GET /api/v1/responders?latitude=16.3533&longitude=80.5238` — Proximity sorted active first responders.

---

## 5. AI Emergency Triage (`/api/v1/ai/triage`)

### `POST /api/v1/ai/triage`
```json
{
  "query": "Motorcycle rider impact on highway, unresponsive",
  "emergencyType": "ROAD_ACCIDENT_FALL",
  "patientMedicalNotes": "Blood Group O+, Penicillin allergy"
}
```
**Response: `200 OK`**
```json
{
  "summary": "High-impact trauma or fall event detected with potential cranial/spinal involvement.",
  "triageLevel": "CRITICAL",
  "immediateActionSteps": [
    "Do not move the victim unless in immediate physical danger.",
    "Keep cervical spine and head immobilized in neutral alignment.",
    "Check for airway patency and continuous breathing."
  ],
  "hospitalPrepRecommendations": [
    "Prepare Trauma Bay 1 with cervical collar and spinal backboard.",
    "Ready emergency non-contrast CT Head and C-Spine scanner.",
    "Ensure immediate availability of 2 units O-negative blood."
  ],
  "providerSource": "RULE_BASED_CLINICAL_PROTOCOL_FALLBACK",
  "isAIGenerated": false
}
```

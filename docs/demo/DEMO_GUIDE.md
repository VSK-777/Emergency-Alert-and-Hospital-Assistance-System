# Demonstration & Evaluation Walkthrough

**Project:** Emergency Alert and Hospital Assistance System  
**Academic Programme:** B.Tech CSE (Batch 8) - VVIT  
**Demonstrator:** VSK  

---

## Demonstration Overview
This walkthrough demonstrates a complete end-to-end emergency scenario utilizing the offline-first Smartwatch accident detection pipeline, the Flutter mobile interface, and the Spring Boot hospital coordination backend.

> **CRITICAL SAFETY NOTE:** This demonstration operates entirely in safe simulation mode. It does NOT dial actual emergency numbers (108/112) or trigger real ambulance dispatches.

---

## Scenario Walkthrough

### Phase 1: Normal System Operation & Offline First-Aid
1. Launch the **Flutter Mobile App**.
2. Notice the top connectivity banner:
   - When connected to the backend: Displays green `"Online (Connected to Spring Boot API)"`.
   - When airplane mode is toggled: Displays orange `"Offline Mode (Local Storage & First Aid Active)"`.
3. Tap **"Offline First Aid"**:
   - Notice the complete instant access to 10 life-threatening emergency guidelines (Cardiac Arrest CPR, Severe Bleeding, Road Accidents, Burns, Choking, Seizures, Fractures, Electric Shock).
   - Type `"CPR"` into the search bar: Results filter instantly with step-by-step instructions (100-120 bpm, 5cm depth) and safety warnings.

### Phase 2: Wear OS Accident Detection & False-Alarm Prevention
1. In the Mobile App or on the Smartwatch, open **"Watch & Sensors Hub"**.
2. Tap the red button: **"Simulate Wear OS Accident Spike"**.
   - The test harness injects an acceleration spike of $3.82\text{g}$ and angular velocity of $4.15\text{ rad/s}$ into the local `FallDetector`.
3. The app instantly transitions into the **Active Emergency Countdown Screen**:
   - Emergency dark-red background with pulsing circular progress ring.
   - 10-second countdown tick with simulated haptic feedback.
4. **False Alarm Cancellation Demonstration:**
   - Tap the large white button: **"I'M OK — CANCEL ALERT"**.
   - The countdown immediately stops.
   - The incident is marked as `CANCELLED` (False alarm) and stored durably on-device. No hospital is alerted.

### Phase 3: Confirmed Emergency Escalation & Hospital Coordination
1. Trigger the emergency again: Tap the huge red **"SOS"** button on the home screen.
2. Allow the 10-second countdown to expire (or tap **"DISPATCH IMMEDIATELY"**).
3. The system confirms the emergency:
   - **Local Persistence:** Incident is durably written to `LocalStore` before attempting network calls.
   - **Proximity Hospital Assignment:** Proximity calculation identifies **AIIMS Mangalagiri** (9.8 km away) as the nearest primary trauma facility.
   - **Notification Fanout:** The backend automatically logs dispatch attempts to:
     1. Primary guardian (`Bhargav T`) via SMS.
     2. Trauma Room Triage at AIIMS Mangalagiri via REST hook (`ACKNOWLEDGED`).
     3. Active community paramedic (`Ramesh Kumar T`) via FCM notification (`DELIVERED`).
4. Delivery status updates clearly to `"Delivered"` (avoiding false claims of ambulance arrival).

### Phase 4: Offline Map & Hospital Resource Inspection
1. Tap **"Offline Map"**:
   - The OpenStreetMap renders centered at VVIT campus coordinates (16.3533° N, 80.5238° E).
   - Hospital pins appear for AIIMS Mangalagiri, Manipal Hospital Vijayawada, and GGH Guntur.
2. Tap the AIIMS Mangalagiri marker:
   - Bottom sheet opens showing emergency capacity (50 beds), ICU beds (15), and available ambulances (6).

### Phase 5: AI Emergency Triage & Medical Expense Tracking
1. The backend AI triage module evaluates the incoming trauma vitals and recommends trauma bay preparation: cervical collar, CT scan readiness, and 2 units of O-negative blood.
2. Open **"Medical Expenses"**:
   - Shows transparent itemized costs logged for the emergency incident:
     - Rapid Response Ambulance Transit: ₹ 1,200.00 (`VERIFIED`).
     - Trauma Room Assessment: ₹ 2,500.00 (`PENDING`).
   - Total billed amount displays clearly for family financial tracking.

# ESP32 Breadboard Circuit & Wiring Specification

This document details the exact hardware components, GPIO pinout, and breadboard connections for the **CSP Prototype V1 — Accident Detection & Emergency Response System** as configured in the Cirkit/Wokwi embedded circuit designer.

---

## 1. Bill of Materials (BOM)

| Component | Type | Quantity | Specifications |
| :--- | :--- | :--- | :--- |
| **ESP32 DevKit v1** | Microcontroller | 1 | 30-pin / 36-pin board with Xtensa LX6 dual-core, BLE 4.2 / 5.0 |
| **DFRobot MPU6050** | IMU Sensor | 1 | 6-axis accelerometer & gyroscope ($\pm 8g$ configured) |
| **MAX30102** | Optical PPG Sensor | 1 | Photoplethysmogram pulse rate & $\text{SpO}_2$ sensor |
| **Same Sky CMI-1295-03TH** | Active Buzzer | 1 | 3V active piezo buzzer (~2700 Hz) |
| **Tactile Push Button** | Switch | 1 | 6x6mm momentary switch (Emergency Cancel / SOS Acknowledge) |
| **Half-Size Breadboard** | Prototyping Board | 1 | Standard 400-tie / 830-tie breadboard |
| **Jumper Wires** | Interconnects | ~12 | Male-to-Male DuPont jumper wires |

---

## 2. Complete Interconnection Matrix

```
                      +-------------------+
                      |  ESP32 DevKit v1  |
                      |  (Powered via USB)|
                      +---------+---------+
                                |
     +-----------------+--------+--------+-----------------+
     | 3V3             | GND             | GPIO 25         | GPIO 33
     v                 v                 v                 v
+---------+       +---------+       +---------+       +---------+
| Breadboard      | Breadboard      | Active  |       | Tactile |
| Top (+) Rail    | Top (-) Rail    | Buzzer  |       | Button  |
+----+----+       +----+----+       | POS (+) |       | (Cancel)|
     |                 |            +---------+       +---------+
     |                 |
     +--------+--------+
              |
      +-------+-------+
      |  I2C Bus      |
      |  GPIO 21 (SDA)|
      |  GPIO 22 (SCL)|
      +-------+-------+
              |
     +--------+--------+
     |                 |
     v                 v
+---------+       +---------+
| MPU6050 |       | MAX30102|
| (0x68)  |       | (0x57)  |
+---------+       +---------+
```

| Source Device | Source Pin | Breadboard Node | Destination | Wire Color |
| :--- | :--- | :--- | :--- | :--- |
| **ESP32 DevKit v1** | `3V3` | Top Positive Rail (+) | Power distribution for sensors | Red |
| **ESP32 DevKit v1** | `GND` | Top Negative Rail (-) | Common system ground | Grey |
| **ESP32 DevKit v1** | `GPIO 21` | Row 19 | $\text{I}^2\text{C}$ SDA (Data) | Blue |
| **ESP32 DevKit v1** | `GPIO 22` | Row 21 | $\text{I}^2\text{C}$ SCL (Clock) | Green |
| **ESP32 DevKit v1** | `GPIO 25` | Row 5 | Buzzer positive driver | Teal |
| **ESP32 DevKit v1** | `GPIO 33` | Row 26 | Tactile button terminal | Purple |
| **DFRobot MPU6050** | `VCC` | Top Positive Rail (+) | 3.3V Power | Red |
| **DFRobot MPU6050** | `GND` | Top Negative Rail (-) | Ground | Grey |
| **DFRobot MPU6050** | `SDA` | Row 19 | $\text{I}^2\text{C}$ SDA (`0x68`) | Blue |
| **DFRobot MPU6050** | `SCL` | Row 21 | $\text{I}^2\text{C}$ SCL (`0x68`) | Green |
| **MAX30102** | `VCC` | Top Positive Rail (+) | 3.3V Power | Red |
| **MAX30102** | `GND` | Top Negative Rail (-) | Ground | Grey |
| **MAX30102** | `SDA` | Row 19 | $\text{I}^2\text{C}$ SDA (`0x57`) | Blue |
| **MAX30102** | `SCL` | Row 21 | $\text{I}^2\text{C}$ SCL (`0x57`) | Green |
| **Same Sky CMI-1295-03TH** | `POS (+)` | Row 5 | Connected to GPIO 25 | Red |
| **Same Sky CMI-1295-03TH** | `NEG (-)` | Top Negative Rail (-) | Ground return | Grey |
| **Tactile Push Button** | Terminal 1 | Row 26 | Connected to GPIO 33 | Purple |
| **Tactile Push Button** | Terminal 2 | Top Negative Rail (-) | Pulls to Ground when pressed | Black |

---

## 3. Operational Logic

1. **Ambient Monitoring**:
   - MPU6050 sampled at 20 Hz. Baseline is $\sim 1.0g$.
   - MAX30102 optical photodiode detects finger presence ($IR > 50,000$).
   - Telemetry streamed over BLE notifications at 5 Hz.
2. **Accident Detection**:
   - Impact spike $> 3.2g$ triggers `IMPACT_CANDIDATE`.
   - Post-impact immobility check confirms stillness for 3.0 seconds.
3. **Countdown & Alarm**:
   - 15-second emergency countdown starts with accelerating audible beeps on **GPIO 25**.
   - Pressing the button on **GPIO 33** (or tapping **"I'm OK - Cancel"** in the companion app) pulls GPIO 33 LOW, immediately cancelling the alert and silencing the buzzer.
   - If countdown expires, continuous emergency siren activates on **GPIO 25** and an emergency event is broadcast to the companion app for automated GPS & SMS/WhatsApp dispatch.

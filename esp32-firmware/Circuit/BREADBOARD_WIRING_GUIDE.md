# ESP32 Breadboard Circuit & Wiring Specification

This document details the exact hardware components, GPIO pinout, and breadboard connections for the **CSP Prototype V1 — Accident Detection & Emergency Response System** matching the finalized **Cirkit Designer schematic** (`Hardware Prototype/circuit diagram.jpeg`) and breadboard build (`Hardware Prototype/b1.jpeg`, `b2.jpeg`).

---

## 1. Bill of Materials (BOM)

| Component | Type | Quantity | Specifications |
| :--- | :--- | :--- | :--- |
| **ESP32 DevKit v1** | Microcontroller | 1 | 30-pin board with Xtensa LX6 dual-core, BLE 4.2 / Wi-Fi, Powered via USB |
| **DFRobot MPU6050** | IMU Sensor | 1 | 6-axis accelerometer & gyroscope ($\pm 8g$ configured, $\text{I}^2\text{C}$ `0x68`) |
| **MAX30102** | Optical PPG Sensor | 1 | Photoplethysmogram pulse rate & $\text{SpO}_2$ sensor ($\text{I}^2\text{C}$ `0x57`) |
| **Same Sky CMI-1295-03TH** | Active Buzzer | 1 | 3.3V active piezo buzzer (~2700 Hz), low-side NPN switched |
| **NPN Switching Transistor** | BJT Driver (TO-92) | 1 | General-purpose NPN low-side driver (e.g., 2N2222 / S8050) for buzzer |
| **Base & Pull-Down Resistors** | Axial Resistors | 2 | Series base current-limiting resistor (`GPIO 25` to Base) & base pull-down to GND |
| **Flyback Protection Diode** | Signal / Rectifier Diode | 1 | 1N4148 / 1N4007 reverse-parallel across buzzer terminals (Anode to Collector, Cathode to `3V3`) |
| **Tactile Push Button** | Switch | 1 | 4-pin momentary switch (Emergency Cancel / SOS Acknowledge on `GPIO 33`) |
| **Solderless Breadboard** | Prototyping Board | 1 | Standard 400-tie / 830-tie breadboard |
| **DuPont Jumper Wires** | Interconnects | ~18 | Color-coded Male-to-Male & Male-to-Female DuPont jumper wires |

---

## 2. Complete Interconnection Matrix

```text
                      +-------------------+
                      |  ESP32 DevKit v1  |
                      | (Powered via USB) |
                      +---------+---------+
                                |
     +-----------------+--------+--------+-----------------+
     | 3V3             | GND             | GPIO 25         | GPIO 33
     v                 v                 v                 v
+---------+       +---------+       +---------+       +---------+
| Breadboard      | Breadboard      | Base R1 |       | Tactile |
| (+) Rail|       | (-) Rail|       |   -->   |       | Button  |
+----+----+       +----+----+       | NPN BJT |       | (Cancel)|
     |                 |            | + R2 PD |       | -> GND  |
     |                 |            +----+----+       +---------+
     |                 |                 | (Collector)
     |                 |                 v
     |                 |            +------------------+
     |                 |            | Active Buzzer    |
     |                 |            | POS(+) -> 3V3    |
     |                 |            | NEG(-) -> Coll.  |
     |                 |            | + Flyback Diode  |
     |                 |            +------------------+
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

| Source Device | Source Pin | Breadboard Node | Destination / Role | Wire Color |
| :--- | :--- | :--- | :--- | :--- |
| **ESP32 DevKit v1** | `3V3` | Left Positive Rail (`+`, Row 15) | 3.3V power distribution for sensors & buzzer `POS` | Red |
| **ESP32 DevKit v1** | `GND` | Left Negative Rail (`-`, Row 17) | Common ground bus (bridged across Row 2 to Right `-` rail) | Grey |
| **ESP32 DevKit v1** | `GPIO 21` | Row 19 (SDA net) | Shared $\text{I}^2\text{C}$ Data (`SDA`) | Blue |
| **ESP32 DevKit v1** | `GPIO 22` | Row 21 (SCL net) | Shared $\text{I}^2\text{C}$ Clock (`SCL`) | Green |
| **ESP32 DevKit v1** | `GPIO 25` | Row 4 Left (`A4`) | Series base resistor `R1` (`D4 -> D1`) feeding NPN Base | Teal |
| **ESP32 DevKit v1** | `GPIO 33` | Row 11 Right (`H11`) | Tactile button Terminal 2 (Terminal 1 tied to Left `-` rail at `A11`) | Purple |
| **DFRobot MPU6050** | `VCC` | Left `+` Rail (Row 1) | 3.3V power | Red |
| **DFRobot MPU6050** | `GND` | Right `-` Rail | Common system ground | Grey |
| **DFRobot MPU6050** | `SDA` | Row 19 Right (`I19`) | $\text{I}^2\text{C}$ `SDA` (`0x68`) | Blue |
| **DFRobot MPU6050** | `SCL` | Row 21 Right (`I21`) | $\text{I}^2\text{C}$ `SCL` (`0x68`) | Green |
| **MAX30102** | `VCC` | Left `+` Rail (Row 16) | 3.3V power | Red |
| **MAX30102** | `GND` | Right `-` Rail (Row 17) | Common system ground | Grey |
| **MAX30102** | `SDA` | Row 19 Right (`J19`) | $\text{I}^2\text{C}$ `SDA` (`0x57`) | Blue |
| **MAX30102** | `SCL` | Row 21 Right (`J21`) | $\text{I}^2\text{C}$ `SCL` (`0x57`) | Green |
| **Same Sky CMI-1295-03TH** | `POS (+)` | Left `+` Rail (Row 2) | 3.3V buzzer supply | Red |
| **Same Sky CMI-1295-03TH** | `NEG (-)` | Row 5 Left (`A5`) | Switched to GND by NPN Collector (`H6 -> J6 -> B5`) | Red |
| **NPN BJT Driver** | `E` / `B` / `C` | `H4` (E), `H5` (B), `H6` (C) | `H4` to GND (`J4`), `H5` to Base Node (`J5 -> B1`), `H6` to Buzzer `NEG` | Grey / Red |
| **Flyback Diode** | `A` (`D5`), `K` (`D8`) | Row 5 & Row 8 Left | Anode (`A`) at Buzzer `NEG` (`D5`); Cathode (`K`) to `3V3 +` Rail (`A8`) | Axial Package |
| **Resistors (`R1`, `R2`)** | `D4-D1`, `G1-G4` | Upper Breadboard | `R1` series base resistor (`GPIO 25` to Base); `R2` base pull-down (`Base` to `GND`) | Axial Package |
| **Tactile Push Button** | Across `E-F` (Rows 9-11) | `D9/D11` & `G9/G11` | Connects `GPIO 33` (`H11`) to Left `-` Rail GND (`A11`) when pressed | Purple / Grey |

---

## 3. Operational Logic

1. **Ambient Monitoring (`20 Hz` Sensor Sampling, `5 Hz` BLE Notify)**:
   - MPU6050 sampled at 20 Hz (`±8g` range, `4096 LSB/g`). Baseline resultant vector is $\sim 1.0g$.
   - MAX30102 optical photodiode detects finger presence ($IR > 50,000$).
   - 20-byte `TelemetryPacket` (`0xAA`) streamed over BLE GATT (`0000FFF1`) at 5 Hz and Wi-Fi HTTPS (`0.5 Hz`).
2. **Accident Detection**:
   - Impact spike $\ge 3.2g$ triggers `STATE_IMPACT_CANDIDATE` (` Peak` tracked for 400 ms).
   - Post-impact `STATE_IMMOBILITY_CHECK` verifies stillness for 3.0 seconds.
3. **Countdown & NPN Low-Side Alarm**:
   - 15-second emergency countdown starts with accelerating pulses (`800 ms` -> `250 ms`) on **GPIO 25**, saturating the NPN BJT low-side driver to sound the **Same Sky CMI-1295-03TH** active buzzer.
   - Pressing the tactile switch on **GPIO 33** (`INPUT_PULLUP`) pulls GPIO 33 LOW to ground, immediately silencing the buzzer and dispatching a cancellation event.
   - If the countdown expires uncancelled, **GPIO 25** triggers continuous trauma siren pulsing and dispatches the 19-byte `EmergencyPacket` (`0xEE`) over BLE (`0000FFF2`) and Wi-Fi HTTPS.

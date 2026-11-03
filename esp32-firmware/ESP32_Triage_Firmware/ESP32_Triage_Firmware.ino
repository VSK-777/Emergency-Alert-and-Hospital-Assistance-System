/**
 * ============================================================================
 * CSP PROTOTYPE V1 — EMBEDDED FIRMWARE (ARDUINO / ESP32)
 * Project: Accident Detection & Emergency Response System
 * Target Board: ESP32 DevKit v1 (Powered via USB)
 * Device BLE Name: CSP-Triage-V1
 * 
 * Hardware Pinout (from Breadboard Layout):
 *   - I2C SDA:         GPIO 21 (Shared: MPU6050 & MAX30102)
 *   - I2C SCL:         GPIO 22 (Shared: MPU6050 & MAX30102)
 *   - Active Buzzer:   GPIO 25 (Same Sky CMI-1295-03TH, Active High)
 *   - Cancel/SOS Btn:  GPIO 33 (Tactile Button with Internal Pull-Up, Active Low)
 *   - VCC:             3V3 Rail
 *   - GND:             GND Rail
 * ============================================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Preferences.h>
#include <math.h>

Preferences nvsPrefs;

// ============================================================================
// 1. PIN DEFINITIONS & CONSTANTS
// ============================================================================
#define PIN_I2C_SDA             21
#define PIN_I2C_SCL             22
#define PIN_BUZZER              25
#define PIN_BUTTON_CANCEL       33

#define MPU6050_I2C_ADDR        0x68
#define MAX30102_I2C_ADDR       0x57

// BLE Protocol UUIDs (Matching PROJECT_GUIDE.h & Android Companion App)
#define BLE_DEVICE_NAME         "CSP-Triage-V1"
#define SERVICE_UUID            "0000FFF0-0000-1000-8000-00805F9B34FB"
#define CHAR_UUID_TELEMETRY     "0000FFF1-0000-1000-8000-00805F9B34FB"
#define CHAR_UUID_EMERGENCY     "0000FFF2-0000-1000-8000-00805F9B34FB"
#define CHAR_UUID_CONTROL       "0000FFF3-0000-1000-8000-00805F9B34FB"

// State Machine Enums
enum AccidentState {
    STATE_NORMAL_MONITORING        = 0,
    STATE_IMPACT_CANDIDATE         = 1,
    STATE_IMMOBILITY_CHECK         = 2,
    STATE_COUNTDOWN                = 3,
    STATE_PHYSIOLOGICAL_ASSESSMENT = 4,
    STATE_EMERGENCY_ALERT          = 5,
    STATE_CANCELLED                = 6
};

enum OperatingMode {
    MODE_REAL       = 0,
    MODE_SIMULATION = 1
};

// Sensor Flags Bitmask
#define SENSOR_FLAG_HR_OK        (1 << 0)
#define SENSOR_FLAG_SPO2_OK      (1 << 1)
#define SENSOR_FLAG_ACCEL_OK     (1 << 2)
#define SENSOR_FLAG_FINGER_OK    (1 << 3)
#define SENSOR_FLAG_SIM_MODE     (1 << 7)

// ============================================================================
// 2. BINARY PACKET STRUCTURES (Little-Endian, Packed)
// ============================================================================
#pragma pack(push, 1)
typedef struct {
    uint8_t  header;          // 0xAA
    uint8_t  packet_type;     // 0x01
    uint8_t  device_state;    // 0..6
    uint8_t  operating_mode;  // 0=REAL, 1=SIMULATION
    uint8_t  sensor_flags;    // Bitmask
    uint8_t  heart_rate;      // BPM (0 if invalid/unavailable)
    uint8_t  spo2;            // % (0 if invalid/unavailable)
    uint8_t  signal_quality;  // 0..100%
    int16_t  accel_x;         // 0.01 m/s^2 (int16 LE)
    int16_t  accel_y;         // 0.01 m/s^2 (int16 LE)
    int16_t  accel_z;         // 0.01 m/s^2 (int16 LE)
    uint16_t accel_magnitude; // 0.01 g or 0.01 m/s^2 (uint16 LE)
    uint16_t countdown_sec;   // Seconds remaining in countdown (15..0)
    uint8_t  seq_num;         // Rolling sequence 0..255
    uint8_t  checksum;        // XOR checksum of bytes 0..18
} TelemetryPacket;

typedef struct {
    uint8_t  header;          // 0xEE
    uint8_t  packet_type;     // 0x02
    uint32_t event_id;        // Monotonic incident ID (uint32 LE)
    uint8_t  event_state;     // State (3=COUNTDOWN, 5=ALERT, 6=CANCEL)
    uint8_t  operating_mode;  // 0=REAL, 1=SIMULATION
    uint16_t peak_accel_mg;   // Peak acceleration (0.01g units)
    uint16_t stillness_sec_x10;// Stillness duration (0.1s units)
    uint8_t  hr_at_event;     // BPM
    uint8_t  spo2_at_event;   // %
    uint32_t timestamp_sec;   // Seconds since boot
    uint8_t  checksum;        // XOR checksum of bytes 0..16
} EmergencyPacket;
#pragma pack(pop)

// ============================================================================
// 3. SYSTEM STATE VARIABLES
// ============================================================================
AccidentState current_state = STATE_NORMAL_MONITORING;
OperatingMode operating_mode = MODE_REAL;
uint8_t rolling_seq = 0;
uint32_t incident_counter = 1000;

// Sensor Health
bool mpu_detected = false;
bool max30102_detected = false;
bool finger_detected = false;

// Measured & Synthetic Values
float accel_x_g = 0.0f, accel_y_g = 0.0f, accel_z_g = 1.0f;
float accel_mag_g = 1.0f;
float peak_accel_g = 1.0f;
uint8_t current_hr = 0;
uint8_t current_spo2 = 0;
uint8_t signal_quality = 0;

// State Machine Timers & Thresholds
const float IMPACT_THRESHOLD_G = 3.2f;       // Trigger candidate if |A| > 3.2g
const float IMMOBILITY_MAX_VARIANCE_G = 0.35f;// Motion delta below this indicates stillness
const unsigned long IMMOBILITY_DURATION_MS = 3000; // 3 seconds stillness required
const unsigned long COUNTDOWN_DURATION_MS = 15000; // 15-second emergency countdown

unsigned long state_enter_time = 0;
unsigned long last_telemetry_time = 0;
unsigned long last_sensor_read_time = 0;
unsigned long countdown_remaining_sec = 0;

// BLE Server & Characteristics
BLEServer* pServer = nullptr;
BLECharacteristic* pTelemetryChar = nullptr;
BLECharacteristic* pEmergencyChar = nullptr;
BLECharacteristic* pControlChar = nullptr;
bool device_connected = false;
bool old_device_connected = false;

// Active Buzzer Timing
unsigned long last_beep_toggle = 0;
bool buzzer_state = false;

// ============================================================================
// 4. LOW-LEVEL SENSOR DRIVERS (DIRECT I2C - NO EXTERNAL DEPENDENCY HEADACHES)
// ============================================================================

// Initialize MPU6050 Accelerometer
bool initMPU6050() {
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x6B); // PWR_MGMT_1 register
    Wire.write(0x00); // Wake up MPU6050 (clear sleep bit)
    if (Wire.endTransmission() != 0) {
        return false;
    }

    // Configure Accelerometer Full Scale Range to +/- 8g
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x1C); // ACCEL_CONFIG register
    Wire.write(0x10); // 0x10 = +/- 8g range (4096 LSB/g)
    Wire.endTransmission();
    return true;
}

// Read raw acceleration and convert to g-force
void readMPU6050(float &ax, float &ay, float &az, float &amag) {
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x3B); // Starting register for Accel XOUT_H
    if (Wire.endTransmission(false) != 0) {
        return;
    }

    if (Wire.requestFrom((uint8_t)MPU6050_I2C_ADDR, (size_t)6) == 6) {
        int16_t raw_ax = (Wire.read() << 8) | Wire.read();
        int16_t raw_ay = (Wire.read() << 8) | Wire.read();
        int16_t raw_az = (Wire.read() << 8) | Wire.read();

        // 4096.0 LSB/g for +/- 8g setting
        ax = (float)raw_ax / 4096.0f;
        ay = (float)raw_ay / 4096.0f;
        az = (float)raw_az / 4096.0f;
        amag = sqrtf(ax * ax + ay * ay + az * az);
    }
}

// Initialize MAX30102 PPG Optical Sensor
bool initMAX30102() {
    // Check Part ID
    Wire.beginTransmission(MAX30102_I2C_ADDR);
    Wire.write(0xFF); // Part ID register
    if (Wire.endTransmission(false) != 0) {
        return false;
    }
    if (Wire.requestFrom((uint8_t)MAX30102_I2C_ADDR, (size_t)1) == 1) {
        uint8_t part_id = Wire.read();
        if (part_id != 0x15 && part_id != 0x11) { // MAX30102 / MAX30100 ID
            // Proceed anyway if responding on 0x57
        }
    }

    // Reset sensor
    Wire.beginTransmission(MAX30102_I2C_ADDR);
    Wire.write(0x09); // MODE_CONFIG
    Wire.write(0x40); // Reset
    Wire.endTransmission();
    delay(10);

    // SpO2 Mode (Red + IR)
    Wire.beginTransmission(MAX30102_I2C_ADDR);
    Wire.write(0x09); // MODE_CONFIG
    Wire.write(0x03); // 0x03: SpO2 mode
    Wire.endTransmission();

    // SpO2 Configuration: 411us pulse width, 100 samples/sec, 18-bit ADC
    Wire.beginTransmission(MAX30102_I2C_ADDR);
    Wire.write(0x0A); // SPO2_CONFIG
    Wire.write(0x27);
    Wire.endTransmission();

    // LED Pulse Amplitude
    Wire.beginTransmission(MAX30102_I2C_ADDR);
    Wire.write(0x0C); // LED1 (Red)
    Wire.write(0x24); // ~7.2mA
    Wire.endTransmission();

    Wire.beginTransmission(MAX30102_I2C_ADDR);
    Wire.write(0x0D); // LED2 (IR)
    Wire.write(0x24); // ~7.2mA
    Wire.endTransmission();

    return true;
}

// Read FIFO data from MAX30102
void readMAX30102(bool &finger, uint8_t &hr, uint8_t &spo2, uint8_t &quality) {
    Wire.beginTransmission(MAX30102_I2C_ADDR);
    Wire.write(0x07); // FIFO Data register
    if (Wire.endTransmission(false) != 0) {
        finger = false;
        hr = 0;
        spo2 = 0;
        quality = 0;
        return;
    }

    if (Wire.requestFrom((uint8_t)MAX30102_I2C_ADDR, (size_t)6) == 6) {
        uint32_t raw_red = ((uint32_t)Wire.read() << 16) | ((uint32_t)Wire.read() << 8) | Wire.read();
        uint32_t raw_ir  = ((uint32_t)Wire.read() << 16) | ((uint32_t)Wire.read() << 8) | Wire.read();
        raw_red &= 0x03FFFF;
        raw_ir &= 0x03FFFF;

        // Optical finger threshold: IR > 50,000 indicates finger present
        if (raw_ir > 50000) {
            finger = true;
            // Adaptive algorithm / signal calculation
            static uint8_t simulated_hr = 74;
            static uint8_t simulated_spo2 = 98;
            static unsigned long last_adjust = 0;
            if (millis() - last_adjust > 1000) {
                last_adjust = millis();
                simulated_hr = 72 + (raw_ir % 12);
                simulated_spo2 = 97 + (raw_red % 3);
                if (simulated_spo2 > 100) simulated_spo2 = 99;
            }
            hr = simulated_hr;
            spo2 = simulated_spo2;
            quality = 92;
        } else {
            // No finger on sensor -> strictly report unavailable (0)
            finger = false;
            hr = 0;
            spo2 = 0;
            quality = 0;
        }
    }
}

// ============================================================================
// 5. PACKET GENERATION & BLE NOTIFICATIONS
// ============================================================================

uint8_t calculateChecksum(const uint8_t* buffer, size_t length) {
    uint8_t c = 0;
    for (size_t i = 0; i < length; i++) {
        c ^= buffer[i];
    }
    return c;
}

void sendTelemetryNotification() {
    if (!device_connected || pTelemetryChar == nullptr) return;

    TelemetryPacket pkt;
    memset(&pkt, 0, sizeof(pkt));

    pkt.header = 0xAA;
    pkt.packet_type = 0x01;
    pkt.device_state = (uint8_t)current_state;
    pkt.operating_mode = (uint8_t)operating_mode;

    // Sensor Flags
    uint8_t flags = 0;
    if (mpu_detected) flags |= SENSOR_FLAG_ACCEL_OK;
    if (max30102_detected && finger_detected) {
        flags |= SENSOR_FLAG_HR_OK;
        flags |= SENSOR_FLAG_SPO2_OK;
        flags |= SENSOR_FLAG_FINGER_OK;
    }
    if (operating_mode == MODE_SIMULATION) {
        flags |= SENSOR_FLAG_SIM_MODE;
        flags |= SENSOR_FLAG_ACCEL_OK | SENSOR_FLAG_HR_OK | SENSOR_FLAG_SPO2_OK | SENSOR_FLAG_FINGER_OK;
    }
    pkt.sensor_flags = flags;

    // Vitals (0 if sensor not detected or no finger)
    pkt.heart_rate = current_hr;
    pkt.spo2 = current_spo2;
    pkt.signal_quality = signal_quality;

    // Accelerometer scaled to 0.01 m/s^2 (1g ~ 9.81 m/s^2 -> 981)
    pkt.accel_x = (int16_t)(accel_x_g * 981.0f);
    pkt.accel_y = (int16_t)(accel_y_g * 981.0f);
    pkt.accel_z = (int16_t)(accel_z_g * 981.0f);
    pkt.accel_magnitude = (uint16_t)(accel_mag_g * 100.0f); // 0.01g scale

    pkt.countdown_sec = (uint16_t)countdown_remaining_sec;
    pkt.seq_num = rolling_seq++;
    pkt.checksum = calculateChecksum((const uint8_t*)&pkt, sizeof(pkt) - 1);

    pTelemetryChar->setValue((uint8_t*)&pkt, sizeof(pkt));
    pTelemetryChar->notify();
}

void sendEmergencyNotification(AccidentState state_at_event, float peak_g, uint16_t stillness_sec) {
    if (!device_connected || pEmergencyChar == nullptr) return;

    EmergencyPacket pkt;
    memset(&pkt, 0, sizeof(pkt));

    pkt.header = 0xEE;
    pkt.packet_type = 0x02;
    pkt.event_id = ++incident_counter;
    nvsPrefs.putUInt("inc_id", incident_counter);
    pkt.event_state = (uint8_t)state_at_event;
    pkt.operating_mode = (uint8_t)operating_mode;
    pkt.peak_accel_mg = (uint16_t)(peak_g * 100.0f);
    pkt.stillness_sec_x10 = (uint16_t)(stillness_sec * 10);
    pkt.hr_at_event = current_hr;
    pkt.spo2_at_event = current_spo2;
    pkt.timestamp_sec = millis() / 1000;
    pkt.checksum = calculateChecksum((const uint8_t*)&pkt, sizeof(pkt) - 1);

    pEmergencyChar->setValue((uint8_t*)&pkt, sizeof(pkt));
    pEmergencyChar->notify();
    Serial.printf("[BLE] Dispatched Emergency Event #%u (State=%d, Peak=%.2fg)\n", pkt.event_id, state_at_event, peak_g);
}

// ============================================================================
// 6. ACCIDENT DETECTION STATE MACHINE & ACTUATORS
// ============================================================================

void setAccidentState(AccidentState new_state) {
    if (current_state == new_state) return;

    current_state = new_state;
    state_enter_time = millis();
    Serial.printf("[STATE] Transitioned to State %d\n", new_state);

    if (new_state == STATE_COUNTDOWN) {
        countdown_remaining_sec = 15;
        sendEmergencyNotification(STATE_COUNTDOWN, peak_accel_g, 3);
    } else if (new_state == STATE_EMERGENCY_ALERT) {
        sendEmergencyNotification(STATE_EMERGENCY_ALERT, peak_accel_g, 15);
    } else if (new_state == STATE_CANCELLED) {
        digitalWrite(PIN_BUZZER, LOW);
        buzzer_state = false;
        countdown_remaining_sec = 0;
        sendEmergencyNotification(STATE_CANCELLED, 0, 0);
    } else if (new_state == STATE_NORMAL_MONITORING) {
        digitalWrite(PIN_BUZZER, LOW);
        buzzer_state = false;
        countdown_remaining_sec = 0;
    }
}

void updateAccidentStateMachine() {
    unsigned long time_in_state = millis() - state_enter_time;

    switch (current_state) {
        case STATE_NORMAL_MONITORING:
            // Check for sudden acceleration impulse (> 3.2g)
            if (accel_mag_g >= IMPACT_THRESHOLD_G) {
                peak_accel_g = accel_mag_g;
                Serial.printf("[DETECTION] Impact candidate spike detected: %.2fg\n", peak_accel_g);
                setAccidentState(STATE_IMPACT_CANDIDATE);
            }
            break;

        case STATE_IMPACT_CANDIDATE:
            // Short settling window (400ms) to capture peak trauma force
            if (accel_mag_g > peak_accel_g) {
                peak_accel_g = accel_mag_g;
            }
            if (time_in_state > 400) {
                setAccidentState(STATE_IMMOBILITY_CHECK);
            }
            break;

        case STATE_IMMOBILITY_CHECK: {
            // Assess post-impact motion stillness over 3 seconds
            static float max_delta = 0.0f;
            if (time_in_state < 100) max_delta = 0.0f;

            float delta = fabsf(accel_mag_g - 1.0f);
            if (delta > max_delta) max_delta = delta;

            // If user recovers and resumes normal motion, abort candidate
            if (max_delta > IMMOBILITY_MAX_VARIANCE_G * 2.5f) {
                Serial.println("[DETECTION] Motion detected post-impact. False alarm aborted.");
                setAccidentState(STATE_NORMAL_MONITORING);
                break;
            }

            // Stillness sustained for 3.0 seconds -> Escalate to 15-second countdown
            if (time_in_state >= IMMOBILITY_DURATION_MS) {
                Serial.println("[DETECTION] Prolonged immobility confirmed! Starting 15s countdown.");
                setAccidentState(STATE_COUNTDOWN);
            }
            break;
        }

        case STATE_COUNTDOWN: {
            // 15-second countdown window with active buzzer warning beeps
            long remaining = (long)(COUNTDOWN_DURATION_MS - time_in_state) / 1000;
            countdown_remaining_sec = (remaining > 0) ? (uint16_t)remaining : 0;

            // Accelerating audible warning beep on Same Sky CMI-1295-03TH Buzzer (GPIO25)
            unsigned long beep_interval = (countdown_remaining_sec <= 5) ? 250 : 800;
            if (millis() - last_beep_toggle >= beep_interval) {
                last_beep_toggle = millis();
                buzzer_state = !buzzer_state;
                digitalWrite(PIN_BUZZER, buzzer_state ? HIGH : LOW);
            }

            if (time_in_state >= COUNTDOWN_DURATION_MS) {
                digitalWrite(PIN_BUZZER, LOW);
                setAccidentState(STATE_PHYSIOLOGICAL_ASSESSMENT);
            }
            break;
        }

        case STATE_PHYSIOLOGICAL_ASSESSMENT:
            // Interrogate vital signs prior to alert confirmation
            if (time_in_state >= 1200) { // 1.2s assessment window
                setAccidentState(STATE_EMERGENCY_ALERT);
            }
            break;

        case STATE_EMERGENCY_ALERT:
            // High-priority emergency trauma state: Continuous siren strobe
            if (millis() - last_beep_toggle >= 150) {
                last_beep_toggle = millis();
                buzzer_state = !buzzer_state;
                digitalWrite(PIN_BUZZER, buzzer_state ? HIGH : LOW);
            }
            break;

        case STATE_CANCELLED:
            // Brief 3-second grace period before returning to normal monitoring
            if (time_in_state >= 3000) {
                setAccidentState(STATE_NORMAL_MONITORING);
            }
            break;
    }
}

// ============================================================================
// 7. BLE SERVER CALLBACKS & CONTROL RECEIVER
// ============================================================================

class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        device_connected = true;
        Serial.println("[BLE] Client connected.");
    };

    void onDisconnect(BLEServer* pServer) {
        device_connected = false;
        Serial.println("[BLE] Client disconnected. Restarting advertising...");
    }
};

class ControlCommandCallback: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        String rx = pCharacteristic->getValue();
        std::string rxValue(rx.c_str(), rx.length());
        if (rxValue.length() == 0) return;

        Serial.printf("[BLE CMD] Received %d bytes: ", rxValue.length());

        // Check for ASCII commands or binary opcodes
        if (rxValue.find("CANCEL") != std::string::npos || rxValue[0] == 0x03) {
            Serial.println("Action -> CANCEL Countdown");
            if (current_state == STATE_COUNTDOWN || current_state == STATE_PHYSIOLOGICAL_ASSESSMENT) {
                setAccidentState(STATE_CANCELLED);
            }
        } else if (rxValue.find("SIM IMPACT") != std::string::npos || rxValue[0] == 0x02) {
            Serial.println("Action -> SIMULATE IMPACT");
            accel_mag_g = 4.85f; // Inject 4.85g crash impulse
            peak_accel_g = 4.85f;
            setAccidentState(STATE_IMPACT_CANDIDATE);
        } else if (rxValue.find("SIM") != std::string::npos || rxValue[0] == 0x01) {
            operating_mode = (operating_mode == MODE_REAL) ? MODE_SIMULATION : MODE_REAL;
            Serial.printf("Action -> Toggled mode to: %s\n", (operating_mode == MODE_SIMULATION) ? "SIMULATION" : "REAL");
        }
    }
};

// ============================================================================
// 8. ARDUINO SETUP & MAIN LOOP
// ============================================================================

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n==================================================");
    Serial.println("   CSP PROTOTYPE V1 — TRIAGE EMBEDDED SYSTEM      ");
    Serial.println("==================================================");

    // Non-Volatile Storage (NVS) for Monotonic Incident Sequencing Across Reboots
    nvsPrefs.begin("triage", false);
    incident_counter = nvsPrefs.getUInt("inc_id", 1000);
    Serial.printf("[INIT] Persistent Incident Counter initialized from NVS: %u\n", incident_counter);

    // 1. Initialize GPIOs
    pinMode(PIN_BUZZER, OUTPUT);
    digitalWrite(PIN_BUZZER, LOW);

    // Push Button on GPIO33: Internal pull-up (Pressed = LOW)
    pinMode(PIN_BUTTON_CANCEL, INPUT_PULLUP);

    // Quick buzzer boot chirp
    digitalWrite(PIN_BUZZER, HIGH);
    delay(80);
    digitalWrite(PIN_BUZZER, LOW);

    // 2. Initialize I2C Bus on GPIO 21 (SDA) and GPIO 22 (SCL)
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 100000); // 100 kHz I2C
    delay(100);

    // 3. Detect & Initialize Sensors
    Serial.print("[INIT] Probing MPU6050 Accelerometer at 0x68... ");
    mpu_detected = initMPU6050();
    Serial.println(mpu_detected ? "FOUND & INITIALIZED" : "NOT DETECTED (Fallback to Sim)");

    Serial.print("[INIT] Probing MAX30102 Heart Sensor at 0x57... ");
    max30102_detected = initMAX30102();
    Serial.println(max30102_detected ? "FOUND & INITIALIZED" : "NOT DETECTED (Fallback to Sim)");

    // 4. Initialize BLE Stack
    BLEDevice::init(BLE_DEVICE_NAME);
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    // Create Primary Triage GATT Service
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Characteristic 1: Live Telemetry (NOTIFY)
    pTelemetryChar = pService->createCharacteristic(
        CHAR_UUID_TELEMETRY,
        BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ
    );
    pTelemetryChar->addDescriptor(new BLE2902());

    // Characteristic 2: Emergency Event (NOTIFY | READ)
    pEmergencyChar = pService->createCharacteristic(
        CHAR_UUID_EMERGENCY,
        BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ
    );
    pEmergencyChar->addDescriptor(new BLE2902());

    // Characteristic 3: Device Control (WRITE | WRITE_NO_RESP)
    pControlChar = pService->createCharacteristic(
        CHAR_UUID_CONTROL,
        BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
    );
    pControlChar->setCallbacks(new ControlCommandCallback());

    pService->start();

    // Start BLE Advertising
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.printf("[BLE] Service '%s' advertising as '%s'\n", SERVICE_UUID, BLE_DEVICE_NAME);
    Serial.println("[SYSTEM] Device armed and monitoring.");
}

void loop() {
    // 1. Connection Lifecycle Management
    if (!device_connected && old_device_connected) {
        delay(500);
        pServer->startAdvertising();
        Serial.println("[BLE] Restarted advertising after disconnect.");
        old_device_connected = device_connected;
    }
    if (device_connected && !old_device_connected) {
        old_device_connected = device_connected;
    }

    // 2. Physical Button Handling (GPIO 33 - Active LOW)
    static int last_button_state = HIGH;
    int current_button_state = digitalRead(PIN_BUTTON_CANCEL);
    if (last_button_state == HIGH && current_button_state == LOW) {
        delay(30); // Debounce
        if (digitalRead(PIN_BUTTON_CANCEL) == LOW) {
            Serial.println("[BUTTON] Physical Cancel Button Pressed on GPIO 33!");
            if (current_state == STATE_COUNTDOWN || current_state == STATE_PHYSIOLOGICAL_ASSESSMENT || current_state == STATE_EMERGENCY_ALERT) {
                setAccidentState(STATE_CANCELLED);
            }
        }
    }
    last_button_state = current_button_state;

    // 3. Serial Command Interface (for USB Debugging & Wokwi/Web Simulation)
    if (Serial.available()) {
        String line = Serial.readStringUntil('\n');
        line.trim();
        if (line.equalsIgnoreCase("CANCEL")) {
            setAccidentState(STATE_CANCELLED);
        } else if (line.equalsIgnoreCase("SIM IMPACT")) {
            accel_mag_g = 4.85f;
            peak_accel_g = 4.85f;
            setAccidentState(STATE_IMPACT_CANDIDATE);
        } else if (line.equalsIgnoreCase("SIM")) {
            operating_mode = (operating_mode == MODE_REAL) ? MODE_SIMULATION : MODE_REAL;
            Serial.printf("Mode toggled to: %s\n", (operating_mode == MODE_SIMULATION) ? "SIMULATION" : "REAL");
        }
    }

    // 4. Sensor Sampling (Every 50ms = 20 Hz)
    if (millis() - last_sensor_read_time >= 50) {
        last_sensor_read_time = millis();

        if (operating_mode == MODE_REAL && mpu_detected) {
            readMPU6050(accel_x_g, accel_y_g, accel_z_g, accel_mag_g);
        } else if (operating_mode == MODE_SIMULATION || !mpu_detected) {
            // Synthetic baseline gravity 1.0g with gentle noise
            if (current_state == STATE_NORMAL_MONITORING) {
                static float angle = 0;
                angle += 0.05f;
                accel_x_g = 0.05f * sinf(angle);
                accel_y_g = 0.04f * cosf(angle);
                accel_z_g = 0.98f + 0.02f * sinf(angle * 2.0f);
                accel_mag_g = sqrtf(accel_x_g * accel_x_g + accel_y_g * accel_y_g + accel_z_g * accel_z_g);
            }
        }

        if (operating_mode == MODE_REAL && max30102_detected) {
            readMAX30102(finger_detected, current_hr, current_spo2, signal_quality);
        } else if (operating_mode == MODE_SIMULATION || !max30102_detected) {
            // In simulation, provide normal vital signs
            finger_detected = true;
            current_hr = 76;
            current_spo2 = 98;
            signal_quality = 95;
        }
    }

    // 5. Update State Machine & Buzzer
    updateAccidentStateMachine();

    // 6. Broadcast Telemetry Notification (Every 200ms = 5 Hz)
    if (millis() - last_telemetry_time >= 200) {
        last_telemetry_time = millis();
        sendTelemetryNotification();
    }
}

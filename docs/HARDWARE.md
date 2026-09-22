# AstroVitals Orbital Telemetry Hardware Specification

Author: MD Tanvir Ahmmed, Ishraq Ahmmed, Suvajit Kumar Arja (Team Orbitrix)  
Challenge: NASA Space Apps Challenge 2026 - Challenge 5 (Health Monitoring Software for Astronauts)  
Document Version: 2.0.0 (Updated 2026-09-22)  
Single Source of Truth: This document is the definitive hardware and pinout reference for AstroVitals.

---

## 1. Revision History

| Version | Date | Author | Description of Changes |
|---------|------|--------|------------------------|
| 1.0.0 | 2026-09-20 | Team Orbitrix | Initial hardware prototype specification. |
| 2.0.0 | 2026-09-22 | Team Orbitrix | Hardware architecture upgrade. Integrated MPU-6050 6-axis IMU on shared I2C (0x68). Added tactile haptic vibration motor via NPN transistor driver on GPIO 18. Added Red Anomaly LED on GPIO 25 and Green Nominal LED on GPIO 26. Dedicated MAX30102 INT to GPIO 19. Migrated radiation monitoring to hybrid NOAA SWPC space weather integration and NASA-STD-3001 reference dosimetry. |

---

## 2. System Architecture Overview

AstroVitals features an integrated physical wearable and astronaut health hub built around the Espressif ESP32-WROOM-32 microcontroller. The wearable performs continuous multichannel biosensing, edge conditioning, real-time threshold monitoring, and local alerting before packaging telemetry into timestamped HTTP POST payloads transmitted to `/api/v1/ingest/vitals` over station Wi-Fi.

If hardware is disconnected or network communication drops, the firmware buffers readings in non-volatile circular storage, while the AstroVitals backend automatically maintains monitoring continuity through calibrated simulation and committed spaceflight analog fixtures.

---

## 3. Sensor Suite and Pinout Mapping

All active sensors and display modules share a single high-speed I2C bus on GPIO 21 (SDA) and GPIO 22 (SCL). Dedicated digital GPIO pins drive the tactile haptic motor, optical status LEDs, and sensor interrupts.

| Component | Sensor IC / Module | Physical Measurement | Interface | Nominal Voltage | ESP32 GPIO Pins |
|-----------|--------------------|----------------------|-----------|-----------------|-----------------|
| Microcontroller Hub | ESP32-WROOM-32 | Dual-core Tensilica LX6, 240 MHz | SoC | 3.3V / 5V USB | - |
| Pulse Oximeter & HR | MAX30102 | Photoplethysmography (Red & IR LEDs) | I2C (0x57) | 3.3V | SDA: GPIO 21, SCL: GPIO 22, INT: GPIO 19 |
| Infrared Core Temp | MLX90614-ESF-DCI | Non-contact thermopile (35 deg FOV) | I2C (0x5A) | 3.3V | SDA: GPIO 21, SCL: GPIO 22 |
| 6-Axis Motion / IMU | MPU-6050 | Tri-axial acceleration & gyro | I2C (0x68) | 3.3V | SDA: GPIO 21, SCL: GPIO 22 |
| Local HUD Display | SSD1306 0.96 inch | 128x64 Monochrome OLED vital display | I2C (0x3C) | 3.3V | SDA: GPIO 21, SCL: GPIO 22 |
| Haptic Feedback Motor | 3V Coin Vibration Motor | Tactile alert notification | Digital PWM | 3.3V rail via NPN | Control: GPIO 18 (Base via 1k resistor) |
| Red Anomaly LED | 5mm High-Efficiency Red | Visual physiological alarm | Digital Out | 3.3V via 220 ohm | Anode: GPIO 25, Cathode: GND |
| Green Nominal LED | 5mm High-Efficiency Green | Visual system nominal indicator | Digital Out | 3.3V via 220 ohm | Anode: GPIO 26, Cathode: GND |

---

## 4. Hardware Wiring Diagram (Single Source of Truth)

```
       +---------------------------------------------+
       |             ESP32-WROOM-32                  |
       |                                             |
       |  [GPIO 21] ------> SDA (Shared I2C Bus) ----+---> MAX30102 (SDA)
       |                                             +---> MLX90614 (SDA)
       |                                             +---> MPU-6050 (SDA)
       |                                             +---> SSD1306  (SDA)
       |                                             |
       |  [GPIO 22] ------> SCL (Shared I2C Bus) ----+---> MAX30102 (SCL)
       |                                             +---> MLX90614 (SCL)
       |                                             +---> MPU-6050 (SCL)
       |                                             +---> SSD1306  (SCL)
       |                                             |
       |  [GPIO 19] ------> INT (MAX30102 Interrupt) |
       |  [GPIO 18] ------> Base of NPN Transistor -> Haptic Vibration Motor
       |  [GPIO 25] ------> Red Anomaly LED          |
       |  [GPIO 26] ------> Green Nominal LED        |
       |  [ 3V3   ] ------> 3.3V VCC Power Rail      |
       |  [ GND   ] ------> Common Ground            |
       +---------------------------------------------+
```

---

## 5. Circuit Design and Component Protection

### 5.1 Shared I2C Bus Topology
- **Bus Speed**: 400 kHz (Fast Mode).
- **Pull-Up Resistors**: 4.7k ohm pull-up resistors connect GPIO 21 (SDA) and GPIO 22 (SCL) to the 3.3V VCC rail.
- **Device Addresses**:
  - `0x57`: MAX30102 PPG sensor.
  - `0x5A`: MLX90614 infrared temperature sensor.
  - `0x68`: MPU-6050 6-axis motion sensor (AD0 tied to GND).
  - `0x3C`: SSD1306 128x64 OLED display.

### 5.2 Haptic Vibration Motor Driver Circuit
- **Driver Transistor**: 2N2222 or S8050 NPN bipolar junction transistor.
- **Base Current Limiter**: 1k ohm resistor between GPIO 18 and transistor base (ensures ~2.6 mA base drive, saturating transistor with V_ce < 0.2V).
- **Inductive Kickback Protection**: 1N4148 or 1N4007 fast flyback diode placed in reverse-parallel across motor terminals to safely clamp inductive voltage spikes when the motor switches off.
- **Power Rail**: Transistor collector connected to motor cathode; motor anode connected to 3.3V rail. Common ground on emitter.

### 5.3 Status Indicator LEDs
- **Red Anomaly LED**: GPIO 25 connected to LED anode via a 220 ohm current-limiting resistor (forward current ~6.8 mA).
- **Green Nominal LED**: GPIO 26 connected to LED anode via a 220 ohm current-limiting resistor (forward current ~6.8 mA).

---

## 6. Real-World Sensor Physics and Mitigation

### 6.1 MAX30102 Motion Artifact Rejection via MPU-6050
- **Physics**: In microgravity, fluid shifts toward the upper body alter capillary bed compliance. Astronaut motion causes shear displacement between skin and optical photodiode, introducing high-amplitude low-frequency baseline wander in photoplethysmography (PPG) waveforms.
- **Mitigation**: The ESP32 firmware continuously samples MPU-6050 acceleration vector magnitude (`motion_g = sqrt(ax^2 + ay^2 + az^2) / 16384.0` in +/-2g mode). When dynamic acceleration variance exceeds 0.25 g, the optical sample frame is flagged for motion rejection. Real-time SpO2 calculation uses a sliding ratio-of-ratios window over 5 consecutive heartbeats with median outlier filtering.

### 6.2 MLX90614 Infrared Body Temperature Settling
- **Physics**: The MLX90614 thermopile sensor detects 5.5 to 14 um infrared radiation across a 35-degree field-of-view (FOV). Distance variations from the skin (optimal 2 to 5 cm) and cabin air thermal currents can induce transient reading drift.
- **Mitigation**: The firmware implements a 3-second thermal settling moving-average filter and calculates ambient temperature differentials (`T_object - T_ambient`). Unrealistic readings outside 32.0 C to 42.0 C are clamped and flagged.

### 6.3 MPU-6050 Motion and Tremor Feature Extraction
- **Physics**: Microgravity eliminates constant 1g hydrostatic preload on musculature, leading to rapid motor unit deconditioning, postural micro-oscillations, and microgravity-induced tremors (typically 4 to 8 Hz).
- **Mitigation**: Rather than transmitting heavy raw 6-axis IMU streams over bandwidth-constrained space Wi-Fi, the ESP32 performs on-chip DSP:
  - Vector acceleration magnitude: `motion_g`.
  - Activity classification: `rest` (motion < 0.15 g), `active` (0.15 g to 0.40 g), or `exercise` (> 0.40 g).
  - Tremor index: bandpass energy in the 4-8 Hz frequency window.

### 6.4 Radiation Monitoring (Hybrid NOAA Space Weather + NASA-STD-3001)
- **Design Context**: Legacy dosimeter tubes were replaced to meet strict power, payload, and budget constraints. Spaceflight ionizing radiation monitoring is handled through an integrated hybrid system:
  1. **Live NOAA SWPC Feed**: When network connectivity is available, the backend queries the NOAA Space Weather Prediction Center (SWPC) GOES satellite X-ray flux and space weather scales (`https://services.swpc.noaa.gov/products/noaa-scales.json`).
  2. **Offline Fallback Fixture**: Committed reference file `demo_fixtures/radspace_weather.json` provides verified historical solar storm scenarios and LEO background dose rates.
  3. **Deterministic Dosimetry Engine**: `backend/compute/radiation_math.py` evaluates cumulative radiation dose against NASA-STD-3001 limits (600 mSv career limit, 250 mSv single-event limit) and South Atlantic Anomaly (SAA) orbital transit multipliers.
  4. **Glanceable UI Indicator**: The dashboard radiation gauge displays cumulative dosimetry alongside a source badge (`LIVE NOAA`, `CACHE`, or `FIXTURE`).

---

## 7. Alerting Logic (Local-First with Advisory Override)

AstroVitals implements a local-first alerting safety envelope to ensure immediate astronaut notification even during complete station Wi-Fi blackout.

### 7.1 Local-First Anomaly Envelope
The ESP32 firmware evaluates raw sensor samples against hard physiological thresholds on every 1-second loop:
- **Heart Rate**: < 40 BPM (severe bradycardia) or > 180 BPM (extreme tachycardia).
- **SpO2**: < 90.0% (acute hypoxia).
- **Skin Temperature**: < 35.0 C (hypothermia) or > 39.0 C (hyperthermia/fever).
- **Motion G**: > 4.0 g (high-g impact or uncontrolled EVA tumble).

### 7.2 Alert Signaling Patterns
- **Nominal State**:
  - Red Anomaly LED (GPIO 25): LOW (OFF).
  - Green Nominal LED (GPIO 26): HIGH (ON, steady green).
  - Haptic Vibration Motor (GPIO 18): LOW (OFF).
  - SSD1306 Display: Status reads `NOMINAL`.
- **Anomaly State**:
  - Red Anomaly LED (GPIO 25): HIGH (ON, flashing or steady red).
  - Green Nominal LED (GPIO 26): LOW (OFF).
  - Haptic Vibration Motor (GPIO 18): Executes a distinct 5-pulse tactile alarm (200 ms ON, 200 ms OFF, repeating 5 cycles).
  - Alert Debounce: A 30-second refractory timer prevents continuous tactile fatigue while maintaining visual LED warning until vitals recover.
  - SSD1306 Display: Status banner flashes `! ALERT !` along with the triggering rule (e.g., `HR LOW`, `SPO2 LOW`, or `TEMP HIGH`).

### 7.3 Advisory Backend Command Override
Flight surgeons and mission controllers can issue advisory haptic notifications (e.g., scheduled EVA check-in, medication reminder) via `POST /api/v1/devices/alert`. When received by the ESP32, the OLED renders `[ALRT] GROUND COMMAND` with a double-pulse haptic pattern.

---

## 8. Telemetry Ingestion Payload Specification

The ESP32 firmware packages biometric readings into JSON transmitted via HTTP POST to:
`POST /api/v1/ingest/vitals`  
Headers: `Content-Type: application/json`, `X-Device-Id: esp32-orbital-hub-01`

```json
{
  "device_id": "esp32-orbital-hub-01",
  "astronaut_id": "astronaut-A",
  "readings": [
    {
      "timestamp_utc": "2026-10-04T12:00:00Z",
      "heart_rate_bpm": 74.2,
      "spo2_pct": 98.4,
      "skin_temp_c": 36.54,
      "accel_x_g": 0.02,
      "accel_y_g": 0.03,
      "accel_z_g": 0.98,
      "activity_state": "rest",
      "radiation_dose_uSv_cumulative": 12.504,
      "battery_pct": 92.5,
      "wifi_rssi": -48.0,
      "buffered": false
    }
  ]
}
```

---

## 9. Power Budget and Battery Management

- **Power Source**: 3.7V 2000 mAh rechargeable Lithium-Polymer (LiPo) cell.
- **Power Regulation**: Low-dropout (LDO) regulator (AP2112K-3.3V, 600 mA maximum).
- **Active Telemetry Draw**:
  - ESP32 microcontroller with Wi-Fi Tx: ~120 mA
  - MAX30102 active PPG LEDs: ~18 mA
  - MLX90614 + MPU-6050 + SSD1306: ~9 mA
  - Green Nominal LED (constant on): ~6.8 mA
  - Haptic Motor (pulsed during alert): ~65 mA peak
  - Total Nominal Active Draw: ~154 mA (~13.0 hours continuous streaming).
- **Sleep Mode Draw**: Wi-Fi modem sleep with 10-second sensor polling: ~11 mA (~180 hours operational life).
- **Charging Interface**: USB-C with onboard TP4056 charge controller (500 mA charge rate with thermal regulation).

---

## 10. Firmware Location and Required Libraries

- **Source Code**: `firmware/astrovitals_esp32.ino`
- **Toolchain**: Arduino IDE 2.x or PlatformIO
- **Target Board**: `ESP32 Dev Module` (Flash: 4MB, Frequency: 240 MHz)
- **Required Libraries**:
  - `WiFi.h` (Built-in ESP32 core)
  - `HTTPClient.h` (Built-in ESP32 core)
  - `Wire.h` (Built-in ESP32 core)
  - `ArduinoJson` (v7.x by Benoit Blanchon)
  - `SparkFun MAX3010x Pulse and Proximity Sensor Library`
  - `Adafruit MLX90614 Library`
  - `Adafruit MPU6050` & `Adafruit Unified Sensor`
  - `Adafruit SSD1306` & `Adafruit GFX Library`

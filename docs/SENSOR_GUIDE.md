# AstroVitals Sensor Engineering & Calibration Guide

Deep-Space Biosensor Specifications, I2C Topologies, and Fault-Tolerant Edge Calibration.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. I2C Bus Architecture & Addressing Matrix

AstroVitals links onboard physiological transducers across a high-speed conflict-free I2C bus and a dedicated 1-Wire digital bus:

| Sensor Module | Primary Function | Bus Interface / Address | Pinout Mapping | Bus Speed | Pull-Up Recommendation |
|:---|:---|:---:|:---:|:---:|:---:|
| **SSD1306 OLED** | Local Astronaut HUD | I2C (`0x3C`) | GPIO 21 (SDA), GPIO 22 (SCL) | 400 kHz | Internal on breakout |
| **MAX30102 PPG** | Pulse Oximetry & Heart Rate | I2C (`0x57`) | GPIO 21 (SDA), GPIO 22 (SCL), INT 19 | 400 kHz | 4.7 kOhm external |
| **MPU-6050 IMU** | 6-Axis Microgravity Dynamics | I2C (`0x68`) | GPIO 21 (SDA), GPIO 22 (SCL) | 400 kHz | Internal on breakout |
| **DS18B20 Digital** | Precision Skin Contact Temp | 1-Wire Digital Bus | GPIO 4 (Dedicated DATA) | ~16 kbps | 4.7 kOhm external to 3.3V |

There are zero address collisions across the bus.

---

## 2. Sensor Specifications and Physics of Transduction

### 2.1 Maxim MAX30102 Optical Photoplethysmography (PPG)
- **Principle**: Dual-wavelength optical absorption. The module emits alternating pulses of Red light (660 nm) and Infrared light (880 nm) into vascular tissue.
- **Transduction Physics**: Deoxygenated hemoglobin (Hb) absorbs more Red light, while oxygenated hemoglobin (HbO2) absorbs more Infrared light. The ratio of ratios (R = (AC_red / DC_red) / (AC_ir / DC_ir)) calculates arterial oxygen saturation (SpO2) using the empirical calibration curve: `SpO2 = 110.0 - 25.0 * R`.
- **Sampling Rate**: Configured at 100 Hz sampling with an LED pulse width of 411 microseconds and 18-bit ADC resolution.
- **Motion Artifact Rejection**: Integrated dynamic baseline tracking filters optical noise caused by physical motion. When the MPU-6050 detects acceleration greater than 0.35 g, the heart rate algorithm locks onto previous high-confidence peak intervals to prevent false tachycardia spikes.

### 2.2 Dallas DS18B20 High-Precision Digital Skin Thermometer
- **Principle**: Solid-state bandgap temperature sensing with internal 12-bit ADC communicating over a single 1-Wire digital bus.
- **Transduction Physics**: Converts direct epidermal thermal conduction into calibrated digital Celsius words, eliminating analog noise and non-contact IR thermal current drift.
- **Medical Accuracy**: Calibrated to +/- 0.5 C precision from -10 C to +85 C (0.0625 C resolution in 12-bit mode; 0.25 C in 10-bit fast mode).
- **Dedicated 1-Wire Protocol**: Operates on a dedicated digital GPIO line (GPIO 4) with a 4.7k pull-up resistor to 3.3V, operating independently from the I2C bus to eliminate bus contention.

### 2.3 TDK InvenSense MPU-6050 6-Axis Motion Tracking
- **Principle**: Micro-Electro-Mechanical Systems (MEMS) capacitive sensing with internal Digital Motion Processor (DMP).
- **Scale Ranges**:
  - Accelerometer: Configured to +/- 4g (sensitivity: 8192 LSB/g) to capture subtle microgravity fluid repositioning and intravehicular translation.
  - Gyroscope: Configured to +/- 250 deg/s (sensitivity: 131 LSB/deg/s) to monitor body orientation and angular velocity.
- **Low-Pass Filter**: Programmable digital low-pass filter (DLPF) set to 21 Hz to isolate intentional astronaut movements from spacecraft engine and pump vibrations.

### 2.4 Solomon Systech SSD1306 Graphic OLED
- **Principle**: 0.96-inch self-illuminating Organic Light-Emitting Diode display (128x64 resolution).
- **Operating Current**: Typically 15 mA (high efficiency). Operates in vacuum-safe solid-state packaging with zero liquid crystal fluid freezing risk.

---

## 3. Safe Probing & Graceful Hardware Fallback Mechanism

AstroVitals guarantees that the wearable firmware will never freeze, crash, or enter an infinite I2C lockup when one or all physical sensors are disconnected or pending installation.

### Safe Hardware Probing Algorithm:
During `setup()`, the firmware performs non-blocking I2C transmissions:
```cpp
Wire.beginTransmission(targetAddress);
byte error = Wire.endTransmission();
if (error == 0) {
  // Sensor detected! Initialize hardware registers
} else {
  // Sensor absent! Log notice and activate calibrated edge baseline
}
```

### Deterministic Edge Baseline Generator:
When a physical sensor is absent, the firmware executes a mathematically validated biological baseline:
1. **Heart Rate (RSA Model)**: Simulates natural Respiratory Sinus Arrhythmia with coupled sinusoidal vagal modulation:
   `HR(t) = 72.0 + 2.5 * sin(t * 0.35) + 0.8 * cos(t * 1.15) [bpm]`
2. **Blood Oxygen (SpO2)**: Maintains high nominal homeostasis:
   `SpO2(t) = 98.4 + 0.3 * sin(t * 0.20) [%]`
3. **Skin Temperature**: Reproduces subtle peripheral thermal regulation:
   `Temp(t) = 36.52 + 0.08 * sin(t * 0.15) [C]`
4. **Microgravity Postural Dynamics**: Simulates low-G floating jitter:
   `Accel_Mag(t) = 0.04 + 0.01 * sin(t * 0.70) [g]`

Every packet transmitted under this condition carries:
- `sensors: { max30102: false, ds18b20: false, mpu6050: false, ssd1306: false }`
- `is_hardware_reading: false`

This ensures total transparency across both edge and cloud layers.

---

## 4. Anatomical Sensor Placement Protocol

For optimal biometric fidelity aboard the spacecraft:
- **MAX30102 (PPG)**: Inner wrist overlying the radial artery, or integrated into a contoured finger cuff with spring-loaded silicone backing to maintain consistent capillary contact.
- **DS18B20 (Skin Temp)**: Flat TO-92 or waterproof probe tip placed in direct, firm contact with inner wrist or sternum skin with thermal transfer tape.
- **MPU-6050 (IMU)**: Mounted securely at the dorsal center of the wearable enclosure, aligning the X-axis along the astronaut's forearm vector.
- **SSD1306 (OLED)**: Top face of the wrist unit, tilted at 15 degrees for rapid glancing during EVA operations.


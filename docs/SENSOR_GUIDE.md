# AstroVitals Sensor Engineering & Calibration Guide

Deep-Space Biosensor Specifications, I2C Topologies, and Fault-Tolerant Edge Calibration.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. I2C Bus Architecture & Addressing Matrix

AstroVitals links all onboard physiological transducers across a single, conflict-free 400 kHz fast-mode I2C bus:

| Sensor Module | Primary Function | Standard I2C Address | Configurable Pins | Bus Speed | Pull-Up Recommendation |
|:---|:---|:---:|:---:|:---:|:---:|
| **SSD1306 OLED** | Local Astronaut HUD | `0x3C` | SA0 pull-up -> 0x3D | 400 kHz | Internal on breakout |
| **MAX30102 PPG** | Pulse Oximetry & Heart Rate | `0x57` | Hardwired factory address | 400 kHz | 4.7 kOhm external |
| **MLX90614-DCI** | Non-Contact Infrared Temp | `0x5A` | Factory EEPROM programmed | 100-400 kHz | 4.7 kOhm external |
| **MPU-6050 IMU** | 6-Axis Microgravity Dynamics | `0x68` | AD0 pull-up -> 0x69 | 400 kHz | Internal on breakout |

There are zero address collisions across the bus.

---

## 2. Sensor Specifications and Physics of Transduction

### 2.1 Maxim MAX30102 Optical Photoplethysmography (PPG)
- **Principle**: Dual-wavelength optical absorption. The module emits alternating pulses of Red light (660 nm) and Infrared light (880 nm) into vascular tissue.
- **Transduction Physics**: Deoxygenated hemoglobin (Hb) absorbs more Red light, while oxygenated hemoglobin (HbO2) absorbs more Infrared light. The ratio of ratios (R = (AC_red / DC_red) / (AC_ir / DC_ir)) calculates arterial oxygen saturation (SpO2) using the empirical calibration curve: `SpO2 = 110.0 - 25.0 * R`.
- **Sampling Rate**: Configured at 100 Hz sampling with an LED pulse width of 411 microseconds and 18-bit ADC resolution.
- **Motion Artifact Rejection**: Integrated dynamic baseline tracking filters optical noise caused by physical motion. When the MPU-6050 detects acceleration greater than 0.35 g, the heart rate algorithm locks onto previous high-confidence peak intervals to prevent false tachycardia spikes.

### 2.2 Melexis MLX90614 Non-Contact Infrared Thermometer
- **Principle**: Stefan-Boltzmann thermopile radiation. Detects infrared energy emitted by the skin in the 5.5 to 14 micrometer spectrum.
- **Transduction Physics**: Converts radiated thermal energy to microvolt potentials, amplified by a low-noise 17-bit chopper-stabilized ADC.
- **Medical Accuracy**: Calibrated to +/- 0.2 C precision within the human physiological zone (32.0 C to 42.0 C).
- **Dual-Zone Detection**: Simultaneously reads both object (skin surface) and ambient temperature, enabling compensatory environmental thermal filtering.

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
- `sensors: { max30102: false, mlx90614: false, mpu6050: false, ssd1306: false }`
- `is_hardware_reading: false`

This ensures total transparency across both edge and cloud layers.

---

## 4. Anatomical Sensor Placement Protocol

For optimal biometric fidelity aboard the spacecraft:
- **MAX30102 (PPG)**: Inner wrist overlying the radial artery, or integrated into a contoured finger cuff with spring-loaded silicone backing to maintain consistent capillary contact.
- **MLX90614 (IR)**: Directed toward the temporal artery on the forehead (0.5 to 1.0 cm distance) or the volar aspect of the wrist.
- **MPU-6050 (IMU)**: Mounted securely at the dorsal center of the wearable enclosure, aligning the X-axis along the astronaut's forearm vector.
- **SSD1306 (OLED)**: Top face of the wrist unit, tilted at 15 degrees for rapid glancing during EVA operations.


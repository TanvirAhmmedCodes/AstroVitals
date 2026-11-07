# AstroVitals Hardware Engineering Guide

Biometric Telemetry Wearable Hub Specifications and Wiring Guide.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. System Hardware Overview

The AstroVitals physical wearable is powered by an **ESP32-WROOM-32** dual-core microcontroller clocked at 240 MHz. It interfaces with medical-grade biosensors over a shared high-speed I2C bus, captures biometric signals, executes local edge safety envelopes, and communicates with mission control over 2.4 GHz Wi-Fi.

```
+-------------------------------------------------------------------------+
|                  AstroVitals Wearable Telemetry Hub                     |
|                                                                         |
|   +-------------------+        +-----------------------------------+    |
|   | 3.7V LiPo Battery | -----> | 3.3V Low-Dropout Regulator (LDO)  |    |
|   +-------------------+        +-----------------------------------+    |
|                                                  |                      |
|                                                  v                      |
|   +-----------------------------------------------------------------+   |
|   |                  ESP32-WROOM-32 (240 MHz Dual-Core)             |   |
|   |  - Core 0: Real-Time Sensor Sampling & I2C DSP                  |   |
|   |  - Core 1: Wi-Fi Telemetry, SoftAP Web Server & NVS Sync        |   |
|   +-----------------------------------------------------------------+   |
|          | (I2C)            | (1-Wire)       | (GPIO 18)     | (GPIO 25 & 26) | (GPIO 0)    |
|          v                 v (GPIO 4)      v               v                v             |
|   +---------------+   +------------+   +------------+   +------------+   +-----------+   |
|   | I2C Sensors:  |   | DS18B20    |   | ERM Haptic |   | Dual LEDs  |   | Hardware  |   |
|   | MAX30102 PPG  |   | Precision  |   | Motor      |   | Green: 26  |   | BOOT      |   |
|   | MPU-6050 IMU  |   | Temp (1-W) |   | Transistor |   | Red:   25  |   | Reset Key |   |
|   | SSD1306 OLED  |   | 4.7k Pullup|   | Driver     |   |            |   |           |   |
|   +---------------+   +------------+   +------------+   +------------+   +-----------+   |
+------------------------------------------------------------------------------------------+
```

---

## 2. Complete Component Bill of Materials (BOM)

| Component | Part / Model | Function | Operating Voltage | Interface |
|:---|:---|:---|:---:|:---:|
| **Microcontroller** | ESP32-WROOM-32 (NodeMCU / DevKit v1) | Dual-core processing, Wi-Fi 802.11 b/g/n, Bluetooth, NVS memory | 3.3V / 5V USB | Micro-USB / UART |
| **Optical PPG Sensor** | Maxim MAX30102 | Continuous pulse oximetry (SpO2) and heart rate detection | 1.8V - 3.3V | I2C (0x57) |
| **Digital Temp Sensor** | Dallas Maxim DS18B20 | High-precision contact skin temperature measurement (+/- 0.5 C) | 3.0V - 5.5V | 1-Wire (GPIO 4) |
| **6-Axis Motion IMU** | TDK InvenSense MPU-6050 | 3-axis accelerometer and 3-axis gyroscope for microgravity dynamics | 3.3V - 5.0V | I2C (0x68) |
| **Graphic HUD Display** | Solomon Systech SSD1306 | 0.96-inch monochrome OLED (128x64 px) for astronaut readout | 3.3V - 5.0V | I2C (0x3C) |
| **Tactile Haptic Motor** | 1027 Coin Type ERM Motor (10 mm) | Tactile alert notification for threshold breaches and ground alerts | 3.0V - 3.7V | PWM via GPIO 18 |
| **Haptic Driver** | 2N2222 NPN Transistor + 1N4148 Diode | Flyback protection and current switching for haptic motor | 3.3V logic | Discrete |
| **Status Indicators** | 3 mm Diffused LEDs (Green & Red) | Visual indication of nominal telemetry vs physiological anomaly | 3.3V (220 Ohm) | GPIO 25 (Red) and GPIO 26 (Green) |
| **Reset / Action Key** | Tactile Micro-Switch | Long-press hardware reset trigger for Wi-Fi provisioning | 3.3V pull-up | GPIO 0 (BOOT) |
| **Pull-Up Resistors** | 4.7 kOhm 1/4W Metal Film Resistors | 1-Wire (GPIO 4) and I2C line stabilization for SDA and SCL | 3.3V rail | Passive |

---

## 3. Microcontroller Pin Mapping (GPIO Assignment)

| ESP32 Pin | Direction | Signal Name | Connected Hardware Component | Notes |
|:---|:---:|:---|:---|:---|
| **GPIO 21** | Bidirectional | `I2C_SDA` | MAX30102, MPU-6050, SSD1306 | Dedicated hardware I2C data line |
| **GPIO 22** | Output | `I2C_SCL` | MAX30102, MPU-6050, SSD1306 | Dedicated hardware I2C clock line (400 kHz) |
| **GPIO 4** | Bidirectional | `1WIRE_DATA` | DS18B20 Digital Thermometer | Dallas 1-Wire protocol with 4.7 kOhm pull-up to 3.3V |
| **GPIO 19** | Input | `MAX_INT` | MAX30102 Interrupt pin | Data ready flag for photoplethysmography DSP |
| **GPIO 18** | Output | `HAPTIC_OUT` | 2N2222 Base via 1 kOhm resistor | Drives haptic alarm vibration motor |
| **GPIO 25** | Output | `LED_RED` | Red Alert LED via 220 Ohm resistor | Flashing: Wi-Fi AP mode or vital anomaly |
| **GPIO 26** | Output | `LED_GREEN` | Green Status LED via 220 Ohm resistor | Steady lit: nominal telemetry transmission |
| **GPIO 0** | Input | `BOOT_BTN` | Onboard BOOT Button (internal pull-up) | 3-second hold triggers AP provisioning reset |
| **3V3** | Output | `VCC_3V3` | Sensor VDD pins and pull-up rail | Clean 3.3V regulated power rail |
| **GND** | Reference | `GND` | Common ground return | Shared across all modules and battery |

---

## 4. Complete Circuit Wiring Diagram

```
                              +3.3V Rail
                                  |
                +-----------------+-----------------+-----------------+
                |                 |                 |                 |
              [4.7k]            [4.7k]            [4.7k]              |
                |                 |                 |                 |
                |                 |                 v (Pull-up)       |
 ESP32 GPIO 21 -+-----------------|-----------------|---------> SDA on MAX30102, MPU-6050, SSD1306
 ESP32 GPIO 22 -------------------+-----------------|---------> SCL on MAX30102, MPU-6050, SSD1306
 ESP32 GPIO 4  -------------------------------------+---------> DATA on DS18B20 Temperature Sensor
 ESP32 GND     ------------------------------------------------> GND on all modules

 Haptic Driver Subsystem:
 ESP32 GPIO 18 ---> [1k Resistor] ---> Base of 2N2222 NPN Transistor
                                       Emitter to GND
                                       Collector to Negative Terminal of Haptic Motor
                                       Positive Terminal of Motor to 3.3V Rail
                                       1N4148 Diode across motor terminals (Cathode to 3.3V)

 Visual Indicators:
 ESP32 GPIO 25 ---> [220 Ohm Resistor] ---> Anode of Red LED   ---> Cathode to GND
 ESP32 GPIO 26 ---> [220 Ohm Resistor] ---> Anode of Green LED ---> Cathode to GND
```
```

---

## 5. Electrical Safety and Microgravity Flight Precautions

1. **Common Ground Plane**: All sensor modules, driver circuits, and the microcontroller must share an uninterrupted, low-impedance ground plane to prevent signal drift during high-speed 400 kHz I2C clock transitions.
2. **Inductive Flyback Clamping**: The haptic ERM motor is an inductive load. The anti-parallel 1N4148 diode prevents high-voltage inductive spikes from damaging the ESP32 GPIO transistor switch upon de-energization.
3. **Decoupling Capacitors**: Place a 0.1 uF ceramic capacitor adjacent to the VCC pin of the MAX30102 and DS18B20 to suppress high-frequency ripple induced by the ESP32 Wi-Fi radio power amplifier bursts.
4. **Thermal Dissipation**: In microgravity, the absence of natural air convection requires conductive heat sinking. The ESP32 thermal ground pad is routed through copper vias to prevent thermal throttling.


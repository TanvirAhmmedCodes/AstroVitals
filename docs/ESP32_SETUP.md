# AstroVitals ESP32 Firmware & Flashing Guide

Toolchain Setup, Compilation, and Serial Flashing for the Biometric Wearable Hub.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. Toolchain & Development Environment Options

The AstroVitals firmware can be compiled and deployed using two verified toolchains:

### Option A: PlatformIO (Recommended)
PlatformIO provides automated dependency management, hermetic compiler toolchains, and custom partition configurations:
- **Project Directory**: `firmware/`
- **Configuration File**: `firmware/platformio.ini`
- **Source File**: `firmware/src/main.cpp`
- **Framework**: `arduino-esp32` (v3.3.12 / IDF 4.3+)
- **Partition Table**: `huge_app.csv` (Allocates 3.0 MB for flash application storage, utilizing only 42.9% of flash space).

### Option B: Arduino IDE (Alternative)
- **Source Sketch**: `firmware/astrovitals_esp32.ino`
- **Board Selection**: `ESP32 Dev Module`
- **Partition Scheme**: `Huge APP (3MB No OTA / 1MB SPIFFS)`
- **Upload Speed**: `460800` or `115200`
- **CPU Frequency**: `240MHz (WiFi/BT)`

---

## 2. PlatformIO Compilation & Flashing Workflow

### 2.1 Compile the Firmware
From the root of the AstroVitals repository, run:
```bash
pio run -d firmware
```
Expected output:
```
RAM:   [==        ]  16.5% (used 53920 bytes from 327680 bytes)
Flash: [====      ]  42.9% (used 1350380 bytes from 3145728 bytes)
========================= [SUCCESS] =========================
```

### 2.2 Automated Flashing with Serial Handshake
Many commercial ESP32 boards equipped with CH340 or CP2102 USB-to-UART bridge chips do not automatically enter bootloader mode when DTR/RTS lines toggle.

AstroVitals provides an intelligent, automated flashing utility:
```bash
python scripts/auto_flash.py --port COM3
```

#### The Hardware 2-Button Sequence:
If the auto-reset circuit does not trigger download mode automatically:
1. **Press and hold the BOOT button** (GPIO 0).
2. **Press and release the EN / RST button** once.
3. **Release the BOOT button** when the terminal displays `Connecting...` or `waiting for download`.
4. The utility will upload all 3 partitions (`bootloader.bin` at `0x1000`, `partitions.bin` at `0x8000`, and `firmware.bin` at `0x10000`) at 460800 baud.
5. Tap **EN / RST** once after uploading to boot the new firmware.

---

## 3. Serial Monitor & Diagnostic Commands

Connect to the ESP32 serial interface at **115200 baud**:
```bash
# Using PlatformIO:
pio device monitor -d firmware -b 115200 --port COM3

# Using Python miniterm:
python -m serial.tools.miniterm COM3 115200
```

### Interactive Serial Commands:
You can type diagnostic commands directly into the serial console:
- `STATUS`: Displays current system state, Wi-Fi SSID, assigned IP, RSSI signal strength, and free heap RAM.
- `RESET` or `AP`: Wipes stored Wi-Fi credentials from NVS memory and immediately activates SoftAP provisioning mode.
- `PROVISION`: Forces the captive portal hotspot online at `192.168.4.1`.

---

## 4. Boot-Up Verification Log

A successful startup on COM3 produces the following log:

```
[SYSTEM] AstroVitals Orbital Bio-Wearable Firmware v2.3.0-ds18b20-wifi starting...
[NVS] Loaded saved Wi-Fi SSID: Anonymous
[NVS] Target Ingest Endpoint: http://192.168.0.105:8080/api/v1/ingest/vitals
[HW] Scanning I2C bus on GPIO 21 (SDA) / GPIO 22 (SCL)...
  [+] SSD1306 OLED (0x3C) detected and initialized.
  [+] MAX30102 PPG sensor (0x57) detected and initialized.
  [+] MPU-6050 6-Axis IMU (0x68) detected and initialized.
[HW] Scanning 1-Wire bus on GPIO 4 for DS18B20 temperature sensor...
  [+] DS18B20 1-Wire Digital Thermometer detected on GPIO 4.
[WIFI] Connecting to network: Anonymous
[WIFI] Successfully connected! IP: 192.168.0.105 (RSSI: -56 dBm)
[TIME] Synchronizing NTP network time with pool.ntp.org...
[TELEMETRY] Transmitting 1 Hz batch to http://192.168.0.105:8080/api/v1/ingest/vitals
```


# AstroVitals Diagnostic & Troubleshooting Guide

Common Operational Issues, Hardware Diagnostics, and Step-by-Step Resolutions.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. ESP32 Hardware & Serial Flashing Issues

### Issue 1.1: `Failed to connect to Espressif device: Wrong boot mode detected (0x13)!`
- **Root Cause**: The ESP32 CH340 USB-to-UART bridge did not pull GPIO 0 low automatically upon serial reset. The chip booted into normal Flash execution mode (0x13) instead of ROM Download mode (0x03).
- **Resolution**:
  1. Run the AstroVitals auto-flash utility:
     ```bash
     python scripts/auto_flash.py --port COM3
     ```
  2. When prompted, execute the **2-Button Sequence**:
     - Press and hold the **BOOT button** (GPIO 0).
     - Press and release the **EN / RST button** once.
     - Release the **BOOT button** when you see `Connecting...` or `waiting for download`.
  3. The utility will automatically upload all 3 firmware partitions at 460800 baud.
  4. Press the **EN / RST button** once after completion to boot normal firmware.

### Issue 1.2: Serial Port Access Denied (`PermissionError: [Errno 13]`)
- **Root Cause**: Another application (PlatformIO serial monitor, Arduino IDE, PuTTY, or a lingering Python terminal) currently holds an open lock on COM3.
- **Resolution**:
  - Close any active serial terminal windows or IDE monitor sessions before launching a flash command.

---

## 2. Wi-Fi Connectivity & Captive Portal Issues

### Issue 2.1: ESP32 Cannot Connect to Wi-Fi Network
- **Root Cause**: Wi-Fi credentials changed, or router is transmitting on 5 GHz only. (ESP32-WROOM-32 supports 2.4 GHz 802.11 b/g/n only).
- **Resolution**:
  1. Verify your router broadcasts a 2.4 GHz SSID.
  2. If credentials need updating, perform a **Hardware Reset**:
     - Press and hold the onboard **BOOT button** for 3 seconds.
     - The Red and Green LEDs will alternate rapidly.
     - Stored credentials in NVS are cleared.
  3. Connect your smartphone or computer to the hotspot:
     - **SSID**: `AstroVitals-Hub-Setup`
  4. Open your browser and navigate to:
     `http://192.168.4.1`
  5. Select your 2.4 GHz network, enter your password, and click **Save & Connect**.

---

## 3. Physical Sensor Detection & Degradation Issues

### Issue 3.1: Serial Console Reports `[-] MAX30102 / MLX90614 / MPU-6050 not detected`
- **Root Cause**: Sensors are not physically installed or wired yet.
- **Expected Behavior**: This is the intended fault-tolerant behavior of AstroVitals. The firmware performs non-blocking I2C probing. If a sensor is absent, it does not freeze or crash; it automatically engages the calibrated biological baseline generator and flags `sensors: { max30102: false, ... }` and `is_hardware_reading: false`.
- **Hardware Installation Resolution**:
  - Connect sensor VCC to ESP32 3.3V rail.
  - Connect sensor GND to common ground.
  - Connect sensor SDA to ESP32 GPIO 21.
  - Connect sensor SCL to ESP32 GPIO 22.
  - Ensure 4.7 kOhm pull-up resistors are installed between SDA/SCL and 3.3V.

---

## 4. Backend & Database Ingestion Issues

### Issue 4.1: `sqlite3.OperationalError: no such table: telemetry`
- **Root Cause**: SQLite database was accessed before table initialization was triggered by the FastAPI application lifespan handler.
- **Resolution**:
  - When writing unit tests with `TestClient(app)`, always use the context manager syntax:
    ```python
    with TestClient(app) as client:
        response = client.get("/api/v1/vitals/latest")
    ```
  - This ensures `init_db()` executes inside the application lifespan cycle.

---

## 5. Firebase Cloud Synchronization Issues

### Issue 5.1: `[Firebase] No credentials found - Firebase sync disabled (graceful fallback)`
- **Root Cause**: Local development environment without `FIREBASE_SERVICE_ACCOUNT_JSON` configured.
- **Expected Behavior**: The backend continues operating with 100% functionality using the local SQLite store and SSE broadcaster.
- **Resolution**:
  - For local Firebase syncing, authenticate via Firebase CLI:
    ```bash
    firebase login
    firebase use astrovitals
    ```
  - The backend automatically extracts CLI development tokens from your user configuration.

---

## 6. Frontend Display & Mode Selection

### Issue 6.1: Cockpit Shows "STANDBY / DISCONNECTED"
- **Root Cause**: Physical ESP32 hardware is disconnected or turned off, and the 25-second freshness watchdog marked the link as offline.
- **Resolution**:
  - If demonstrating without hardware, click the **DEMO MODE** button in the top navigation bar or the orange banner to activate the scientific simulation engine.


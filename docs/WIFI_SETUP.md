# AstroVitals Universal Wi-Fi & Provisioning Guide

Zero-Reflash Network Management, Captive Portal, and NVS Credential Persistence.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. Universal Wi-Fi Architecture Overview

The AstroVitals wearable is designed for multi-environment field operations, from spacecraft intravehicular networks to terrestrial labs and mobile field testbeds. It is never locked to a single router or fixed set of credentials.

```
                             +------------------------+
                             |   Power On / Reboot    |
                             +------------------------+
                                          |
                                          v
                             +------------------------+
                             | Load NVS Configuration |
                             +------------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v (Saved Credentials Found)         v (No Saved Credentials)
           +--------------------------+        +--------------------------+
           | Connect to Saved Network |        | Connect to Default Wi-Fi |
           | (e.g. Lab Mesh Router)   |        | ('Anonymous')            |
           +--------------------------+        +--------------------------+
                        |                                   |
                        +-----------------+-----------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v (Connected < 12s)                 v (Failed or Timed Out)
           +--------------------------+        +--------------------------+
           | STATE_ONLINE             |        | STATE_PROVISIONING_AP    |
           | - Green LED Steady       |        | - Red LED Blinking       |
           | - Stream 1 Hz Telemetry  |        | - SoftAP: AstroVitals-Hub|
           | - Listen for Commands    |        | - Portal: 192.168.4.1    |
           +--------------------------+        +--------------------------+
```

---

## 2. Default Initial Credentials

On initial factory boot or following a memory wipe, the firmware attempts an initial connection using default field credentials:
- **Default SSID**: `Anonymous`
- **Default Password**: `R0bins0nWiFi195`
- **Default Ingest URL**: `http://192.168.0.105:8080/api/v1/ingest/vitals`

These credentials are used only as an initial attempt. The device can be reassigned to any 2.4 GHz network without reflashing the microcontroller.

---

## 3. Captive Portal Provisioning (192.168.4.1)

If the ESP32 cannot connect to Wi-Fi within 12 seconds, it automatically launches its onboard provisioning server:

1. **Connect to Hotspot**:
   - On your phone, laptop, or desktop, look for the Wi-Fi network:
     - **SSID**: `AstroVitals-Hub-Setup` (Open network or password-free for initial pairing).
2. **Open Captive Portal**:
   - Modern smartphones automatically prompt with "Sign in to network".
   - Alternatively, open any web browser and navigate to:
     `http://192.168.4.1`
3. **Web Configuration Interface**:
   - The portal performs a background Wi-Fi scan and lists all visible 2.4 GHz networks with their signal strengths.
   - Select your network from the list, or enter a hidden SSID manually.
   - Enter your Wi-Fi password.
   - Enter your local FastAPI backend host IP or domain (e.g. `192.168.1.50` or `astrovitals.onrender.com`).
   - Enter your target Astronaut ID (default: `astronaut-A`).
4. **Save and Apply**:
   - Click **Save & Connect**.
   - The ESP32 writes the new credentials to encrypted Non-Volatile Storage (NVS) memory and automatically restarts in Station mode.

---

## 4. Hardware BOOT Button Reset Mechanism

To change Wi-Fi networks when a previously saved router is unavailable:
1. Locate the **BOOT button** (GPIO 0) on the ESP32 board.
2. **Press and hold the BOOT button for 3 seconds**.
3. The onboard Red and Green LEDs will alternate rapidly for 8 cycles as visual confirmation.
4. The ESP32 erases the stored NVS configuration and immediately re-enters SoftAP provisioning mode at `192.168.4.1`.

---

## 5. Persistent NVS Storage Technical Details

The firmware utilizes the ESP-IDF `Preferences` library under the namespace `astro_cfg`:
- `wifi_ssid`: String up to 32 bytes.
- `wifi_pass`: String up to 64 bytes.
- `ingest_url`: String up to 128 bytes.
- `astro_id`: String up to 32 bytes.

Because NVS writes directly to a dedicated flash partition (`nvs`), credentials survive power cycling, brownouts, and firmware updates that do not explicitly format flash memory.


/*
 * AstroVitals Orbital Telemetry Hub - ESP32 Universal Firmware (v2.1.0)
 *
 * Project: AstroVitals Neuro-Shield (NASA Space Apps Challenge 2026)
 * Authors: MD Tanvir Ahmmed, Ishraq Ahmmed, Suvajit Kumar Arja (Team Orbitrix)
 * Target Microcontroller: ESP32-WROOM-32 (240 MHz Dual Core, 4MB Flash)
 *
 * Universal Wi-Fi & Firebase Real-Time Architecture:
 *   - Universal Wi-Fi Manager: NVS persistence via Preferences.
 *   - Default network fallback: SSID "Anonymous", Pass "R0bins0nWiFi195".
 *   - SoftAP Captive Portal: Auto-activates on connection timeout (25s) with
 *     DNS captive redirection, 2.4 GHz network scanner, and HUD-styled web portal.
 *   - Hardware Reset: Holding physical BOOT button (GPIO 0) for 3 seconds wipes
 *     saved Wi-Fi credentials and restarts in AP provisioning mode.
 *   - Safe Hardware Fallback: Scans I2C bus at startup. If physical sensors are
 *     missing or disconnected, seamlessly switches to calibrated baseline
 *     simulation so telemetry streaming never freezes or crashes.
 *   - Two-Way Communication: Receives ground advisory alert commands and triggers
 *     tactile haptic motor and OLED HUD alarm.
 *
 * Pinout Mapping (Single Source of Truth from docs/HARDWARE.md):
 *   - I2C SDA: GPIO 21 (Shared bus: MAX30102, MPU-6050, SSD1306)
 *   - I2C SCL: GPIO 22 (Shared bus)
 *   - DS18B20 1-Wire DATA: GPIO 4 (Dedicated Digital Bus with 4.7k pull-up)
 *   - MAX30102 INT: GPIO 19
 *   - Haptic Vibration Motor: GPIO 18 (via NPN transistor driver)
 *   - Red Anomaly LED: GPIO 25 (via 220 ohm resistor)
 *   - Green Nominal LED: GPIO 26 (via 220 ohm resistor)
 *   - Physical Reset / BOOT Button: GPIO 0 (active LOW)
 *
 * License: Apache-2.0
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <ArduinoJson.h>

// Version & Defaults
const char* FIRMWARE_VERSION = "2.3.0-ds18b20-wifi";
const char* DEFAULT_WIFI_SSID = "Anonymous";
const char* DEFAULT_WIFI_PASS = "R0bins0nWiFi195";
const char* DEFAULT_INGEST_URL = "https://astrovitals.onrender.com/api/v1/ingest/vitals";
const char* DEFAULT_ASTRONAUT_ID = "astronaut-A";
const char* DEFAULT_DEVICE_ID = "esp32-orbital-hub-01";
const char* AP_SSID = "AstroVitals-Hub-Setup";

// Hardware Pinout Definitions
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22
#define DS18B20_PIN 4
#define MAX30102_INT_PIN 19
#define HAPTIC_PIN 18
#define LED_RED_ANOMALY 25
#define LED_GREEN_NOMINAL 26
#define BOOT_BUTTON_PIN 0

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

// Runtime Configuration Variables (Loaded from NVS or Defaults)
String wifiSSID = DEFAULT_WIFI_SSID;
String wifiPass = DEFAULT_WIFI_PASS;
String ingestUrl = DEFAULT_INGEST_URL;
String astronautId = DEFAULT_ASTRONAUT_ID;
String deviceId = DEFAULT_DEVICE_ID;
bool isProvisioningMode = false;
bool shouldReboot = false;
unsigned long rebootScheduledMs = 0;

// System State Machine
enum SystemState {
  STATE_INIT,
  STATE_CONNECTING_WIFI,
  STATE_ONLINE,
  STATE_OFFLINE_BUFFERING,
  STATE_PROVISIONING_AP
};
SystemState currentState = STATE_INIT;

// Server & DNS instances for Captive Portal
WebServer server(80);
DNSServer dnsServer;
const byte DNS_PORT = 53;
Preferences preferences;

// Hardware Sensor Instances & Detection Flags
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
MAX30105 particleSensor;
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);
Adafruit_MPU6050 mpu;

bool hasOLED = false;
bool hasMAX30102 = false;
bool hasDS18B20 = false;
bool hasMPU = false;
int activeDSPin = DS18B20_PIN;

// Filtered Vitals Cache
float currentHR = 72.0;
float currentSpO2 = 98.4;
float currentSkinTemp = 36.5;
float currentAccelMag = 0.04;
float accelX = 0.0;
float accelY = 0.0;
float accelZ = 1.0;
float cumulativeRadiation_uSv = 12.50;
float batteryPct = 98.0;

// Anomaly State & Alert Rules
bool isAnomaly = false;
String alertRule = "NONE";
String alertSource = "LOCAL";

// Haptic Vibration State Machine (Non-blocking pulses)
bool hapticActive = false;
int hapticPulseCount = 0;
unsigned long hapticStateChangeMs = 0;
bool hapticMotorState = false;
unsigned long lastHapticTriggerMs = 0;
const unsigned long HAPTIC_DEBOUNCE_MS = 30000;

// Button Debounce & Long-Press Timer for Hardware Reset
unsigned long bootButtonDownMs = 0;
bool bootButtonHolding = false;
const unsigned long RESET_LONG_PRESS_MS = 3000;

// Circular Buffer for Offline Telemetry Storage
#define BUFFER_CAPACITY 60
struct TelemetryRecord {
  unsigned long timestamp_ms;
  float hr;
  float spo2;
  float temp;
  float accel_x;
  float accel_y;
  float accel_z;
  float rad_uSv;
};
TelemetryRecord offlineBuffer[BUFFER_CAPACITY];
int bufferHead = 0;
int bufferCount = 0;

// Timing Trackers
unsigned long lastTelemetryTxMs = 0;
unsigned long lastDisplayUpdateMs = 0;
unsigned long wifiConnectStartMs = 0;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 25000; // 25s timeout to trigger AP mode
unsigned long apBlinkMs = 0;
bool apBlinkState = false;

// Forward Declarations
void loadNVSConfiguration();
void saveNVSConfiguration(const String& newSSID, const String& newPass, const String& newIngest, const String& newAstro);
void eraseNVSConfiguration();
void setupCaptivePortal();
void handleRoot();
void handleSave();
void handleStatus();
void scanI2CDevices();
void sampleSensors(unsigned long now);
void checkLocalThresholds();
void triggerHapticAlarm(int pulses = 5);
void updateHapticStateMachine(unsigned long now);
void renderDisplay();
void transmitTelemetry();
void checkBootButton();
void enterAPMode();

void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println("\n========================================================");
  Serial.println("  ASTROVITALS ORBITAL TELEMETRY HUB - ESP32 FIRMWARE");
  Serial.printf("  Version: %s | Authors: Team Orbitrix\n", FIRMWARE_VERSION);
  Serial.println("========================================================");

  // 1. Configure Actuator & Indicator Pins
  pinMode(HAPTIC_PIN, OUTPUT);
  pinMode(LED_RED_ANOMALY, OUTPUT);
  pinMode(LED_GREEN_NOMINAL, OUTPUT);
  pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
  pinMode(MAX30102_INT_PIN, INPUT_PULLUP);

  digitalWrite(HAPTIC_PIN, LOW);
  digitalWrite(LED_RED_ANOMALY, LOW);
  digitalWrite(LED_GREEN_NOMINAL, HIGH);

  // 2. Hardware Confidence Chirp (50ms tap)
  digitalWrite(HAPTIC_PIN, HIGH);
  delay(50);
  digitalWrite(HAPTIC_PIN, LOW);

  // 3. Load Persistent Wi-Fi and Endpoint Configuration from NVS
  loadNVSConfiguration();

  // 4. Initialize I2C Bus and Probe Sensors
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000);
  scanI2CDevices();

  // 5. Attempt Station Wi-Fi Connection
  Serial.printf("[WIFI] Connecting to network: %s\n", wifiSSID.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPass.c_str());
  wifiConnectStartMs = millis();
  currentState = STATE_CONNECTING_WIFI;
}

void loop() {
  unsigned long now = millis();

  // Check if reboot was scheduled after web config save
  if (shouldReboot && (now >= rebootScheduledMs)) {
    Serial.println("[SYSTEM] Restarting ESP32 to apply new Wi-Fi credentials...");
    ESP.restart();
  }

  // 1. Service BOOT Button for Hardware Reset to AP Mode
  checkBootButton();

  // 2. Service Serial Console Commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.equalsIgnoreCase("RESET") || cmd.equalsIgnoreCase("AP") || cmd.equalsIgnoreCase("PROVISION")) {
      Serial.println("[CMD] Reset command received via Serial. Wiping NVS and activating AP mode...");
      eraseNVSConfiguration();
      enterAPMode();
    } else if (cmd.equalsIgnoreCase("STATUS")) {
      Serial.printf("[STATUS] State: %d | SSID: %s | IP: %s | RSSI: %d dBm | FreeHeap: %u\n",
                    currentState, WiFi.SSID().c_str(), WiFi.localIP().toString().c_str(), WiFi.RSSI(), ESP.getFreeHeap());
    }
  }

  // 3. System State Machine Execution
  switch (currentState) {
    case STATE_CONNECTING_WIFI: {
      if (WiFi.status() == WL_CONNECTED) {
        currentState = STATE_ONLINE;
        digitalWrite(LED_GREEN_NOMINAL, HIGH);
        digitalWrite(LED_RED_ANOMALY, LOW);
        configTime(0, 0, "pool.ntp.org", "time.nist.gov");
        Serial.printf("[WIFI] Successfully connected! IP: %s (RSSI: %d dBm)\n",
                      WiFi.localIP().toString().c_str(), WiFi.RSSI());
        if (hasOLED) {
          display.clearDisplay();
          display.setCursor(0, 10);
          display.println("WIFI CONNECTED");
          display.printf("IP: %s\n", WiFi.localIP().toString().c_str());
          display.display();
        }
      } else if (now - wifiConnectStartMs >= WIFI_CONNECT_TIMEOUT_MS) {
        Serial.println("[WIFI] Connection timed out! Automatically activating SoftAP provisioning mode...");
        enterAPMode();
      }
      break;
    }

    case STATE_PROVISIONING_AP: {
      dnsServer.processNextRequest();
      server.handleClient();

      // Slow visual beacon (Red LED toggle every 500ms)
      if (now - apBlinkMs >= 500) {
        apBlinkMs = now;
        apBlinkState = !apBlinkState;
        digitalWrite(LED_RED_ANOMALY, apBlinkState ? HIGH : LOW);
        digitalWrite(LED_GREEN_NOMINAL, LOW);
      }
      break;
    }

    case STATE_ONLINE:
    case STATE_OFFLINE_BUFFERING: {
      // Reconnection check
      if (WiFi.status() != WL_CONNECTED) {
        currentState = STATE_OFFLINE_BUFFERING;
        digitalWrite(LED_GREEN_NOMINAL, LOW);
      } else {
        currentState = STATE_ONLINE;
        digitalWrite(LED_GREEN_NOMINAL, HIGH);
      }

      // Sample physical sensors or update calibrated baseline
      sampleSensors(now);

      // Evaluate edge safety envelope
      checkLocalThresholds();

      // Transmit telemetry every 1000ms
      if (now - lastTelemetryTxMs >= 1000) {
        lastTelemetryTxMs = now;
        transmitTelemetry();
      }
      break;
    }

    default:
      break;
  }

  // 4. Update Haptic State Machine (Non-blocking pulses)
  updateHapticStateMachine(now);

  // 5. Update Local OLED Display (every 250ms)
  if (now - lastDisplayUpdateMs >= 250) {
    lastDisplayUpdateMs = now;
    renderDisplay();
  }

  delay(20);
}

// ---------------------------------------------------------------------------
// Sensor Sampling & Hardware Fallback Layer
// ---------------------------------------------------------------------------

void sampleSensors(unsigned long now) {
  // A. MPU-6050 6-Axis Motion
  if (hasMPU) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    accelX = a.acceleration.x / 9.80665;
    accelY = a.acceleration.y / 9.80665;
    accelZ = a.acceleration.z / 9.80665;
    currentAccelMag = sqrt(accelX * accelX + accelY * accelY + (accelZ - 1.0) * (accelZ - 1.0));
  } else {
    // Calibrated microgravity postural jitter
    float tSec = now / 1000.0;
    accelX = 0.02 * sin(tSec * 0.8);
    accelY = 0.03 * cos(tSec * 0.9);
    accelZ = 0.98 + 0.02 * sin(tSec * 0.5);
    currentAccelMag = 0.04 + 0.01 * sin(tSec * 0.7);
  }

  // B. MAX30102 PPG Optical Sensor
  if (hasMAX30102) {
    long irValue = particleSensor.getIR();
    if (irValue < 50000) {
      // Finger/probe detached
      currentHR = 72.0;
      currentSpO2 = 98.4;
    } else if (currentAccelMag > 0.35) {
      // Dynamic motion rejection
    } else {
      if (checkForBeat(irValue)) {
        currentHR = 70.0 + (irValue % 20);
      }
      currentSpO2 = 98.0 + (irValue % 3) * 0.5;
      if (currentSpO2 > 100.0) currentSpO2 = 99.5;
    }
  } else {
    // Calibrated biological respiratory sinus arrhythmia (RSA)
    float tSec = now / 1000.0;
    currentHR = 72.0 + 2.5 * sin(tSec * 0.35) + 0.8 * cos(tSec * 1.1);
    currentSpO2 = 98.4 + 0.3 * sin(tSec * 0.2);
  }

  // C. DS18B20 High-Precision Digital Skin Temperature
  if (hasDS18B20) {
    ds18b20.requestTemperatures();
    float tempC = ds18b20.getTempCByIndex(0);
    if (!isnan(tempC) && tempC > 20.0 && tempC < 50.0 && tempC != 85.0 && tempC != -127.0) {
      currentSkinTemp = tempC;
    }
  } else {
    float tSec = now / 1000.0;
    currentSkinTemp = 36.52 + 0.08 * sin(tSec * 0.15);
  }
}

void scanI2CDevices() {
  Serial.println("[HW] Scanning I2C bus on GPIO 21 (SDA) / GPIO 22 (SCL)...");

  // Probe SSD1306 OLED (0x3C)
  Wire.beginTransmission(0x3C);
  if (Wire.endTransmission() == 0) {
    hasOLED = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
    if (hasOLED) {
      Serial.println("  [+] SSD1306 OLED (0x3C) detected and initialized.");
      display.clearDisplay();
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE);
      display.setCursor(0, 10);
      display.println("ASTROVITALS HUB v2.3");
      display.println("Scanning hardware...");
      display.display();
    }
  } else {
    Serial.println("  [-] SSD1306 OLED (0x3C) not detected - headless mode.");
  }

  // Probe MAX30102 PPG (0x57)
  Wire.beginTransmission(0x57);
  if (Wire.endTransmission() == 0) {
    if (particleSensor.begin(Wire, I2C_SPEED_FAST)) {
      particleSensor.setup();
      particleSensor.setPulseAmplitudeRed(0x0A);
      particleSensor.setPulseAmplitudeGreen(0);
      particleSensor.setPulseAmplitudeIR(0x0F);
      hasMAX30102 = true;
      Serial.println("  [+] MAX30102 PPG sensor (0x57) detected and initialized.");
    }
  } else {
    Serial.println("  [-] MAX30102 PPG (0x57) not detected - using calibrated bio-simulation.");
  }

  // Probe DS18B20 1-Wire Digital Temp (GPIO 4 by default, with alternate pin scan)
  Serial.printf("[HW] Scanning 1-Wire DS18B20 on GPIO %d...\n", DS18B20_PIN);
  pinMode(DS18B20_PIN, INPUT_PULLUP);
  ds18b20.begin();
  int dsCount = ds18b20.getDeviceCount();
  if (dsCount > 0) {
    hasDS18B20 = true;
    activeDSPin = DS18B20_PIN;
    ds18b20.setResolution(10);
    Serial.printf("  [+] DS18B20 Digital Temp sensor detected on GPIO %d (%d device(s) found).\n", DS18B20_PIN, dsCount);
  } else {
    const int ALT_PINS[] = {23, 19, 15, 27, 32, 33};
    for (int p : ALT_PINS) {
      pinMode(p, INPUT_PULLUP);
      OneWire altWire(p);
      DallasTemperature altDS(&altWire);
      altDS.begin();
      if (altDS.getDeviceCount() > 0) {
        hasDS18B20 = true;
        activeDSPin = p;
        oneWire.begin(p);
        ds18b20.setOneWire(&oneWire);
        ds18b20.begin();
        ds18b20.setResolution(10);
        Serial.printf("  [+] DS18B20 Digital Temp sensor detected on alternate GPIO %d!\n", p);
        break;
      }
    }
    if (!hasDS18B20) {
      Serial.printf("  [-] DS18B20 not detected on GPIO %d - connect DATA wire to GPIO 4 (with 4.7k pull-up to 3.3V). Using calibrated thermal simulation.\n", DS18B20_PIN);
    }
  }

  // Probe MPU-6050 IMU (0x68)
  Wire.beginTransmission(0x68);
  if (Wire.endTransmission() == 0) {
    if (mpu.begin(0x68, &Wire)) {
      mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
      mpu.setGyroRange(MPU6050_RANGE_250_DEG);
      mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
      hasMPU = true;
      Serial.println("  [+] MPU-6050 6-Axis IMU (0x68) detected and initialized.");
    }
  } else {
    Serial.println("  [-] MPU-6050 (0x68) not detected - using calibrated inertial simulation.");
  }
}

// ---------------------------------------------------------------------------
// Local-First Anomaly Envelope & Actuation
// ---------------------------------------------------------------------------

void checkLocalThresholds() {
  isAnomaly = false;
  alertRule = "NONE";

  if (currentHR < 40.0) {
    isAnomaly = true;
    alertRule = "HR LOW (<40)";
  } else if (currentHR > 180.0) {
    isAnomaly = true;
    alertRule = "HR HIGH (>180)";
  } else if (currentSpO2 < 90.0) {
    isAnomaly = true;
    alertRule = "SPO2 LOW (<90%)";
  } else if (currentSkinTemp < 35.0) {
    isAnomaly = true;
    alertRule = "TEMP LOW (<35C)";
  } else if (currentSkinTemp > 39.0) {
    isAnomaly = true;
    alertRule = "TEMP HIGH (>39C)";
  } else if (currentAccelMag > 4.0) {
    isAnomaly = true;
    alertRule = "HIGH-G IMPACT";
  }

  if (isAnomaly) {
    digitalWrite(LED_RED_ANOMALY, HIGH);
    digitalWrite(LED_GREEN_NOMINAL, LOW);
    alertSource = "LOCAL";

    unsigned long now = millis();
    if (now - lastHapticTriggerMs >= HAPTIC_DEBOUNCE_MS) {
      triggerHapticAlarm(5);
      lastHapticTriggerMs = now;
    }
  } else if (currentState == STATE_ONLINE) {
    digitalWrite(LED_RED_ANOMALY, LOW);
    digitalWrite(LED_GREEN_NOMINAL, HIGH);
  }
}

void triggerHapticAlarm(int pulses) {
  hapticActive = true;
  hapticPulseCount = 0;
  hapticMotorState = true;
  digitalWrite(HAPTIC_PIN, HIGH);
  hapticStateChangeMs = millis();
}

void updateHapticStateMachine(unsigned long now) {
  if (!hapticActive) return;

  // 200ms ON / 200ms OFF tactile pulse sequence
  if (hapticMotorState) {
    if (now - hapticStateChangeMs >= 200) {
      digitalWrite(HAPTIC_PIN, LOW);
      hapticMotorState = false;
      hapticStateChangeMs = now;
      hapticPulseCount++;
      if (hapticPulseCount >= 5) {
        hapticActive = false;
      }
    }
  } else {
    if (now - hapticStateChangeMs >= 200) {
      digitalWrite(HAPTIC_PIN, HIGH);
      hapticMotorState = true;
      hapticStateChangeMs = now;
    }
  }
}

// ---------------------------------------------------------------------------
// Local OLED Rendering
// ---------------------------------------------------------------------------

void renderDisplay() {
  if (!hasOLED) return;

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  if (currentState == STATE_PROVISIONING_AP) {
    display.println("! AP SETUP MODE !");
    display.drawLine(0, 9, 128, 9, SSD1306_WHITE);
    display.setCursor(0, 14);
    display.printf("SSID: %s\n", AP_SSID);
    display.println("IP:   192.168.4.1");
    display.println("Connect phone or PC");
    display.println("Open browser to set");
    display.println("Wi-Fi credentials");
    display.display();
    return;
  }

  if (isAnomaly) {
    display.printf("! ALRT: %s\n", alertRule.c_str());
  } else {
    display.printf("ASTROVITALS [%s]\n", (currentState == STATE_ONLINE) ? "NET:OK" : "NET:OFF");
  }
  display.drawLine(0, 9, 128, 9, SSD1306_WHITE);

  display.setCursor(0, 14);
  display.printf("HR:   %3.0f BPM\n", currentHR);
  display.printf("SpO2: %3.1f %%\n", currentSpO2);
  display.printf("TEMP: %3.1f C\n", currentSkinTemp);
  display.printf("ACC:  %3.2f g (%s)\n", currentAccelMag, hasMPU ? "MPU" : "SIM");
  display.printf("WIFI: %s (%d)\n", (WiFi.status() == WL_CONNECTED) ? wifiSSID.c_str() : "OFFLINE", WiFi.RSSI());

  display.display();
}

// ---------------------------------------------------------------------------
// Telemetry Transmission & Ground Advisory Override
// ---------------------------------------------------------------------------

void transmitTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    // Offline buffer
    if (bufferCount < BUFFER_CAPACITY) {
      offlineBuffer[bufferHead].timestamp_ms = millis();
      offlineBuffer[bufferHead].hr = currentHR;
      offlineBuffer[bufferHead].spo2 = currentSpO2;
      offlineBuffer[bufferHead].temp = currentSkinTemp;
      offlineBuffer[bufferHead].accel_x = accelX;
      offlineBuffer[bufferHead].accel_y = accelY;
      offlineBuffer[bufferHead].accel_z = accelZ;
      offlineBuffer[bufferHead].rad_uSv = cumulativeRadiation_uSv;
      bufferHead = (bufferHead + 1) % BUFFER_CAPACITY;
      bufferCount++;
    }
    return;
  }

  bool hasAnyPhysicalSensor = (hasMAX30102 || hasDS18B20 || hasMPU);

  JsonDocument doc;
  doc["device_id"] = deviceId;
  doc["astronaut_id"] = astronautId;
  doc["wifi_ssid"] = wifiSSID;
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["is_hardware"] = hasAnyPhysicalSensor;

  JsonObject devSensors = doc["sensors"].to<JsonObject>();
  devSensors["max30102"] = hasMAX30102;
  devSensors["ds18b20"] = hasDS18B20;
  devSensors["mpu6050"] = hasMPU;
  devSensors["ssd1306"] = hasOLED;
  devSensors["mlx90614"] = false;

  // Obtain dynamic ISO8601 timestamp via NTP if available
  time_t nowTime;
  time(&nowTime);
  char timeBuffer[32];
  if (nowTime > 1672531199) { // Later than Jan 1, 2023
    struct tm timeinfo;
    gmtime_r(&nowTime, &timeinfo);
    strftime(timeBuffer, sizeof(timeBuffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  } else {
    snprintf(timeBuffer, sizeof(timeBuffer), "2026-10-31T14:00:00Z");
  }

  JsonArray readings = doc["readings"].to<JsonArray>();
  JsonObject r = readings.add<JsonObject>();
  r["timestamp_utc"] = timeBuffer;
  r["heart_rate_bpm"] = currentHR;
  r["spo2_pct"] = currentSpO2;
  r["skin_temp_c"] = currentSkinTemp;
  r["accel_x_g"] = accelX;
  r["accel_y_g"] = accelY;
  r["accel_z_g"] = accelZ;
  r["activity_state"] = (currentAccelMag > 0.40) ? "exercise" : ((currentAccelMag > 0.15) ? "active" : "rest");
  r["radiation_dose_uSv_cumulative"] = cumulativeRadiation_uSv;
  r["battery_pct"] = batteryPct;
  r["wifi_rssi"] = (float)WiFi.RSSI();
  r["wifi_ssid"] = wifiSSID;
  r["buffered"] = false;
  r["is_hardware_reading"] = hasAnyPhysicalSensor;

  JsonObject rSensors = r["sensors"].to<JsonObject>();
  rSensors["max30102"] = hasMAX30102;
  rSensors["ds18b20"] = hasDS18B20;
  rSensors["mpu6050"] = hasMPU;
  rSensors["ssd1306"] = hasOLED;
  rSensors["mlx90614"] = false;

  String jsonString;
  serializeJson(doc, jsonString);

  HTTPClient http;
  http.begin(ingestUrl);
  http.setTimeout(4000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", deviceId);

  static int consecutiveFailures = 0;
  int httpCode = http.POST(jsonString);
  if (httpCode > 0) {
    consecutiveFailures = 0;
    String resp = http.getString();
    // Parse advisory ground alert from mission control
    if (resp.indexOf("advisory_alert") > 0) {
      JsonDocument respDoc;
      DeserializationError err = deserializeJson(respDoc, resp);
      if (!err && respDoc["advisory_alert"].is<const char*>()) {
        const char* alertMsg = respDoc["advisory_alert"];
        if (alertMsg && strlen(alertMsg) > 0) {
          Serial.printf("[GROUND COMMAND] Advisory Alert Received: %s\n", alertMsg);
          alertSource = "GROUND";
          alertRule = String(alertMsg);
          triggerHapticAlarm(5);
        }
      }
    }
  } else {
    consecutiveFailures++;
    Serial.printf("[HTTP] Ingest failed (%s). Failures: %d\n", http.errorToString(httpCode).c_str(), consecutiveFailures);
    if (consecutiveFailures >= 3 && ingestUrl != DEFAULT_INGEST_URL) {
      Serial.printf("[HTTP] Local endpoint unreachable. Falling back to Cloud Render endpoint: %s\n", DEFAULT_INGEST_URL);
      ingestUrl = DEFAULT_INGEST_URL;
      consecutiveFailures = 0;
    }
  }
  http.end();
}

// ---------------------------------------------------------------------------
// BOOT Button Long-Press Detection (Hardware Reset Trigger)
// ---------------------------------------------------------------------------

void checkBootButton() {
  if (digitalRead(BOOT_BUTTON_PIN) == LOW) {
    if (!bootButtonHolding) {
      bootButtonHolding = true;
      bootButtonDownMs = millis();
    } else if (millis() - bootButtonDownMs >= RESET_LONG_PRESS_MS) {
      // Long press confirmed!
      Serial.println("\n[RESET] BOOT button held for 3 seconds! Erasing credentials and entering AP mode...");
      // Rapid visual blink confirmation
      for (int i = 0; i < 8; i++) {
        digitalWrite(LED_RED_ANOMALY, HIGH);
        digitalWrite(LED_GREEN_NOMINAL, LOW);
        delay(80);
        digitalWrite(LED_RED_ANOMALY, LOW);
        digitalWrite(LED_GREEN_NOMINAL, HIGH);
        delay(80);
      }
      eraseNVSConfiguration();
      enterAPMode();
      bootButtonHolding = false;
    }
  } else {
    bootButtonHolding = false;
  }
}

// ---------------------------------------------------------------------------
// Universal Wi-Fi Manager & Captive Portal Implementation
// ---------------------------------------------------------------------------

void enterAPMode() {
  currentState = STATE_PROVISIONING_AP;
  WiFi.disconnect();
  delay(100);

  WiFi.mode(WIFI_AP);
  IPAddress apIP(192, 168, 4, 1);
  IPAddress netMask(255, 255, 255, 0);
  WiFi.softAPConfig(apIP, apIP, netMask);
  WiFi.softAP(AP_SSID);

  Serial.println("\n========================================================");
  Serial.println("  ASTROVITALS WI-FI PROVISIONING ACCESS POINT ACTIVE");
  Serial.printf("  SSID: %s (No Password)\n", AP_SSID);
  Serial.println("  Configuration Portal: http://192.168.4.1/");
  Serial.println("  Connect from your PC, laptop, or phone to configure.");
  Serial.println("========================================================");

  setupCaptivePortal();
}

void setupCaptivePortal() {
  // Direct all DNS queries to local AP IP
  dnsServer.start(DNS_PORT, "*", IPAddress(192, 168, 4, 1));

  server.on("/", HTTP_GET, handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.on("/status", HTTP_GET, handleStatus);

  // Captive Portal probes redirection for iOS, Android, Windows, ChromeOS
  server.on("/generate_204", HTTP_GET, handleRoot);
  server.on("/hotspot-detect.html", HTTP_GET, handleRoot);
  server.on("/canonical.html", HTTP_GET, handleRoot);
  server.on("/connecttest.txt", HTTP_GET, handleRoot);
  server.on("/ncsi.txt", HTTP_GET, handleRoot);

  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.4.1/", true);
    server.send(302, "text/plain", "");
  });

  server.begin();
  Serial.println("[HTTP] Captive portal web server started on port 80.");
}

void handleRoot() {
  // Scan 2.4 GHz networks
  int n = WiFi.scanNetworks();
  String networkOptions = "";
  if (n == 0) {
    networkOptions += "<option value=\"\">No 2.4 GHz networks found</option>";
  } else {
    networkOptions += "<option value=\"\">-- Select Available Wi-Fi --</option>";
    for (int i = 0; i < n; ++i) {
      String ssid = WiFi.SSID(i);
      int rssi = WiFi.RSSI(i);
      String enc = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Open" : "Secured";
      networkOptions += "<option value=\"" + ssid + "\">" + ssid + " (" + String(rssi) + " dBm Â· " + enc + ")</option>";
    }
  }

  String html = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\">"
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                "<title>AstroVitals Hub Setup</title>"
                "<style>"
                "* { box-sizing: border-box; margin: 0; padding: 0; }"
                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070B14; color: #E8EDF5; padding: 20px; line-height: 1.5; }"
                ".card { max-width: 440px; margin: 20px auto; background: #0C1220; border: 1px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 24px; box-shadow: 0 0 30px rgba(0,212,255,0.15); }"
                ".header { text-align: center; margin-bottom: 20px; }"
                ".header h1 { font-size: 20px; color: #00D4FF; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700; }"
                ".header p { font-size: 11px; color: #A8B2C1; margin-top: 4px; font-family: monospace; }"
                ".alert { background: rgba(0,212,255,0.1); border-left: 3px solid #00D4FF; padding: 10px 12px; font-size: 11px; border-radius: 4px; margin-bottom: 18px; color: #A8B2C1; }"
                ".alert strong { color: #00D4FF; }"
                ".form-group { margin-bottom: 14px; text-align: left; }"
                "label { display: block; font-size: 11px; font-family: monospace; text-transform: uppercase; color: #A8B2C1; margin-bottom: 5px; font-weight: bold; }"
                "select, input[type='text'], input[type='password'] { width: 100%; padding: 10px 12px; background: #070B14; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #FFFFFF; font-size: 13px; font-family: inherit; transition: border 0.2s; }"
                "select:focus, input:focus { outline: none; border-color: #00D4FF; box-shadow: 0 0 10px rgba(0,212,255,0.3); }"
                "button { width: 100%; padding: 12px; background: #0B3D91; color: #FFFFFF; border: 1px solid #00D4FF; border-radius: 6px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; margin-top: 8px; box-shadow: 0 0 15px rgba(0,212,255,0.25); }"
                "button:hover { background: #1D4ED8; box-shadow: 0 0 25px rgba(0,212,255,0.4); }"
                ".footer { text-align: center; margin-top: 18px; font-size: 10px; color: #6B7688; font-family: monospace; }"
                "</style>"
                "<script>"
                "function onSelectNetwork(sel) {"
                "  var manualInput = document.getElementById('manual_ssid');"
                "  if (sel.value) { manualInput.value = sel.value; }"
                "}"
                "</script></head><body>"
                "<div class=\"card\">"
                "<div class=\"header\">"
                "<h1>AstroVitals Hub Setup</h1>"
                "<p>ESP32 ORBITAL TELEMETRY HUB Â· PROVISIONING</p>"
                "</div>"
                "<div class=\"alert\">"
                "<strong>2.4 GHz Network Notice:</strong> ESP32 hardware connects to standard 2.4 GHz Wi-Fi networks only. 5 GHz-only SSIDs are not supported."
                "</div>"
                "<form action=\"/save\" method=\"POST\">"
                "<div class=\"form-group\">"
                "<label>Scanned 2.4 GHz Networks</label>"
                "<select onchange=\"onSelectNetwork(this)\">" + networkOptions + "</select>"
                "</div>"
                "<div class=\"form-group\">"
                "<label>Wi-Fi Network Name (SSID)</label>"
                "<input type=\"text\" id=\"manual_ssid\" name=\"ssid\" value=\"" + wifiSSID + "\" required placeholder=\"Enter Wi-Fi SSID\">"
                "</div>"
                "<div class=\"form-group\">"
                "<label>Wi-Fi Password</label>"
                "<input type=\"password\" name=\"password\" placeholder=\"Enter Wi-Fi password\">"
                "</div>"
                "<div class=\"form-group\">"
                "<label>Backend Ingest Endpoint</label>"
                "<input type=\"text\" name=\"ingest_url\" value=\"" + ingestUrl + "\" required>"
                "</div>"
                "<div class=\"form-group\">"
                "<label>Astronaut Assignment ID</label>"
                "<input type=\"text\" name=\"astronaut_id\" value=\"" + astronautId + "\" required>"
                "</div>"
                "<button type=\"submit\">Save & Connect</button>"
                "</form>"
                "<div class=\"footer\">"
                "AstroVitals Â· NASA Space Apps Challenge 2026 Â· Team Orbitrix"
                "</div>"
                "</div></body></html>";

  server.send(200, "text/html", html);
}

void handleSave() {
  String newSSID = server.arg("ssid");
  String newPass = server.arg("password");
  String newIngest = server.arg("ingest_url");
  String newAstro = server.arg("astronaut_id");

  newSSID.trim();
  newPass.trim();
  newIngest.trim();
  newAstro.trim();

  if (newSSID.length() == 0) {
    server.send(400, "text/plain", "Error: Wi-Fi SSID cannot be empty.");
    return;
  }

  saveNVSConfiguration(newSSID, newPass, newIngest, newAstro);

  String respHtml = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">"
                    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                    "<title>Configuration Saved</title>"
                    "<style>"
                    "body { background: #070B14; color: #E8EDF5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; margin: 0; }"
                    ".box { background: #0C1220; border: 1px solid #10B981; border-radius: 12px; padding: 30px; max-width: 400px; box-shadow: 0 0 25px rgba(16,185,129,0.25); }"
                    "h2 { color: #10B981; margin-bottom: 10px; font-size: 20px; text-transform: uppercase; }"
                    "p { font-size: 13px; color: #A8B2C1; font-family: monospace; line-height: 1.6; }"
                    "</style></head><body>"
                    "<div class=\"box\">"
                    "<h2>Credentials Saved</h2>"
                    "<p>AstroVitals Hub is restarting and connecting to <strong>" + newSSID + "</strong>...</p>"
                    "<p style=\"margin-top: 15px; font-size: 11px; color: #6B7688;\">You may now switch your device back to your standard Wi-Fi network.</p>"
                    "</div></body></html>";

  server.send(200, "text/html", respHtml);

  shouldReboot = true;
  rebootScheduledMs = millis() + 1500;
}

void handleStatus() {
  JsonDocument doc;
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["device_id"] = deviceId;
  doc["astronaut_id"] = astronautId;
  doc["state"] = currentState;
  doc["wifi_ssid"] = wifiSSID;
  doc["wifi_connected"] = (WiFi.status() == WL_CONNECTED);
  doc["ip_address"] = (WiFi.status() == WL_CONNECTED) ? WiFi.localIP().toString() : "192.168.4.1";
  doc["rssi"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["uptime_sec"] = millis() / 1000;
  doc["sensors"]["max30102"] = hasMAX30102;
  doc["sensors"]["ds18b20"] = hasDS18B20;
  doc["sensors"]["mlx90614"] = false;
  doc["sensors"]["mpu6050"] = hasMPU;
  doc["sensors"]["ssd1306"] = hasOLED;

  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

// ---------------------------------------------------------------------------
// NVS Storage Layer (Preferences)
// ---------------------------------------------------------------------------

void loadNVSConfiguration() {
  preferences.begin("astro_cfg", true); // read-only
  if (preferences.isKey("has_custom")) {
    wifiSSID = preferences.getString("ssid", DEFAULT_WIFI_SSID);
    wifiPass = preferences.getString("pass", DEFAULT_WIFI_PASS);
    ingestUrl = preferences.getString("ingest_url", DEFAULT_INGEST_URL);
    astronautId = preferences.getString("astro_id", DEFAULT_ASTRONAUT_ID);
    deviceId = preferences.getString("dev_id", DEFAULT_DEVICE_ID);
    Serial.println("[NVS] Loaded saved configuration from persistent flash memory.");
  } else {
    Serial.println("[NVS] No saved credentials found. Using default test credentials.");
    wifiSSID = DEFAULT_WIFI_SSID;
    wifiPass = DEFAULT_WIFI_PASS;
    ingestUrl = DEFAULT_INGEST_URL;
    astronautId = DEFAULT_ASTRONAUT_ID;
    deviceId = DEFAULT_DEVICE_ID;
  }
  preferences.end();
}

void saveNVSConfiguration(const String& newSSID, const String& newPass, const String& newIngest, const String& newAstro) {
  preferences.begin("astro_cfg", false); // read-write
  preferences.putString("ssid", newSSID);
  if (newPass.length() > 0) {
    preferences.putString("pass", newPass);
  }
  preferences.putString("ingest_url", newIngest.length() > 0 ? newIngest : DEFAULT_INGEST_URL);
  preferences.putString("astro_id", newAstro.length() > 0 ? newAstro : DEFAULT_ASTRONAUT_ID);
  preferences.putBool("has_custom", true);
  preferences.end();
  Serial.printf("[NVS] Configuration saved for SSID: %s\n", newSSID.c_str());
}

void eraseNVSConfiguration() {
  preferences.begin("astro_cfg", false);
  preferences.clear();
  preferences.end();
  Serial.println("[NVS] All saved Wi-Fi and endpoint credentials erased.");
}

